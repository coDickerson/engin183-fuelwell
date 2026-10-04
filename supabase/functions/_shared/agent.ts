// A small, explicit tool-use loop around the Claude Messages API.
//
// Why a manual loop instead of the SDK tool runner: we need per-turn control for
// production hardening: a wall-clock deadline, a turn cap, a step log for the UI,
// and a final "submit" tool whose input is validated by code before it is accepted.
// Invalid submissions go back to the model as an is_error tool_result (one chance to
// repair). Anything else (no key, API error, refusal, timeout, still invalid) returns
// `ok: false` and the caller answers with its deterministic rules engine instead.
import Anthropic from 'npm:@anthropic-ai/sdk@0.131.0';

export const MODEL = 'claude-sonnet-5-5';

export type Step = { tool: string; detail: string };

export interface ToolSpec {
  name: string;
  description: string;
  input_schema: Anthropic.Beta.BetaTool.InputSchema;
}

export interface LoopOptions<T> {
  system: string;
  userMessage: string;
  tools: ToolSpec[];
  /** Runs a non-submit tool. Must not throw for bad input; return an error object instead. */
  runTool: (name: string, input: Record<string, unknown>) => unknown;
  /** Human-readable one-liner for the step log. */
  describe: (name: string, input: Record<string, unknown>, output: unknown) => string;
  submitTool: string;
  /** Returns the parsed value, or a list of problems to send back to the model. */
  validateSubmit: (input: Record<string, unknown>) => { ok: true; value: T } | { ok: false; problems: string[] };
  maxTurns?: number;
  maxTokens?: number;
  deadlineMs?: number;
}

export type LoopResult<T> =
  | { ok: true; value: T; steps: Step[]; turns: number }
  | { ok: false; reason: string; steps: Step[] };

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  // The hosted project stores the key as Claude_FuelWell_API_key; ANTHROPIC_API_KEY also works.
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY') ?? Deno.env.get('Claude_FuelWell_API_key');
  if (!apiKey) return null;
  // Per-request timeout is set below from the remaining deadline; one SDK retry for 429/5xx.
  // Keys not scoped to a workspace must name one; set ANTHROPIC_WORKSPACE_ID for those.
  const workspaceId = Deno.env.get('ANTHROPIC_WORKSPACE_ID');
  client ??= new Anthropic({
    apiKey,
    maxRetries: 1,
    defaultHeaders: workspaceId ? { 'anthropic-workspace-id': workspaceId } : undefined,
  });
  return client;
}

export async function runToolLoop<T>(opts: LoopOptions<T>): Promise<LoopResult<T>> {
  const steps: Step[] = [];
  const anthropic = getClient();
  if (!anthropic) return { ok: false, reason: 'no_api_key', steps };

  const maxTurns = opts.maxTurns ?? 6;
  const deadline = Date.now() + (opts.deadlineMs ?? 40_000);
  const tools: Anthropic.Beta.BetaTool[] = opts.tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
    strict: true, // schema-valid arguments; semantic checks still run in code
  }));
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: 'user', content: opts.userMessage }];
  let repairsLeft = 1;
  let nudgesLeft = 1;

  for (let turn = 1; turn <= maxTurns; turn += 1) {
    const remaining = deadline - Date.now();
    if (remaining < 2_000) return { ok: false, reason: 'deadline', steps };

    let response: Anthropic.Beta.BetaMessage;
    try {
      response = await anthropic.beta.messages.create(
        {
          model: MODEL,
          max_tokens: opts.maxTokens ?? 2_048, // capped: outputs are short JSON tool calls
          system: opts.system,
          tools,
          // Sonnet 5.5 rejects forced tool_choice; auto + prompt + strict schemas instead.
          tool_choice: { type: 'auto' },
          output_config: { effort: 'low' }, // short, well-scoped task; keeps latency down
          messages,
          // If a safety classifier declines, re-run server-side on Anthropic's
          // recommended fallback model instead of returning a refusal.
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
        },
        { timeout: Math.min(remaining, 25_000) },
      );
    } catch (err) {
      const reason = err instanceof Anthropic.APIError ? `api_error_${err.status ?? 'network'}` : 'api_exception';
      console.error(JSON.stringify({ level: 'warn', msg: 'model_call_failed', reason, error: String(err) }));
      return { ok: false, reason, steps };
    }

    if (response.stop_reason === 'refusal') return { ok: false, reason: 'refusal', steps };
    if (response.stop_reason === 'max_tokens') return { ok: false, reason: 'max_tokens', steps };

    // Keep the full assistant content (including any thinking blocks) unchanged.
    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'pause_turn') continue;

    const toolUses = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use');
    if (toolUses.length === 0) {
      if (nudgesLeft-- > 0) {
        messages.push({ role: 'user', content: `Please finish by calling the ${opts.submitTool} tool.` });
        continue;
      }
      return { ok: false, reason: 'no_submit', steps };
    }

    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const use of toolUses) {
      const input = (use.input && typeof use.input === 'object' ? use.input : {}) as Record<string, unknown>;
      if (use.name === opts.submitTool) {
        const checked = opts.validateSubmit(input);
        if (checked.ok) {
          steps.push({ tool: use.name, detail: 'Submitted a final answer; code validated its shape and values.' });
          return { ok: true, value: checked.value, steps, turns: turn };
        }
        steps.push({ tool: use.name, detail: `Rejected by validation: ${checked.problems.slice(0, 3).join('; ')}` });
        if (repairsLeft-- <= 0) return { ok: false, reason: 'invalid_output', steps };
        results.push({
          type: 'tool_result',
          tool_use_id: use.id,
          is_error: true,
          content: `Not accepted. Fix these problems and call ${opts.submitTool} again:\n- ${checked.problems.join('\n- ')}`,
        });
        continue;
      }
      let output: unknown;
      try {
        output = opts.runTool(use.name, input);
      } catch (err) {
        output = { error: `Tool failed: ${String(err)}` };
      }
      steps.push({ tool: use.name, detail: opts.describe(use.name, input, output) });
      results.push({ type: 'tool_result', tool_use_id: use.id, content: JSON.stringify(output) });
    }
    // All results for this turn go back in ONE user message.
    messages.push({ role: 'user', content: results });
  }
  return { ok: false, reason: 'max_turns', steps };
}

// --- small validation helpers shared by both functions -----------------------

export function isStr(v: unknown, max: number, min = 1): v is string {
  return typeof v === 'string' && v.trim().length >= min && v.length <= max;
}

export function isNum(v: unknown, min: number, max: number): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
}
