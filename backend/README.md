# Backend scope

FuelWell currently uses hosted Supabase Auth for email/password accounts. There is no application database table, server route, or edge function in this demo. Quiz answers stay in same-origin browser session storage. The dashboard shows synthetic information only.

If profile persistence is added later, create a migration here and enable Row Level Security so users can access only their own records. See `auth-setup.md` for the current Auth and redirect configuration.
