// Sample workspace for the FuelWell demo: Heidi manages her mom Fung's renal diet.
// Every value here is fictional sample data for a student demo. It is not medical advice.

export const persona = {
  patient: { name: 'Fung', relation: 'Mom', age: 78, stage: 'G3b', egfr: 38, cuisine: 'Cantonese home cooking' },
  caregiver: { name: 'Heidi', role: 'Primary caregiver' },
  sister: { name: 'Joyce', role: 'Sister · view-only' },
  dietitian: {
    name: 'Mei Chen, RD',
    initials: 'MC',
    label: 'Sample dietitian · Mei Chen, RD (fictional)',
    clinic: 'Sample renal nutrition clinic',
  },
};

// Daily targets used for the Today tiles (sample values a dietitian might set for G3b).
export const targets = {
  k: { label: 'Potassium', unit: 'mg', target: 2000 },
  p: { label: 'Phosphorus', unit: 'mg', target: 800 },
  na: { label: 'Sodium', unit: 'mg', target: 2000 },
  fluid: { label: 'Fluid', unit: 'mL', target: 1500, logged: 900 },
};

export const mealSlots = [
  { key: 'breakfast', label: 'Breakfast', time: '8:00 AM' },
  { key: 'lunch', label: 'Lunch', time: '12:30 PM' },
  { key: 'dinner', label: 'Dinner', time: '6:00 PM' },
  { key: 'snack', label: 'Snack', time: '3:30 PM' },
];

const m = (name, zh, note, k, p, na) => ({ name, zh, note, k, p, na });

// Index 0 = Monday … 6 = Sunday. Rough K/P/Na in mg per portion.
export const week = [
  {
    day: 'Mon',
    breakfast: m('White rice congee with ginger and shredded chicken', '薑絲雞粥', 'Made with homemade unsalted stock', 190, 150, 280),
    lunch: m('Steamed fish with scallion and low-sodium soy, white rice', '清蒸魚', '1 tsp low-sodium soy, measured', 520, 280, 450),
    dinner: m('Stir-fried cabbage with garlic, egg & chive omelette, rice', '蒜蓉炒椰菜', 'Cabbage is a low-potassium vegetable', 420, 190, 380),
    snack: m('Fresh pear slices', '雪梨', 'One small pear', 120, 15, 2),
  },
  {
    day: 'Tue',
    breakfast: m('Steamed egg custard with scallion and a plain mantou', '蒸水蛋', 'Egg white rich, no added salt', 160, 120, 320),
    lunch: m('Winter melon soup with homemade low-sodium stock, rice', '冬瓜湯', 'Stock simmered under an hour, unsalted', 380, 160, 360),
    dinner: m('Chicken with snow peas and red pepper, white rice', '荷蘭豆炒雞片', 'Light sauce: ginger, garlic, rice wine', 560, 290, 520),
    snack: m('Unsalted rice crackers and apple slices', '米餅', 'About 4 crackers', 150, 40, 30),
  },
  {
    day: 'Wed',
    breakfast: m('Plain rice noodle rolls with sesame oil', '齋腸粉', 'A drizzle of diluted low-sodium soy', 110, 90, 380),
    lunch: m('Ginger-scallion chicken, rice and blanched choy sum', '薑蔥雞', 'Choy sum boiled, water discarded', 540, 300, 420),
    dinner: m('Steamed tofu with minced pork, stir-fried napa cabbage', '肉碎蒸豆腐', 'Half-cup tofu portion', 470, 260, 560),
    snack: m('Grapes, half a cup', '提子', 'A lower-potassium fruit', 140, 15, 2),
  },
  {
    day: 'Thu',
    breakfast: m('Congee with egg white and ginger', '蛋白粥', 'No century egg (very salty)', 150, 110, 260),
    lunch: m('Wonton noodle soup with homemade stock, half the broth', '雲吞麵', 'Leave half the broth in the bowl', 430, 230, 690),
    dinner: m('Steamed sea bass with ginger, bean sprouts, rice', '薑蒸鱸魚', 'Bean sprouts are low in potassium', 560, 300, 400),
    snack: m('Blueberries and unsalted crackers', '藍莓', 'Half a cup of berries', 90, 30, 60),
  },
  {
    day: 'Fri',
    breakfast: m('Homemade steamed chicken bun, lightly seasoned', '雞包', 'Low-salt filling, no oyster sauce', 180, 120, 420),
    lunch: m('Egg fried rice with peas and carrot', '蛋炒飯', 'Low-sodium soy, no MSG or bouillon', 380, 220, 560),
    dinner: m('Braised chicken with napa cabbage and glass noodles', '白菜粉絲燜雞', 'Glass noodles are low in potassium', 520, 260, 540),
    snack: m('Fresh pineapple chunks', '菠蘿', 'Half a cup', 110, 8, 1),
  },
  {
    day: 'Sat',
    breakfast: m('Rice congee with ginger and fish slices', '魚片粥', 'Fresh fish, not dried scallop', 260, 190, 300),
    lunch: m('Cantonese lo mein with chicken and bean sprouts', '雞絲撈麵', 'Low-sodium sauce, extra sprouts', 420, 240, 620),
    dinner: m('White-cut chicken with ginger-scallion oil, green beans, rice', '白切雞', 'Ginger-scallion oil instead of salt dip', 540, 290, 380),
    snack: m('One small homemade egg tart', '蛋撻', 'A treat-size portion', 70, 70, 110),
  },
  {
    day: 'Sun',
    breakfast: m('Plain congee with scallion and white pepper', '白粥', 'Skip the salted fish and pickles', 120, 80, 180),
    lunch: m('Family dim sum at home: har gow, veggie dumplings, cheung fun', '飲茶', 'Two of each, with plain tea', 360, 220, 780),
    dinner: m('Steamed fish with scallion, stir-fried cabbage, rice', '清蒸魚', 'Lighter dinner after dim sum', 600, 300, 420),
    snack: m('Apple slices', '蘋果', 'One small apple', 110, 10, 1),
  },
];

