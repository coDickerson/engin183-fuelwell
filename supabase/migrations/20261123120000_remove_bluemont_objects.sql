-- Remove objects from the Bluemont Children Foundation website that were applied to FuelWell's
-- database by mistake (Bluemont's own project is zogwicnfyzjdnxbeizhp). They were never in
-- FuelWell's migration history and FuelWell's code never used them. All Bluemont tables were empty;
-- user_roles only held labels the Bluemont trigger gave every new FuelWell account ("volunteer").

drop trigger if exists on_auth_user_created_give_role on auth.users;

drop policy if exists "Volunteers add photos to their own folder" on storage.objects;
drop policy if exists "Volunteers remove their own photos" on storage.objects;
drop policy if exists "Volunteers see their own photos, officers see all" on storage.objects;

drop table if exists public.feedback cascade;
drop table if exists public.submissions cascade;
drop table if exists public.contact_messages cascade;
drop table if exists public.plushie_requests cascade;
drop table if exists public.user_roles cascade;

drop function if exists public.give_new_user_volunteer_role();
drop function if exists public.touch_user_roles_updated_at();
drop function if exists public.feedback_fill_in();
drop function if exists public.feedback_mark_edited();
drop function if exists public.submissions_fill_in();
drop function if exists public.is_officer();
drop function if exists public.mark_my_feedback_seen();
drop function if exists public.my_first_name();
drop function if exists public.thank_for_feedback(uuid);

-- Left behind: the empty storage bucket "submission-photos". Supabase blocks deleting buckets from SQL;
-- delete it in the dashboard (Storage -> submission-photos -> Delete bucket).
