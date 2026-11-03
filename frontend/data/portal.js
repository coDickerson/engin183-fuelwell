// Mock content for the portal pages Megan owns: AI Chat, Notes and the Today zone bar.
// Every value here is fictional sample data. It is not medical advice.
// Text that people read is { en, zh, es }; pick it with tr() from scripts/i18n.js.
import { week } from './fung.js';

const s = (en, zh, es) => ({ en, zh, es });

/* ---------- AI Chat: mock replies used by scripts/portal/agent.js ---------- */

// Checked first: symptoms always get a "call a person" answer and never food advice.
export const urgentWords = /swell|swollen|short of breath|breathing|can'?t breathe|chest pain|confus|faint|passed out|腫|氣喘|呼吸|胸口痛|胸痛|暈|昏|hinchad|falta (de )?(el )?aire|respirar|dolor (de|en el) pecho|confundid|desmay/i;

export const urgentReply = s(
  'Swelling, chest pain or trouble breathing can be serious for someone with kidney disease. Please call Dr. Lau’s office now. If Mom has chest pain, bad trouble breathing or seems confused, call 911. I can’t help with symptoms. This needs a person.',
  '對腎病患者來說，水腫、胸口痛或呼吸困難可能很嚴重。請立即致電劉醫生診所。如果媽媽胸口痛、呼吸非常困難或神志不清，請馬上打 911。我不能處理身體不適的問題，這需要由醫護人員處理。',
  'La hinchazón, el dolor de pecho o la falta de aire pueden ser graves en alguien con enfermedad renal. Llama ahora al consultorio del Dr. Lau. Si mamá tiene dolor de pecho, mucha dificultad para respirar o está confundida, llama al 911. No puedo ayudar con síntomas. Esto necesita a una persona.',
);

const dayLabel = (n) => s(`Day ${n}`, `第 ${n} 天`, `Día ${n}`);
const slotLabel = {
  breakfast: s('Breakfast', '早餐', 'Desayuno'),
  lunch: s('Lunch', '午餐', 'Almuerzo'),
  dinner: s('Dinner', '晚餐', 'Cena'),
};

// A three-day plan built from dishes already in Fung's week, so it feels like her own cooking.
export const sampleMealPlan = {
  title: s('3 days of Cantonese home cooking, lower in salt', '三日低鹽廣東家常菜', '3 días de comida casera cantonesa con menos sal'),
  days: [0, 1, 2].map((i) => ({
    label: dayLabel(i + 1),
    meals: ['breakfast', 'lunch', 'dinner'].map((slot) => ({ slot: slotLabel[slot], name: week[i][slot].name, tip: week[i][slot].note })),
  })),
};