// Per-portion thresholds for the Low / Med / High meal badges.
export const mealThresholds = {
  k: [400, 700],
  p: [200, 300],
  na: [400, 700],
};

export const dietitianMessages = [
  {
    from: 'dietitian', daysAgo: 3, time: '9:12 AM',
    text: 'Hi Heidi, thanks for sending Fung\'s food log. The steamed fish and ginger congee are great choices. One thing to watch: the preserved mustard greens (梅菜) at Sunday dinner are very high in sodium. Could we try fresh choy sum instead?',
  },
  {
    from: 'caregiver', daysAgo: 3, time: '7:40 PM',
    text: 'Thanks Mei! Mom loves 梅菜扣肉 at New Year, so we\'ll save it for special occasions. She\'s been fine with the cabbage.',
  },
  {
    from: 'dietitian', daysAgo: 2, time: '10:05 AM',
    text: 'That sounds like a good plan. A small portion at a celebration is something we can talk through together. Please bring her latest lab printout to our follow-up video visit.',
  },
];

export const exampleQuestions = [
  'Can Mom have a small bowl of Sunday pork bone soup (老火湯)?',
  'Mom\'s ankles look more swollen and she gets short of breath on the stairs.',
  'Can we move her follow-up to a morning next week?',
];

// Visits are positioned relative to today so the demo always looks current.
export const visits = {
  upcoming: [
    { id: 'v-follow', daysFromNow: 9, hour: 10, minute: 30, title: 'Nutrition follow-up', with: 'Mei Chen, RD (fictional)', mode: 'Video visit', minutes: 30 },
    { id: 'v-labs', daysFromNow: 23, hour: 8, minute: 15, title: 'Blood draw for kidney labs', with: 'Sample lab, Main St', mode: 'In person', minutes: 15 },
  ],
  past: [
    { id: 'v-intro', daysFromNow: -28, hour: 14, minute: 0, title: 'First nutrition consult', with: 'Mei Chen, RD (fictional)', mode: 'Video visit', minutes: 45, note: 'Set daily targets; agreed to swap preserved vegetables for fresh greens.' },
    { id: 'v-neph', daysFromNow: -74, hour: 11, minute: 0, title: 'Kidney check-up', with: 'Sample nephrology clinic', mode: 'In person', minutes: 30, note: 'eGFR 39. Referred to a renal dietitian.' },
  ],
};

export const careCircle = [
  { name: 'Fung', detail: 'Mom · 78 · CKD stage G3b', role: 'Patient', tone: 'teal' },
  { name: 'Heidi', detail: 'Daughter · manages meals and visits', role: 'Primary caregiver (you)', tone: 'clay' },
  { name: 'Joyce', detail: 'Daughter · can see plans and messages', role: 'View-only', tone: 'plain' },
];

