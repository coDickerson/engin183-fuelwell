// FuelWell shared renal nutrition data: the single source of truth.
//
// Plain ESM with no dependencies so that BOTH of these import the same file:
//   - the Deno Edge Functions (via ./nutrients.ts, which adds types)
//   - the Node script in .claude/skills/renal-recipe-check/scripts/check-meals.mjs
// Edit values here only; the skill and the runtime agent can never drift apart.
//
// SOURCE: USDA FoodData Central (https://fdc.nal.usda.gov), SR Legacy and FNDDS
// entries, values in mg per 100 g of the food as eaten. FDC IDs are given where the
// entry maps to one record. Values are rounded and some are approximations:
//   ~  = approximated from the closest USDA record (named in the note)
//   d  = derived by FuelWell (e.g. dilution or leaching), method in the note
// Brands vary a lot, especially sauces and broths. This is sample data for a
// student demo, not a clinical database.

/**
 * @typedef {{ name: string, aliases: string[], k: number, p: number, na: number,
 *   fdc?: number, note?: string, group: string }} NutrientRow
 */

/** @type {NutrientRow[]} */
export const NUTRIENTS = [
  // Grains, noodles, wrappers
  { name: 'white rice, cooked', aliases: ['rice', 'white rice', 'steamed rice', 'jasmine rice', 'bap', 'com'], k: 35, p: 43, na: 1, fdc: 168878, group: 'grain' },
  { name: 'brown rice, cooked', aliases: ['brown rice'], k: 43, p: 83, na: 5, fdc: 168875, group: 'grain' },
  { name: 'glutinous rice, cooked', aliases: ['sticky rice', 'sweet rice', 'glutinous rice'], k: 10, p: 8, na: 5, fdc: 169715, group: 'grain' },
  { name: 'congee (plain rice porridge)', aliases: ['congee', 'jook', 'juk', 'rice porridge', 'chao'], k: 8, p: 10, na: 1, group: 'grain', note: 'd: white rice cooked diluted ~1:4 with water' },
  { name: 'wheat noodles, cooked', aliases: ['noodles', 'wheat noodles', 'mein', 'udon', 'kalguksu', 'somen'], k: 44, p: 58, na: 1, fdc: 168928, group: 'grain', note: '~ pasta, enriched, cooked, unsalted' },
  { name: 'egg noodles, cooked', aliases: ['egg noodles', 'lo mein noodles', 'chow mein noodles', 'wonton noodles'], k: 38, p: 99, na: 5, fdc: 169731, group: 'grain' },
  { name: 'rice noodles, cooked', aliases: ['rice noodles', 'pho noodles', 'banh pho', 'rice vermicelli', 'bun noodles', 'ho fun', 'rice sticks'], k: 4, p: 20, na: 19, fdc: 169742, group: 'grain' },
  { name: 'glass noodles, cooked', aliases: ['glass noodles', 'cellophane noodles', 'mung bean noodles', 'dangmyeon', 'japchae noodles', 'vermicelli'], k: 3, p: 8, na: 3, group: 'grain', note: 'd: cellophane noodles, dehydrated (FDC 168896) hydrated ~4x' },
  { name: 'wonton wrappers', aliases: ['wonton wrapper', 'wonton skins', 'dumpling wrappers', 'gyoza wrappers'], k: 84, p: 64, na: 548, fdc: 172779, group: 'grain' },
  { name: 'cornstarch', aliases: ['corn starch', 'starch', 'potato starch'], k: 3, p: 13, na: 9, fdc: 169698, group: 'grain' },

  // Vegetables and aromatics
  { name: 'bok choy, cooked', aliases: ['bok choy', 'pak choi', 'baby bok choy', 'shanghai bok choy', 'cai be trang'], k: 371, p: 29, na: 34, fdc: 170391, group: 'vegetable' },
  { name: 'napa cabbage', aliases: ['napa', 'chinese cabbage', 'wombok', 'baechu', 'pe-tsai', 'cai thao'], k: 238, p: 29, na: 9, fdc: 169979, group: 'vegetable' },
  { name: 'gai lan (Chinese broccoli), cooked', aliases: ['gai lan', 'kai lan', 'chinese broccoli'], k: 261, p: 41, na: 7, fdc: 169978, group: 'vegetable' },
  { name: 'green cabbage', aliases: ['cabbage'], k: 170, p: 26, na: 18, fdc: 169975, group: 'vegetable' },
  { name: 'mung bean sprouts', aliases: ['bean sprouts', 'sprouts', 'gia', 'sukju'], k: 149, p: 54, na: 6, fdc: 169958, group: 'vegetable' },
  { name: 'soybean sprouts', aliases: ['kongnamul', 'soy sprouts'], k: 484, p: 164, na: 14, fdc: 168426, group: 'vegetable' },
  { name: 'scallion', aliases: ['green onion', 'green onions', 'spring onion', 'spring onions', 'scallions', 'pa', 'hanh la'], k: 276, p: 37, na: 16, fdc: 170005, group: 'aromatic' },
  { name: 'ginger', aliases: ['ginger root', 'fresh ginger', 'gung'], k: 415, p: 34, na: 13, fdc: 169231, group: 'aromatic' },
  { name: 'garlic', aliases: ['garlic cloves', 'minced garlic', 'maneul'], k: 401, p: 153, na: 17, fdc: 169230, group: 'aromatic' },
  { name: 'onion', aliases: ['yellow onion', 'white onion', 'onions'], k: 146, p: 29, na: 4, fdc: 170000, group: 'vegetable' },
  { name: 'shiitake mushrooms, fresh', aliases: ['shiitake', 'mushrooms', 'mushroom', 'pyogo', 'shiitake mushroom'], k: 304, p: 112, na: 9, fdc: 168580, group: 'vegetable' },
  { name: 'shiitake mushrooms, dried', aliases: ['dried shiitake', 'dried mushrooms', 'black mushrooms'], k: 1534, p: 294, na: 13, fdc: 168579, group: 'vegetable' },
  { name: 'enoki mushrooms', aliases: ['enoki', 'enoki mushroom'], k: 359, p: 105, na: 3, fdc: 168581, group: 'vegetable' },
  { name: 'potato, boiled', aliases: ['potato', 'potatoes', 'gamja'], k: 328, p: 40, na: 5, fdc: 170438, group: 'vegetable' },
  { name: 'potato, leached (soaked and double-boiled)', aliases: ['leached potato', 'double-boiled potato'], k: 160, p: 35, na: 5, group: 'vegetable', note: 'd: boiled potato with ~50% potassium removed by soak and double boil (published leaching studies report 50-75%)' },
  { name: 'taro, cooked', aliases: ['taro', 'taro root', 'khoai mon', 'toran'], k: 484, p: 76, na: 11, fdc: 168487, group: 'vegetable' },
  { name: 'sweet potato, boiled', aliases: ['sweet potato', 'goguma', 'khoai lang'], k: 230, p: 32, na: 27, fdc: 168483, group: 'vegetable' },
  { name: 'winter melon', aliases: ['wax gourd', 'winter gourd', 'dong gua', 'bi dao'], k: 6, p: 19, na: 111, fdc: 168565, group: 'vegetable' },
  { name: 'daikon radish', aliases: ['daikon', 'radish', 'mu', 'korean radish', 'lo bok', 'cu cai'], k: 227, p: 23, na: 21, fdc: 169276, group: 'vegetable' },
  { name: 'carrot', aliases: ['carrots'], k: 320, p: 35, na: 69, fdc: 170393, group: 'vegetable' },
  { name: 'cucumber', aliases: ['cucumbers', 'oi'], k: 147, p: 24, na: 2, fdc: 168409, group: 'vegetable' },
  { name: 'zucchini', aliases: ['korean zucchini', 'hobak', 'squash', 'courgette'], k: 261, p: 38, na: 8, fdc: 169291, group: 'vegetable' },
  { name: 'spinach, cooked', aliases: ['spinach', 'sigeumchi'], k: 466, p: 56, na: 70, fdc: 168463, group: 'vegetable' },
  { name: 'water spinach (ong choy)', aliases: ['water spinach', 'ong choy', 'rau muong', 'morning glory'], k: 312, p: 39, na: 113, fdc: 168455, group: 'vegetable' },
  { name: 'tomato', aliases: ['tomatoes', 'ca chua'], k: 237, p: 24, na: 5, fdc: 170457, group: 'vegetable' },
  { name: 'bell pepper', aliases: ['green pepper', 'red pepper', 'capsicum', 'peppers'], k: 175, p: 20, na: 3, fdc: 170427, group: 'vegetable' },
  { name: 'snow peas', aliases: ['snap peas', 'pea pods', 'peas'], k: 200, p: 53, na: 4, fdc: 170419, group: 'vegetable' },
  { name: 'eggplant', aliases: ['aubergine', 'chinese eggplant', 'gaji'], k: 229, p: 24, na: 2, fdc: 169228, group: 'vegetable' },
  { name: 'lotus root, boiled', aliases: ['lotus root', 'lotus', 'yeongeun'], k: 363, p: 78, na: 45, fdc: 168422, group: 'vegetable' },
  { name: 'bitter melon', aliases: ['bitter gourd', 'kho qua', 'foo gwa'], k: 296, p: 31, na: 5, fdc: 168381, group: 'vegetable' },
  { name: 'bamboo shoots, canned', aliases: ['bamboo shoots', 'bamboo', 'mang'], k: 105, p: 25, na: 7, fdc: 169210, group: 'vegetable' },
  { name: 'cilantro', aliases: ['coriander leaves', 'coriander', 'ngo'], k: 521, p: 48, na: 46, fdc: 169997, group: 'herb' },
  { name: 'Thai basil', aliases: ['basil', 'hung que', 'rau que'], k: 295, p: 56, na: 4, fdc: 172232, group: 'herb', note: '~ basil, fresh' },
  { name: 'lemongrass', aliases: ['lemon grass', 'xa'], k: 723, p: 101, na: 6, fdc: 168573, group: 'herb' },
  { name: 'chili pepper, fresh', aliases: ['chili', 'chile', 'thai chili', 'red chili', 'ot'], k: 322, p: 43, na: 9, fdc: 168577, group: 'aromatic' },
  { name: 'lime juice', aliases: ['lime', 'lemon juice', 'chanh'], k: 117, p: 14, na: 2, fdc: 168156, group: 'fruit' },
  { name: 'pineapple', aliases: ['thom', 'dua'], k: 109, p: 8, na: 1, fdc: 169124, group: 'fruit' },
  { name: 'tamarind pulp', aliases: ['tamarind', 'me'], k: 628, p: 113, na: 28, fdc: 167770, group: 'fruit' },

  // Protein foods
  { name: 'tofu, firm', aliases: ['tofu', 'firm tofu', 'bean curd', 'dubu', 'dau hu', 'dau phu'], k: 237, p: 190, na: 14, fdc: 172475, group: 'protein' },
  { name: 'tofu, soft/silken', aliases: ['silken tofu', 'soft tofu', 'sundubu'], k: 180, p: 62, na: 5, fdc: 172449, group: 'protein' },
  { name: 'egg, whole', aliases: ['egg', 'eggs', 'gyeran', 'trung'], k: 138, p: 198, na: 142, fdc: 171287, group: 'protein' },
  { name: 'egg white', aliases: ['egg whites'], k: 163, p: 15, na: 166, fdc: 172183, group: 'protein' },
  { name: 'chicken breast, cooked', aliases: ['chicken', 'chicken breast', 'dak', 'ga'], k: 256, p: 228, na: 74, fdc: 171477, group: 'protein' },
  { name: 'chicken thigh, cooked', aliases: ['chicken thigh', 'dark meat chicken'], k: 238, p: 192, na: 95, fdc: 173627, group: 'protein' },
  { name: 'pork loin, cooked', aliases: ['pork', 'pork loin', 'lean pork', 'dwaeji', 'thit heo', 'char siu'], k: 362, p: 250, na: 55, fdc: 168249, group: 'protein', note: '~ pork loin, lean, roasted' },
  { name: 'ground pork, cooked', aliases: ['ground pork', 'minced pork', 'pork mince'], k: 362, p: 222, na: 73, fdc: 167903, group: 'protein' },
  { name: 'pork belly', aliases: ['samgyeopsal', 'pork belly slices', 'ba chi'], k: 185, p: 80, na: 32, fdc: 167812, group: 'protein' },
  { name: 'beef, lean, cooked', aliases: ['beef', 'brisket', 'flank', 'eye of round', 'sogogi', 'bo', 'tai'], k: 320, p: 200, na: 55, fdc: 174032, group: 'protein', note: '~ beef, round, lean, cooked' },
  { name: 'white fish, cooked', aliases: ['fish', 'white fish', 'cod', 'sea bass', 'tilapia', 'ca', 'saengseon', 'catfish'], k: 244, p: 138, na: 78, fdc: 171956, group: 'protein', note: '~ Atlantic cod, cooked' },
  { name: 'salmon, cooked', aliases: ['salmon'], k: 384, p: 252, na: 61, fdc: 175168, group: 'protein' },
  { name: 'shrimp, cooked', aliases: ['shrimp', 'prawns', 'prawn', 'tom', 'saeu'], k: 170, p: 237, na: 111, fdc: 175180, group: 'protein' },
  { name: 'dried shrimp', aliases: ['dried shrimp', 'tom kho', 'har mai'], k: 550, p: 1000, na: 4000, group: 'protein', note: '~ no single USDA record; approximated from FNDDS dried seafood and label data. Varies widely.' },
  { name: 'fish balls', aliases: ['fish ball', 'fish cake', 'eomuk', 'cha ca'], k: 200, p: 120, na: 600, group: 'protein', note: '~ label-based approximation for processed fish paste' },
  { name: 'mung beans, boiled', aliases: ['mung bean', 'mung beans', 'nokdu', 'dau xanh'], k: 266, p: 99, na: 2, fdc: 174256, group: 'legume' },
  { name: 'adzuki beans, boiled', aliases: ['red beans', 'adzuki', 'pat', 'dau do'], k: 532, p: 168, na: 8, fdc: 173728, group: 'legume' },
  { name: 'peanuts, dry roasted, unsalted', aliases: ['peanuts', 'peanut', 'dau phong'], k: 634, p: 358, na: 6, fdc: 172430, group: 'nut' },
  { name: 'sesame seeds', aliases: ['sesame', 'toasted sesame seeds', 'kkae'], k: 468, p: 629, na: 11, fdc: 170150, group: 'nut' },

  // Sauces, seasonings, broths
  { name: 'soy sauce', aliases: ['soy sauce', 'soya sauce', 'shoyu', 'light soy sauce', 'ganjang', 'nuoc tuong', 'xi dau'], k: 435, p: 166, na: 5493, fdc: 174277, group: 'sauce' },
  { name: 'low-sodium soy sauce', aliases: ['low sodium soy sauce', 'reduced sodium soy sauce', 'lite soy sauce', 'less sodium soy sauce'], k: 180, p: 130, na: 3333, fdc: 174278, group: 'sauce', note: 'some brands replace salt with potassium chloride; check the label' },
  { name: 'oyster sauce', aliases: ['oyster sauce', 'dau hao'], k: 54, p: 22, na: 2733, fdc: 174279, group: 'sauce' },
  { name: 'fish sauce', aliases: ['fish sauce', 'nuoc mam', 'aekjeot', 'nam pla'], k: 288, p: 7, na: 7851, fdc: 174531, group: 'sauce' },
  { name: 'hoisin sauce', aliases: ['hoisin'], k: 119, p: 38, na: 1615, fdc: 172884, group: 'sauce' },
  { name: 'doenjang (soybean paste)', aliases: ['doenjang', 'soybean paste', 'fermented soybean paste', 'miso', 'tuong'], k: 210, p: 159, na: 4300, fdc: 172442, group: 'sauce', note: '~ miso (FDC 172442) for K and P; sodium raised toward typical Korean doenjang labels' },
  { name: 'gochujang', aliases: ['gochujang', 'red pepper paste', 'korean chili paste'], k: 300, p: 90, na: 2500, group: 'sauce', note: '~ label-based approximation; no SR Legacy record' },
  { name: 'gochugaru (chili flakes)', aliases: ['gochugaru', 'chili flakes', 'red pepper flakes', 'chili powder'], k: 2014, p: 294, na: 30, fdc: 170932, group: 'seasoning', note: '~ cayenne/red pepper, ground (no added salt)' },
  { name: 'cabbage kimchi', aliases: ['kimchi', 'baechu kimchi'], k: 151, p: 24, na: 498, fdc: 169415, group: 'vegetable', note: 'homemade kimchi is often saltier (600-900 mg)' },
  { name: 'kimchi, rinsed', aliases: ['rinsed kimchi'], k: 140, p: 24, na: 250, group: 'vegetable', note: 'd: cabbage kimchi with ~50% of surface sodium rinsed off' },
  { name: 'MSG (monosodium glutamate)', aliases: ['msg', 'monosodium glutamate', 'mi chinh', 'bot ngot', 'ajinomoto'], k: 0, p: 0, na: 12300, group: 'seasoning', note: 'd: MSG is 12.3% sodium by weight' },
  { name: 'table salt', aliases: ['salt', 'sea salt', 'kosher salt', 'muoi', 'sogeum'], k: 8, p: 0, na: 38758, fdc: 173468, group: 'seasoning' },
  { name: 'sugar', aliases: ['white sugar', 'rock sugar', 'duong'], k: 2, p: 0, na: 1, fdc: 169655, group: 'seasoning' },
  { name: 'rice vinegar', aliases: ['vinegar', 'black vinegar', 'giam'], k: 2, p: 8, na: 2, fdc: 173469, group: 'seasoning', note: '~ distilled vinegar' },
  { name: 'sesame oil', aliases: ['toasted sesame oil', 'chamgireum'], k: 0, p: 0, na: 0, fdc: 171016, group: 'fat' },
  { name: 'vegetable oil', aliases: ['oil', 'cooking oil', 'canola oil', 'neutral oil'], k: 0, p: 0, na: 0, fdc: 172336, group: 'fat' },
  { name: 'coconut milk, canned', aliases: ['coconut milk', 'nuoc cot dua'], k: 220, p: 96, na: 13, fdc: 170173, group: 'fat' },
  { name: 'chicken broth, store-bought', aliases: ['chicken broth', 'chicken stock', 'broth', 'stock', 'canned broth'], k: 87, p: 30, na: 371, fdc: 174536, group: 'broth' },
  { name: 'beef broth, restaurant style', aliases: ['beef broth', 'pho broth', 'beef stock'], k: 130, p: 30, na: 380, fdc: 174535, group: 'broth', note: '~ beef broth, ready-to-serve' },
  { name: 'bone broth', aliases: ['bone broth', 'pork bone broth', 'anchovy stock', 'dashi', 'yuksu', 'seolleongtang broth'], k: 120, p: 30, na: 300, group: 'broth', note: '~ store-bought bone broth labels; homemade with salt is similar' },
  { name: 'homemade low-sodium stock', aliases: ['low sodium stock', 'unsalted stock', 'homemade stock', 'low-sodium broth', 'no-salt stock'], k: 105, p: 32, na: 50, group: 'broth', note: 'd: chicken stock, home-prepared (FDC 172883) made without added salt' },
];

