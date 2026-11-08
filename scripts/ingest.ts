// Loads FuelWell's retrieval data into Supabase:
//   data/swap_catalog.csv           -> public.swap_catalog
//   data/guidelines/* (sources.json) -> public.guideline_chunks (~800-token chunks)
//
// Safe to run twice: rows are keyed by stable IDs, unchanged rows are skipped, and
// catalog rows or chunks that no longer exist are removed. If OPENAI_API_KEY is set,
// new or changed rows also get embeddings; without it, search uses keywords.
//
// Run: npm run ingest      (needs SUPABASE_SERVICE_ROLE_KEY in .env.local)
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { PDFParse } from 'pdf-parse';
import { EMBEDDING_MODEL_ID } from '../api/_lib/env.js';
import { getEmbedder, supabase } from '../api/_lib/retrieve.js';
import { DATA_DIR, GUIDELINE_DIR, loadSources, pageRanges, type GuidelineSource } from './lib/sources.js';

const CHUNK_CHARS = 3200; // about 800 tokens of English
const CHUNK_OVERLAP = 300;
const BATCH = 100;

const sha = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 32);
const slug = (s: string) => s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

type Table = 'swap_catalog' | 'guideline_chunks';
type Row = { id: string; content: string; content_hash: string } & Record<string, unknown>;

async function existing(table: Table, filter?: { column: string; value: string }) {
  const out = new Map<string, { hash: string; model: string | null }>();
  for (let from = 0; ; from += 1000) {
    let q = supabase().from(table).select('id, content_hash, embedding_model').range(from, from + 999);
    if (filter) q = q.eq(filter.column, filter.value);
    const { data, error } = await q;
    if (error) throw new Error(`${table} read failed: ${error.message}`);
    for (const r of data ?? []) out.set(r.id, { hash: r.content_hash, model: r.embedding_model });
    if (!data || data.length < 1000) break;
  }
  return out;
}

/** Upserts changed rows (clearing stale vectors), deletes rows that are gone, embeds what needs it. */
async function sync(table: Table, rows: Row[], scope?: { column: string; value: string }) {
  const before = await existing(table, scope);
  const changed = rows.filter((r) => before.get(r.id)?.hash !== r.content_hash);
  for (let i = 0; i < changed.length; i += BATCH) {
    const batch = changed.slice(i, i + BATCH).map((r) => ({ ...r, embedding: null, embedding_model: null, updated_at: new Date().toISOString() }));
    const { error } = await supabase().from(table).upsert(batch, { onConflict: 'id' });
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  }
  const keep = new Set(rows.map((r) => r.id));
  const gone = [...before.keys()].filter((id) => !keep.has(id));
  for (let i = 0; i < gone.length; i += BATCH) {
    const { error } = await supabase().from(table).delete().in('id', gone.slice(i, i + BATCH));
    if (error) throw new Error(`${table} delete failed: ${error.message}`);
  }

  let embedded = 0;
  const embedder = getEmbedder();
  if (embedder) {
    const changedIds = new Set(changed.map((r) => r.id));
    const need = rows.filter((r) => changedIds.has(r.id) || before.get(r.id)?.model !== EMBEDDING_MODEL_ID);
    for (let i = 0; i < need.length; i += 64) {
      const batch = need.slice(i, i + 64);
      const vectors = await embedder.embedDocuments(batch.map((r) => r.content));
      for (let j = 0; j < batch.length; j += 1) {
        const { error } = await supabase()
          .from(table)
          .update({ embedding: JSON.stringify(vectors[j]), embedding_model: EMBEDDING_MODEL_ID })
          .eq('id', batch[j].id);
        if (error) throw new Error(`${table} embedding update failed: ${error.message}`);
      }
      embedded += batch.length;
    }
  }
  return { total: rows.length, changed: changed.length, removed: gone.length, embedded };
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------
async function catalogRows(): Promise<Row[]> {
  const csv = await readFile(path.join(DATA_DIR, 'swap_catalog.csv'), 'utf8');
  const records = parse(csv, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
  const seen = new Set<string>();
  return records.map((r) => {
    let id = `catalog:${slug(r.meal)}`;
    for (let n = 2; seen.has(id); n += 1) id = `catalog:${slug(r.meal)}-${n}`;
    seen.add(id);
    const watch = r.watch.split('|').map((w) => w.trim()).filter(Boolean);
    const content = `${r.meal}. Cuisine: ${r.cuisine}. Usually ${r.eater_type}. Watch: ${watch.join(', ')}. Swap: ${r.swap}. Why: ${r.why}`;
    return { id, meal: r.meal, eater_type: r.eater_type, cuisine: r.cuisine, watch, swap: r.swap, why: r.why, content, content_hash: sha(content) };
  });
}

// ---------------------------------------------------------------------------
// Guidelines
// ---------------------------------------------------------------------------
interface Page { num: number | null; text: string }

const HEADING = [
  /^#{1,3}\s+(.{3,120})$/, // markdown headings in the saved web pages
  /^((?:chapter|section|guideline|recommendation|practice point)\s+[\dA-Z][\w.]*\b.{0,100})$/i,
  /^(\d+(?:\.\d+){1,3}\s+[A-Z][a-z][^.]{3,90})$/, // "3.1 Dietary sodium" (needs a dotted number)
];

async function readPages(s: GuidelineSource, file: string): Promise<Page[]> {
  if (s.kind === 'web') {
    const raw = await readFile(file, 'utf8');
    const body = raw.replace(/^(Title|URL|Fetched):.*\n/gm, '').trim();
    return [{ num: null, text: body }];
  }
  const parser = new PDFParse({ data: await readFile(file) });
  try {
    const ranges = pageRanges(s);
    const result = await parser.getText();
    return result.pages
      .filter((p) => !ranges || ranges.some(([first, last]) => p.num >= first && p.num <= last))
      .map((p) => ({ num: p.num, text: p.text }));
  } finally {
    await parser.destroy();
  }
}

async function chunkSource(s: GuidelineSource, pages: Page[]): Promise<Row[]> {
  // Join pages, remembering where each starts and where each heading is.
  let full = '';
  const pageStarts: { at: number; num: number | null }[] = [];
  const headings: { at: number; text: string }[] = [];
  for (const p of pages) {
    pageStarts.push({ at: full.length, num: p.num });
    for (const line of p.text.split('\n')) {
      const t = line.trim();
      const h = HEADING.map((re) => re.exec(t)).find(Boolean);
      if (h && t.length <= 130) headings.push({ at: full.length, text: h[1].replace(/\s+/g, ' ').trim() });
      full += `${line}\n`;
    }
    full += '\n';
  }
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: CHUNK_CHARS, chunkOverlap: CHUNK_OVERLAP });
  const pieces = await splitter.splitText(full);
  const rows: Row[] = [];
  let cursor = 0;
  pieces.forEach((piece, index) => {
    const found = full.indexOf(piece.slice(0, 120), Math.max(0, cursor - CHUNK_OVERLAP - 200));
    const at = found >= 0 ? found : cursor;
    cursor = at + piece.length;
    const page = [...pageStarts].reverse().find((p) => p.at <= at)?.num ?? null;
    const section = [...headings].reverse().find((h) => h.at <= at + 200)?.text ?? null;
    const content = piece.replace(/\n{3,}/g, '\n\n').trim();
    if (content.length < 80) return; // page numbers, stray headers
    rows.push({
      id: `${s.id}:${index}`, source_id: s.id, title: s.title, section, page, url: s.url,
      chunk_index: index, content, content_hash: sha(`${s.title}|${section}|${page}|${content}`),
    });
  });
  return rows;
}

