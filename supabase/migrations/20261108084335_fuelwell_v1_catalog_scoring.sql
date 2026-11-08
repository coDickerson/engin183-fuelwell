-- FuelWell v1: better keyword scoring for the swap catalog.
-- Score = how well the typed text and the meal name match in EITHER direction
-- ("panda express" inside "Panda Express orange chicken with chow mein", or
-- "Pho" inside "a pho restaurant"). A shared word alone ("chicken salad" vs
-- "Fried chicken") stays below the server's 0.6 cut-off. Vector search is unchanged.
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
  with q as (select lower(coalesce(query_text, '')) as t, public.fw_or_tsquery(query_text) as tsq),
  scored as (
    select c.*,
      case
        when query_embedding is not null
          then 1 - (c.embedding operator(extensions.<=>) query_embedding)
        else greatest(
          extensions.word_similarity(q.t, lower(c.meal)),
          extensions.word_similarity(lower(c.meal), q.t),
          coalesce(ts_rank_cd(c.fts, q.tsq, 32), 0)
        )
      end::double precision as score
    from public.swap_catalog c, q
    where case
            when query_embedding is not null
              then c.embedding is not null and c.embedding_model = match_swap_catalog.embedding_model
            else true
          end
  )
  select s.id, s.meal, s.eater_type, s.cuisine, s.watch, s.swap, s.why, s.score,
         case when query_embedding is not null then 'vector' else 'keyword' end as method
  from scored s
  where s.score > 0.2
  order by s.score desc
  limit least(greatest(match_count, 1), 20);
$$;

revoke execute on function public.match_swap_catalog(text, extensions.vector, text, integer) from public, anon, authenticated;
grant execute on function public.match_swap_catalog(text, extensions.vector, text, integer) to service_role;