// Keyword replies. The first rule whose pattern matches the question wins.
export const agentReplies = [
  {
    match: /meal plan|plan for|this week|menu|what (should|can) (mom|she) eat|餐單|菜單|計劃|一週|plan de comidas|menú|esta semana/i,
    text: s(
      'Here’s a 3-day plan built from dishes Mom already eats. Sauces are measured and the soups are short-simmered. Please check it with Mei before you make big changes.',
      '這是用媽媽平日常吃的菜編排的三日餐單。醬料都有量度，湯水都是短時間煲的。作出較大改動前，請先和 Mei 確認。',
      'Aquí tienes un plan de 3 días con platos que mamá ya come. Las salsas van medidas y las sopas se cocinan poco tiempo. Revísalo con Mei antes de hacer cambios grandes.',
    ),
    mealPlan: sampleMealPlan,
  },
  {
    match: /soy|sauce|oyster|hoisin|salt|豉油|醬|蠔油|鹽|soya|salsa|sal\b/i,
    text: s(
      'Soy sauce is one of the biggest sources of salt in Cantonese cooking. Ideas that keep the flavour:\n• Use a less-sodium soy sauce (for example Kikkoman Less Sodium) and measure it: 1 teaspoon, not a pour. It is still salty.\n• Add flavour with ginger, scallion, garlic, a little rice vinegar or sesame oil.\n• Oyster sauce and hoisin are salty too. About ½ teaspoon each.\n• Save fermented bean curd (腐乳) and salted black beans for special days.\n• Avoid “lite salt” or salt substitutes made with potassium. They can be risky for kidneys.\nMei can tell you how much fits in Mom’s day.',
      '豉油是廣東菜裏最主要的鹽分來源之一。保留味道的方法：\n• 改用低鈉豉油（例如萬字減鹽豉油），並用匙量度：每次 1 茶匙，不要直接倒。低鈉豉油仍然偏鹹。\n• 多用薑、蔥、蒜、少許米醋或麻油提味。\n• 蠔油和海鮮醬也很鹹，每樣大約半茶匙。\n• 腐乳和豆豉留待節日才吃。\n• 不要用含鉀的「低鈉鹽」或代鹽，對腎臟可能有風險。\n媽媽每天可以吃多少，可以問 Mei。',
      'La salsa de soya es una de las mayores fuentes de sal en la cocina cantonesa. Ideas que conservan el sabor:\n• Usa soya baja en sodio (por ejemplo Kikkoman Less Sodium) y mídela: 1 cucharadita, no un chorro. Sigue siendo salada.\n• Da sabor con jengibre, cebollín, ajo, un poco de vinagre de arroz o aceite de ajonjolí.\n• La salsa de ostión y la hoisin también son saladas. Más o menos ½ cucharadita de cada una.\n• Deja el tofu fermentado (腐乳) y los frijoles negros salados para días especiales.\n• Evita la “sal light” o sustitutos de sal con potasio. Pueden ser riesgosos para los riñones.\nMei te puede decir cuánto cabe en el día de mamá.',
    ),
  },
  {
    match: /soup|老火湯|湯|sopa|caldo/i,
    text: s(
      'Long-boiled soups (老火湯) pull potassium and phosphorus from bones and vegetables into the broth. To keep soup on the table:\n• Simmer under an hour, like Mom’s winter melon soup (冬瓜湯).\n• Have a small bowl, and eat the soft melon more than the broth.\n• Skip dried seafood, salted pork and bouillon cubes.\nAsk Mei how often soup fits in Mom’s week.',
      '老火湯會把骨頭和蔬菜裏的鉀和磷煲進湯裏。想繼續飲湯，可以：\n• 煲不超過一小時，例如媽媽的冬瓜湯。\n• 只飲一小碗，多吃冬瓜，少飲湯。\n• 不放海味、鹹豬肉或雞粉、湯包。\n媽媽每星期可以飲幾次湯，可以問 Mei。',
      'Las sopas de cocción larga (老火湯) pasan el potasio y el fósforo de los huesos y verduras al caldo. Para seguir tomando sopa:\n• Cocina menos de una hora, como la sopa de melón de invierno (冬瓜湯) de mamá.\n• Toma un plato pequeño y come más melón que caldo.\n• Evita mariscos secos, cerdo salado y cubitos de caldo.\nPregunta a Mei cada cuánto puede tomar sopa mamá.',
    ),
  },
  {
    match: /lo mein|noodle|chow mein|麵|fideo/i,
    text: s(
      'Mom’s lo mein can stay. A few swaps:\n• Use fresh egg noodles and skip the seasoning packet.\n• Measure 1 teaspoon of less-sodium soy and ½ teaspoon of oyster sauce for the whole pan.\n• Char siu is salty. Use a few slices, or home-roasted chicken with ginger and scallion.\n• Bulk it up with cabbage and bean sprouts.',
      '媽媽的撈麵可以照吃，只要換幾樣：\n• 用新鮮蛋麵，不用調味包。\n• 整鑊只用 1 茶匙低鈉豉油和半茶匙蠔油。\n• 叉燒很鹹，只放幾片，或改用自家薑蔥焗雞。\n• 多加椰菜和芽菜。',
      'El lo mein de mamá se puede quedar. Algunos cambios:\n• Usa fideos de huevo frescos y no uses el sobre de sazonador.\n• Mide 1 cucharadita de soya baja en sodio y ½ de salsa de ostión para toda la sartén.\n• El char siu es salado. Usa unas pocas rebanadas, o pollo asado en casa con jengibre y cebollín.\n• Agrega repollo y germinado de soya.',
    ),
  },
  {
    match: /congee|jook|粥|arroz caldoso/i,
    text: s(
      'White rice congee is a good choice for Mom. To keep it gentle on her kidneys:\n• Cook it with homemade unsalted stock, ginger and scallion.\n• Add shredded chicken or a little fish for protein.\n• Skip century egg, salted egg and pork floss (肉鬆). They are very salty.',
      '白粥很適合媽媽。想對腎臟更溫和：\n• 用自家無鹽上湯，加薑絲和蔥花。\n• 加雞絲或少量魚片補充蛋白質。\n• 不要加皮蛋、鹹蛋或肉鬆，這些都很鹹。',
      'El congee de arroz blanco es buena opción para mamá. Para cuidar sus riñones:\n• Prepáralo con caldo casero sin sal, jengibre y cebollín.\n• Agrega pollo deshebrado o un poco de pescado como proteína.\n• Evita el huevo centenario, el huevo salado y el pork floss (肉鬆). Son muy salados.',
    ),
  },
  {
    match: /fruit|banana|orange|apple|pear|水果|香蕉|橙|蘋果|梨|fruta|plátano|naranja|manzana|pera/i,
    text: s(
      'Fruits lower in potassium: apple, pear (雪梨), grapes, berries and pineapple.\nHigher in potassium: banana, orange, kiwi, and dried fruit like dried longan (龍眼乾).\nOne small piece at a time is a good habit. Mei can say which fit Mom’s labs.',
      '鉀質較低的水果：蘋果、雪梨、提子、莓類和菠蘿。\n鉀質較高的水果：香蕉、橙、奇異果，以及龍眼乾等乾果。\n每次吃一小份是好習慣。哪些適合媽媽的化驗結果，可以問 Mei。',
      'Frutas con menos potasio: manzana, pera (雪梨), uvas, moras y piña.\nCon más potasio: plátano, naranja, kiwi y frutas secas como el longan seco (龍眼乾).\nUna porción pequeña a la vez es un buen hábito. Mei te puede decir cuáles van con los análisis de mamá.',
    ),
  },
];

