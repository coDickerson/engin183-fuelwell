# Backend scope

FuelWell uses hosted Supabase Auth for email/password accounts. The `quiz_results` table stores each signed-in user's role, stage, goal, and whether they mentioned food traditions. The free-text answer stays out of the database. Row Level Security limits reads and writes to the user's own row. The dashboard's meals, labs, appointments, and care team remain synthetic examples.

Apply `migrations/001_quiz_results.sql` to the Supabase project before deploying the matching quiz flow. See `auth-setup.md` for Auth and redirect configuration.
