# How FuelWell gets accurate answers: process, data, recipes and next steps

Companion to `docs/ask-a-meal-plan.md`. Written Nov 14 2026. Licenses and availability were
checked on the web that day; confirm terms with each owner before copying anything.

## 1. The accuracy process

An answer is only as good as the weakest of these steps, so every step has a check.

| Step | What happens | Who or what checks it | Status |
|---|---|---|---|
| 1. Sources | A closed library: guidelines, patient-education pages, clinician guides, nutrient databases. Each passage carries who it applies to (stage, dialysis) and a date. | Team adds sources; an RD approves the list | 138 passages from 13 sources. Population and date tags not done |
| 2. Rulebook | One versioned list of rules (`api/_lib/rules.ts`): additions before cuts, no personal numbers, dialysis protein, potassium only if the care team limits it, and so on. | A renal dietitian signs off each version | Written; not yet signed off |
| 3. Retrieval | Find the dish in the swap list plus the 4 most relevant passages for the question and the profile. | Test set (step 7) checks that the right passages come back | Keyword search. Vector search needs an embeddings key |
| 4. Answer | Claude fills a fixed card: answer, watch, swaps, portion, sources. | Schema validation | Done |
| 5. Code guards | Salt substitutes, star fruit, protein cuts on dialysis, daily targets, numbers in portion tips, shaming words, made-up source IDs. One repair round, then code removes what's still wrong. | `api/_lib/safety.ts` | Done |
| 6. Grounding check | **New:** a second, cheap model call checks each sentence against the cited passages and flags anything unsupported. Unsupported claims are removed or rewritten. | Verifier prompt plus code | To build |
| 7. Test set ("golden questions") | 100-200 real questions (Edith's, interview questions, every cuisine by every stage), each with must-say and must-never-say points written by an RD. Runs on every change. | `npm run test:meals`, extended | 20 cases today; expand |
| 8. Numbers | Any number shown comes from code looking up USDA FoodData Central or a label, never from the model, and is labeled as an estimate with its source. | Code | To build |
| 9. Human review | An RD reviews swap-list rows and adapted recipes (`draft` → `reviewed`). "Dietitian reviewed" is shown only when true. A "Something wrong?" button sends an answer to a review queue. | RD consultant | To build |
| 10. Learning from misses | Today the logs never store what people type (privacy), so we couldn't see Edith's question. Add an opt-in "share this answer so a dietitian can check it". | Team, weekly | To build |
| 11. Freshness | Each source records the date it was checked. Re-check guidelines yearly and brand data monthly; formulas change (Edith). | Ingest script | To build |

**Source tiers** (when sources disagree, the higher tier wins):
1. Clinical guidelines: KDOQI 2020, KDIGO 2024 CKD, KDIGO 2022 Diabetes in CKD.
2. Patient education from kidney organizations: NKF, NIDDK, Kidney Care UK and BDA renal dietitians.
3. Named clinician guides: Dr. Hashmi's Kidney Guide (food and supplement pages only).
4. Data: USDA FoodData Central and FNDDS, national food tables, product labels, chain menus.

## 2. Datasets: where to get them and what each is for

| Dataset | Use in FuelWell | Access and license | Effort |
|---|---|---|---|
| **USDA FoodData Central**: Foundation, SR Legacy, Branded Foods ([API guide](https://fdc.nal.usda.gov/api-guide), [about](https://fdc.nal.usda.gov/about-us)) | Sodium, potassium, phosphorus and protein per ingredient for recipe math. Branded Foods covers specific products (soy sauce brands, frozen meals) and their ingredient lists, which lets us flag phosphate and potassium additives. This answers Edith's brand concern. | Free API key from api.data.gov. Public domain ([data.gov](https://catalog.data.gov/dataset/fooddata-central)). Branded data updated monthly in the API; downloads twice a year | Medium. Best first dataset |
| **FNDDS 2021-2023** ([data.gov](https://catalog.data.gov/dataset/food-and-nutrient-database-for-dietary-studies-fndds), [contents](https://ars.usda.gov/ARSUserFiles/80400530/pdf/fndds/2021_2023_Contents_of_Datasets.pdf)) | Whole dishes as Americans eat them, with recipes broken into ingredients. Gives cited estimates for mixed dishes. Check which of our 70 dishes have food codes. | Free download (Access, SAS, Excel quick view). Public domain | Medium |
| **Open Food Facts** ([license](https://openfoodfacts.github.io/openfoodfacts-server/api/tutorials/license-be-on-the-legal-side), [data](https://world-sk.openfoodfacts.org/data)) | Barcodes, ingredient lists and additive E-numbers, including Asian grocery brands that USDA lacks. Supports a label or barcode scanner. | ODbL: credit them, and share a derived database under the same license. Nightly dumps, Parquet, API | Medium |
| **Taiwan food nutrition database** ([data.gov.tw](https://data.gov.tw/en/datasets/8543)) | Taiwanese foods and dishes. | Open Government Data License, free | Medium |
| **Philippine Food Composition Tables (PhilFCT)** ([FNRI](https://i.fnri.dost.gov.ph/fct/library)) | About 1,500 Filipino foods. | Online lookup; ask philfct@fnri.dost.gov.ph for bulk data | Ask first |
| **China Food Composition Tables** ([INFOODS](https://www.fao.org/infoods/infoods/tables-and-databases/china/en/)) | Chinese ingredients. | China CDC publication; license unclear | Ask first |
| **Chain restaurant nutrition** (chains' own nutrition pages; [MenuStat](https://catalog.data.gov/dataset/dohmh-menustat-historical), historical) | Eating-out mode: rank real menu items by sodium using published numbers, not AI guesses. | Chains with 20+ locations must make written nutrition information available under FDA menu labeling rules. MenuStat stops around 2019-2021 and its license isn't stated | Medium; refresh yearly |
| **Kidney Care UK cultural low-potassium sheets** (Chinese and Far Eastern, South Asian, African Caribbean) ([BDA](https://bda.uk.com/specialist-groups-and-branches/renal-nutrition-specialist-group/projects/resources-for-patients.html)) | Culture-specific advice written by renal dietitians, with Chinese food advice Edith's patients need. | Copyrighted. Ask BDA / Kidney Care UK for permission to cite and index | Ask first |
| **More guidelines**: ADA Standards of Care 2026, CKD chapter; more NKF pages | Diabetes plus CKD questions. | Read and cite; store privately like the existing PDFs | Low |
| **Question bank** | Golden questions (step 7): interview transcripts, Edith's question, and anonymized public questions from kidney forums (questions only, no names). | Our own | Low |

## 3. Recipes from verified sources

Two parts: link out to dietitian-approved recipes, and check our own adaptations with real data.

**A. A recipe finder that links to verified collections.** Store each recipe's title, link, cuisine, tags and the source's own nutrition numbers, not the full text, and send people to the source page. Ask the owners for permission before storing more than that.

| Collection | Why it's trustworthy | Notes |
|---|---|---|
| [Kidney Care UK, Kidney Kitchen](https://www.kidneycareuk.org/kidney-kitchen/) | Every recipe analyzed and approved by the BDA Kidney Dietitian Specialist Group. Low-salt recipes have less than 0.3 g salt per 100 g. South Asian, African and Caribbean collections, and Chinese-style dishes | UK measures; best cultural fit. [South Asian](https://kidneycareuk.org/get-support/healthy-diet-support/kidney-kitchen-magazines/kidney-kitchen-south-asian-recipes/) |
| [NKF recipes](https://kidney.org/recipes-search?page=1) and [cookbook list](https://www.kidney.org/kidney-topics/kidney-disease-cookbooks) | National Kidney Foundation, with nutrition per recipe; cookbook page reviewed by the NKF Patient Education Team | US measures |
| [DaVita recipe collections](https://dkc.ewp.davita.com/diet-nutrition/recipe-collections) | Created by DaVita kidney dietitians | Large; dialysis-focused |
| [DCI Kidney Cooking Book](https://dciinc.org/wp-content/uploads/2024/09/KidneyCookingBook2015-lowres.pdf), [NW Kidney Centers HD Cookbook](https://nwkidney.org/wp-content/uploads/2024/09/HD-Cookbook-202120.pdf) | Dialysis-center dietitians; nutrient analysis from USDA data | Free PDFs; ask before reuse |

**B. Checking family recipes FuelWell adapts:**
1. Claude adapts the family recipe (as today), keeping the dish recognizable.
2. Code matches each ingredient to USDA FoodData Central (or a branded product) and adds up sodium, potassium, phosphorus and protein per serving.
3. Code compares the totals with NKF's recipe tags. Per meal: sodium < 500 mg, potassium < 450 mg, phosphorus < 250 mg, protein < 15 g (CKD 3-4) or about 24 g (dialysis). The card says "lower sodium per NKF recipe guide" only when the numbers back it up. Numbers are labeled estimates.
4. The recipe stays a draft until an RD reviews it and we cook it and note the taste (Dr. Shusterman). Then it gets the "Dietitian reviewed" and "Kitchen tested" badges.

## 4. Cole's agent: what to fix

What `supabase/functions/chat-agent` does well:
- checks the signed-in user and that the patient belongs to them
- only lets reviewed care plans reach the model
- saves chat history and enforces a daily limit
- answers in the person's language
- falls back to pre-written answers if the AI fails

What's weak:
1. **Nothing calls it.** The website never wired it in.
2. **Retrieval is 4 hard-coded sentences.** The same database already holds 138 guideline passages and 70 dishes (`match_guideline_chunks`, `match_swap_catalog`).
3. **The prompt doesn't answer the question first and has no portion rule.** Its instruction for meals is "suggest a few concrete ingredient or preparation changes", the same flaw the meal swap had.
4. **Free text, no safety checks.** None of the checks in `safety.ts` run on its answers.
5. **Narrow emergency check.** It misses swelling and "short of breath", which the old chat caught.
6. **Profiles differ from the website's.** It reads `patient_profiles`, while the site saves to `profiles`.

**Recommendation:** one backend.
- Move Cole's strong parts (patient ownership, reviewed-plan gating, history, quota, language, rules fallback) into the Meals pipeline. Make "Ask about a meal" a short conversation: the first message gives the card, follow-ups answer in text that runs through the same retrieval and safety checks.
- Then retire `chat-agent`, or keep it as the server Cole maintains, but calling the same retrieval and safety code. Cole should make this call.

## 5. More ideas, ranked by impact for effort

1. **Answers in 中文 and Español.** The page says "Answers are in English for now." Pass the page language to the prompt. Matters for Edith's Chinese-speaking patients. Small.
2. **Follow-up questions in Ask about a meal**, with history. Medium.
3. **"Which brand?" check.** Ask for the soy sauce, broth or frozen meal brand. Look it up in FoodData Central or Open Food Facts. Show its sodium next to a lower-sodium option and flag "phos" and potassium chloride. Medium.
4. **Care-team limits in the profile** (Dr. Shusterman's toggles). Small.
5. **Golden-question test set and grounding check** (process steps 6-7). Medium; protects everything else.
6. **"Something wrong?" button and dietitian review queue.** Medium.
7. **Restaurant sodium ranking** from chains' published nutrition. Medium.
8. **Taste feedback** ("We liked this / Not for us") and taste settings. Small.
9. **"Your usual week" and a 3-day food record**, with a summary for the dietitian before a visit (Edith's time saver). Larger.
10. **Event planning:** a birthday or holiday meal and the days around it (Dr. Hashmi). Small once 2 exists.
11. **Doctor-visit prep:** questions to bring, from the SELF Principle "two tests" handout. No lab interpretation. Small.
12. **Photos for the 40 new swap-list dishes.** Small.
13. **Vector search** (an embeddings key) so "beef noodle" also finds "niu rou mian". Small.

## 6. What only the team can do

- **Recruit an RD reviewer.** Edith offered to share with other dietitians, and Jen is reviewing the swap list. Ask one of them to sign off the rulebook and the swap list.
- **Get Edith's exact question** (draft reply is in Gmail).
- **Ask for permission:** Kidney Care UK / BDA (cultural sheets and Kidney Kitchen index), NKF and DaVita (recipe index), FNRI (PhilFCT bulk data).
- **Cook and taste-test** two or three adapted recipes, with photos (Dr. Shusterman).
- **Decide with Cole** on one backend.
- **Get a free FoodData Central API key** (api.data.gov), and an embeddings key if we want vector search.
- **Before real patients use it:** a privacy review (health-privacy rules apply once dietitians use it with their patients), and check whether patient-facing personalized advice raises any FDA software questions.
