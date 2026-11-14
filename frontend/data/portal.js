// Mock content for the portal pages Megan owns: Notes and the Today zone bar.
// Every value here is fictional sample data. It is not medical advice.
// Text that people read is { en, zh, es }; pick it with tr() from scripts/i18n.js.
import { week } from './fung.js';

const s = (en, zh, es) => ({ en, zh, es });

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