/**
 * Per-meal (one serving) thresholds that turn totals into low / mid / high.
 * DEMO HEURISTICS, not clinical targets. Reasoning:
 *   NKF / KDOQI-based guidance for CKD G3b-G4 commonly lands around
 *   potassium ~2,000-3,000 mg/day (individualised by labs), phosphorus ~800-1,000 mg/day,
 *   sodium < 2,300 mg/day (often ~2,000). Split over three meals plus a snack:
 *   - K:  < 400 low,  400-700 mid,  > 700 high   (~1/3 of a 2,000 mg day is ~670)
 *   - P:  < 200 low,  200-300 mid,  > 300 high   (~1/3 of 800-1,000 mg)
 *   - Na: < 400 low,  400-700 mid,  > 700 high   (~1/3 of 2,000-2,300 mg)
 * Sources: National Kidney Foundation patient nutrition pages; KDOQI Clinical Practice
 * Guideline for Nutrition in CKD: 2020 Update. A person's own targets come from their
 * kidney care team.
 */
export const THRESHOLDS = {
  k: { lowBelow: 400, midMax: 700 },
  p: { lowBelow: 200, midMax: 300 },
  na: { lowBelow: 400, midMax: 700 },
};

/** @param {'k'|'p'|'na'} nutrient @param {number} mg @returns {'low'|'mid'|'high'} */
export function levelFor(nutrient, mg) {
  const t = THRESHOLDS[nutrient];
  if (mg < t.lowBelow) return 'low';
  if (mg <= t.midMax) return 'mid';
  return 'high';
}

