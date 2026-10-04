#!/usr/bin/env node
// renal-recipe-check: audit FuelWell meal/recipe sample data for kidney-diet sanity.
//
// Imports the SAME nutrient table, thresholds and swap map as the recipe-adapter
// Edge Function (supabase/functions/_shared/renal-data.mjs), so the skill and the
// runtime agent cannot drift.
//
// Usage (from the repo root):
//   node .claude/skills/renal-recipe-check/scripts/check-meals.mjs                 # scan frontend/data/*.js
//   node .claude/skills/renal-recipe-check/scripts/check-meals.mjs path/to/meals.js
//   node .claude/skills/renal-recipe-check/scripts/check-meals.mjs --dish "kimchi jjigae"
//   node .claude/skills/renal-recipe-check/scripts/check-meals.mjs --self-test
// Flags: --json (machine-readable), --strict (warnings also fail the run)
// Exit code: 0 ok, 1 errors found (or warnings with --strict), 2 usage/load problem.
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../../..');
const dataModule = join(repoRoot, 'supabase/functions/_shared/renal-data.mjs');
const { NUTRIENTS, THRESHOLDS, SWAPS, DISHES, findNutrient, findDish, computeTotals, levelFor } = await import(
  pathToFileURL(dataModule).href
);

// Per-meal plausibility limits. Above these a single serving is almost certainly a
// data-entry error (e.g. per-day or per-recipe values typed into a per-serving field).
const UNREALISTIC = { k: 2500, p: 1200, na: 4500 };
const DRIFT = 0.35; // declared vs computed totals may differ by this fraction before we warn
const DISCLAIMER_RE = /not\s+medical\s+advice|sample\s+data|sample\s+estimate|for\s+demonstration|demo\s+data|student\s+demo/i;

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const asJson = flag('--json');
const strict = flag('--strict');

// ---------------------------------------------------------------------------
// Meal extraction: accept the shapes FuelWell sample data tends to use.
// ---------------------------------------------------------------------------
const NUM_KEYS = {
  k: ['k_mg', 'potassium_mg', 'potassium', 'k'],
  p: ['p_mg', 'phosphorus_mg', 'phosphorus', 'p'],
  na: ['na_mg', 'sodium_mg', 'sodium', 'na'],
};

function pickNumber(obj, keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  }
  return undefined;
}

function declaredTotals(meal) {
  for (const holder of [meal, meal.nutrients, meal.totals, meal.totals_after, meal.per_serving, meal.perServing]) {
    if (!holder || typeof holder !== 'object') continue;
    const k = pickNumber(holder, NUM_KEYS.k);
    const p = pickNumber(holder, NUM_KEYS.p);
    const na = pickNumber(holder, NUM_KEYS.na);
    if (k !== undefined || p !== undefined || na !== undefined) return { k, p, na };
  }
  return null;
}

function declaredLevels(meal) {
  const src = meal.levels ?? meal.levels_after ?? meal.badges ?? null;
  if (!src || typeof src !== 'object') return null;
  const norm = (v) => (typeof v === 'string' ? v.toLowerCase().replace('medium', 'mid').replace('moderate', 'mid') : undefined);
  return { k: norm(src.k ?? src.potassium), p: norm(src.p ?? src.phosphorus), na: norm(src.na ?? src.sodium) };
}

function mealName(obj) {
  for (const key of ['name', 'title', 'dish', 'adapted_name', 'label']) if (typeof obj?.[key] === 'string') return obj[key];
  return null;
}

function looksLikeMeal(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj) || !mealName(obj)) return false;
  return Array.isArray(obj.ingredients) || declaredTotals(obj) !== null || declaredLevels(obj) !== null;
}

function collectMeals(value, path, out, depth = 0) {
  if (depth > 4 || value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      if (looksLikeMeal(item)) out.push({ path: `${path}[${i}]`, meal: item });
      else collectMeals(item, `${path}[${i}]`, out, depth + 1);
    });
    return;
  }
  if (looksLikeMeal(value)) {
    out.push({ path, meal: value });
    return;
  }
  for (const [key, child] of Object.entries(value)) collectMeals(child, `${path}.${key}`, out, depth + 1);
}