// Lab history (sample). Dates are month labels; values are illustrative.
export const trends = [
  {
    key: 'egfr', label: 'eGFR', unit: 'mL/min', explain: 'Kidney filtering. Higher is better; steady is the goal.',
    band: { low: 30, high: 44, label: 'Stage G3b range (30–44)' },
    domain: [28, 48],
    points: [
      { month: 'Oct 25', value: 44 },
      { month: 'Jan 26', value: 41 },
      { month: 'May 26', value: 39 },
      { month: 'Sep 26', value: 38 },
    ],
  },
  {
    key: 'k', label: 'Potassium', unit: 'mmol/L', explain: 'Too high can affect the heart rhythm.',
    band: { low: 3.5, high: 5.0, label: 'Goal 3.5–5.0' },
    domain: [3.2, 5.6],
    points: [
      { month: 'Oct 25', value: 4.3 },
      { month: 'Jan 26', value: 4.8 },
      { month: 'May 26', value: 5.2 },
      { month: 'Sep 26', value: 4.6 },
    ],
  },
  {
    key: 'p', label: 'Phosphorus', unit: 'mg/dL', explain: 'Too high over time can weaken bones.',
    band: { low: 2.5, high: 4.5, label: 'Goal 2.5–4.5' },
    domain: [2.2, 5],
    points: [
      { month: 'Oct 25', value: 3.8 },
      { month: 'Jan 26', value: 4.2 },
      { month: 'May 26', value: 4.6 },
      { month: 'Sep 26', value: 4.3 },
    ],
  },
];

export const labDate = 'Sep 18, 2026';
export const labs = [
  { name: 'eGFR', what: 'Kidney filtering', value: '38', unit: 'mL/min', range: '60 or more', status: 'low', statusText: 'Below range', note: 'Expected for stage G3b' },
  { name: 'Creatinine', what: 'Waste the kidneys clear', value: '1.4', unit: 'mg/dL', range: '0.5–1.1', status: 'high', statusText: 'Above range', note: '' },
  { name: 'Potassium', what: 'Mineral in many fruits and vegetables', value: '4.6', unit: 'mmol/L', range: '3.5–5.0', status: 'ok', statusText: 'In range', note: 'Down from 5.2 in May' },
  { name: 'Phosphorus', what: 'Mineral in dairy, nuts, additives', value: '4.3', unit: 'mg/dL', range: '2.5–4.5', status: 'near', statusText: 'Near upper limit', note: '' },
  { name: 'Sodium', what: 'Salt balance', value: '139', unit: 'mmol/L', range: '135–145', status: 'ok', statusText: 'In range', note: '' },
  { name: 'Bicarbonate', what: 'Acid balance', value: '23', unit: 'mmol/L', range: '22–29', status: 'ok', statusText: 'In range', note: '' },
  { name: 'Albumin', what: 'Protein and nutrition', value: '3.8', unit: 'g/dL', range: '3.5–5.0', status: 'ok', statusText: 'In range', note: '' },
  { name: 'Hemoglobin', what: 'Red blood cells', value: '11.6', unit: 'g/dL', range: '12.0–15.5', status: 'low', statusText: 'Below range', note: 'Ask about anemia in CKD' },
];

