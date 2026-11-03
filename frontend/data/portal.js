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

/* ---------- Notes: guides, meal plans and care-team notes ---------- */

// Who writes notes. Mei and Dr. Lau come from the care circle in fung.js.
export const noteAuthors = {
  mei: { name: 'Mei Chen, RD', initials: 'MC', tone: 'clay', role: s('Renal dietitian', '腎病營養師', 'Dietista renal') },
  lau: { name: { en: 'Dr. Lau', zh: '劉醫生', es: 'Dr. Lau' }, initials: 'DL', tone: 'teal', role: s('Nephrology (kidney doctor)', '腎科醫生', 'Nefrología (médico del riñón)') },
};

// A meal plan lists Fung's week from fung.js, starting on the Monday of the note's week.
// `days` picks which day of `week` to show for each weekday, so older plans differ a little.
const plan = (days) => ({ days });

// Notes are placed relative to today (daysAgo) so the portal always looks current.
export const careNotes = [
  {
    id: 'g-sauces', type: 'guide', author: 'mei', daysAgo: 0, h: 8, m: 30,
    title: s('Weekly guide: cooking with sauces', '每週指南：醬料怎樣用', 'Guía semanal: cocinar con salsas'),
    summary: s('Keep the flavour of soy, oyster and hoisin sauce while using less salt.', '保留豉油、蠔油和海鮮醬的味道，同時減少鹽分。', 'Conserva el sabor de la soya, la salsa de ostión y la hoisin usando menos sal.'),
    body: [
      s('Sauces are where most of the salt in Mom’s cooking comes from. You don’t have to give them up. Measure them instead of pouring.', '媽媽飲食中大部分的鹽分都來自醬料。不用完全戒掉，只要用匙量度，不要直接倒。', 'La mayor parte de la sal en la comida de mamá viene de las salsas. No hace falta dejarlas. Mídelas en lugar de servirlas a ojo.'),
    ],
    tips: [
      s('Less-sodium soy sauce (for example Kikkoman Less Sodium): up to 1 teaspoon per dish.', '低鈉豉油（例如萬字減鹽豉油）：每道菜最多 1 茶匙。', 'Soya baja en sodio (por ejemplo Kikkoman Less Sodium): hasta 1 cucharadita por plato.'),
      s('Oyster sauce and hoisin: about ½ teaspoon per dish.', '蠔油和海鮮醬：每道菜大約半茶匙。', 'Salsa de ostión y hoisin: más o menos ½ cucharadita por plato.'),
      s('Fermented bean curd (腐乳) and salted black beans: special days only.', '腐乳和豆豉：只在節日吃。', 'Tofu fermentado (腐乳) y frijoles negros salados: solo en días especiales.'),
      s('No salt substitutes made with potassium (“lite salt”).', '不要用含鉀的代鹽（「低鈉鹽」）。', 'Nada de sustitutos de sal con potasio (“sal light”).'),
      s('More ginger, scallion, garlic and a splash of rice vinegar for flavour.', '多用薑、蔥、蒜和少許米醋提味。', 'Más jengibre, cebollín, ajo y un chorrito de vinagre de arroz para dar sabor.'),
    ],
  },
  {
    id: 'p-week4', type: 'plan', author: 'mei', daysAgo: 0, h: 8, m: 45,
    title: s('Meal plan for this week', '本週餐單', 'Plan de comidas de esta semana'),
    summary: s('Mom’s usual Cantonese dishes, with measured sauces and short-simmered soup.', '媽媽平日的廣東菜，醬料有量度，湯水短時間煲。', 'Los platos cantoneses de siempre de mamá, con salsas medidas y sopa de cocción corta.'),
    plan: plan([0, 1, 2, 3, 4, 5, 6]),
  },
  {
    id: 'd-followup', type: 'dietitian', author: 'mei', daysAgo: 3, h: 10, m: 15,
    title: s('Note after reviewing Mom’s food log', '審閱媽媽飲食紀錄後的筆記', 'Nota tras revisar el registro de comidas de mamá'),
    summary: s('Good choices this week. Swap preserved mustard greens (梅菜) for fresh choy sum (菜心).', '本週選擇很好。把梅菜換成新鮮菜心。', 'Buenas elecciones esta semana. Cambiar las hojas de mostaza en conserva (梅菜) por choy sum (菜心) fresco.'),
    body: [
      s('The steamed fish and ginger congee are great choices. Keep them in the rotation.', '清蒸魚和薑絲粥都是很好的選擇，可以繼續經常煮。', 'El pescado al vapor y el congee de jengibre son muy buenas opciones. Sigan con ellos.'),
      s('Preserved mustard greens (梅菜) are very high in salt. Use fresh choy sum instead on most days. A small portion of 梅菜扣肉 at New Year is something we can plan for together.', '梅菜鈉含量很高，平日請改用新鮮菜心。過年吃一小份梅菜扣肉，我們可以一起計劃。', 'Las hojas de mostaza en conserva (梅菜) tienen mucha sal. Usen choy sum fresco la mayoría de los días. Una porción pequeña de 梅菜扣肉 en Año Nuevo la podemos planear juntas.'),
      s('Please bring Mom’s latest lab printout to our next video visit.', '下次視像覆診時，請帶上媽媽最新的化驗報告。', 'Por favor traigan los análisis más recientes de mamá a la próxima videoconsulta.'),
    ],
  },
  {
    id: 'g-soups', type: 'guide', author: 'mei', daysAgo: 7, h: 8, m: 30,
    title: s('Weekly guide: soups and potassium', '每週指南：湯水與鉀', 'Guía semanal: sopas y potasio'),
    summary: s('How to keep Sunday soup without the extra potassium.', '怎樣繼續飲星期日的湯，又不會攝取太多鉀。', 'Cómo mantener la sopa del domingo sin el potasio extra.'),
    body: [
      s('Long-boiled soups (老火湯) pull potassium and phosphorus out of bones and vegetables and into the broth. Shorter soups are a better fit for Mom.', '老火湯會把骨頭和蔬菜中的鉀和磷煲進湯裏。短時間煲的湯較適合媽媽。', 'Las sopas de cocción larga (老火湯) sacan el potasio y el fósforo de los huesos y verduras hacia el caldo. Las sopas cortas le van mejor a mamá.'),
    ],
    tips: [
      s('Simmer under an hour. Winter melon soup (冬瓜湯) is a good choice.', '煲不超過一小時，冬瓜湯是好選擇。', 'Cocinar menos de una hora. La sopa de melón de invierno (冬瓜湯) es buena opción.'),
      s('One small bowl. Eat the soft melon more than the broth.', '只飲一小碗，多吃冬瓜，少飲湯。', 'Un plato pequeño. Comer más melón que caldo.'),
      s('No dried seafood, salted pork, or bouillon cubes.', '不放海味、鹹豬肉或雞粉、湯包。', 'Sin mariscos secos, cerdo salado ni cubitos de caldo.'),
    ],
  },
  {
    id: 'p-week3', type: 'plan', author: 'mei', daysAgo: 7, h: 8, m: 45,
    title: s('Meal plan for the week', '一週餐單', 'Plan de comidas de la semana'),
    summary: s('Steamed fish twice, short-simmered soup on Sunday.', '清蒸魚兩次，星期日飲短時間煲的湯。', 'Pescado al vapor dos veces y sopa corta el domingo.'),
    plan: plan([3, 1, 0, 6, 4, 2, 5]),
  },
  {
    id: 'dr-labs', type: 'doctor', author: 'lau', daysAgo: 13, h: 16, m: 20,
    title: s('Lab review', '化驗結果覆核', 'Revisión de análisis'),
    summary: s('Kidney function is steady. Potassium is back in range. Keep an eye on phosphorus.', '腎功能穩定，鉀已回到正常範圍，要留意磷。', 'La función renal está estable. El potasio volvió al rango. Vigilar el fósforo.'),
    body: [
      s('Fung’s kidney function is steady at stage G3b. Keeping it steady is the goal.', 'Fung 的腎功能穩定，仍屬 G3b 期。目標是保持穩定。', 'La función renal de Fung está estable en etapa G3b. La meta es mantenerla así.'),
      s('Potassium came back into range after the changes to soups and fruit. Well done.', '改變湯水和水果的習慣後，鉀已回到正常範圍。做得很好。', 'El potasio volvió al rango después de los cambios en sopas y fruta. Muy bien.'),
      s('Phosphorus is near the top of the goal range. Please work with Mei on dairy, dried seafood and packaged foods.', '磷接近目標上限，請和 Mei 一起留意奶類、海味乾貨和包裝食品。', 'El fósforo está cerca del límite de la meta. Por favor revisen con Mei los lácteos, mariscos secos y alimentos empacados.'),
      s('Next blood test is already booked. No medicine changes today.', '下次抽血已預約。今日不需更改藥物。', 'El próximo análisis de sangre ya está reservado. Hoy no hay cambios de medicinas.'),
    ],
  },
  {
    id: 'g-dimsum', type: 'guide', author: 'mei', daysAgo: 14, h: 8, m: 30,
    title: s('Weekly guide: dim sum and eating out', '每週指南：飲茶與外出用餐', 'Guía semanal: dim sum y comer fuera'),
    summary: s('Yum cha with the family can stay. Choose steamed dishes and go easy on the sauces.', '可以繼續和家人飲茶。多選蒸點，少點醬汁。', 'El yum cha en familia se puede quedar. Elijan platos al vapor y poca salsa.'),
    tips: [
      s('Better choices: har gow (蝦餃), steamed rice rolls with sauce on the side, steamed fish.', '較好的選擇：蝦餃、腸粉（醬汁另上）、蒸魚。', 'Mejores opciones: har gow (蝦餃), rollos de arroz al vapor con la salsa aparte, pescado al vapor.'),
      s('Go easy on: char siu bao, salted egg yolk buns, fried dishes.', '少吃：叉燒包、流沙包、煎炸點心。', 'Con moderación: char siu bao, bollos de yema salada, platos fritos.'),
      s('Ask for sauce on the side and drink tea, not soup.', '醬汁另上，飲茶代替飲湯。', 'Pidan la salsa aparte y tomen té en lugar de sopa.'),
    ],
  },
  {
    id: 'p-week2', type: 'plan', author: 'mei', daysAgo: 14, h: 8, m: 45,
    title: s('Meal plan for the week', '一週餐單', 'Plan de comidas de la semana'),
    summary: s('Lighter sauces, more cabbage and bean sprouts.', '醬汁清淡，多吃椰菜和芽菜。', 'Salsas ligeras, más repollo y germinado.'),
    plan: plan([1, 0, 3, 2, 5, 4, 6]),
  },
  {
    id: 'd-consult', type: 'dietitian', author: 'mei', daysAgo: 28, h: 15, m: 0,
    title: s('Summary of our first visit', '首次諮詢摘要', 'Resumen de nuestra primera consulta'),
    summary: s('We set Mom’s daily goals and agreed to swap preserved vegetables for fresh greens.', '我們訂立了媽媽的每日目標，並同意以新鮮蔬菜代替醃菜。', 'Fijamos las metas diarias de mamá y acordamos cambiar las verduras en conserva por verduras frescas.'),
    body: [
      s('It was lovely to meet you and Mom. Her own cooking is a great place to start. We will adjust it, not replace it.', '很高興認識你和媽媽。她自己煮的菜是很好的起點，我們會調整，而不是取代。', 'Fue un gusto conocerlas a ti y a mamá. Su propia cocina es un gran punto de partida. La vamos a ajustar, no a reemplazar.'),
      s('Each week I’ll send a short guide and a meal plan here. Message me any time with questions.', '我每星期都會在這裏發送簡短指南和餐單。有任何問題，隨時傳訊息給我。', 'Cada semana enviaré aquí una guía corta y un plan de comidas. Escríbeme cuando tengas preguntas.'),
    ],
    tips: [
      s('Fresh greens instead of preserved vegetables (梅菜, 鹹菜).', '用新鮮蔬菜代替醃菜（梅菜、鹹菜）。', 'Verduras frescas en lugar de verduras en conserva (梅菜, 鹹菜).'),
      s('White rice instead of brown rice for now.', '暫時以白飯代替糙米飯。', 'Arroz blanco en lugar de integral por ahora.'),
      s('Homemade stock without salt.', '自家煲無鹽上湯。', 'Caldo casero sin sal.'),
    ],
  },
];
