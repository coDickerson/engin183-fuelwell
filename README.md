# FuelWell

A student product demo for kidney nutrition support. The landing page, account and matching quiz, overview dashboard, meal ideas, and care team are built as a Vite multi-page website. Supabase provides email/password authentication. Scheduling, messaging, lab records, and meal plans are demonstration screens only.

## Project structure

- `frontend/`: public HTML entry points, styles, and page scripts
- `frontend/auth/`: Supabase browser client and account/quiz flow
- `backend/`: hosted Supabase setup notes and the RLS-protected quiz result migration
- `vite.config.js`: builds the three pages into `dist/` for Vercel

## Run locally

1. Run `npm install`.
2. Copy `.env.example` to `.env` and set the Supabase project URL and browser-safe publishable key. `VITE_SUPABASE_ANON_KEY` is the existing variable name; it accepts a publishable key. Never use a secret or service-role key in a `VITE_` variable.
3. Run `npm run dev`.
4. Apply `backend/migrations/001_quiz_results.sql` to the configured Supabase project.
5. Open the local URL. Saving a quiz result and opening the dashboard require a confirmed account.

Run `npm run build` to generate `dist/`. For Vercel, use the Vite preset or `npm run build` with output directory `dist`. Set the same two `VITE_` environment variables in Vercel, then deploy. See `backend/auth-setup.md` for allowed email redirect URLs.

No real health information should be entered into this demo. The role, stage, goal, and traditions flag are saved for the signed-in user; the free-text answer stays out of the database. The rest of the dashboard uses labeled sample data.
