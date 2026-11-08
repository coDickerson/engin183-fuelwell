-- FuelWell v1 (/swap page): the two sources the AI is allowed to ground its answers in.
--
--   swap_catalog      our swap list (data/swap_catalog.csv), one row per meal
--   guideline_chunks  ~800-token passages from KDOQI / KDIGO / NKF (data/guidelines/)
--
-- Both are filled by scripts/ingest.ts and read only by the server (api/_lib/retrieve.ts)
-- with the service-role key. Row level security is on with no policies, so the public
-- anon key cannot read them: the guideline text is copyrighted and stays private.
--
-- Search works two ways:
--   * vector  (pgvector cosine) when an embeddings key is set and rows were embedded
--             with the same model; the embedding column has no fixed size so the
--             provider can change later (just re-run the ingest script).
--   * keyword (Postgres full-text + trigram) as the fallback, so v1 works with only
--             an Anthropic key.

create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.swap_catalog (
  id              text primary key,            -- e.g. 'catalog:pho'
  meal            text not null,
  eater_type      text not null,               -- home | frozen | takeout
  cuisine         text not null,
  watch           text[] not null default '{}',-- Na, K, P, Fluid, Sugar
  swap            text not null,
  why             text not null,
  content         text not null,               -- the text that is searched and embedded
  content_hash    text not null,               -- lets the ingest skip unchanged rows
  embedding       extensions.vector,
  embedding_model text,
  fts             tsvector generated always as (to_tsvector('english', content)) stored,
  updated_at      timestamptz not null default now()
);

create index swap_catalog_fts_idx on public.swap_catalog using gin (fts);
create index swap_catalog_meal_trgm_idx on public.swap_catalog using gin (meal extensions.gin_trgm_ops);

create table public.guideline_chunks (
  id              text primary key,            -- '<source_id>:<chunk_index>'
  source_id       text not null,               -- e.g. 'kdoqi-2020', 'nkf-potassium'
  title           text not null,
  section         text,
  page            integer,
  url             text,
  chunk_index     integer not null,
  content         text not null,
  content_hash    text not null,
  embedding       extensions.vector,
  embedding_model text,
  fts             tsvector generated always as (
                    to_tsvector('english', coalesce(section, '') || ' ' || content)
                  ) stored,
  updated_at      timestamptz not null default now()
);

create index guideline_chunks_source_idx on public.guideline_chunks (source_id, chunk_index);
create index guideline_chunks_fts_idx on public.guideline_chunks using gin (fts);

alter table public.swap_catalog enable row level security;
alter table public.guideline_chunks enable row level security;
revoke all on table public.swap_catalog, public.guideline_chunks from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
-- Turns free text into an OR query of its stemmed words: 'congee | salt | egg'.
create or replace function public.fw_or_tsquery(query_text text)
returns tsquery
language sql
immutable
set search_path = ''
as $$
  select nullif(string_agg(quote_literal(lexeme), ' | '), '')::tsquery
  from unnest(tsvector_to_array(to_tsvector('english', coalesce(query_text, '')))) as lexeme;
$$;

-- ---------------------------------------------------------------------------
-- Match functions (score is 0..1, higher is better; the server applies the threshold)
-- ---------------------------------------------------------------------------
create or replace function public.match_swap_catalog(
  query_text      text,
  query_embedding extensions.vector default null,
  embedding_model text default null,
  match_count     integer default 4
)
returns table (
  id text, meal text, eater_type text, cuisine text, watch text[], swap text, why text,
  score double precision, method text
)
language sql
stable
set search_path = ''
as $$
  with q as (select public.fw_or_tsquery(query_text) as tsq)
  select c.id, c.meal, c.eater_type, c.cuisine, c.watch, c.swap, c.why,
         case
           when query_embedding is not null
             then 1 - (c.embedding operator(extensions.<=>) query_embedding)
           else greatest(
             extensions.word_similarity(lower(c.meal), lower(query_text)),
             ts_rank_cd(c.fts, q.tsq, 32) * 2
           )
         end::double precision as score,
         case when query_embedding is not null then 'vector' else 'keyword' end as method
  from public.swap_catalog c, q
  where case
          when query_embedding is not null
            then c.embedding is not null and c.embedding_model = match_swap_catalog.embedding_model
          else (q.tsq is not null and c.fts @@ q.tsq)
               or extensions.word_similarity(lower(c.meal), lower(query_text)) > 0.3
        end
  order by score desc
  limit least(greatest(match_count, 1), 20);
$$;

create or replace function public.match_guideline_chunks(
  query_text      text,
  query_embedding extensions.vector default null,
  embedding_model text default null,
  match_count     integer default 4
)
returns table (
  id text, source_id text, title text, section text, page integer, url text, content text,
  score double precision, method text
)
language sql
stable
set search_path = ''
as $$
  with q as (select public.fw_or_tsquery(query_text) as tsq)
  select g.id, g.source_id, g.title, g.section, g.page, g.url, g.content,
         case
           when query_embedding is not null
             then 1 - (g.embedding operator(extensions.<=>) query_embedding)
           else ts_rank_cd(g.fts, q.tsq, 32) * 2
         end::double precision as score,
         case when query_embedding is not null then 'vector' else 'keyword' end as method
  from public.guideline_chunks g, q
  where case
          when query_embedding is not null
            then g.embedding is not null and g.embedding_model = match_guideline_chunks.embedding_model
          else q.tsq is not null and g.fts @@ q.tsq
        end
  order by score desc
  limit least(greatest(match_count, 1), 20);
$$;

-- Only the server (service role) may call these.
revoke execute on function public.fw_or_tsquery(text) from public, anon, authenticated;
revoke execute on function public.match_swap_catalog(text, extensions.vector, text, integer) from public, anon, authenticated;
revoke execute on function public.match_guideline_chunks(text, extensions.vector, text, integer) from public, anon, authenticated;
grant execute on function public.fw_or_tsquery(text) to service_role;
grant execute on function public.match_swap_catalog(text, extensions.vector, text, integer) to service_role;
grant execute on function public.match_guideline_chunks(text, extensions.vector, text, integer) to service_role;