// ---------------------------------------------------------------------------
async function main() {
  if (process.argv.includes('--dry-run')) return dryRun();
  const embed = getEmbedder() ? `on (${EMBEDDING_MODEL_ID})` : 'off (no OPENAI_API_KEY, keyword search only)';
  console.log(`Embeddings: ${embed}\n`);

  const cat = await sync('swap_catalog', await catalogRows());
  console.log(`swap_catalog       ${cat.total} rows (${cat.changed} new/changed, ${cat.removed} removed, ${cat.embedded} embedded)`);

  const missing: GuidelineSource[] = [];
  for (const s of await loadSources()) {
    const file = path.join(GUIDELINE_DIR, s.file);
    if (!existsSync(file)) { missing.push(s); continue; }
    const rows = await chunkSource(s, await readPages(s, file));
    const r = await sync('guideline_chunks', rows, { column: 'source_id', value: s.id });
    console.log(`  ${s.id.padEnd(24)} ${String(r.total).padStart(4)} chunks (${r.changed} new/changed, ${r.removed} removed, ${r.embedded} embedded)`);
  }

  const counts = await Promise.all((['swap_catalog', 'guideline_chunks'] as const).map(async (t) => {
    const { count, error } = await supabase().from(t).select('id', { count: 'exact', head: true });
    if (error) throw new Error(error.message);
    return `${t}: ${count}`;
  }));
  console.log(`\nRow counts in Supabase -> ${counts.join(' | ')}`);
  if (missing.length) {
    console.log('\nMissing guideline files (skipped; their rows were left as they were):');
    for (const s of missing) console.log(`  - data/guidelines/${s.file}   from ${s.url}`);
    console.log('Run `npm run fetch:guidelines` for the NKF pages; download the PDFs by hand.');
  }
}

/** npm run ingest -- --dry-run : read and chunk everything, touch nothing. */
async function dryRun() {
  console.log(`swap_catalog       ${(await catalogRows()).length} rows (dry run)`);
  for (const s of await loadSources()) {
    const file = path.join(GUIDELINE_DIR, s.file);
    if (!existsSync(file)) { console.log(`  ${s.id.padEnd(24)} missing`); continue; }
    const rows = await chunkSource(s, await readPages(s, file));
    const sizes = rows.map((r) => r.content.length);
    console.log(`  ${s.id.padEnd(24)} ${String(rows.length).padStart(4)} chunks, ${Math.min(...sizes)}-${Math.max(...sizes)} chars, sections e.g. ${JSON.stringify(rows.slice(0, 3).map((r) => r.section))}, pages ${JSON.stringify([...new Set(rows.map((r) => r.page))].slice(0, 6))}`);
  }
}

main().catch((err) => { console.error(err instanceof Error ? err.message : err); process.exit(1); });
