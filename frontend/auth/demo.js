// Public demo account for reviewers. It is pre-confirmed in Supabase, so no email is needed.
// These credentials are intentionally public; the account holds only sample data.
export const DEMO_EMAIL = 'heidi_demo@fuelwell.app';
export const DEMO_PASSWORD = 'FuelwellDemo';

export function isDemoUser(user) {
  return user?.email?.toLowerCase() === DEMO_EMAIL;
}
