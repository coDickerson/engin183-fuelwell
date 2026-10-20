# FuelWell auth setup

FuelWell uses Supabase Auth (email and password). The sign-in page is
`/start.html`. It has three ways in: sign in, create an account with email and
password, or **Explore the demo as Heidi**. The short matching questionnaire is
optional after sign-in on `/family.html`.
Real accounts go to `/family.html`; the shared demo account goes to the
fictional dashboard.

## 1. Environment

1. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`. Use the browser-safe publishable (or legacy anon)
   key, never a secret or service-role key. `.env` is ignored by Git.
2. In Vercel, set the same two variables for Production and Preview.
3. Apply `migrations/001_quiz_results.sql` so quiz answers can be saved.
4. Apply `supabase/migrations/20261014080213_family_access.sql` before
   deploying the family workspace. See `backend/README.md` for the access model.
5. Apply `supabase/migrations/20261014084716_family_note_permissions.sql`
   before deploying the workspace with owner-controlled note access.

If the variables are missing, the sign-in page shows a setup notice and
disables the forms. It never pretends a sign-in worked.

## 2. The demo account

| | |
|---|---|
| Email | `heidi_demo@fuelwell.app` |
| Password | `FuelwellDemo` |
| Persona | Heidi, who manages meals for her mom Fung (78, CKD G3b, eGFR 38, Cantonese home cooking). Her sister Joyce has view-only access. |

These credentials are public on purpose. They live in `frontend/auth/demo.js`
and are shown on the sign-in page so reviewers can type them. The account must
hold sample data only.

**How to create it:** Supabase Dashboard → Authentication → Users →
**Add user** → **Create new user**. Enter the email and password above and tick
**Auto Confirm User**, so no confirmation email is needed. The dashboard's
Fung workspace is bundled fictional data; it does not load clinical records
from the database.

The demo button calls `supabase.auth.signInWithPassword` with these
credentials and opens `/dashboard.html`. The demo user cannot access the real
family workspace or save the optional account questionnaire. If the account is
missing, the page says "The demo account isn't available right now" instead of
showing a raw error.

### Shareable demo link

```
https://<your-vercel-domain>/start.html?demo=1
http://localhost:5173/start.html?demo=1
```

This link shows a short "Opening Heidi's demo…" screen, signs in as the demo
user and goes straight to the dashboard. Use it in the portfolio submission
and in the site's "Try the demo" buttons.

## 3. Email confirmation

Keep **Confirm email** on for real family accounts. Family creation and
invitation acceptance require a confirmed, non-anonymous account. After
sign-up, the page tells the user to open the confirmation email and sign in.
`/start.html` then sends confirmed real users to `/family.html`. For a
teammate-only pilot, Supabase's built-in sender can deliver to project-team
addresses. Public signup requires a custom SMTP provider.

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
under Authentication → Emails → SMTP Settings. The public Heidi demo does not
need to send email.

## 5. Redirect URLs

Supabase Dashboard → Authentication → URL Configuration.

- **Site URL:** `https://<your-vercel-domain>`
- **Redirect URLs** (add each):
  - `http://localhost:5173/start.html`
  - `http://localhost:5173/family.html`
  - `http://localhost:5173/**`
  - `https://<your-vercel-domain>/start.html`
  - `https://<your-vercel-domain>/family.html`
  - `https://<your-vercel-domain>/**`
  - `https://*-<your-vercel-team>.vercel.app/**` (optional, for preview deploys)

Confirmation and password-reset links return to `/start.html`. A reset link
opens the "Choose a new password" form; a confirmation link signs the person
in and forwards real accounts to `/family.html`.

## 6. Optional starting point

After sign-in, the family page can save `role`, `stage`, `goal` and a
`has_traditions` flag to `quiz_results`. No email or free-text answer is stored
there. RLS restricts every read and write to the signed-in user's ID. The form
can be skipped or edited later.

Passwords must be at least 8 characters (checked in the browser; set the same
minimum under Authentication → Sign In / Providers → Email → Minimum password
length).

## 7. Family access

After signing in, a real account can create a family or use an invitation
link. The owner enters the relative's account email and selects caregiver,
patient, or viewer. FuelWell shows the owner a private link to send through a
trusted channel; it does not send invitation email. The link expires after
seven days, can be used once, and is accepted only by a confirmed account
whose current email matches the invitation. Owners can revoke a pending link
or remove a member. Owners also choose no note access, read-only, or read and
add access when inviting someone and can change it from the member list later.
They can also change a pending invitation's note access before it is accepted.
These settings are enforced by database policies on the next request. They
apply only to shared notes; roles and membership remain visible to members.
The shared demo account is excluded from this workspace.
