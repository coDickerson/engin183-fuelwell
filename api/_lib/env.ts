// All server settings in one place. Nothing here is ever sent to the browser.
// Files under api/_lib are helpers; Vercel does not turn them into routes.

export const DEFAULT_MODEL = 'claude-sonnet-5-5';

export function anthropicKey(): string | undefined {
  // The Supabase Edge Functions store the same key as Claude_FuelWell_API_key.
  return process.env.ANTHROPIC_API_KEY || process.env.Claude_FuelWell_API_key || undefined;
}

export function anthropicModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
}

/** Organization-scoped Anthropic keys must name a workspace. Optional. */
export function anthropicWorkspace(): string | undefined {
  return process.env.ANTHROPIC_WORKSPACE_ID || undefined;
}

export function supabaseUrl(): string | undefined {
  // VITE_SUPABASE_URL is the same public project URL the website already uses.
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || undefined;
}

/** Server-only key: reads the private retrieval tables. Never put it in a VITE_ variable. */
export function supabaseServiceKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || undefined;
}

/** Embeddings are optional in v1. Without a key, search falls back to keywords. */
export function openaiKey(): string | undefined {
  return process.env.OPENAI_API_KEY || undefined;
}

export const EMBEDDING_MODEL = 'text-embedding-3-small';
/** Stored next to each vector so rows from a different model are never compared. */
export const EMBEDDING_MODEL_ID = `openai:${EMBEDDING_MODEL}`;

export function missingConfig(): string[] {
  const missing: string[] = [];
  if (!anthropicKey()) missing.push('ANTHROPIC_API_KEY');
  if (!supabaseUrl()) missing.push('SUPABASE_URL');
  if (!supabaseServiceKey()) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  return missing;
}
