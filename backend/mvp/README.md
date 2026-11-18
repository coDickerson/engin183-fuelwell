# FuelWell local MVP backend

This is a **local, fictional demonstration**, separate from Supabase Auth and the existing deployed recipe adapter. It uses no real patient records, external model, or API key. The backend does more than relay a prompt: it selects a patient profile, retrieves relevant source passages, chooses a meal workflow or menu workflow, computes meal estimates from the repo's nutrient table, and returns a structured result with assumptions and citations. Its rules and sample recipes are deliberately inspectable.

## Run it

In two terminals from the repo root:

```sh
npm run dev:api
npm run dev
```

Open `http://localhost:5173/workspace-demo.html`. Vite proxies `/api` to the local server on port 8787.

## Request path

1. The patient selector loads `GET /api/profiles` from `profiles.mjs`. Both profiles are fictional; targets are unset.
2. The composer sends `POST /api/analyze` with `{patientId, mode, message}`. A text attachment is appended to the message in the browser. Images and PDFs are not accepted by this MVP endpoint.
3. `engine.mjs` checks the selected profile, picks the meal or menu path, and calls `retrieve()` in `knowledge.mjs` for relevant source passages.
4. For one of the supported example dishes (lo mein, pho, tacos), `engine.mjs` computes before and after estimates from the shared USDA-based table in `supabase/functions/_shared/renal-data.mjs`. Unknown dishes ask for ingredients and portions instead of fabricating numbers.
5. For menus, it compares lines from the supplied menu text and explains preparation uncertainties. It never claims exact restaurant nutrients.
6. The response includes the patient context, structured result, assumptions, and source links. The UI renders these and can save a summary to browser-local notes.
7. Open **How the backend made this answer** under a response to see the selected profile, workflow, retrieval IDs, and computation. The raw JSON is available by sending the same request to `/api/analyze`.

Try `Chicken lo mein with soy sauce and oyster sauce` with Fung, then switch to Sam. The dialysis profile changes the protein context. In menu mode, try `Steamed fish with rice; Fried chicken with sauce; Vegetable soup`.

## Honest limits

The retrieval is a small, keyword-based knowledge index, not vector RAG or LangChain yet. The responses are deterministic and cover a narrow set of recipes. No care-plan OCR, clinical approval, real login, Google Calendar sync, restaurant database, or production persistence is connected. The existing Supabase Edge Function remains the earlier AI recipe prototype; this local service makes the profile and retrieval contract testable before adding model generation. Do not enter real health information in this local demonstration.
