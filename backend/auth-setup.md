# FuelWell auth setup

FuelWell uses Supabase Auth for email and password accounts. The public site
offers three paths: a fictional sample demo at /demo, a waitlist at /join, and
account creation at /start.html#sign-up. The class food board survey remains
at /waitlist for existing QR codes.

## Environment and database

1. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a local .env file and in
   the Vercel Production and Preview environments. The key must be browser-safe;
   never use a service-role or secret key in a VITE_ variable.
2. Apply backend/migrations/001_quiz_results.sql and the profile migrations in
   supabase/migrations. Both tables use owner-only Row Level Security. The
   optional forms on /account.html use these tables.
3. Add the site and localhost start page to Supabase Auth redirect URLs. The
   development default is http://localhost:5173/start.html.

If the variables are missing, the account forms show a setup notice and do
not submit. The local account preview at /account.html?preview=1 works without
Supabase and never reads or writes account data.

## Visitor and account flow

- /demo signs in to the public, pre-confirmed demo account and opens
  /demo-dashboard.html. The demo contains only fictional Heidi and Fung care
  data. Every Try the demo link goes through this separate page.
- /start.html asks for name, email and password. The name is stored as
  display-only user metadata during sign-up, so it survives an email
  confirmation opened in another tab. User metadata is never used for access
  decisions.
- New and returning real accounts open /dashboard.html. This private dashboard
  shows their own saved name, food preferences and starting goal. The optional
  profile and goal forms are at /account.html. Personal meal plans and care
  records are not yet available. Direct visits to a fictional app tab send
  real accounts back to /dashboard.html.
- A demo session is signed out when someone opens /start.html, so it cannot
  stand in for the person's own sign-in. The demo account cannot use the
  real-account starting page.

## Demo account

| Field | Value |
|---|---|
| Email | heidi_demo@fuelwell.app |
| Password | FuelwellDemo |
| Persona | Heidi caring for her mom Fung, with fictional CKD data |

The credentials are intentionally public. Create the user in Supabase Auth
with Auto Confirm User enabled. The account must contain only sample data.
If the demo account is missing, /demo shows a friendly retry screen.
Old /start.html?demo=1 links forward to /demo.html.

## Email confirmation and resets

The sign-up code handles both confirmation settings. If Confirm email is off,
Supabase returns a session and the new account opens immediately. If it is on,
the page asks the person to confirm their email and sign in. The confirmation
link returns to /start.html and then opens /dashboard.html. Password reset
links return to /start.html and show the new-password form.

Supabase's default email service has delivery and rate limits. Configure
custom SMTP before inviting users outside the project team. Add localhost
and any deployed domain to Supabase Auth URL Configuration before testing
confirmation and reset links.

## Optional profile and starting goal

The account page saves name, cuisine and optional sample health conditions to
public.profiles. The starting goal saves role, stage, goal and a
has_traditions flag to public.quiz_results. Both forms are optional and can
be edited later. Their existing RLS policies restrict reads and writes to
the signed-in user.

Passwords must be at least eight characters in the browser; set the same
minimum in the Supabase Auth email provider settings.
