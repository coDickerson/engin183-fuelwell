# FuelWell auth setup

FuelWell uses Supabase Auth (email and password). The sign-in page is
`/start.html`. It has two ways in: sign in, or create an account (a short
three-step quiz, then email and password). The demo is a separate page,
`/demo` (`/demo.html`), so it never gets mixed up with someone's own account.

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
| Email | `heidi_demo@fuelwell.app` |
| Password | `FuelwellDemo` |
| Persona | Heidi, who manages meals for her mom Fung (78, CKD G3b, eGFR 38, Cantonese home cooking). Her sister Joyce has view-only access. |

These credentials are public on purpose. They live in `frontend/auth/demo.js`
and are listed in the README so reviewers can type them on the sign-in page. The account must
hold sample data only.

**How to create it:** Supabase Dashboard → Authentication → Users →
**Add user** → **Create new user**. Enter the email and password above and tick
**Auto Confirm User**, so no confirmation email is needed. Then seed the sample
data for that user (the dashboard reads it by `user_id`).

`/demo` (`frontend/auth/demo-page.js`) calls `supabase.auth.signInWithPassword`
with these credentials and opens `/dashboard.html`. The app never writes quiz answers for
the demo user (`isDemoUser` guards `saveMatch`), so reviewers can't overwrite
the curated data. If the account is missing, the page says "The demo account
isn't available right now" instead of showing a raw error.

### Shareable demo link

```
https://<your-vercel-domain>/demo
http://localhost:5173/demo.html
```

This page shows a short "Opening FuelWell…" screen, signs in as the demo
user and goes straight to the dashboard. Every "Try the demo" button links
here. Old `/start.html?demo=1` links still work: they forward to `/demo.html`.

### Keeping the demo and real accounts apart

A demo session is remembered by the browser like any other. If someone who
explored the demo later opens `/start.html`, the page signs that demo session
out and shows the sign-in form, instead of sending them back into Heidi's
dashboard. Real accounts that are already signed in still go straight to
their own dashboard.

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

## 7. Profile (name, cuisine, health conditions)

FuelWell covers high blood pressure, diabetes and kidney disease, and also
people with none of these (athletes, anyone who wants to eat well). Each
account has one row in `public.profiles` (migrations `20261016120000_profiles`
and `20261017120000_profiles_conditions`): `full_name`, `cuisine`,
`has_high_blood_pressure`, `has_diabetes`, `has_kidney_disease`, and
`ckd_stage` (`g1`–`g5`, `g5d` for dialysis, or `unsure`; only kept when kidney
disease is ticked). RLS lets only the signed-in owner read, insert or update
their row; `anon` has no access.

- **Sign-up** step 1 asks who it's for and "Do you have any of these?" (high
  blood pressure, diabetes, kidney disease or dialysis, or None of these). The
  kidney stage is an optional follow-up that only appears when kidney disease
  is ticked. Step 2 asks for the cuisine that feels like home (with quick
  picks) and the main goal, including "Fuel training and everyday energy" and
  "Eat healthier day to day". The account step asks for the person's name.
  The answers wait in `sessionStorage` (`fuelwell.profile.v1`) until there is
  a session, then are inserted. They never overwrite an existing profile.
- **Dashboard** (`/dashboard.html`) shows the profile in a "Your profile" card
  with an Edit form, and greets the person by their first name. Accounts made
  before profiles existed see a "Complete your profile" form there instead.
- The demo account keeps Heidi's curated persona and never shows this card.

Passwords must be at least 8 characters (checked in the browser; set the same
minimum under Authentication → Sign In / Providers → Email → Minimum password
length).
