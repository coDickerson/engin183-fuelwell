// The three routes, written once without any web framework so the Vercel functions
// (api/*.ts), the local dev server and the test script all run the same code.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { identifyDish, runCard, type CardResult } from './chain.js';
import { missingConfig } from './env.js';
import { checkImage } from './images.js';
import {
  DISCLAIMER, EatOutInputSchema, parseProfile, RecipeInputSchema, SwapInputSchema, type Mode, type Profile,
} from './schemas.js';
import type { Retrieved } from './retrieve.js';

export interface RouteResult { status: number; body: Record<string, unknown> }

const fail = (status: number, error: string, code: string): RouteResult => ({ status, body: { error, code } });

interface SourceRef { id: string; kind: 'catalog' | 'guideline'; title: string; url: string | null }

/** Sources shown on the card come from what was retrieved, never from the model's own words. */
function sourceRefs(ids: string[], ctx: Retrieved): SourceRef[] {
  const out: SourceRef[] = [];
  for (const id of ids) {
    const c = ctx.catalog.find((r) => r.id === id);
    if (c) { out.push({ id, kind: 'catalog', title: `FuelWell swap catalog: ${c.meal}`, url: null }); continue; }
    const g = ctx.guidelines.find((r) => r.id === id);
    if (g) {
      const section = g.section && !g.title.toLowerCase().includes(g.section.toLowerCase()) ? g.section : null;
      const where = [section, g.page ? `p. ${g.page}` : null].filter(Boolean).join(', ');
      out.push({ id, kind: 'guideline', title: where ? `${g.title} (${where})` : g.title, url: g.url });
    }
  }
  return out;
}

function respond(mode: Mode, r: CardResult, extra: Record<string, unknown> = {}): RouteResult {
  return {
    status: 200,
    body: {
      mode,
      card: r.card,
      sources: sourceRefs(r.card.sources, r.ctx),
      coverage: r.ctx.coverage,
      retrieval: r.ctx.method,
      disclaimer: DISCLAIMER,
      ...extra,
    },
  };
}

function firstIssue(error: { issues: { message: string; path: PropertyKey[] }[] }): string {
  const i = error.issues[0];
  if (!i) return 'Please check what you typed.';
  if (i.message.startsWith('Type a meal')) return i.message;
  const field = String(i.path[0] ?? 'input');
  return /too_big|at most|<=/i.test(i.message) ? `That ${field} is too long. Please shorten it.` : `Please fill in the ${field}.`;
}

async function swap(body: unknown): Promise<RouteResult> {
  const parsed = SwapInputSchema.safeParse(body);
  if (!parsed.success) return fail(400, firstIssue(parsed.error), 'bad_input');
  const profile: Profile = parseProfile(parsed.data.profile);
  let meal = parsed.data.meal ?? '';
  let photoDish: string | null = null;
  if (parsed.data.imageBase64) {
    const img = checkImage(parsed.data.imageBase64);
    if (!img.ok) return fail(400, img.error, 'bad_image');
    const guess = await identifyDish(img.dataUrl);
    if (!guess.is_food || !guess.dish) return fail(422, "We couldn't spot a meal in that photo. Try another photo or type the meal.", 'not_food');
    photoDish = guess.dish;
    meal = meal ? `${meal} (photo looks like: ${guess.dish})` : guess.dish;
  }
  const r = await runCard({ mode: 'swap', profile, input: meal, query: meal });
  return respond('swap', r, photoDish ? { photo_dish: photoDish } : {});
}

async function eatout(body: unknown): Promise<RouteResult> {
  const parsed = EatOutInputSchema.safeParse(body);
  if (!parsed.success) return fail(400, firstIssue(parsed.error), 'bad_input');
  const { restaurant, usualOrder } = parsed.data;
  const input = `Restaurant: ${restaurant}${usualOrder ? `\nUsually orders: ${usualOrder}` : ''}`;
  const r = await runCard({ mode: 'eatout', profile: parseProfile(parsed.data.profile), input, query: `${restaurant} ${usualOrder ?? ''}`.trim() });
  return respond('eatout', r);
}

async function recipe(body: unknown): Promise<RouteResult> {
  const parsed = RecipeInputSchema.safeParse(body);
  if (!parsed.success) return fail(400, firstIssue(parsed.error), 'bad_input');
  const text = parsed.data.recipe;
  // Search with the start of the recipe (title and first ingredients), not all of it.
  const r = await runCard({ mode: 'recipe', profile: parseProfile(parsed.data.profile), input: text, query: text.slice(0, 400) });
  return respond('recipe', r);
}

const HANDLERS: Record<Mode, (body: unknown) => Promise<RouteResult>> = { swap, eatout, recipe };

export async function runRoute(mode: Mode, body: unknown): Promise<RouteResult> {
  const started = Date.now();
  const missing = missingConfig();
  if (missing.length) {
    console.error(JSON.stringify({ route: mode, msg: 'missing_config', missing }));
    return fail(503, 'FuelWell is not set up on this server yet.', 'not_configured');
  }
  try {
    const result = await HANDLERS[mode](body);
    // Log only what helps debugging. Never the meal, photo or profile.
    console.log(JSON.stringify({
      route: mode, status: result.status, ms: Date.now() - started,
      coverage: result.body.coverage ?? null, retrieval: result.body.retrieval ?? null,
    }));
    return result;
  } catch (err) {
    console.error(JSON.stringify({ route: mode, msg: 'failed', ms: Date.now() - started, error: String(err).slice(0, 300) }));
    return fail(502, 'FuelWell could not answer just now. Please try again.', 'upstream_error');
  }
}

/** Wraps a route as a Vercel Node function. */
export function vercelHandler(mode: Mode) {
  return async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      res.status(405).json({ error: 'Use POST.', code: 'method_not_allowed' });
      return;
    }
    const body = typeof req.body === 'string' ? safeJson(req.body) : req.body;
    const result = await runRoute(mode, body);
    res.status(result.status).json(result.body);
  };
}

function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}
