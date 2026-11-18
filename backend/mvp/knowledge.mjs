// Small reviewed-source index for the local demonstration. Retrieval is keyword based and inspectable.
export const guidance = [
  { id: 'nkf-dialysis-protein', population: 'dialysis', tags: ['protein', 'meat', 'chicken', 'fish', 'meal'],
    text: 'People receiving hemodialysis generally need enough protein and calories; a renal dietitian sets the personal amount.',
    source: 'National Kidney Foundation: Hemodialysis', url: 'https://www.kidney.org/kidney-topics/hemodialysis' },
  { id: 'nkf-dialysis-dining', population: 'dialysis', tags: ['restaurant', 'menu', 'takeout', 'sodium', 'order'],
    text: 'When dining out on dialysis, consider sodium, potassium, phosphorus, fluids, portions, and protein. Ask how food is prepared.',
    source: 'National Kidney Foundation: Dining Out With Confidence', url: 'https://www.kidney.org/kidney-topics/dining-out-confidence-dialysis' },
  { id: 'nkf-ckd-plate', population: 'all', tags: ['meal', 'recipe', 'vegetable', 'protein', 'culture'],
    text: 'Food choices and portions should fit the person’s lab results, treatment, culture, budget, and food preferences. A person on dialysis usually needs more protein than someone not on dialysis.',
    source: 'National Kidney Foundation: How to Plan Meals for CKD', url: 'https://www.kidney.org/kidney-topics/creating-kidney-friendly-plate' },
  { id: 'nkf-phosphate', population: 'all', tags: ['phosphorus', 'processed', 'brand', 'additive', 'sauce'],
    text: 'Check ingredient lists for phosphate additives, often containing “phos.” Food composition and absorption differ by source.',
    source: 'National Kidney Foundation: How to Plan Meals for CKD', url: 'https://www.kidney.org/kidney-topics/creating-kidney-friendly-plate' },
  { id: 'nkf-sodium', population: 'all', tags: ['sodium', 'salt', 'broth', 'sauce', 'restaurant', 'takeout'],
    text: 'Restaurant and packaged foods can contribute substantial sodium. The patient’s care team should set their personal food targets.',
    source: 'National Kidney Foundation: Creating a Kidney Friendly Plate', url: 'https://www.kidney.org/kidney-topics/creating-kidney-friendly-plate' },
];

export function retrieve(query, profile, limit = 3) {
  const words = new Set(String(query).toLowerCase().match(/[a-z]{3,}/g) || []);
  const dialysis = profile.dialysis === true;
  return guidance.filter((item) => item.population === 'all' || (dialysis && item.population === 'dialysis'))
    .map((item) => ({ item, score: item.tags.reduce((n, tag) => n + (words.has(tag) ? 2 : 0), 0) + (item.population === 'all' ? 0 : 1) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit).map(({ item }) => item);
}
