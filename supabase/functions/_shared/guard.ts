// Auth + per-user daily quota for FuelWell AI functions.
//
// verify_jwt stays on at the gateway, so every request already carries a valid
// Supabase JWT. The anon key is also a valid JWT, so we still resolve the user and
// reject anything that is not a real, signed-in account.
//
// The quota lives in public.ai_usage (backend/migrations/002_ai_usage.sql). That table
// has RLS on and no client policies; only this function, using the service role key
// that Supabase injects into Edge Functions, can touch it via ai_usage_consume().
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2.117.2';
import { HttpError } from './http.ts';

export const DEMO_EMAIL = 'heidi_demo@fuelwell.app';
export const DAILY_LIMIT = 40;
export const DEMO_DAILY_LIMIT = 300; // shared reviewer account, so a larger pool

let admin: SupabaseClient | null = null;

function adminClient(): SupabaseClient {
  if (admin) return admin;
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) throw new HttpError(500, 'server_error', 'The AI helper is not configured yet.');
  admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}

/** Resolve the signed-in user from the bearer token, or throw 401. */
export async function requireUser(req: Request): Promise<User> {
  const header = req.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) throw new HttpError(401, 'not_signed_in', 'Please sign in to use this helper.');
  const { data, error } = await adminClient().auth.getUser(token);
  const user = data?.user;
  if (error || !user || user.is_anonymous || !user.email) {
    throw new HttpError(401, 'not_signed_in', 'Please sign in to use this helper.');
  }
  return user;
}

export interface Quota {
  allowed: boolean;
  used: number;
  limit: number;
}

/**
 * Atomically count one call against today's (UTC) quota.
 * Returns null if the quota store is unavailable (e.g. migration not applied yet);
 * callers then skip the model and answer with the rules engine, which costs nothing.
 */
export async function consumeQuota(user: User, fn: string): Promise<Quota | null> {
  const limit = user.email?.toLowerCase() === DEMO_EMAIL ? DEMO_DAILY_LIMIT : DAILY_LIMIT;
  const { data, error } = await adminClient().rpc('ai_usage_consume', {
    p_user_id: user.id,
    p_function: fn,
    p_limit: limit,
  });
  if (error) {
    console.error(JSON.stringify({ level: 'error', msg: 'quota_unavailable', fn, error: error.message }));
    return null;
  }
  const row = (Array.isArray(data) ? data[0] : data) as { allowed?: boolean; used?: number } | null;
  if (!row || typeof row.allowed !== 'boolean') return null;
  return { allowed: row.allowed, used: Number(row.used ?? 0), limit };
}

export function enforceQuota(quota: Quota | null): void {
  if (quota && !quota.allowed) {
    throw new HttpError(
      429,
      'rate_limited',
      `You've reached today's limit of ${quota.limit} AI requests. It resets at midnight UTC.`,
    );
  }
}
