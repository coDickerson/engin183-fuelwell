# Backend scope

FuelWell uses Supabase Auth for email/password accounts. `quiz_results` holds
each account's private onboarding summary, with Row Level Security (RLS)
restricted to that user. The free-text quiz answer is not saved.

The family workspace uses the migration in
`supabase/migrations/20261014080213_family_access.sql`. It creates families,
memberships, email-bound invitations, and shared notes. The follow-up migration
`supabase/migrations/20261014084716_family_note_permissions.sql` lets owners
choose `none`, `read`, or `write` note access for each invitee and change it
after they join. Caregivers and patients default to `write`, viewers to `read`;
the owner always has `write`. Family owners can invite, revoke invitations,
and remove members. RLS checks current database membership and note access on
every request, so changes take effect without waiting for a new login. Direct
membership writes are unavailable to browser clients; owner operations and
invitation acceptance use guarded database functions.

The publicly credentialed Heidi demo account cannot join or create real
families. Its meals, labs, appointments, and care-team data remain fictional
examples. Real accounts open `/family.html`, where they can access only their
own quiz summary and families they belong to. This release stores shared
notes only. Clinical records need a separate, patient-specific access model
before they are accepted from real users.

The hosted project's older quiz and AI migrations are already applied, but
their local files live in `backend/migrations` and do not share version numbers
with the files in `supabase/migrations`. Review migration history before using
`supabase db push`. Apply both family migrations to the intended project and
verify the RLS policies before deploying the matching frontend. See
`auth-setup.md` for Auth, email, and redirect settings.