export const DISCLAIMER =
  'Sample estimates from USDA FoodData Central values for a student demo. Not medical advice. ' +
  'Check portions and targets with your kidney care team or renal dietitian.';

function normalise(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fuzzy match an ingredient name against the table.
 * Exact name/alias match wins, then the longest alias contained in the query, then
 * word overlap. Returns null for unknown ingredients rather than guessing.
 * @param {string} query
 * @returns {NutrientRow | null}
 */
export function findNutrient(query) {
  const q = normalise(query);
  if (!q) return null;
  for (const row of NUTRIENTS) {
    if (normalise(row.name) === q || row.aliases.some((a) => normalise(a) === q)) return row;
  }
  let best = null;
  let bestLen = 0;
  for (const row of NUTRIENTS) {
    for (const alias of [row.name, ...row.aliases]) {
      const a = normalise(alias);
      if (a.length >= 3 && new RegExp(`(^|\\s)${a.replace(/[-]/g, '\\-')}(\\s|$)`).test(q) && a.length > bestLen) {
        best = row;
        bestLen = a.length;
      }
    }
  }
  if (best) return best;
  const qWords = new Set(q.split(' ').filter((w) => w.length > 2));
  let bestScore = 0;
  for (const row of NUTRIENTS) {
    const words = normalise(row.name).split(' ').filter((w) => w.length > 2);
    const hits = words.filter((w) => qWords.has(w)).length;
    const score = words.length ? hits / words.length : 0;
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }
  return bestScore >= 0.5 ? best : null;
}

/**
 * Deterministic totals: the model never does arithmetic.
 * @param {{ name: string, amount_g: number }[]} ingredients
 */
export function computeTotals(ingredients) {
  const lines = [];
  const unknown = [];
  let k = 0, p = 0, na = 0;
  for (const item of ingredients) {
    const row = findNutrient(item.name);
    const grams = Math.max(0, Number(item.amount_g) || 0);
    if (!row) {
      unknown.push(item.name);
      lines.push({ name: item.name, amount_g: grams, matched: null, k_mg: 0, p_mg: 0, na_mg: 0 });
      continue;
    }
    const f = grams / 100;
    const line = {
      name: item.name,
      amount_g: grams,
      matched: row.name,
      k_mg: Math.round(row.k * f),
      p_mg: Math.round(row.p * f),
      na_mg: Math.round(row.na * f),
    };
    k += line.k_mg; p += line.p_mg; na += line.na_mg;
    lines.push(line);
  }
  const totals = { k_mg: k, p_mg: p, na_mg: na };
  const levels = { k: levelFor('k', k), p: levelFor('p', p), na: levelFor('na', na) };
  return { lines, totals, levels, unknown };
}

/**
 * Culturally faithful swaps, used by the rules fallback and suggested by the skill.
 * `to: null` removes the ingredient. `factor` scales the amount. `add` appends a helper.
 */
export const SWAPS = {
  'soy sauce': { to: 'low-sodium soy sauce', factor: 0.75, why: 'Keeps the soy flavour with roughly 40% less sodium; using a little less cuts more.' },
  'oyster sauce': { to: 'oyster sauce', factor: 0.5, why: 'Halving it keeps the glossy, savoury finish while cutting its sodium in half.' },
  'fish sauce': { to: 'fish sauce', factor: 0.5, why: 'Half the fish sauce plus a squeeze of lime keeps the bright, savoury balance.', add: { name: 'lime juice', amount_g: 5 } },
  'hoisin sauce': { to: 'hoisin sauce', factor: 0.5, why: 'A smaller drizzle still gives sweetness and depth.' },
  'MSG (monosodium glutamate)': { to: null, factor: 0, why: 'MSG adds sodium; extra ginger, scallion and a splash of vinegar carry the flavour instead.' },
  'table salt': { to: 'table salt', factor: 0.5, why: 'Halve added salt and season at the table only if needed.' },
  'chicken broth, store-bought': { to: 'homemade low-sodium stock', factor: 1, why: 'Unsalted homemade stock keeps the body of the soup with a fraction of the sodium.' },
  'beef broth, restaurant style': { to: 'homemade low-sodium stock', factor: 1, why: 'Simmer bones with charred onion and ginger without salt; season lightly at the end.' },
  'bone broth': { to: 'homemade low-sodium stock', factor: 1, why: 'Same long-simmered base, made without added salt.' },
  'doenjang (soybean paste)': { to: 'doenjang (soybean paste)', factor: 0.5, why: 'Half the paste still tastes like doenjang jjigae; more vegetables fill the pot.' },
  'gochujang': { to: 'gochujang', factor: 0.5, why: 'Half the paste with a pinch of gochugaru keeps colour and heat with less sodium.' },
  'cabbage kimchi': { to: 'kimchi, rinsed', factor: 0.75, why: 'A quick rinse and a slightly smaller amount keep the sour kimchi taste with less salt.' },
  'potato, boiled': { to: 'potato, leached (soaked and double-boiled)', factor: 1, why: 'Peel, cut small, soak, then boil in fresh water to pull out much of the potassium.' },
  'taro, cooked': { to: 'daikon radish', factor: 1, why: 'Daikon gives the same soft, brothy bite as taro with about half the potassium.' },
  'spinach, cooked': { to: 'mung bean sprouts', factor: 1, why: 'Bean sprouts are a familiar namul and much lower in potassium than spinach.' },
  'dried shrimp': { to: 'dried shrimp', factor: 0.3, why: 'A small pinch still gives the deep seafood aroma; dried shrimp is very salty.' },
  'brown rice, cooked': { to: 'white rice, cooked', factor: 1, why: 'White rice is lower in phosphorus and potassium, which matters more at this stage.' },
  'shiitake mushrooms, dried': { to: 'shiitake mushrooms, fresh', factor: 1.5, why: 'Fresh shiitake keeps the earthy taste with far less concentrated potassium.' },
  'tamarind pulp': { to: 'lime juice', factor: 1, why: 'Lime gives canh chua its sourness without tamarind’s potassium.' },
  'fish balls': { to: 'white fish, cooked', factor: 1, why: 'Fresh fish has the same role with much less sodium than processed fish paste.' },
  'wonton wrappers': { to: 'wonton wrappers', factor: 0.75, why: 'A few fewer wontons per bowl trims sodium from the wrappers.' },
};

/** Per-serving dish library for the rules fallback and the skill self-test. */
export const DISHES = [
  {
    key: 'lo mein', cuisine: 'chinese', name: 'Pork lo mein', aliases: ['lo mein', 'chow mein', 'stir fried noodles', 'stir-fried noodles'],
    ingredients: [
      { name: 'egg noodles', amount_g: 200 }, { name: 'pork', amount_g: 60 }, { name: 'bok choy', amount_g: 60 },
      { name: 'bean sprouts', amount_g: 40 }, { name: 'shiitake', amount_g: 30 }, { name: 'soy sauce', amount_g: 15 },
      { name: 'oyster sauce', amount_g: 10 }, { name: 'scallion', amount_g: 10 }, { name: 'garlic', amount_g: 5 },
      { name: 'sesame oil', amount_g: 5 },
    ],
  },
  {
    key: 'congee', cuisine: 'chinese', name: 'Chicken congee', aliases: ['congee', 'jook', 'juk', 'rice porridge', 'chao', 'chao ga'],
    ingredients: [
      { name: 'congee', amount_g: 300 }, { name: 'chicken broth', amount_g: 150 }, { name: 'chicken', amount_g: 50 },
      { name: 'ginger', amount_g: 5 }, { name: 'scallion', amount_g: 5 }, { name: 'soy sauce', amount_g: 5 },
      { name: 'salt', amount_g: 1.5 }, { name: 'dried shrimp', amount_g: 5 },
    ],
  },
  {
    key: 'steamed fish', cuisine: 'chinese', name: 'Cantonese steamed fish with rice', aliases: ['steamed fish', 'steamed whole fish', 'ginger scallion fish'],
    ingredients: [
      { name: 'white fish', amount_g: 150 }, { name: 'white rice', amount_g: 150 }, { name: 'ginger', amount_g: 10 },
      { name: 'scallion', amount_g: 10 }, { name: 'soy sauce', amount_g: 15 }, { name: 'sesame oil', amount_g: 5 },
      { name: 'vegetable oil', amount_g: 10 },
    ],
  },
  {
    key: 'fried rice', cuisine: 'chinese', name: 'Egg fried rice', aliases: ['fried rice', 'egg fried rice', 'yangzhou fried rice', 'com chien', 'bokkeumbap'],
    ingredients: [
      { name: 'white rice', amount_g: 200 }, { name: 'egg', amount_g: 50 }, { name: 'pork', amount_g: 40 },
      { name: 'snow peas', amount_g: 30 }, { name: 'scallion', amount_g: 10 }, { name: 'soy sauce', amount_g: 10 },
      { name: 'oyster sauce', amount_g: 5 }, { name: 'vegetable oil', amount_g: 10 }, { name: 'msg', amount_g: 1 },
    ],
  },
  {
    key: 'doenjang jjigae', cuisine: 'korean', name: 'Doenjang jjigae with rice', aliases: ['doenjang jjigae', 'doenjang stew', 'soybean paste stew', 'doenjang'],
    ingredients: [
      { name: 'doenjang', amount_g: 30 }, { name: 'anchovy stock', amount_g: 300 }, { name: 'tofu', amount_g: 80 },
      { name: 'zucchini', amount_g: 50 }, { name: 'potato', amount_g: 50 }, { name: 'onion', amount_g: 30 },
      { name: 'shiitake', amount_g: 20 }, { name: 'gochugaru', amount_g: 2 }, { name: 'garlic', amount_g: 5 },
      { name: 'white rice', amount_g: 150 },
    ],
  },
  {
    key: 'kimchi jjigae', cuisine: 'korean', name: 'Kimchi jjigae with rice', aliases: ['kimchi jjigae', 'kimchi stew', 'kimchi chigae'],
    ingredients: [
      { name: 'kimchi', amount_g: 120 }, { name: 'pork belly', amount_g: 60 }, { name: 'tofu', amount_g: 60 },
      { name: 'anchovy stock', amount_g: 300 }, { name: 'gochujang', amount_g: 10 }, { name: 'gochugaru', amount_g: 3 },
      { name: 'scallion', amount_g: 10 }, { name: 'white rice', amount_g: 150 },
    ],
  },
  {
    key: 'pho', cuisine: 'vietnamese', name: 'Pho bo (beef noodle soup)', aliases: ['pho', 'pho bo', 'beef noodle soup', 'pho ga'],
    ingredients: [
      { name: 'rice noodles', amount_g: 200 }, { name: 'beef broth', amount_g: 500 }, { name: 'beef', amount_g: 70 },
      { name: 'fish sauce', amount_g: 10 }, { name: 'hoisin sauce', amount_g: 10 }, { name: 'bean sprouts', amount_g: 30 },
      { name: 'onion', amount_g: 20 }, { name: 'thai basil', amount_g: 5 }, { name: 'lime juice', amount_g: 5 },
    ],
  },
  {
    key: 'canh chua', cuisine: 'vietnamese', name: 'Canh chua (sour fish soup) with rice', aliases: ['canh chua', 'sour soup', 'sour fish soup', 'canh chua ca'],
    ingredients: [
      { name: 'white fish', amount_g: 100 }, { name: 'chicken broth', amount_g: 300 }, { name: 'tamarind', amount_g: 15 },
      { name: 'pineapple', amount_g: 50 }, { name: 'tomato', amount_g: 60 }, { name: 'bean sprouts', amount_g: 40 },
      { name: 'fish sauce', amount_g: 10 }, { name: 'sugar', amount_g: 5 }, { name: 'thai basil', amount_g: 3 },
      { name: 'white rice', amount_g: 150 },
    ],
  },
  {
    key: 'wonton soup', cuisine: 'chinese', name: 'Wonton soup', aliases: ['wonton soup', 'wontons', 'wonton', 'hoanh thanh', 'won ton'],
    ingredients: [
      { name: 'wonton wrappers', amount_g: 40 }, { name: 'ground pork', amount_g: 60 }, { name: 'shrimp', amount_g: 30 },
      { name: 'chicken broth', amount_g: 400 }, { name: 'bok choy', amount_g: 50 }, { name: 'scallion', amount_g: 5 },
      { name: 'soy sauce', amount_g: 5 }, { name: 'sesame oil', amount_g: 2 },
    ],
  },
];

/** @param {string} text */
export function findDish(text) {
  const q = normalise(text);
  if (!q) return null;
  let best = null;
  let bestLen = 0;
  for (const dish of DISHES) {
    for (const alias of [dish.key, ...dish.aliases]) {
      const a = normalise(alias);
      if (q.includes(a) && a.length > bestLen) {
        best = dish;
        bestLen = a.length;
      }
    }
  }
  return best;
}

/**
 * Apply the SWAPS map to an ingredient list (rules engine).
 * @param {{ name: string, amount_g: number }[]} ingredients
 */
export function applySwaps(ingredients) {
  const after = [];
  const swaps = [];
  for (const item of ingredients) {
    const row = findNutrient(item.name);
    const swap = row ? SWAPS[row.name] : undefined;
    if (!swap) {
      after.push({ ...item });
      continue;
    }
    const amount = Math.round(item.amount_g * swap.factor * 10) / 10;
    if (swap.to === null) {
      swaps.push({ from: item.name, to: 'leave out', why: swap.why });
    } else if (swap.to === row.name) {
      after.push({ name: item.name, amount_g: amount, swapped_from: `${item.name} (${item.amount_g} g)` });
      swaps.push({ from: `${item.name} (${item.amount_g} g)`, to: `${item.name} (${amount} g)`, why: swap.why });
    } else {
      after.push({ name: swap.to, amount_g: amount, swapped_from: item.name });
      swaps.push({ from: item.name, to: swap.to, why: swap.why });
    }
    const addRow = swap.add ? findNutrient(swap.add.name) : null;
    const present = (list) => list.some((a) => findNutrient(a.name)?.name === addRow?.name);
    if (swap.add && !present(after) && !present(ingredients)) {
      after.push({ ...swap.add });
    }
  }
  return { after, swaps };
}
