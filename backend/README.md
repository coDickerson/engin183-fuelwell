# Backend scope

FuelWell uses hosted Supabase Auth for email/password accounts. Sign-up asks for name, email and password. After sign-in, real accounts land on `/dashboard.html`, which reads their saved profile and starting goal. The optional forms at `/account.html` save those details. The `quiz_results` table stores role, stage, goal and whether a cuisine preference was saved. Row Level Security limits reads and writes to the user's own row. The fictional meals, labs, appointments and care team are available only through the separate demo account at `/demo-dashboard.html`.

Apply `migrations/001_quiz_results.sql` and the profile migrations to the Supabase project before using optional preferences. See `auth-setup.md` for Auth and redirect configuration.