export const defaultReply = s(
  'I can help make Mom’s own dishes kidney-friendly. Try asking about a dish (lo mein, congee, soup), a sauce, or a meal plan. For questions about her labs or medicines, please ask Mei or Dr. Lau.',
  '我可以幫你把媽媽平日愛吃的菜改得更適合腎臟。可以問我某道菜（撈麵、粥、湯）、醬料，或者請我編排餐單。化驗結果或藥物的問題，請問 Mei 或劉醫生。',
  'Puedo ayudarte a adaptar los platos de mamá para cuidar sus riñones. Pregúntame por un plato (lo mein, congee, sopa), una salsa o un plan de comidas. Para dudas sobre análisis o medicinas, pregunta a Mei o al Dr. Lau.',
);

// Three starter questions under the chat box. Few choices on purpose.
export const chatSuggestions = [
  s('How can Mom still use soy sauce?', '媽媽還可以怎樣用豉油？', '¿Cómo puede mamá seguir usando salsa de soya?'),
  s('Make a 3-day meal plan', '幫我編排三日餐單', 'Haz un plan de comidas de 3 días'),
  s('Can Mom have Sunday soup (老火湯)?', '媽媽星期日可以飲老火湯嗎？', '¿Puede mamá tomar la sopa del domingo (老火湯)?'),
];
