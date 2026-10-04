---
name: renal-recipe-check
description: Checks FuelWell meal and recipe data for kidney-diet sanity. Use whenever you add, edit or review a meal, recipe, dish, meal plan, swap table or nutrient value in the FuelWell codebase (for example sample data in frontend/data/*.js, the dish library or nutrient table in supabase/functions/_shared/renal-data.mjs, or meal cards in dashboard scripts), or when someone asks whether potassium, phosphorus or sodium numbers or low/mid/high badges look right, whether a dish is CKD- or renal-friendly, or for culturally faithful swaps for Chinese, Korean or Vietnamese dishes. Runs a Node script against the same USDA-based nutrient table and per-meal thresholds the recipe-adapter Edge Function uses, flags unrealistic values, badge mismatches, unknown ingredients and missing disclaimers, and suggests swaps.
---

# Renal recipe check

FuelWell shows potassium (K), phosphorus (P) and sodium (Na) per meal for an older parent with CKD stage 3b-4. Wrong numbers or a missing disclaimer undermine trust. This skill makes every meal edit pass the same check the runtime AI agent uses.

**One source of truth:** `supabase/functions/_shared/renal-data.mjs` holds the nutrient table (USDA FoodData Central, FDC IDs in the file), the per-meal thresholds, the swap map and the dish library. The `recipe-adapter` Edge Function and this skill both import it. Never copy these numbers into another file. Change them only there.

## When to run

- After creating or editing any meal, recipe, dish or meal plan data.
- After changing `renal-data.mjs`: run `--self-test` too.
- Before committing UI that shows nutrient badges.

## Steps

1. Find the data you touched. Default target: `frontend/data/*.js` (ES modules that export arrays or objects of meals).
2. Run from the repo root:
   ```bash
   node .claude/skills/renal-recipe-check/scripts/check-meals.mjs            # all of frontend/data
   node .claude/skills/renal-recipe-check/scripts/check-meals.mjs frontend/data/<file>.js
   node .claude/skills/renal-recipe-check/scripts/check-meals.mjs --dish "doenjang jjigae"   # a library dish
   node .claude/skills/renal-recipe-check/scripts/check-meals.mjs --self-test               # after editing renal-data.mjs
   ```
   Add `--json` for machine-readable output or `--strict` to fail on warnings. Exit code 1 means there are errors.
3. Fix every `ERROR` before finishing:
   - **Unrealistic value** (per serving: K > 2,500, P > 1,200, Na > 4,500 mg, or a negative number): usually a per-day or whole-pot value. Recompute per serving.
   - **No disclaimer**: the file must say it is sample data and not medical advice (for example `export const DISCLAIMER = 'Sample data for a student demo. Not medical advice.'`).
4. Resolve each `WARN` or explain why it is fine:
   - **Badge mismatch**: the shown low/mid/high must follow the thresholds. Fix the badge, not the threshold.
   - **Declared vs computed drift > 35%**: if the meal lists `{name, amount_g}` ingredients, the table total wins unless you have a better source.
   - **Unknown ingredient**: use a name the table knows, or add a row to `renal-data.mjs` with K/P/Na per 100 g and its USDA FDC ID (mark approximations with `note`).
5. Use the `swap` lines to suggest changes that keep the dish recognisable (see rules below). `info` lines on high meals are fine for sample data if the UI pairs them with a tip or swap.
6. Report back: which files were checked, errors fixed, remaining warnings with reasons, and any swaps you applied.

## Meal data shape the script understands

Any exported array or object whose items have a `name`/`title`/`dish` plus either `ingredients` or nutrient fields:

```js
export const DISCLAIMER = 'Sample data for a student demo. Not medical advice.';
export const MEALS = [{
  name: 'Ginger scallion steamed fish',
  ingredients: [{ name: 'white fish', amount_g: 150 }, { name: 'low-sodium soy sauce', amount_g: 8 }], // or plain strings
  k_mg: 420, p_mg: 220, na_mg: 300,            // also: potassium/phosphorus/sodium(_mg), or nested nutrients/totals
  levels: { k: 'mid', p: 'mid', na: 'low' },   // optional badges, checked against thresholds
}];
```

## Thresholds (per meal, demo heuristics)

| | low | mid | high |
|---|---|---|---|
| Potassium | < 400 mg | 400-700 | > 700 |
| Phosphorus | < 200 mg | 200-300 | > 300 |
| Sodium | < 400 mg | 400-700 | > 700 |

These come from NKF / KDOQI 2020 daily ranges for CKD 3b-4 split across three meals and a snack. They are labelled demo heuristics, not clinical targets; personal targets come from the care team.

## Swap rules (culturally faithful)

- Keep the dish's name, method and signature flavour. Change the fewest ingredients that matter.
- Sodium first: low-sodium soy sauce, half the fish sauce plus lime, half the doenjang or gochujang, homemade unsalted stock, skip MSG, rinse kimchi, serve broth partly uneaten.
- Then potassium: leach potatoes, daikon for taro, fresh not dried shiitake, lime for tamarind, napa cabbage or bean sprouts for spinach, smaller vegetable portions.
- Then phosphorus: avoid processed meats and phosphate additives; palm-sized protein; white rice over brown.
- Never write medical advice, medicine or supplement guidance, or dosing in meal copy.
