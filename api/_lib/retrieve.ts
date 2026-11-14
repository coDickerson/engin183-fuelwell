// Step 1 of the chain: find the catalog rows and guideline passages that match.
// Uses vector search when an embeddings key is set and the rows were embedded with
// the same model; otherwise (or if the vector search finds nothing) uses keywords.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from '@langchain/openai';
import { EMBEDDING_MODEL, EMBEDDING_MODEL_ID, openaiKey, supabaseServiceKey, supabaseUrl } from './env.js';

export interface CatalogHit {
  id: string; meal: string; eater_type: string; cuisine: string; watch: string[];
  swap: string; why: string; portion: string | null; score: number; method: 'vector' | 'keyword';
}
export interface GuidelineHit {
  id: string; source_id: string; title: string; section: string | null; page: number | null;
  url: string | null; content: string; score: number; method: 'vector' | 'keyword';
}
export interface Retrieved {
  catalog: CatalogHit[];
  guidelines: GuidelineHit[];
  method: 'vector' | 'keyword';
  coverage: 'catalog' | 'guidelines' | 'none';
}

// "Relevant enough" cut-offs, tuned on the test meals (see README).
//   keyword catalog: name match in either direction, 0..1 ("chicken salad" vs "Fried chicken" = 0.57, rejected)
//   keyword guidelines: Postgres full-text rank x2
//   vector: cosine similarity
const MIN_SCORE = {
  keyword: { catalog: 0.6, guidelines: 0.1 },
  vector: { catalog: 0.45, guidelines: 0.3 },
};
const TOP_K = 4;

let db: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  const url = supabaseUrl();
  const key = supabaseServiceKey();
  if (!url || !key) throw new Error('Supabase is not configured (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).');
  db ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return db;
}

let embedder: OpenAIEmbeddings | null | undefined;
export function getEmbedder(): OpenAIEmbeddings | null {
  if (embedder !== undefined) return embedder;
  const key = openaiKey();
  embedder = key ? new OpenAIEmbeddings({ model: EMBEDDING_MODEL, apiKey: key }) : null;
  return embedder;
}

async function match<T extends { score: number }>(
  fn: 'match_swap_catalog' | 'match_guideline_chunks',
  queryText: string,
  embedding: number[] | null,
): Promise<T[]> {
  const { data, error } = await supabase().rpc(fn, {
    query_text: queryText,
    query_embedding: embedding ? JSON.stringify(embedding) : null,
    embedding_model: embedding ? EMBEDDING_MODEL_ID : null,
    match_count: TOP_K,
  });
  if (error) throw new Error(`${fn} failed: ${error.message}`);
  return (data ?? []) as T[];
}

type Searches = { catalog: CatalogHit[]; forMeal: GuidelineHit[]; forProfile: GuidelineHit[] };

async function search(meal: string, topics: string, embeddings: number[][] | null): Promise<Searches> {
  const [catalog, forMeal, forProfile] = await Promise.all([
    match<CatalogHit>('match_swap_catalog', meal, embeddings?.[0] ?? null),
    match<GuidelineHit>('match_guideline_chunks', meal, embeddings?.[0] ?? null),
    match<GuidelineHit>('match_guideline_chunks', topics, embeddings?.[1] ?? null),
  ]);
  return { catalog, forMeal, forProfile };
}

/**
 * Two guideline searches: one with what the person typed (decides whether anything relevant
 * exists) and one with the profile topics (dialysis, diabetes, eating out...) so the passages
 * fit the person. Up to 4 passages go to the model, the meal-specific ones first.
 *
 * @param meal   what the person typed (the meal, restaurant or start of the recipe)
 * @param topics profile and mode words, e.g. "dialysis fluid protein restaurant"
 */
export async function retrieve(meal: string, topics: string): Promise<Retrieved> {
  const mealText = meal.slice(0, 500);
  const topicText = topics.slice(0, 300);

  let method: 'vector' | 'keyword' = 'keyword';
  let found: Searches | null = null;
  const emb = getEmbedder();
  if (emb) {
    try {
      const vectors = await emb.embedDocuments([mealText, topicText]);
      found = await search(mealText, topicText, vectors);
      method = 'vector';
      if (!found.catalog.length && !found.forMeal.length && !found.forProfile.length) found = null; // nothing embedded yet
    } catch (err) {
      console.warn(JSON.stringify({ msg: 'vector_search_failed_using_keywords', error: String(err).slice(0, 200) }));
      found = null;
    }
  }
  if (!found) {
    method = 'keyword';
    found = await search(mealText, topicText, null);
  }

  const min = MIN_SCORE[method];
  const catalog = found.catalog.filter((r) => r.score >= min.catalog);
  const forMeal = found.forMeal.filter((r) => r.score >= min.guidelines);
  const forProfile = found.forProfile.filter((r) => r.score >= min.guidelines);

  const guidelines: GuidelineHit[] = [];
  for (const g of [...forMeal.slice(0, 3), ...forProfile, ...forMeal.slice(3)]) {
    if (guidelines.length >= TOP_K) break;
    if (!guidelines.some((x) => x.id === g.id)) guidelines.push(g);
  }
  // "Relevant" means the meal itself matched something; profile passages alone don't count.
  const coverage = catalog.length ? 'catalog' : forMeal.length ? 'guidelines' : 'none';
  return { catalog, guidelines: coverage === 'none' ? [] : guidelines, method, coverage };
}

export function formatCatalog(rows: CatalogHit[]): string {
  if (!rows.length) return '(none)';
  return rows
    .map((r) => `[${r.id}] ${r.meal} (${r.cuisine}, usually ${r.eater_type}). Watch: ${r.watch.join(', ')}. Swap: ${r.swap}. Why: ${r.why}.${r.portion ? ` Portion: ${r.portion}.` : ''}`)
    .join('\n');
}

export function formatGuidelines(rows: GuidelineHit[]): string {
  if (!rows.length) return '(none)';
  return rows
    .map((r) => {
      const where = [r.section, r.page ? `page ${r.page}` : null].filter(Boolean).join(', ');
      return `[${r.id}] ${r.title}${where ? ` (${where})` : ''}\n${r.content.trim()}`;
    })
    .join('\n\n---\n\n');
}
