# FuelWell auth and matching quiz setup

The landing page leads to a short matching quiz. Users can then sign in or
create an account to save the result and open the dashboard.

1. Copy '.env.example' to '.env' and fill in 'VITE_SUPABASE_URL' and
   'VITE_SUPABASE_ANON_KEY'. Use a browser-safe publishable key (or legacy anon
   key), never a secret/service role key. '.env' is ignored by Git.
2. In Supabase Auth, keep Email enabled. Hosted projects normally require email
   confirmation. Add the local and deployed '/start.html' URLs to Auth's allowed
   redirect URLs so confirmation and password recovery links return to the app.
3. In Vercel, set those same two environment variables for the deployment.
4. Apply `migrations/001_quiz_results.sql` to the Supabase project before
   deploying the quiz result save flow.
5. Run the site, complete the quiz, create an account or sign in, and confirm
   the email if prompted. The authenticated flow opens `/dashboard.html`.

The quiz can be completed before sign-in. Saving a result and opening the
dashboard requires a confirmed account. Missing configuration shows a setup
message and disables account forms; it never simulates successful sign-in.

The result page keeps a small summary in same-origin `sessionStorage` under
`fuelwell.match.v1`. After sign-in, it saves the role, stage, goal, and
`hasTraditions` flag to `quiz_results`. Neither the free-text answer nor email
is stored there. The dashboard checks the account and displays the saved result.

The migration enables RLS and restricts every read and write to the signed-in
user's ID.
