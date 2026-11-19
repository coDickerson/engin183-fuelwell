// Testable retrieval and context assembly for the LangChain chat function.
// Only reviewed care-plan text can become patient-specific retrieval context.
// (Cole's code, copied from the deployed chat-agent v4 so it lives in git.)
export const guidance = [
  { id: 'nkf-plate', population: 'all', tags: ['meal', 'recipe', 'food', 'portion', 'culture', 'vegetable'],
    text: 'A kidney food plan depends on treatment, lab results, medicines, budget, culture, and food preferences. A kidney dietitian sets individual food choices and portions.',
    title: 'Creating a Kidney Friendly Plate', url: 'https://www.kidney.org/kidney-topics/creating-kidney-friendly-plate' },
  { id: 'nkf-sodium', population: 'all', tags: ['sodium', 'salt', 'sauce', 'broth', 'restaurant', 'takeout'],
    text: 'Less processed food, home cooking when possible, and herbs and spices instead of salt can help reduce sodium. Read food labels for sodium.',
    title: 'Creating a Kidney Friendly Plate', url: 'https://www.kidney.org/kidney-topics/creating-kidney-friendly-plate' },
  { id: 'nkf-phosphate', population: 'all', tags: ['phosphorus', 'phosphate', 'processed', 'brand', 'additive'],
    text: 'Check ingredient lists for phosphate additives, including ingredients with “phos” in the name. Needs vary by lab results and treatment.',
    title: 'Creating a Kidney Friendly Plate', url: 'https://www.kidney.org/kidney-topics/creating-kidney-friendly-plate' },
  { id: 'nkf-dialysis-dining', population: 'dialysis', tags: ['dialysis', 'restaurant', 'menu', 'takeout', 'order', 'protein', 'fluid'],
    text: 'For dining out on dialysis, consider protein, sodium, potassium, phosphorus, fluids, and portions. Ask how food is prepared and discuss choices with the dialysis dietitian.',
    title: 'Dining Out With Confidence - On Dialysis', url: 'https://www.kidney.org/kidney-topics/dining-out-confidence-dialysis' },
];

const words = (value) => new Set(String(value).toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || []);
const score = (query, item) => {
  const q = words(query);
  return item.tags.reduce((n, tag) => n + (q.has(tag) ? 3 : 0), 0) + [...words(item.text)].reduce((n, word) => n + (q.has(word) ? 1 : 0), 0);
};

export function workflowFor(message, requestedMode) {
  if (requestedMode === 'meal' || requestedMode === 'menu') return requestedMode;
  return /\b(menu|restaurant|takeout|order(ing)? out|dining out)\b/i.test(message) ? 'menu' : 'meal';
}

export function retrieveContext({ message, profile, reviewedPlans = [], limit = 4 }) {
  const population = profile?.on_dialysis === true ? 'dialysis' : 'all';
  const general = guidance.filter((item) => item.population === 'all' || item.population === population)
    .map((item) => ({ ...item, kind: 'guidance' }));
  const plans = reviewedPlans.filter((plan) => plan.status === 'reviewed' && plan.reviewed_at && plan.patient_id === profile?.id)
    .flatMap((plan) => String(plan.source_text || '').split(/\n\s*\n/).map((part, index) => part.trim()).filter(Boolean).slice(0, 16)
      .map((text, index) => ({ id: `plan-${plan.id}-${index}`, kind: 'reviewed-plan', population: 'patient', text: text.slice(0, 1200), title: plan.title, url: null, tags: [], reviewedAt: plan.reviewed_at })));
  return [...plans, ...general].map((item) => ({ item, rank: score(message, item) + (item.kind === 'reviewed-plan' ? 20 : 0) }))
    .sort((a, b) => b.rank - a.rank).slice(0, limit).map(({ item }) => item);
}

export function makePromptContext({ profile, documents, workflow, language }) {
  const patient = profile ? `${profile.display_name}; CKD stage ${profile.ckd_stage || 'unknown'}; dialysis ${profile.on_dialysis === true ? 'yes' : profile.on_dialysis === false ? 'no' : 'unknown'}; cuisine ${profile.cuisine || 'unknown'}; preferences ${profile.food_preferences || 'none recorded'}` : 'No patient profile is linked to this caregiver account.';
  const sources = documents.map((doc) => `[${doc.id}] ${doc.kind === 'reviewed-plan' ? `Reviewed patient plan (${doc.reviewedAt})` : 'General NKF guidance'}: ${doc.text}`).join('\n\n');
  return { patient, sources, workflow, language: ['en', 'zh', 'es'].includes(language) ? language : 'en' };
}

// A bounded answer when the model is unavailable. It never uses unreviewed plans
// or invents personal limits, nutrient totals, or approval of a specific meal.
export function rulesAnswer({ profile, documents, workflow, language = 'en' }) {
  const copy = {
    en: {
      meal: 'For this dish, keep its familiar base and ask how much sauce, broth, or packaged seasoning it uses. Try herbs, ginger, citrus, or a measured smaller amount of sauce for flavor. Check labels and portions with the kidney dietitian.',
      menu: 'For these menu choices, ask how each dish is prepared, whether sauce or broth can be served separately, and what portion is served. Restaurant ingredients and nutrient amounts cannot be confirmed from a menu name.',
      targets: 'Personal nutrient targets are unavailable until a clinician reviews a care plan.',
      profile: 'Add a patient profile for more tailored food ideas.',
    },
    zh: {
      meal: '這道菜可以保留熟悉的基本做法，先了解醬汁、湯底或包裝調味料的用量。可試用薑、香草、檸檬，或量好較少的醬汁來調味。請與腎臟營養師核對食材標籤和份量。',
      menu: '選擇餐廳菜式時，請問清楚烹調方法、醬汁或湯可否分開上，以及每份的份量。單看菜名無法確認食材或營養含量。',
      targets: '臨床人員審核照護計劃前，沒有可用的個人營養目標。',
      profile: '加入病人資料後，才能提供更貼近個人情況的食物建議。',
    },
    es: {
      meal: 'Para este plato, conserve su base habitual y pregunte cuánto aderezo, caldo o condimento envasado lleva. Pruebe hierbas, jengibre, cítricos o una cantidad menor y medida de salsa. Revise las etiquetas y porciones con el dietista renal.',
      menu: 'Para elegir del menú, pregunte cómo preparan cada plato, si pueden servir la salsa o el caldo aparte y cuál es la porción. El nombre del plato no confirma sus ingredientes ni sus nutrientes.',
      targets: 'No hay metas personales de nutrientes hasta que un profesional revise el plan de atención.',
      profile: 'Agregue un perfil del paciente para obtener ideas más adaptadas.',
    },
  }[language] || null;
  const words = copy || {
    meal: 'Keep the familiar dish, ask about sauces and portions, and check choices with the kidney dietitian.',
    menu: 'Ask about preparation, sauces, and portions; a menu name does not confirm nutrients.',
    targets: 'Personal nutrient targets are unavailable until a clinician reviews a care plan.',
    profile: 'Add a patient profile for more tailored food ideas.',
  };
  const sourceIds = documents.filter((doc) => doc.kind === 'guidance').slice(0, 2).map((doc) => `[${doc.id}]`).join(' ');
  const hasPlan = documents.some((doc) => doc.kind === 'reviewed-plan');
  return [words[workflow === 'menu' ? 'menu' : 'meal'], sourceIds, ...(!hasPlan ? [words.targets] : []), ...(!profile ? [words.profile] : [])].filter(Boolean).join(' ');
}
