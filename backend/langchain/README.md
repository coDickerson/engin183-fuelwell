# LangChain chat backend

The AI Chat calls `frontend/scripts/portal/agent.js`. That file still defaults to fictional mock replies. On November 9, 2026, the patient and chat tables were applied to the hosted Supabase project and `chat-agent` version 4 was deployed with JWT verification. The frontend feature flag remains off until a signed-in response is verified.

## Request path

1. The browser sends `{ message, language, history, patientId? }` to the authenticated Supabase `chat-agent` function. The shared demo account uses up to four short browser history messages and may omit `patientId` to use fictional Fung. An ordinary account without a patient ID receives general guidance only.
2. The function resolves the signed-in user. When given a patient ID, it loads only a patient whose `caregiver_user_id` matches that user. It reads only care plans with `status='reviewed'`.
3. For ordinary accounts, the function loads the last two saved exchanges for that user and the same patient context. It then chooses a meal or menu workflow and retrieves relevant National Kidney Foundation snippets plus chunks from that patient's reviewed plan. Retrieval is lexical and bounded. It does not use embeddings or a vector database yet.
4. A LangChain `RunnableSequence` passes a `ChatPromptTemplate`, retrieved context, and the question to `ChatAnthropic`, then parses plain text. The prompt forbids invented targets and nutrient totals. If the model or quota store is unavailable, a bounded rules answer uses the retrieved general guidance and returns `source: 'rules'`. A daily quota denial still returns 429.
5. An urgent-symptom rule returns a deterministic care-team message before the model runs. Calls use the existing per-user AI quota. Non-demo answers are saved to `chat_exchanges` for future continuity. The shared public demo account is never persisted.

The patient and plan schema is in `supabase/migrations/20261106031425_patient_profiles_and_care_plans.sql`; chat storage is in `supabase/migrations/20261109223800_chat_history.sql`. Caregivers may add pending plan text, but cannot mark it reviewed. A clinician review workflow with privileged credentials must do that; it is not implemented yet. No personal nutrient ranges should be shown before this review. Chat records contain potentially sensitive text, so ordinary accounts can read only their own rows, cannot write AI answers directly, and have no sharing policy.

## Inspect and test

```sh
node --test backend/mvp/chat-rag.test.mjs
npm run build
node --env-file=.env --env-file=.env.local backend/smoke-chat.mjs
```

The tests cover patient isolation in retrieval, rejection of pending plans, dialysis-specific source filtering, general guidance without a profile, rules fallback, and workflow selection. The hosted migrations and function version 4 deploy succeeded. Live table privileges and policies were inspected: `anon` cannot read chat records, authenticated users can read only their own rows, and only `service_role` can insert. A signed-in response and actual chat save have **not** been verified: this environment could not resolve the Supabase host, even after retrying the smoke test outside the filesystem sandbox. The current Vercel AI Chat still uses its mock responses because the frontend flag is off.

To activate: confirm the Anthropic key secret and model identifier, test a signed-in general question and a question with an owned patient ID, then set `VITE_CHAT_AGENT_ENABLED=true` in Vercel and redeploy. The current AI Chat does not pass a patient ID, so it will use the general path for ordinary accounts. Personalization also needs a patient creation and selection flow plus a clinician review workflow. Do not put service-role or model keys in `VITE_` variables.
