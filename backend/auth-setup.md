# FuelWell auth and matching quiz setup

This branch changes only the account and quiz page. The starter already includes
'@supabase/supabase-js' in 'package.json'.

1. Copy '.env.example' to '.env' and fill in 'VITE_SUPABASE_URL' and
   'VITE_SUPABASE_ANON_KEY'. Use a browser-safe publishable key (or legacy anon
   key), never a secret/service role key. '.env' is ignored by Git.
2. In Supabase Auth, keep Email enabled. Hosted projects normally require email
   confirmation. Add the local and deployed '/start.html' URLs to Auth's allowed
   redirect URLs so confirmation and password recovery links return to the app.
3. In Vercel, set those same two environment variables for the deployment.
4. Run the site, create an account, confirm the email if prompted, sign in,
   complete the quiz, and follow the result link to '/dashboard.html'.

The quiz starts only after 'supabase.auth.getUser()' confirms a real account
session. Missing configuration shows a clear setup message and disables account
forms; it never simulates a successful sign-in.

This version does not create a profile table or send quiz answers to Supabase.
The result page stores a small summary in same-origin 'sessionStorage' under
'fuelwell.match.v1' for the dashboard integration during merge. It contains
'role', 'stage', 'goal', and 'hasTraditions'; it does not contain the free-text
answer or email. The dashboard teammate can read this key during integration,
then guard '/dashboard.html' using 'getAuthenticatedUser()' and wire its sign-out
control to 'signOutCurrentSession()' from 'supabase.js'. Until that merge, the
starter dashboard is sample content and does not consume this summary.

If a profile table is added later, enable RLS and restrict every read/write to
the signed-in user's ID before persisting answers.
