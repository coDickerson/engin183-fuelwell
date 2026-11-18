import { NUTRIENTS, findNutrient } from '../../supabase/functions/_shared/renal-data.mjs';
import { profiles } from './profiles.mjs';
import { retrieve } from './knowledge.mjs';

const dishes = [
  { match: /lo\s?mein|noodles?/i, title: 'Lo mein', original: [['egg noodles, cooked', 180], ['chicken breast, cooked', 80], ['bok choy, cooked', 80], ['soy sauce', 20], ['oyster sauce', 12]],
    adapted: [['egg noodles, cooked', 180], ['chicken breast, cooked', 80], ['green cabbage', 80], ['low-sodium soy sauce', 8], ['rice vinegar', 8], ['ginger', 8]],
    swaps: ['Use a measured smaller amount of sauce, with rice vinegar and ginger for flavor.', 'Keep the noodles and chicken; use cabbage for this example side.'] },
  { match: /pho|beef noodle soup/i, title: 'Pho', original: [['rice noodles, cooked', 180], ['beef, lean, cooked', 80], ['beef broth, restaurant style', 350], ['fish sauce', 12]],
    adapted: [['rice noodles, cooked', 180], ['beef, lean, cooked', 80], ['homemade low-sodium stock', 250], ['lime juice', 15], ['Thai basil', 8]],
    swaps: ['Keep the rice noodles and beef; use less broth and skip extra fish sauce.', 'Use lime and herbs for flavor.'] },
  { match: /taco/i, title: 'Chicken tacos', original: [['chicken breast, cooked', 90], ['tomato', 60], ['table salt', 2]],
    adapted: [['chicken breast, cooked', 90], ['green cabbage', 60], ['lime juice', 15], ['cilantro', 8]],
    swaps: ['Keep the chicken filling and use lime, cilantro, and cabbage for a fresh topping.', 'Check packaged tortillas and sauces for sodium; they are not included in this estimate.'] },
];

function totals(items) {
  const ingredients = items.map(([name, grams]) => {
    const food = NUTRIENTS.find((row) => row.name === name);
    if (!food) throw new Error(`Missing food record: ${name}`);
    return { name, grams, source: food.fdc ? `USDA FDC ${food.fdc}` : 'FuelWell sample estimate', potassiumMg: Math.round(food.k * grams / 100), phosphorusMg: Math.round(food.p * grams / 100), sodiumMg: Math.round(food.na * grams / 100) };
  });
  return { ingredients, potassiumMg: ingredients.reduce((n, x) => n + x.potassiumMg, 0), phosphorusMg: ingredients.reduce((n, x) => n + x.phosphorusMg, 0), sodiumMg: ingredients.reduce((n, x) => n + x.sodiumMg, 0) };
}

function meal(message, profile) {
  const dish = dishes.find((item) => item.match.test(message));
  const evidence = retrieve(`${message} meal recipe sodium protein`, profile);
  if (!dish) {
    const recognized = NUTRIENTS.filter((row) => [row.name, ...row.aliases].some((name) => new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(message))).slice(0, 6);
    return { kind: 'meal', title: 'Tell us a little more about the dish', summary: recognized.length ? `I recognized ${recognized.map((x) => x.name).join(', ')}. Add the main ingredients and approximate portions for a useful adaptation.` : 'Give the dish name or its main ingredients and approximate portions so the estimate can use actual food records.', swaps: [], before: null, after: null, evidence, assumptions: ['No nutrient total was calculated because the recipe and portions are incomplete.'] };
  }
  const before = totals(dish.original);
  const after = totals(dish.adapted);
  const dialysisNote = profile.dialysis ? 'The sample keeps a protein food in the meal; the dialysis dietitian must confirm the portion.' : 'The protein portion is only an example; the dietitian must confirm the amount.';
  return { kind: 'meal', title: `Adapt ${dish.title} for ${profile.name}`, summary: `A sample version that keeps the identity of ${dish.title} while changing the biggest sodium sources. ${dialysisNote}`, swaps: dish.swaps,
    before, after, evidence, assumptions: ['One estimated serving from a fixed demonstration recipe.', 'Values vary by brand and cooking method.', 'This is not checked against personal nutrient targets because none are reviewed.'] };
}

function menu(message, profile) {
  const lines = message.split(/\n|;/).map((line) => line.trim()).filter(Boolean);
  const candidates = lines.filter((line) => !/^(menu|restaurant|help me|what should)/i.test(line)).slice(0, 12);
  const items = candidates.length ? candidates : [message];
  const ranked = items.map((name) => {
    const lower = name.toLowerCase();
    const reasons = [];
    let flags = 0;
    if (/fried|bacon|sausage|processed|cheese|salted|soy sauce|fish sauce|broth|soup/i.test(lower)) { flags += 2; reasons.push('Likely sodium or additive concern; ask about preparation.'); }
    if (/grilled|steamed|plain|fresh|rice/i.test(lower)) reasons.push('Preparation may be easier to adjust; confirm sauces and portions.');
    if (/chicken|fish|egg|beef|tofu/i.test(lower) && profile.dialysis) reasons.push('Includes a protein food; ask the dietitian about the portion.');
    const food = findNutrient(name);
    return { name, category: flags ? 'Ask before ordering' : 'Worth asking about', reasons: reasons.length ? reasons : ['Ingredients and preparation are unknown from the menu name alone.'], matchedFood: food?.name ?? null, score: flags };
  }).sort((a, b) => a.score - b.score);
  return { kind: 'menu', title: `Menu choices for ${profile.name}`, summary: 'These are relative comparisons from menu descriptions, not nutrient calculations or a medical clearance.', items: ranked,
    evidence: retrieve(`${message} restaurant menu sodium takeout`, profile), assumptions: ['Restaurant portions, sauces, and ingredients are unknown.', 'Ask the restaurant how the dish is prepared.', 'No patient nutrient targets are approved in this sample profile.'] };
}

export function analyze(input) {
  const profile = profiles[input?.patientId];
  if (!profile) throw new RangeError('Select a valid patient.');
  const message = String(input?.message || '').trim();
  if (message.length < 3 || message.length > 5000) throw new RangeError('Enter a request between 3 and 5000 characters.');
  const mode = input?.mode === 'menu' ? 'menu' : 'meal';
  const response = mode === 'menu' ? menu(message, profile) : meal(message, profile);
  return {
    patient: { id: profile.id, name: profile.name, condition: profile.condition, cuisine: profile.cuisine, plan: profile.plan },
    response,
    pipeline: {
      profile: profile.id,
      workflow: mode,
      retrieval: response.evidence.map((item) => item.id),
      computation: mode === 'meal' && response.after ? 'food-table-estimate' : mode === 'menu' ? 'menu-description-ranking' : 'needs-more-detail',
      generation: 'deterministic-demo',
    },
  };
}
