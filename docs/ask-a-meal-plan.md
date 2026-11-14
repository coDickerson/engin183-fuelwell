# Ask-a-meal: a food helper that dietitians and doctors can stand behind

Status as of Nov 14 2026. Written after Edith Yang, RD (Healthy Mission Dietitian) tried the
prototype and replied on Nov 11.

## What Edith said, and why it happened

| Edith said | Cause |
|---|---|
| "I tried asking the AI a question about something I had eaten, but the response didn't quite address my question." | The general AI Chat answered from canned keyword replies (`frontend/scripts/portal/agent.js` was a mock; Cole's `chat-agent` was never wired in). The Meals swap could only fill a swap card, with no place for an answer. |
| "I didn't see anywhere for portions." | No card or catalog row had portion guidance; the rules only said "no numbers". |
| "Cantonese cuisine seemed to be the primary Chinese option." | 7 of 30 catalog dishes were Chinese, mostly Cantonese, and the Meals page always used Fung's profile ("Cantonese home cooking; age 78"). |
| "The meal planning menu was still too restrictive and limited." | The sample week is a fixed menu. Edith and Dianne both said patients don't follow fixed plans. |
| Recommends a registered dietitian consultant; not ready to recommend to patients yet. | The swap list is a draft that no renal dietitian has reviewed. |

## Principles every clinician we interviewed agreed on

1. Start from what people already eat. No rigid meal plans. (Edith, Dianne, Dr. Hashmi, Jen Hernandez)
2. Additions before cuts. Never shame. (Jen, Dr. Hashmi)
3. Personal by stage and by what the care team set, not one renal diet. (Dr. Shusterman, Dr. Hashmi)
4. A closed, cited source library: KDOQI 2020, KDIGO 2024 and 2022, NKF pages, Dr. Hashmi's guide, later USDA FoodData Central and brand labels.
5. The AI never invents numbers. Personal targets only from a care plan a dietitian reviewed.
6. A dietitian stays in the loop; the tool says when it is unsure (brands, sauces, restaurant cooking). (Edith, Dianne, Dr. Shusterman)
7. Minimal privacy footprint: no medical-record connection. (Dr. Shusterman)

## Medical review

- **Stage mix-ups.** Protein advice is opposite before and after dialysis (KDOQI 2020 gives separate ranges for CKD 3-5, CKD with diabetes, and dialysis). Unknown stage gets advice that is safe for everyone. Peritoneal vs hemodialysis should be asked later.
- **Potassium.** Individualize by labs (KDOQI 2020; NKF: "If your potassium is in range, you may not need to avoid all higher potassium fruits and vegetables"). Advice says "if your care team limits potassium".
- **Over-restriction.** NKF: "Do not remove whole food groups unless your healthcare team tells you to." Additions first.
- **Portions.** The strongest lever (Edith cuts the noodle portion and adds protein and vegetables), but personal amounts are the dietitian's. FuelWell gives relative, dish-specific tips; a code filter rejects grams, cups, ounces or mg in a portion tip; dialysis never gets a smaller protein portion. Amounts come only from a reviewed care plan (`patient_care_plans.targets`).
- **Hidden sodium and phosphorus.** Phosphate additives, potassium chloride in "low-sodium" products, brined meat. Ask the brand rather than guess (Edith); label check later (Dr. Hashmi).
- **Blocked in code:** salt substitutes, star fruit, supplements and herbal remedies, medication advice, urgent symptoms.
- **Disagreements** (for example potassium absorption): the rule list in `api/_lib/rules.ts` is the one rulebook, versioned, signed off by a renal dietitian before anything says "dietitian reviewed".
- **Privacy:** once dietitians use FuelWell with real patients, health-privacy rules apply.

## User review

- Adult children in a hurry and older patients: 6th-grade reading level, EN / 中文 / ES.
- Answer the question first; no guilt after eating something.
- Show who the answer is for, with an edit link.
- Ask little up front; ask more in context ("Which soy sauce do you use?").
- Learn taste (liked / not for us; sweeter, savory, spicy) instead of stereotyping by ethnicity.
- Teach the why, so people learn the plate method.

## Profiles

Today there are three: the account `profiles` table, Cole's `patient_profiles`, and the demo persona. Target: one patient profile per patient, owned by the caregiver.

| Group | Fields | Set by |
|---|---|---|
| Clinical | Stage; dialysis type; diabetes; blood pressure | Patient or caregiver |
| Care-team limits (Dr. Shusterman's toggles) | Potassium, phosphorus, sodium, protein, fluid: limit / no limit / not sure | Patient ("my care team said"), confirmed by a dietitian |
| Personal targets | Portions and amounts | Only from a reviewed care plan |
| Food | Cuisine and region, taste, staple brands, favorite dishes and restaurants, home / frozen / takeout / work, who cooks | Patient or caregiver |
| Learned | Liked / not liked, saved swaps | The app |
| Not stored | Medical records; labs (maybe later, dietitian-only) | n/a |

## Phases

**Phase 0 (done on branch `fix-swap-questions`)**
- Answer-first: the swap card has an `answer` field for questions.
- General AI Chat removed; the Today AI box sends questions to Meals.
- Cole's `chat-agent` function and its two migrations committed (they were only on Supabase).
- Meals uses the signed-in account's profile; the demo keeps Fung. Edit-profile link.
- Portion tip on every card and every catalog row, with code checks.
- Swap list 30 -> 70 dishes (Cantonese, Taiwanese, Shanghainese, Sichuan, Hainanese, plus Thai, Indian, Middle Eastern, Salvadoran, West African, soul food and Dr. Hashmi's examples). All still drafts.
- New source: SELF Principle Kidney Guide v2, pages 9-10.
- eGFR-to-stage hint in the profile form (KDIGO 2024).
- Unsourced mg numbers and badges removed from the Meals sample week.

**To finish Phase 0**
1. Apply `supabase/migrations/20261114080000_swap_catalog_portion.sql`, then `npm run ingest`. Do this before deploying: `/api/catalog` now selects the `portion` column.
2. Reply to Edith (draft in Gmail).

**Phase 1 (next 2-3 weeks)**
- Follow-up questions inside "Ask about a meal", with saved history (reuse Cole's `chat_exchanges`, auth and quota).
- One patient profile with care-team limits, region and taste.
- Liked / not for us feedback.
- Turn the meal-planning page into "Your usual week": log typical meals (Edith's 3-day food record), then get swaps.

**Phase 2 (dietitian in the loop)**
- Review status on catalog rows and the rulebook; show "Dietitian reviewed" only when true.
- Care-plan review screen (Cole's table has the status field).
- More regional dishes, reviewed by an RD. Brand questions, then label checks.
- Cook adapted recipes and record taste notes (Dr. Shusterman).

**Later:** pre-visit summary for the dietitian; directory of dietitians by culture and language; labs only if a dietitian manages them.

## Decisions for the team

1. Who reviews content: Edith, Jen, or someone Edith recommends.
2. One backend: keep the Meals pipeline (`api/_lib/`) and port Cole's auth, patient ownership, reviewed-plan gating, history and quota, or the reverse. Cole should agree.
3. Labs: leave out, or dietitian-only?
4. Meal-planning page: rework into "Your usual week", or remove? (Peyton)
