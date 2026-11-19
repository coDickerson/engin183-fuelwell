// POST /api/welcome: sends the welcome email (with the swap-guide link) to someone who just
// created an account on /join. The caller must send their own access token, so this can only
// ever email the signed-in person's own address, and only within 15 minutes of sign-up.
// Sending is off until RESEND_API_KEY and JOIN_EMAIL_FROM are set in Vercel.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { welcomeEmail, type JoinLocale } from './welcome-email.js';
import { supabase } from './retrieve.js';
import { supabaseServiceKey, supabaseUrl } from './env.js';
import type { RouteResult } from './routes.js';

const LOCALES: JoinLocale[] = ['en', 'zh-Hans', 'zh-Hant', 'es'];
const DEMO_EMAIL = 'heidi_demo@fuelwell.app';
const NEW_ACCOUNT_MS = 15 * 60 * 1000;

function siteUrl(): string {
  return (process.env.SITE_URL || 'https://kidneyhealth.vercel.app').replace(/\/+$/, '');
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.JOIN_EMAIL_FROM);
}

export async function welcome(token: string | null, body: unknown): Promise<RouteResult> {
  if (!token) return { status: 401, body: { error: 'Sign in first.', code: 'auth' } };
  if (!emailConfigured()) return { status: 200, body: { ok: true, emailed: false, reason: 'email_off' } };
  if (!supabaseUrl() || !supabaseServiceKey()) return { status: 503, body: { error: 'Not configured.', code: 'config' } };

  const { data, error } = await supabase().auth.getUser(token);
  const user = data?.user;
  if (error || !user?.email) return { status: 401, body: { error: 'Sign in first.', code: 'auth' } };
  if (user.email.toLowerCase() === DEMO_EMAIL) return { status: 200, body: { ok: true, emailed: false } };
  if (Date.now() - new Date(user.created_at).getTime() > NEW_ACCOUNT_MS) return { status: 200, body: { ok: true, emailed: false, reason: 'not_new' } };

  const input = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const locale = LOCALES.includes(input.language as JoinLocale) ? (input.language as JoinLocale) : 'en';
  const name = String(user.user_metadata?.full_name || '').trim().slice(0, 80) || user.email.split('@')[0];
  const { subject, html, text } = welcomeEmail(locale, name, `${siteUrl()}/meals.html#browse`);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.JOIN_EMAIL_FROM,
        to: [user.email],
        subject,
        html,
        text,
        ...(process.env.JOIN_EMAIL_REPLY_TO ? { reply_to: process.env.JOIN_EMAIL_REPLY_TO } : {}),
      }),
    });
    if (!response.ok) {
      console.error(JSON.stringify({ fn: 'welcome', msg: 'email_failed', status: response.status, body: (await response.text()).slice(0, 300) }));
      return { status: 200, body: { ok: true, emailed: false } };
    }
  } catch (err) {
    console.error(JSON.stringify({ fn: 'welcome', msg: 'email_failed', error: String(err) }));
    return { status: 200, body: { ok: true, emailed: false } };
  }
  console.log(JSON.stringify({ fn: 'welcome', language: locale, emailed: true }));
  return { status: 200, body: { ok: true, emailed: true } };
}

export async function welcomeVercelHandler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Use POST.', code: 'method_not_allowed' });
    return;
  }
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  let body: unknown = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  const result = await welcome(token, body);
  res.status(result.status).json(result.body);
}
