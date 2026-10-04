# FuelWell auth setup

FuelWell uses Supabase Auth (email and password). The sign-in page is
`/start.html`. It has three ways in: sign in, create an account (a short
three-step quiz, then email and password), or **Explore the demo as Heidi**.

## 1. Environment

1. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`. Use the browser-safe publishable (or legacy anon)
   key, never a secret or service-role key. `.env` is ignored by Git.
2. In Vercel, set the same two variables for Production and Preview.
3. Apply `migrations/001_quiz_results.sql` so quiz answers can be saved.

If the variables are missing, the sign-in page shows a setup notice and
disables the forms. It never pretends a sign-in worked.

## 2. The demo account

| | |
|---|---|
| Email | `heidi.demo@fuelwell.app` |
| Password | `FuelWell-Demo-2026` |
| Persona | Heidi, who manages meals for her mom Fung (78, CKD G3b, eGFR 38, Cantonese home cooking). Her sister Joyce has view-only access. |

These credentials are public on purpose. They live in `frontend/auth/demo.js`
and are shown on the sign-in page so reviewers can type them. The account must
hold sample data only.

**How to create it:** Supabase Dashboard → Authentication → Users →
**Add user** → **Create new user**. Enter the email and password above and tick
**Auto Confirm User**, so no confirmation email is needed. Then seed the sample
data for that user (the dashboard reads it by `user_id`).

The demo button calls `supabase.auth.signInWithPassword` with these
credentials and opens `/dashboard.html`. The app never writes quiz answers for
the demo user (`isDemoUser` guards `saveMatch`), so reviewers can't overwrite
the curated data. If the account is missing, the page says "The demo account
isn't available right now" instead of showing a raw error.

### Shareable demo link

```
https://<your-vercel-domain>/start.html?demo=1
http://localhost:5173/start.html?demo=1
```

This link shows a short "Opening Heidi's demo…" screen, signs in as the demo
user and goes straight to the dashboard. Use it in the portfolio submission
and in the site's "Try the demo" buttons.

## 3. Turn off "Confirm email"

Supabase Dashboard → Authentication → Sign In / Providers → **Email** →
turn off **Confirm email** → Save.

With it off, `signUp` returns a session and new users go straight to the
dashboard. The code still handles both cases: if confirmation is turned back
on, the page tells the person to open the confirmation email and then sign in.
When they return from the email link signed in, `/start.html` sends them to
the dashboard rather than showing the quiz again.

## 4. Default SMTP limits

Supabase's built-in email service is for testing only:

- It only delivers to email addresses of **members of the Supabase project
  team**. Anyone else gets "Email address not authorized", which the page shows
  as "We can't email that address yet. Try the demo account."
- It is rate-limited to roughly **2 emails per hour** for the whole project.
  Hitting the limit shows "We've sent too many emails. Wait a few minutes or
  try the demo."

This affects confirmation emails (if turned on) and password-reset emails. For
real users, add a custom SMTP provider (Resend, Postmark, SendGrid and so on)
under Authentication → Emails → SMTP Settings. For the class demo, turning off
Confirm email and using the demo account avoids email entirely.

## 5. Redirect URLs

Supabase Dashboard → Authentication → URL Configuration.

- **Site URL:** `https://<your-vercel-domain>`
- **Redirect URLs** (add each):
  - `http://localhost:5173/start.html`
  - `http://localhost:5173/**`
  - `https://<your-vercel-domain>/start.html`
  - `https://<your-vercel-domain>/**`
  - `https://*-<your-vercel-team>.vercel.app/**` (optional, for preview deploys)

Confirmation and password-reset links return to `/start.html`. A reset link
opens the "Choose a new password" form; a confirmation link signs the person
in and forwards them to the dashboard.

## 6. Data saved by the quiz

The quiz keeps a small summary in same-origin `sessionStorage` under
`fuelwell.match.v1` until the account exists. After sign-up or sign-in it saves
`role`, `stage`, `goal` and a `has_traditions` flag to `quiz_results`. The
free-text answer and the email are not stored there. RLS restricts every read
and write to the signed-in user's ID.

Passwords must be at least 8 characters (checked in the browser; set the same
minimum under Authentication → Sign In / Providers → Email → Minimum password
length).
