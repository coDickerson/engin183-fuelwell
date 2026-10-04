// HTTP helpers shared by FuelWell Edge Functions: CORS, JSON responses, typed errors,
// and server-side input validation.

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-api-version, x-region',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Expose-Headers': 'X-FuelWell-Source-Reason',
  'Access-Control-Max-Age': '86400',
};

export type ErrorCode = 'not_signed_in' | 'rate_limited' | 'bad_input' | 'method_not_allowed' | 'server_error';

export class HttpError extends Error {
  constructor(public status: number, public code: ErrorCode, message: string) {
    super(message);
  }
}

export function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', ...extra },
  });
}

export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) return json({ error: err.message, code: err.code }, err.status);
  console.error(JSON.stringify({ level: 'error', msg: 'unhandled', error: String(err) }));
  return json({ error: 'Something went wrong on our side. Please try again.', code: 'server_error' }, 500);
}

const MAX_BODY_BYTES = 8_192;

/** Read a small JSON object body; reject anything else. */
export async function readJsonBody(req: Request): Promise<Record<string, unknown>> {
  if (req.method !== 'POST') throw new HttpError(405, 'method_not_allowed', 'Use POST.');
  const declared = Number(req.headers.get('content-length') ?? '0');
  if (declared > MAX_BODY_BYTES) throw new HttpError(400, 'bad_input', 'That request is too large.');
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) throw new HttpError(400, 'bad_input', 'That request is too large.');
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new HttpError(400, 'bad_input', 'The request body must be JSON.');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'bad_input', 'The request body must be a JSON object.');
  }
  return body as Record<string, unknown>;
}

export const MAX_TEXT = 600;

/** Required free-text field: string, trimmed, non-empty, at most `max` characters. */
export function requireText(body: Record<string, unknown>, field: string, label: string, max = MAX_TEXT): string {
  const value = body[field];
  if (typeof value !== 'string') throw new HttpError(400, 'bad_input', `Please enter ${label}.`);
  // Strip control characters except newlines and tabs.
  const cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  if (!cleaned) throw new HttpError(400, 'bad_input', `Please enter ${label}.`);
  if (cleaned.length > max) throw new HttpError(400, 'bad_input', `Please keep ${label} under ${max} characters.`);
  return cleaned;
}

/** Optional short text field. Returns null when absent or blank. */
export function optionalText(body: Record<string, unknown>, field: string, label: string, max: number): string | null {
  const value = body[field];
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new HttpError(400, 'bad_input', `Please send ${label} as text.`);
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim();
  if (cleaned.length > max) throw new HttpError(400, 'bad_input', `Please keep ${label} under ${max} characters.`);
  return cleaned || null;
}

/** Optional enum field. */
export function optionalEnum<T extends string>(
  body: Record<string, unknown>,
  field: string,
  allowed: readonly T[],
): T | null {
  const value = body[field];
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value.toLowerCase())) {
    throw new HttpError(400, 'bad_input', `${field} must be one of: ${allowed.join(', ')}.`);
  }
  return value.toLowerCase() as T;
}
