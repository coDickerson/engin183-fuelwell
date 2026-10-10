-- The sign-up quiz now asks G3 / G4 / Not sure. Keep accepting 'g3b' so rows
-- and in-flight sign-ups from the earlier quiz stay valid.
alter table public.quiz_results drop constraint quiz_results_stage_check;
alter table public.quiz_results add constraint quiz_results_stage_check
  check (stage in ('g3', 'g3b', 'g4', 'unsure'));
