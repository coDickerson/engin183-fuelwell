# FuelWell's kidney-specific AI: how it works and where it's going

Written Nov 13 2026, from a conversation about the vision. Companion docs:
`docs/ask-a-meal-plan.md` (what Edith asked for and Phase 0) and
`docs/accuracy-and-data-plan.md` (the accuracy process, datasets and recipes).

## The core idea: we customize around Claude, not by training our own model

FuelWell uses Claude as the base model. It doesn't fine-tune one (retrain a model on our own
examples). Fine-tuning would need thousands of answers labeled by dietitians, doesn't add facts
reliably, and needs retraining whenever guidance changes. **Retrieval** instead pulls approved
sources into each question, so answers stay current and can be checked against what they cite.
This approach is called RAG (retrieval-augmented generation).

So "customized AI for kidney patients" means:
**our knowledge + our rules + the patient's profile + our checks + dietitian review**, wrapped around a general model.

## How we customize it today

| Layer | Technical name | What FuelWell does now | Who asked for it |
|---|---|---|---|
| Knowledge | RAG over a curated set of sources | 70 dishes with swaps and portion tips; 138 passages from 13 sources (KDOQI, KDIGO, NKF, Dr. Hashmi's guide) | All clinicians: "only what we stand behind" |
| Rules | System prompt / rulebook (`api/_lib/rules.ts`) | Add before cutting, no shaming, no personal numbers, dialysis protein rule, potassium advice only if the care team limits it | Jen, Dr. Hashmi |
| Personalization | Context injection | Stage, dialysis, diabetes and cuisine from the account profile go into every prompt | Dr. Shusterman: "personal by stage" |
| Answer format | Structured output (`api/_lib/schemas.ts`) | A fixed card: answer, what to watch, swaps, portion, sources | Edith: "answer my question", "where are portions?" |
| Safety | Code-based checks plus one repair round (`api/_lib/safety.ts`) | Code removes salt substitutes, star fruit, protein cuts on dialysis, made-up sources, and numbers in portion tips | Dr. Shusterman, Dr. Hashmi |
| Testing | Test suite (`npm run test:meals`) | 20 test questions run on every change | n/a |

## Two LangChain setups, one to keep

Both use LangChain: a prompt template, then ChatAnthropic, then the model's output.

| | Meals helper (`api/_lib`, what the website uses) | Cole's agent (`supabase/functions/chat-agent`) |
|---|---|---|
| What it searches | 70 dishes and 138 guideline passages in the database | 4 sentences hard-coded in the file |
| Answer format | Fixed card | Free text |
| Safety checks | Full set in `safety.ts` | Emergency-symptom word check only (misses swelling) |
| Answers the question first | Yes | No ("suggest changes") |
| Login, patient ownership, history, daily limit, languages | Weak or missing | Good |
| Wired into the website | Yes | No |

History: the Meals helper was built Nov 8 by Megan with Claude Code. Cole deployed `chat-agent` on Nov 9.

**Option A:** move Cole's strengths into the Meals helper.
**Option B:** make Cole's agent the main one and add the shared search, the card format, the
safety checks, and the answer-first prompt.
Either way we end with one LangChain backend. Decide with Cole.

LangChain is optional; it's a convenience layer over the Claude API. It's useful once the model
calls tools (see 3 below).

## What's still weak, and what great looks like

1. **Shallow personalization.**
   - Today the profile has 4 fields.
   - Next, a full patient profile:
     - limits the care team set: potassium, phosphorus, sodium, protein and fluid, each limit / no limit / not sure (Dr. Shusterman's toggles)
     - dialysis type
     - region (not just "Chinese") and taste
     - staple brands, and who cooks
     - memory of what they liked or didn't, and past questions
   - Personal numbers come only from a care plan a dietitian reviewed. Cole's `patient_care_plans` table supports this.
2. **Search matches exact words only.**
   - Today it is keyword search.
   - Next, combine keywords with meaning-based matching (embeddings), so "牛肉麵" finds "beef noodle soup".
   - Tag each passage with who it is for (for example dialysis), and filter by that.
   - Re-sort results by relevance before the AI sees them.
3. **The AI can't look things up.**
   - Next, the AI calls our code (tool use):
     - `lookup_nutrients` (USDA FoodData Central)
     - `lookup_brand` (Open Food Facts)
     - `lookup_menu` (restaurant chain data)
   - It asks clarifying questions ("Which soy sauce do you use?"), as Edith suggested.
   - The model decides what to look up and code does the math, so numbers are never guessed.
4. **No check that answers match their sources.**
   - Next, a cheap second model call checks each sentence against the passages it cites.
   - Sentences without support are removed.
5. **Small test set.**
   - Next, 150+ realistic test questions with grading rubrics written by dietitians, run on every change.
   - Measure:
     - safety violations
     - whether it answered the actual question (Edith's complaint)
     - whether it personalized correctly (dialysis keeps protein)
     - reading level
6. **Little insight into what goes wrong.**
   - Next, log each request (LangSmith or Langfuse): sources retrieved, safety fixes, speed and cost.
   - Add an opt-in "share with a dietitian" button so misses like Edith's reach us.
7. **No dietitian in the loop.**
   - Next, a dietitian dashboard:
     - review dishes and adapted recipes
     - enter a patient's care plan
     - read a summary before each visit (Edith's 3-day food record)
   - Show "Dietitian reviewed" only when it is true.
8. **English only.**
   - Answers in 中文 and Español, at a 6th-grade reading level.
   - Small change, big impact for Edith's patients.

## The business picture

- **Product:** advice from a kidney dietitian between visits, for the food your family actually cooks.
- **What's hard to copy:** anyone can call Claude. Not anyone has:
  - a dietitian-reviewed dish catalog across cuisines
  - a signed-off rulebook
  - a graded test set
  - each patient's learned profile
  - working relationships with dietitians
- **Distribution:** patients reach the app through their dietitians, and the app connects back to them. Clinicians recommend it because it extends their care instead of replacing it. Every clinician we interviewed wanted the dietitian kept in the loop.
- **Proving results:**
  - First, patient confidence, swaps actually tried, and dietitian time saved.
  - Later, a pilot with a practice like Edith's, tracking potassium and phosphorus labs.
- **Before real patients:**
  - health-privacy compliance (HIPAA, with signed agreements from vendors like Anthropic and Supabase)
  - check whether personalized advice raises FDA software questions

## Priority order

1. Test questions written with a dietitian
2. Full profile with the care-team toggles
3. Chinese and Spanish answers
4. Tool use with USDA data (numbers come from code)
5. Checking answers against their sources
6. Combined keyword and meaning-based search
7. Dietitian dashboard

1 and 2 make it accurate and personal. 3 to 7 make it impressive.