function normaliseIngredients(list) {
  const amounts = [];
  const names = [];
  for (const item of list ?? []) {
    if (typeof item === 'string') {
      names.push(item);
      continue;
    }
    if (!item || typeof item !== 'object') continue;
    const name = item.name ?? item.ingredient ?? item.item;
    if (typeof name !== 'string') continue;
    names.push(name);
    const grams = pickNumber(item, ['amount_g', 'grams', 'g', 'weight_g']);
    if (grams !== undefined) amounts.push({ name, amount_g: grams });
  }
  return { names, amounts: amounts.length === names.length && amounts.length ? amounts : null };
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------
function checkMeal(meal) {
  const findings = [];
  const add = (severity, message) => findings.push({ severity, message });
  const name = mealName(meal);
  const { names, amounts } = normaliseIngredients(meal.ingredients);

  const unknown = names.filter((n) => !findNutrient(n));
  if (unknown.length) add('warn', `Ingredients not in the shared nutrient table: ${unknown.join(', ')}. Add them to renal-data.mjs (with a USDA FDC ID) or use a known name.`);

  const computed = amounts ? computeTotals(amounts) : null;
  const declared = declaredTotals(meal);

  if (declared) {
    for (const key of ['k', 'p', 'na']) {
      const v = declared[key];
      if (v === undefined) {
        add('warn', `No ${LABEL[key]} value declared.`);
        continue;
      }
      if (!Number.isFinite(v) || v < 0) add('error', `${LABEL[key]} = ${v} is not a valid amount.`);
      else if (v > UNREALISTIC[key]) add('error', `${LABEL[key]} ${v} mg in one serving is unrealistic (limit ${UNREALISTIC[key]}). Per-day or whole-recipe value?`);
    }
    if (declared.k === 0 && declared.p === 0 && names.length > 1) add('warn', 'K and P are both 0 for a multi-ingredient dish; that is not plausible.');
  }

  if (computed && declared) {
    const pairs = [['k', 'k_mg'], ['p', 'p_mg'], ['na', 'na_mg']];
    for (const [key, field] of pairs) {
      const d = declared[key];
      const c = computed.totals[field];
      if (d === undefined || !Number.isFinite(d)) continue;
      const base = Math.max(c, 50);
      if (Math.abs(d - c) / base > DRIFT) {
        add('warn', `Declared ${LABEL[key]} ${d} mg differs from table-computed ${c} mg by more than ${Math.round(DRIFT * 100)}%.`);
      }
    }
  }

  const effective = computed
    ? computed.totals
    : declared
      ? { k_mg: declared.k, p_mg: declared.p, na_mg: declared.na }
      : null;
  const levels = effective && [effective.k_mg, effective.p_mg, effective.na_mg].every(Number.isFinite)
    ? { k: levelFor('k', effective.k_mg), p: levelFor('p', effective.p_mg), na: levelFor('na', effective.na_mg) }
    : null;

  const shown = declaredLevels(meal);
  if (shown && levels) {
    for (const key of ['k', 'p', 'na']) {
      if (shown[key] && shown[key] !== levels[key]) {
        add('warn', `Badge says ${LABEL[key]} "${shown[key]}" but the thresholds give "${levels[key]}".`);
      }
    }
  }
  if (levels) {
    for (const key of ['k', 'p', 'na']) {
      if (levels[key] === 'high') add('info', `${LABEL[key]} is high for one meal (> ${THRESHOLDS[key].midMax} mg). Fine to show, but pair it with a swap or portion tip.`);
    }
  }

  // Culturally faithful swaps from the shared map.
  const suggestions = [];
  const seen = new Set();
  for (const n of names) {
    const row = findNutrient(n);
    const swap = row ? SWAPS[row.name] : undefined;
    if (!swap || seen.has(row.name)) continue;
    seen.add(row.name);
    const to = swap.to === null ? 'leave it out' : swap.to === row.name ? `${Math.round(swap.factor * 100)}% of the amount` : swap.to;
    suggestions.push(`${n} -> ${to}: ${swap.why}`);
  }
  if (!names.length && !declared) add('warn', 'No ingredients or nutrient values to check.');

  return { name, computed: computed?.totals ?? null, declared, levels, findings, suggestions };
}

async function checkFile(file) {
  const abs = resolve(file);
  const rel = relative(repoRoot, abs);
  const source = await readFile(abs, 'utf8');
  let mod;
  try {
    mod = await import(pathToFileURL(abs).href);
  } catch (err) {
    // A .js file outside a "type": "module" package: retry as an ES module from source.
    try {
      mod = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
    } catch {
      mod = null;
    }
    if (!mod) return { file: rel, loadError: `Could not import as an ES module: ${err.message}`, meals: [], fileFindings: [] };
  }
  const found = [];
  for (const [key, value] of Object.entries(mod)) {
    if (looksLikeMeal(value)) found.push({ path: key, meal: value });
    else collectMeals(value, key, found);
  }
  const fileFindings = [];
  if (found.length && !DISCLAIMER_RE.test(source)) {
    fileFindings.push({ severity: 'error', message: 'No disclaimer found. Label this as sample data and "not medical advice" (export a DISCLAIMER or include it in the data).' });
  }
  return { file: rel, meals: found.map(({ path, meal }) => ({ path, ...checkMeal(meal) })), fileFindings };
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------
const LABEL = { k: 'K', p: 'P', na: 'Na' };
const ICON = { error: 'ERROR', warn: 'WARN ', info: 'info ' };

function printReport(reports) {
  for (const r of reports) {
    console.log(`\n== ${r.file}`);
    if (r.loadError) {
      console.log(`  ${ICON.error} ${r.loadError}`);
      continue;
    }
    for (const f of r.fileFindings) console.log(`  ${ICON[f.severity]} ${f.message}`);
    if (!r.meals.length) console.log('  (no meal-like objects found)');
    for (const m of r.meals) {
      const t = m.computed ?? (m.declared ? { k_mg: m.declared.k, p_mg: m.declared.p, na_mg: m.declared.na } : null);
      const lv = m.levels ? ` [K ${m.levels.k} / P ${m.levels.p} / Na ${m.levels.na}]` : '';
      const nums = t ? ` K ${t.k_mg ?? '?'} · P ${t.p_mg ?? '?'} · Na ${t.na_mg ?? '?'} mg${m.computed ? ' (computed)' : ' (declared)'}` : '';
      console.log(`  - ${m.name} (${m.path})${nums}${lv}`);
      for (const f of m.findings) console.log(`      ${ICON[f.severity]} ${f.message}`);
      for (const s of m.suggestions) console.log(`      swap  ${s}`);
    }
  }
  const counts = tally(reports);
  console.log(`\nSummary: ${counts.meals} meals, ${counts.error} errors, ${counts.warn} warnings. Table: ${NUTRIENTS.length} ingredients (USDA FDC). Thresholds per meal: K <${THRESHOLDS.k.lowBelow}/<=${THRESHOLDS.k.midMax}, P <${THRESHOLDS.p.lowBelow}/<=${THRESHOLDS.p.midMax}, Na <${THRESHOLDS.na.lowBelow}/<=${THRESHOLDS.na.midMax} mg (demo heuristics).`);
}

function tally(reports) {
  const c = { meals: 0, error: 0, warn: 0 };
  for (const r of reports) {
    if (r.loadError) c.error += 1;
    for (const f of r.fileFindings ?? []) c[f.severity] = (c[f.severity] ?? 0) + 1;
    for (const m of r.meals ?? []) {
      c.meals += 1;
      for (const f of m.findings) if (f.severity !== 'info') c[f.severity] += 1;
    }
  }
  return c;
}

function finish(reports) {
  if (asJson) console.log(JSON.stringify(reports, null, 2));
  else printReport(reports);
  const c = tally(reports);
  process.exit(c.error > 0 || (strict && c.warn > 0) ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------
if (flag('--help') || flag('-h')) {
  console.log('Usage: check-meals.mjs [files...] [--dish "name"] [--self-test] [--json] [--strict]');
  process.exit(0);
}

if (flag('--self-test')) {
  let failures = 0;
  const expect = (cond, label) => {
    if (!cond) failures += 1;
    console.log(`${cond ? 'pass' : 'FAIL'}  ${label}`);
  };
  for (const dish of DISHES) {
    const r = checkMeal({ name: dish.name, ingredients: dish.ingredients });
    expect(r.computed && !r.findings.some((f) => f.severity === 'error') && !r.findings.some((f) => /not in the shared/.test(f.message)),
      `library dish "${dish.key}" resolves every ingredient (Na ${r.computed?.na_mg} mg)`);
  }
  const bad = checkMeal({ name: 'Typo soup', ingredients: ['soy sauce', 'dragonfruit foam'], potassium: 9000, phosphorus: 0, sodium: -5, levels: { k: 'low' } });
  expect(bad.findings.some((f) => /unrealistic/.test(f.message)), 'flags unrealistic potassium');
  expect(bad.findings.some((f) => /not a valid amount/.test(f.message)), 'flags negative sodium');
  expect(bad.findings.some((f) => /not in the shared nutrient table/.test(f.message)), 'flags unknown ingredient');
  expect(bad.findings.some((f) => /Badge says K "low"/.test(f.message)), 'flags badge/threshold mismatch');
  expect(bad.suggestions.some((s) => s.startsWith('soy sauce -> low-sodium soy sauce')), 'suggests a culturally faithful swap');
  const drift = checkMeal({ name: 'Drift', ingredients: [{ name: 'soy sauce', amount_g: 15 }], sodium_mg: 100, potassium_mg: 65, phosphorus_mg: 25 });
  expect(drift.findings.some((f) => /differs from table-computed/.test(f.message)), 'flags declared vs computed drift');
  expect(findNutrient('Bok Choy')?.name === 'bok choy, cooked' && findNutrient('nuoc mam')?.name === 'fish sauce' && findNutrient('xyz') === null, 'fuzzy lookup matches and refuses unknowns');
  expect(levelFor('k', 399) === 'low' && levelFor('k', 700) === 'mid' && levelFor('na', 701) === 'high', 'threshold boundaries');
  console.log(failures ? `\n${failures} self-test check(s) failed.` : '\nAll self-test checks passed.');
  process.exit(failures ? 1 : 0);
}

const dishName = option('--dish');
if (dishName) {
  const dish = findDish(dishName);
  if (!dish) {
    console.error(`Unknown dish "${dishName}". Library: ${DISHES.map((d) => d.key).join(', ')}`);
    process.exit(2);
  }
  finish([{ file: `dish library: ${dish.key}`, fileFindings: [], meals: [{ path: dish.key, ...checkMeal({ name: dish.name, ingredients: dish.ingredients }) }] }]);
}

const fileArgs = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--dish');
let files = fileArgs;
if (!files.length) {
  const dir = join(repoRoot, 'frontend/data');
  files = existsSync(dir) ? (await readdir(dir)).filter((f) => /\.(m?js)$/.test(f)).map((f) => join(dir, f)) : [];
  if (!files.length) {
    console.log('No meal data files found in frontend/data/. Pass file paths, --dish "<name>", or --self-test.');
    process.exit(0);
  }
}
const reports = [];
for (const f of files) {
  if (!existsSync(f)) {
    reports.push({ file: f, loadError: 'File not found.', meals: [], fileFindings: [] });
    continue;
  }
  reports.push(await checkFile(f));
}
finish(reports);