export const swaps = [
  { cuisine: 'chinese', limit: 'Regular soy sauce', choose: 'Low-sodium soy, measured with a teaspoon, or diluted 1:1 with rice vinegar', why: 'One tablespoon of regular soy has about 900 mg sodium, almost half a day.' },
  { cuisine: 'chinese', limit: 'Oyster sauce and chicken bouillon powder', choose: 'Ginger-scallion oil, garlic, white pepper and a little rice wine', why: 'Bouillon and oyster sauce are mostly salt. Aromatics add flavour with almost none.' },
  { cuisine: 'chinese', limit: 'Preserved vegetables (梅菜, 榨菜, salted mustard greens)', choose: 'Fresh choy sum, napa cabbage, or cucumber quick-pickled in unsalted rice vinegar', why: 'Salt-cured vegetables carry hundreds of mg of sodium per spoonful.' },
  { cuisine: 'chinese', limit: 'Long-boiled bone soup (老火湯)', choose: 'Light homemade stock, simmered under an hour, skimmed and unsalted; winter melon soup', why: 'Hours of boiling pull potassium and phosphorus out of bones and roots into the broth.' },
  { cuisine: 'chinese', limit: 'Dried shrimp, dried scallop, salted fish', choose: 'A few fresh shrimp or fresh fish, with ginger and garlic for depth', why: 'Dried seafood is concentrated sodium and phosphorus.' },
  { cuisine: 'chinese', limit: 'Star fruit (楊桃)', choose: 'Avoid completely. Pear, apple, grapes or pineapple instead', why: 'Star fruit has a toxin that weak kidneys cannot clear. It can be dangerous in CKD.' },
  { cuisine: 'chinese', limit: 'Large servings of tofu or soy milk', choose: 'Half a cup of tofu as the meal\'s protein; soy milk with no "phos" additives on the label', why: 'Soy is a good protein but adds phosphorus and potassium, and some soy milks add phosphate.' },
  { cuisine: 'chinese', limit: 'Brown rice and multigrain rice', choose: 'White jasmine rice', why: 'White rice is lower in phosphorus and potassium, which matters more at this stage.' },
  { cuisine: 'korean', limit: 'Kimchi as a full side dish', choose: 'Two tablespoons of rinsed kimchi, or fresh cucumber muchim with less salt', why: 'Half a cup of kimchi can have 500 mg sodium or more.' },
  { cuisine: 'korean', limit: 'Doenjang and gochujang in stews', choose: 'Half the paste, with more garlic, onion, zucchini and a pinch of gochugaru', why: 'Fermented pastes are very salty; halving them keeps the flavour.' },
  { cuisine: 'korean', limit: 'Instant ramyeon seasoning packet', choose: 'A quarter of the packet, or homemade low-sodium anchovy-kelp broth', why: 'One packet can be over 1,500 mg of sodium.' },
  { cuisine: 'korean', limit: 'Seasoned, salted gim (seaweed)', choose: 'Plain roasted gim with a touch of sesame oil', why: 'Seasoned seaweed snacks add salt quickly.' },
  { cuisine: 'vietnamese', limit: 'Fish sauce (nước mắm) straight', choose: 'Nước chấm made with lime, water, garlic and a little sugar; about 1 teaspoon of fish sauce', why: 'One tablespoon of fish sauce has about 1,400 mg sodium.' },
  { cuisine: 'vietnamese', limit: 'Long-simmered beef bone pho broth', choose: 'Lighter broth with charred ginger, onion, star anise; drink half the bowl', why: 'Bone broths and canned stock are high in sodium and phosphorus.' },
  { cuisine: 'vietnamese', limit: 'Pickled vegetables (dưa chua)', choose: 'Fresh cucumber, herbs, lettuce and bean sprouts', why: 'Brine-pickled vegetables are high in sodium.' },
  { cuisine: 'vietnamese', limit: 'Banana and coconut water', choose: 'Apple, pineapple or longan; plain water or jasmine tea', why: 'Both are very high in potassium.' },
];

export const grocery = [
  { aisle: 'Produce', items: ['Green cabbage, 1 head', 'Napa cabbage, 1 head', 'Winter melon, 1 wedge', 'Scallions, 2 bunches', 'Fresh ginger, 1 large knob', 'Garlic, 1 bulb', 'Bean sprouts, 1 bag', 'Snow peas, 200 g', 'Choy sum, 1 bunch', 'Pears, 3', 'Apples, 3', 'Grapes, 1 small bag', 'Blueberries, 1 box', 'Pineapple, 1 small'] },
  { aisle: 'Meat & seafood', items: ['Chicken thighs, skinless, 1 kg', 'Whole sea bass or tilapia, 2', 'Fish fillet for congee, 200 g', 'Lean minced pork, 250 g', 'Small fresh shrimp, 200 g'] },
  { aisle: 'Refrigerated', items: ['Eggs, 1 dozen', 'Firm tofu, 1 small block', 'Fresh rice noodle sheets (cheung fun)'] },
  { aisle: 'Rice, noodles & pantry', items: ['White jasmine rice', 'Thin egg noodles (lo mein)', 'Glass noodles', 'Low-sodium soy sauce', 'Rice vinegar', 'Toasted sesame oil', 'Ground white pepper', 'Shaoxing rice wine (for cooking)', 'Unsalted rice crackers'] },
];

export const recipeExamples = [
  { label: "Mom's lo mein", dish: "Mom's lo mein with soy sauce, oyster sauce and char siu", cuisine: 'chinese' },
  { label: 'Korean doenjang jjigae', dish: 'Doenjang jjigae with tofu, zucchini and potato', cuisine: 'korean' },
  { label: 'Vietnamese pho', dish: 'Vietnamese beef pho with fish sauce and bone broth', cuisine: 'vietnamese' },
  { label: 'Steamed pork with salted fish', dish: 'Steamed minced pork with salted fish (鹹魚蒸肉餅)', cuisine: 'chinese' },
];
