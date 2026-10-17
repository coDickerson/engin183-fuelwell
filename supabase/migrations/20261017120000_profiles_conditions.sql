-- FuelWell now covers high blood pressure, diabetes and kidney disease, plus people
-- with none of these (athletes, anyone eating well). Kidney disease gets its own flag,
-- the kidney stage becomes an optional follow-up (with dialysis), and the sign-up quiz
-- accepts no stage and the new goals.
alter table public.profiles add column if not exists has_kidney_disease boolean not null default false;
update public.profiles set has_kidney_disease = true where ckd_stage is not null and not has_kidney_disease;

alter table public.profiles drop constraint if exists profiles_ckd_stage_check;
alter table public.profiles add constraint profiles_ckd_stage_check
  check (ckd_stage is null or ckd_stage in ('g1', 'g2', 'g3', 'g3a', 'g3b', 'g4', 'g5', 'g5d', 'unsure'));

alter table public.quiz_results alter column stage drop not null;
alter table public.quiz_results drop constraint if exists quiz_results_stage_check;
alter table public.quiz_results add constraint quiz_results_stage_check
  check (stage is null or stage in ('g1', 'g2', 'g3', 'g3b', 'g4', 'g5', 'g5d', 'unsure'));

alter table public.quiz_results drop constraint if exists quiz_results_goal_check;
alter table public.quiz_results add constraint quiz_results_goal_check
  check (goal in ('familiar-meals', 'understand-options', 'prepare-conversation', 'fuel-performance', 'eat-healthier'));
