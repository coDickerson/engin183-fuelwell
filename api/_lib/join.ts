// POST /api/join: saves a waitlist signup from /join and sends the swap-guide email.
// The email goes out once per new email address (a repeat signup is a quiet success), and
// only when an email provider is configured (RESEND_API_KEY and JOIN_EMAIL_FROM).
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { joinEmail, type JoinLocale } from './join-email.js';
import { supabase } from './retrieve.js';
import { supabaseServiceKey, supabaseUrl } from './env.js';
import type { RouteResult } from './routes.js';

const LOCALES: JoinLocale[] = ['en', 'zh-Hans', 'zh-Hant', 'es'];
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE = /^\+?[\d\s().-]+$/;

function siteUrl(): string {
  return (process.env.SITE_URL || 'https://kidneyhealth.vercel.app').replace(/\/+$/, '');
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.JOIN_EMAIL_FROM);
}

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

async function sendGuideEmail(to: string, name: string, locale: JoinLocale): Promise<boolean> {
  if (!emailConfigured()) return false;
  const { subject, html, text: plain } = joinEmail(locale, name, `${siteUrl()}/demo?to=browse`);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.JOIN_EMAIL_FROM,
        to: [to],
        subject,
        html,
        text: plain,
        ...(process.env.JOIN_EMAIL_REPLY_TO ? { reply_to: process.env.JOIN_EMAIL_REPLY_TO } : {}),
      }),
    });
    if (!response.ok) {
      console.error(JSON.stringify({ fn: 'join', msg: 'email_failed', status: response.status, body: (await response.text()).slice(0, 300) }));
      return false;
    }
    return true;
  } catch (error) {
    console.error(JSON.stringify({ fn: 'join', msg: 'email_failed', error: String(error) }));
    return false;
  }
}

export async function join(body: unknown): Promise<RouteResult> {
  const input = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const firstName = text(input.first_name, 80);
  const email = text(input.email, 254).toLowerCase();
  const phone = text(input.phone, 30);
  const story = text(input.story, 4000);
  const language = LOCALES.includes(input.language as JoinLocale) ? (input.language as JoinLocale) : 'en';
  const via = text(input.via, 40) || 'form';

  if (!firstName) return { status: 400, body: { error: 'Please enter your name.', code: 'name' } };
  if (!email || !EMAIL.test(email)) return { status: 400, body: { error: 'Please check your email address.', code: 'email' } };
  const digits = (phone.match(/\d/g) || []).length;
  if (phone && (!PHONE.test(phone) || digits < 7 || digits > 15)) return { status: 400, body: { error: 'Please check your phone number.', code: 'phone' } };
  if (!supabaseUrl() || !supabaseServiceKey()) return { status: 503, body: { error: 'The waitlist is not configured.', code: 'config' } };

  const { error } = await supabase().from('waitlist_signups').insert({
    first_name: firstName, email, phone: phone || null, story: story || null, language,
  });
  if (error && error.code === '23505') return { status: 200, body: { ok: true, emailed: false, repeat: true } };
  if (error) {
    console.error(JSON.stringify({ fn: 'join', msg: 'insert_failed', code: error.code, error: error.message }));
    return { status: error.code === '23514' ? 400 : 500, body: { error: 'Could not save the signup.', code: error.code === '23514' ? 'email' : 'server' } };
  }
  const emailed = await sendGuideEmail(email, firstName, language);
  console.log(JSON.stringify({ fn: 'join', via, language, story: Boolean(story), emailed }));
  return { status: 200, body: { ok: true, emailed } };
}

export async function joinVercelHandler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Use POST.', code: 'method_not_allowed' });
    return;
  }
  let body: unknown = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  const result = await join(body);
  res.status(result.status).json(result.body);
}
