# FuelWell

A student product demo for kidney nutrition support. The landing page, account and matching quiz, and sample dashboard are built as a Vite multi-page website. Supabase provides email/password authentication. Scheduling, messaging, lab records, and meal plans are demonstration screens only.

## Project structure

- `frontend/`: public HTML entry points, styles, and page scripts
- `frontend/auth/`: Supabase browser client and account/quiz flow
- `backend/`: hosted Supabase setup notes; no server code or patient database is deployed in this demo
- `vite.config.js`: builds the three pages into `dist/` for Vercel

## Run locally

1. Run `npm install`.
2. Copy `.env.example` to `.env` and set the Supabase project URL and browser-safe publishable key. `VITE_SUPABASE_ANON_KEY` is the existing variable name; it accepts a publishable key. Never use a secret or service-role key in a `VITE_` variable.
3. Run `npm run dev`.
4. Open the local URL. Sign-in and the dashboard require a configured Supabase project and a confirmed account.

Run `npm run build` to generate `dist/`. For Vercel, use the Vite preset or `npm run build` with output directory `dist`. Set the same two `VITE_` environment variables in Vercel, then deploy. See `backend/auth-setup.md` for allowed email redirect URLs.

No real health information should be entered into this demo. Quiz answers stay in the browser session; the dashboard uses labeled sample data.
