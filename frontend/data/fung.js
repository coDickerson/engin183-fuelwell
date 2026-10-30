// Workspace data for the FuelWell demo: Heidi manages her mom Fung's renal diet.
// Every value here is fictional sample data. It is not medical advice.
// Text that people read is { en, zh, es }; pick it with tr() from scripts/i18n.js.
// zh is Traditional Chinese with Hong Kong / Cantonese food words (豉油, 椰菜, 菜心).

export const persona = {
  patient: {
    name: 'Fung', age: 78, stage: 'G3b', egfr: 38,
    relation: { en: 'Mom', zh: '媽媽', es: 'Mamá' },
    cuisine: { en: 'Cantonese home cooking', zh: '廣東家常菜', es: 'Comida casera cantonesa' },
  },
  caregiver: { name: 'Heidi', email: 'heidi_demo@fuelwell.app' },
  sister: { name: 'Joyce' },
  dietitian: {
    name: 'Mei Chen, RD',
    initials: 'MC',
    role: { en: 'Renal dietitian', zh: '腎病營養師', es: 'Dietista renal' },
    languages: { en: 'Cantonese · English', zh: '粵語 · 英語', es: 'Cantonés · Inglés' },
  },
};

// Daily targets used for the Today tiles (values a dietitian might set for G3b).
export const targets = {
  k: { label: { en: 'Potassium', zh: '鉀', es: 'Potasio' }, unit: 'mg', target: 2000 },
  p: { label: { en: 'Phosphorus', zh: '磷', es: 'Fósforo' }, unit: 'mg', target: 800 },
  na: { label: { en: 'Sodium', zh: '鈉', es: 'Sodio' }, unit: 'mg', target: 2000 },
};

export const mealSlots = [
  { key: 'breakfast', label: { en: 'Breakfast', zh: '早餐', es: 'Desayuno' }, h: 8, m: 0 },
  { key: 'lunch', label: { en: 'Lunch', zh: '午餐', es: 'Almuerzo' }, h: 12, m: 30 },
  { key: 'dinner', label: { en: 'Dinner', zh: '晚餐', es: 'Cena' }, h: 18, m: 0 },
  { key: 'snack', label: { en: 'Snack', zh: '小食', es: 'Merienda' }, h: 15, m: 30 },
];

// name: full description per language. dish: the Chinese dish name the family uses.
const m = (name, dish, note, k, p, na) => ({ name, dish, note, k, p, na });

// Index 0 = Monday … 6 = Sunday. Rough K/P/Na in mg per portion.
export const week = [
  {
    breakfast: m({ en: 'White rice congee with ginger and shredded chicken', zh: '薑絲雞絲白粥', es: 'Congee de arroz con jengibre y pollo deshebrado' }, '薑絲雞粥',
      { en: 'Made with homemade unsalted stock', zh: '用自家無鹽上湯煮', es: 'Con caldo casero sin sal' }, 190, 150, 280),
    lunch: m({ en: 'Steamed fish with scallion and low-sodium soy, white rice', zh: '蔥油清蒸魚（低鈉豉油）配白飯', es: 'Pescado al vapor con cebollín y soya baja en sodio, arroz blanco' }, '清蒸魚',
      { en: '1 tsp low-sodium soy, measured', zh: '低鈉豉油只用 1 茶匙', es: '1 cucharadita de soya baja en sodio, medida' }, 520, 280, 450),
    dinner: m({ en: 'Garlic stir-fried cabbage, egg and chive omelette, rice', zh: '蒜蓉炒椰菜、韭菜煎蛋配白飯', es: 'Repollo salteado con ajo, tortilla de cebollino y arroz' }, '蒜蓉炒椰菜',
      { en: 'Cabbage is a low-potassium vegetable', zh: '椰菜是低鉀蔬菜', es: 'El repollo es bajo en potasio' }, 420, 190, 380),
    snack: m({ en: 'Fresh pear slices', zh: '新鮮雪梨片', es: 'Rebanadas de pera fresca' }, '雪梨',
      { en: 'One small pear', zh: '一個小雪梨', es: 'Una pera pequeña' }, 120, 15, 2),
  },
  {
    breakfast: m({ en: 'Steamed egg custard with scallion and a plain mantou', zh: '蔥花蒸水蛋配白饅頭', es: 'Flan de huevo al vapor con cebollín y un mantou' }, '蒸水蛋',
      { en: 'Extra egg white, no added salt', zh: '多用蛋白，不另加鹽', es: 'Más clara de huevo, sin sal añadida' }, 160, 120, 320),
    lunch: m({ en: 'Winter melon soup with homemade low-sodium stock, rice', zh: '冬瓜湯（自家低鈉上湯）配白飯', es: 'Sopa de melón de invierno con caldo casero bajo en sodio, arroz' }, '冬瓜湯',
      { en: 'Stock simmered under an hour, unsalted', zh: '上湯煲不超過一小時，不加鹽', es: 'Caldo de menos de una hora, sin sal' }, 380, 160, 360),
    dinner: m({ en: 'Chicken with snow peas and red pepper, white rice', zh: '荷蘭豆紅椒炒雞片配白飯', es: 'Pollo con chícharos chinos y pimiento rojo, arroz blanco' }, '荷蘭豆炒雞片',
      { en: 'Light sauce: ginger, garlic, rice wine', zh: '清淡調味：薑、蒜、米酒', es: 'Salsa ligera: jengibre, ajo y vino de arroz' }, 560, 290, 520),
    snack: m({ en: 'Unsalted rice crackers and apple slices', zh: '無鹽米餅配蘋果片', es: 'Galletas de arroz sin sal y manzana' }, '米餅',
      { en: 'About 4 crackers', zh: '大約 4 塊', es: 'Unas 4 galletas' }, 150, 40, 30),
  },
  {
    breakfast: m({ en: 'Plain rice noodle rolls with sesame oil', zh: '麻油齋腸粉', es: 'Rollos de fideo de arroz con aceite de ajonjolí' }, '齋腸粉',
      { en: 'A drizzle of diluted low-sodium soy', zh: '淋少許稀釋低鈉豉油', es: 'Un chorrito de soya baja en sodio diluida' }, 110, 90, 380),
    lunch: m({ en: 'Ginger-scallion chicken, rice and blanched choy sum', zh: '薑蔥雞、白飯配灼菜心', es: 'Pollo con jengibre y cebollín, arroz y choy sum' }, '薑蔥雞',
      { en: 'Choy sum boiled, water discarded', zh: '菜心灼熟後倒掉菜水', es: 'Choy sum hervido, sin el agua' }, 540, 300, 420),
    dinner: m({ en: 'Steamed tofu with minced pork, stir-fried napa cabbage', zh: '肉碎蒸豆腐、炒紹菜', es: 'Tofu al vapor con cerdo molido y col china salteada' }, '肉碎蒸豆腐',
      { en: 'Half-cup tofu portion', zh: '豆腐份量半碗', es: 'Media taza de tofu' }, 470, 260, 560),
    snack: m({ en: 'Grapes, half a cup', zh: '提子半碗', es: 'Uvas, media taza' }, '提子',
      { en: 'A lower-potassium fruit', zh: '鉀含量較低的水果', es: 'Fruta baja en potasio' }, 140, 15, 2),
  },
  {
    breakfast: m({ en: 'Congee with egg white and ginger', zh: '薑絲蛋白粥', es: 'Congee con clara de huevo y jengibre' }, '蛋白粥',
      { en: 'No century egg (very salty)', zh: '不加皮蛋（非常鹹）', es: 'Sin huevo centenario (muy salado)' }, 150, 110, 260),
    lunch: m({ en: 'Wonton noodle soup with homemade stock, half the broth', zh: '雲吞麵（自家上湯，湯只喝一半）', es: 'Sopa de wonton con fideos y caldo casero, la mitad del caldo' }, '雲吞麵',
      { en: 'Leave half the broth in the bowl', zh: '湯留一半在碗裏', es: 'Deja la mitad del caldo' }, 430, 230, 690),
    dinner: m({ en: 'Steamed sea bass with ginger, bean sprouts, rice', zh: '薑蒸鱸魚、炒芽菜配白飯', es: 'Lubina al vapor con jengibre, germinado de soya y arroz' }, '薑蒸鱸魚',
      { en: 'Bean sprouts are low in potassium', zh: '芽菜鉀含量低', es: 'El germinado es bajo en potasio' }, 560, 300, 400),
    snack: m({ en: 'Blueberries and unsalted crackers', zh: '藍莓配無鹽餅乾', es: 'Arándanos y galletas sin sal' }, '藍莓',
      { en: 'Half a cup of berries', zh: '藍莓半碗', es: 'Media taza de arándanos' }, 90, 30, 60),
  },
  {
    breakfast: m({ en: 'Homemade steamed chicken bun, lightly seasoned', zh: '自家清淡雞包', es: 'Bollo de pollo al vapor casero, poco sazonado' }, '雞包',
      { en: 'Low-salt filling, no oyster sauce', zh: '餡料少鹽，不用蠔油', es: 'Relleno bajo en sal, sin salsa de ostión' }, 180, 120, 420),
    lunch: m({ en: 'Egg fried rice with peas and carrot', zh: '青豆紅蘿蔔蛋炒飯', es: 'Arroz frito con huevo, chícharos y zanahoria' }, '蛋炒飯',
      { en: 'Low-sodium soy, no MSG or bouillon', zh: '低鈉豉油，不加味精或雞粉', es: 'Soya baja en sodio, sin glutamato ni consomé' }, 380, 220, 560),
    dinner: m({ en: 'Braised chicken with napa cabbage and glass noodles', zh: '紹菜粉絲燜雞', es: 'Pollo guisado con col china y fideos de cristal' }, '白菜粉絲燜雞',
      { en: 'Glass noodles are low in potassium', zh: '粉絲鉀含量低', es: 'Los fideos de cristal son bajos en potasio' }, 520, 260, 540),
    snack: m({ en: 'Fresh pineapple chunks', zh: '新鮮菠蘿粒', es: 'Trozos de piña fresca' }, '菠蘿',
      { en: 'Half a cup', zh: '半碗', es: 'Media taza' }, 110, 8, 1),
  },
  {
    breakfast: m({ en: 'Rice congee with ginger and fish slices', zh: '薑絲魚片粥', es: 'Congee con jengibre y filete de pescado' }, '魚片粥',
      { en: 'Fresh fish, not dried scallop', zh: '用新鮮魚片，不用瑤柱', es: 'Pescado fresco, sin vieiras secas' }, 260, 190, 300),
    lunch: m({ en: 'Cantonese lo mein with chicken and bean sprouts', zh: '雞絲芽菜撈麵', es: 'Lo mein cantonés con pollo y germinado de soya' }, '雞絲撈麵',
      { en: 'Low-sodium sauce, extra sprouts', zh: '低鈉醬汁，多加芽菜', es: 'Salsa baja en sodio y más germinado' }, 420, 240, 620),
    dinner: m({ en: 'White-cut chicken with ginger-scallion oil, green beans, rice', zh: '白切雞配薑蔥油、炒四季豆、白飯', es: 'Pollo blanco cantonés con aceite de jengibre, ejotes y arroz' }, '白切雞',
      { en: 'Ginger-scallion oil instead of a salt dip', zh: '用薑蔥油代替鹽碟', es: 'Aceite de jengibre y cebollín en vez de sal' }, 540, 290, 380),
    snack: m({ en: 'One small homemade egg tart', zh: '一個小巧的自家蛋撻', es: 'Una tartaleta de huevo casera pequeña' }, '蛋撻',
      { en: 'A treat-size portion', zh: '小食份量', es: 'Porción de antojo' }, 70, 70, 110),
  },
  {
    breakfast: m({ en: 'Plain congee with scallion and white pepper', zh: '蔥花白胡椒白粥', es: 'Congee sencillo con cebollín y pimienta blanca' }, '白粥',
      { en: 'Skip the salted fish and pickles', zh: '不配鹹魚和醃菜', es: 'Sin pescado salado ni encurtidos' }, 120, 80, 180),
    lunch: m({ en: 'Dim sum at home: har gow, veggie dumplings, cheung fun', zh: '在家飲茶：蝦餃、素餃、腸粉', es: 'Dim sum en casa: har gow, dumplings de verdura y cheung fun' }, '飲茶',
      { en: 'Two of each, with plain tea', zh: '每款兩件，配清茶', es: 'Dos de cada uno, con té' }, 360, 220, 780),
    dinner: m({ en: 'Steamed fish with scallion, stir-fried cabbage, rice', zh: '蔥油清蒸魚、炒椰菜配白飯', es: 'Pescado al vapor con cebollín, repollo salteado y arroz' }, '清蒸魚',
      { en: 'A lighter dinner after dim sum', zh: '飲茶後晚餐清淡些', es: 'Cena ligera después del dim sum' }, 600, 300, 420),
    snack: m({ en: 'Apple slices', zh: '蘋果片', es: 'Rebanadas de manzana' }, '蘋果',
      { en: 'One small apple', zh: '一個小蘋果', es: 'Una manzana pequeña' }, 110, 10, 1),
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
    from: 'dietitian', daysAgo: 3, h: 9, m: 12,
    text: {
      en: 'Hi Heidi, thanks for sending your mom’s food log. The steamed fish and ginger congee are great choices. One thing to watch: the preserved mustard greens (梅菜) at Sunday dinner are very high in sodium. Could we try fresh choy sum instead?',
      zh: 'Heidi 你好，謝謝你傳來媽媽的飲食紀錄。清蒸魚和薑絲粥都是很好的選擇。有一點要留意：星期日晚餐的梅菜鈉含量很高，可以試試改用新鮮菜心嗎？',
      es: 'Hola, Heidi. Gracias por enviar el registro de comidas de tu mamá. El pescado al vapor y el congee de jengibre son muy buenas opciones. Algo a vigilar: las hojas de mostaza en conserva (梅菜) de la cena del domingo tienen mucho sodio. ¿Probamos con choy sum fresco?',
    },
  },
  {
    from: 'caregiver', daysAgo: 3, h: 19, m: 40,
    text: {
      en: 'Thanks Mei! Mom loves 梅菜扣肉 at New Year, so we’ll save it for special occasions. She’s been fine with the cabbage.',
      zh: '謝謝 Mei！媽媽過年最愛吃梅菜扣肉，我們會留到節日才吃。她吃椰菜也很習慣。',
      es: '¡Gracias, Mei! A mamá le encanta el 梅菜扣肉 en Año Nuevo, así que lo dejaremos para ocasiones especiales. Con el repollo le ha ido bien.',
    },
  },
  {
    from: 'dietitian', daysAgo: 2, h: 10, m: 5,
    text: {
      en: 'That sounds like a good plan. A small portion at a celebration is something we can talk through together. Please bring her latest lab printout to our follow-up video visit.',
      zh: '這個安排很好。節日時吃一小份，我們可以一起商量。下次視像覆診時，請帶上她最新的化驗報告。',
      es: 'Me parece un buen plan. Una porción pequeña en una celebración es algo que podemos hablar juntas. Por favor trae sus análisis más recientes a nuestra videoconsulta de seguimiento.',
    },
  },
];

export const exampleQuestions = [
  {
    en: 'Can Mom have a small bowl of Sunday pork bone soup (老火湯)?',
    zh: '媽媽星期日可以喝一小碗豬骨老火湯嗎？',
    es: '¿Puede mamá tomar un plato pequeño de la sopa de hueso de cerdo del domingo (老火湯)?',
  },
  {
    en: 'Mom’s ankles look more swollen and she gets short of breath on the stairs.',
    zh: '媽媽的腳踝好像更腫了，上樓梯時會氣喘。',
    es: 'Los tobillos de mamá se ven más hinchados y le falta el aire al subir escaleras.',
  },
  {
    en: 'Can we move her follow-up to a morning next week?',
    zh: '可以把她的覆診改到下星期的早上嗎？',
    es: '¿Podemos cambiar su cita de seguimiento a una mañana de la próxima semana?',
  },
];

const withMei = 'Mei Chen, RD';
const followUp = { en: 'Nutrition follow-up', zh: '營養覆診', es: 'Seguimiento de nutrición' };
const video = { en: 'Video visit', zh: '視像覆診', es: 'Videoconsulta' };
const inPerson = { en: 'In person', zh: '親身到診', es: 'En persona' };

// Visits are positioned relative to today so the workspace always looks current.
export const visits = {
  upcoming: [
    { id: 'v-follow', daysFromNow: 9, hour: 10, minute: 30, title: followUp, with: withMei, mode: video, video: true, minutes: 30 },
    { id: 'v-labs', daysFromNow: 23, hour: 8, minute: 15, title: { en: 'Blood draw for kidney labs', zh: '腎功能抽血化驗', es: 'Análisis de sangre renal' }, with: { en: 'Eastbay Lab, Shattuck Ave', zh: 'Eastbay 化驗所，Shattuck Ave', es: 'Laboratorio Eastbay, Shattuck Ave' }, mode: inPerson, minutes: 15 },
  ],
  past: [
    { id: 'v-intro', daysFromNow: -28, hour: 14, minute: 0, title: { en: 'First nutrition consult', zh: '首次營養諮詢', es: 'Primera consulta de nutrición' }, with: withMei, mode: video, video: true, minutes: 45,
      note: { en: 'Set daily targets; agreed to swap preserved vegetables for fresh greens.', zh: '訂立每日目標；同意以新鮮蔬菜代替醃菜。', es: 'Se fijaron metas diarias; acordamos cambiar verduras en conserva por verduras frescas.' } },
    { id: 'v-neph', daysFromNow: -74, hour: 11, minute: 0, title: { en: 'Kidney check-up', zh: '腎科檢查', es: 'Revisión renal' }, with: { en: 'Dr. Lau, Nephrology', zh: '劉醫生，腎科', es: 'Dr. Lau, Nefrología' }, mode: inPerson, minutes: 30,
      note: { en: 'eGFR 39. Referred to a renal dietitian.', zh: 'eGFR 39，轉介腎病營養師。', es: 'eGFR 39. Referida a una dietista renal.' } },
  ],
  newVisit: { with: withMei, mode: video, video: true },
};

export const careCircle = [
  { name: 'Fung', tone: 'teal', detail: { en: 'Mom · 78 · CKD stage G3b', zh: '媽媽 · 78 歲 · 慢性腎病 G3b 期', es: 'Mamá · 78 · ERC etapa G3b' }, role: { en: 'Patient', zh: '病人', es: 'Paciente' } },
  { name: 'Heidi', tone: 'clay', detail: { en: 'Daughter · manages meals and visits', zh: '女兒 · 負責飲食和覆診', es: 'Hija · organiza comidas y citas' }, role: { en: 'Primary caregiver (you)', zh: '主要照顧者（你）', es: 'Cuidadora principal (tú)' } },
  { name: 'Joyce', tone: 'plain', viewOnly: true, detail: { en: 'Daughter · can see plans and messages', zh: '女兒 · 可查看餐單和訊息', es: 'Hija · puede ver planes y mensajes' }, role: { en: 'View-only', zh: '只可查看', es: 'Solo lectura' } },
  { name: 'Mei Chen, RD', tone: 'clay', initials: 'MC', detail: { en: 'Renal dietitian · Cantonese and English', zh: '腎病營養師 · 粵語及英語', es: 'Dietista renal · cantonés e inglés' }, role: { en: 'Care team', zh: '醫療團隊', es: 'Equipo de salud' } },
];

// Lab history. Points are [year, month] so labels follow the reader's language.
export const trends = [
  {
    key: 'egfr', label: 'eGFR', unit: 'mL/min',
    explain: { en: 'Kidney filtering. Higher is better; steady is the goal.', zh: '腎臟過濾功能。越高越好，目標是保持穩定。', es: 'Filtrado del riñón. Más alto es mejor; la meta es mantenerlo estable.' },
    band: { low: 30, high: 44, label: { en: 'Stage G3b range (30–44)', zh: 'G3b 期範圍（30–44）', es: 'Rango de etapa G3b (30–44)' } },
    domain: [28, 48],
    points: [[2025, 10, 44], [2026, 1, 41], [2026, 5, 39], [2026, 9, 38]],
  },
  {
    key: 'k', label: { en: 'Potassium', zh: '鉀', es: 'Potasio' }, unit: 'mmol/L',
    explain: { en: 'Too high can affect the heart rhythm.', zh: '過高可能影響心律。', es: 'Si está muy alto puede afectar el ritmo del corazón.' },
    band: { low: 3.5, high: 5.0, label: { en: 'Goal 3.5–5.0', zh: '目標 3.5–5.0', es: 'Meta 3.5–5.0' } },
    domain: [3.2, 5.6],
    points: [[2025, 10, 4.3], [2026, 1, 4.8], [2026, 5, 5.2], [2026, 9, 4.6]],
  },
  {
    key: 'p', label: { en: 'Phosphorus', zh: '磷', es: 'Fósforo' }, unit: 'mg/dL',
    explain: { en: 'Too high over time can weaken bones.', zh: '長期過高會令骨骼變弱。', es: 'Si se mantiene alto puede debilitar los huesos.' },
    band: { low: 2.5, high: 4.5, label: { en: 'Goal 2.5–4.5', zh: '目標 2.5–4.5', es: 'Meta 2.5–4.5' } },
    domain: [2.2, 5],
    points: [[2025, 10, 3.8], [2026, 1, 4.2], [2026, 5, 4.6], [2026, 9, 4.3]],
  },
];

export const labDate = [2026, 9, 18];
const inRange = { en: 'In range', zh: '正常範圍', es: 'En rango' };
const below = { en: 'Below range', zh: '低於範圍', es: 'Por debajo' };
export const labs = [
  { name: 'eGFR', what: { en: 'Kidney filtering', zh: '腎臟過濾功能', es: 'Filtrado del riñón' }, value: '38', unit: 'mL/min', range: { en: '60 or more', zh: '60 或以上', es: '60 o más' }, status: 'low', statusText: below, note: { en: 'Expected for stage G3b', zh: '符合 G3b 期', es: 'Esperado en etapa G3b' } },
  { name: { en: 'Creatinine', zh: '肌酸酐', es: 'Creatinina' }, what: { en: 'Waste the kidneys clear', zh: '由腎臟清除的廢物', es: 'Desecho que limpian los riñones' }, value: '1.4', unit: 'mg/dL', range: '0.5–1.1', status: 'high', statusText: { en: 'Above range', zh: '高於範圍', es: 'Por encima' } },
  { name: { en: 'Potassium', zh: '鉀', es: 'Potasio' }, what: { en: 'Mineral in many fruits and vegetables', zh: '很多蔬果都含有的礦物質', es: 'Mineral de muchas frutas y verduras' }, value: '4.6', unit: 'mmol/L', range: '3.5–5.0', status: 'ok', statusText: inRange, note: { en: 'Down from 5.2 in May', zh: '由五月的 5.2 回落', es: 'Bajó de 5.2 en mayo' } },
  { name: { en: 'Phosphorus', zh: '磷', es: 'Fósforo' }, what: { en: 'Mineral in dairy, nuts, additives', zh: '奶類、果仁和添加劑中的礦物質', es: 'Mineral en lácteos, nueces y aditivos' }, value: '4.3', unit: 'mg/dL', range: '2.5–4.5', status: 'near', statusText: { en: 'Near upper limit', zh: '接近上限', es: 'Cerca del límite' } },
  { name: { en: 'Sodium', zh: '鈉', es: 'Sodio' }, what: { en: 'Salt balance', zh: '鹽分平衡', es: 'Equilibrio de sal' }, value: '139', unit: 'mmol/L', range: '135–145', status: 'ok', statusText: inRange },
  { name: { en: 'Bicarbonate', zh: '碳酸氫鹽', es: 'Bicarbonato' }, what: { en: 'Acid balance', zh: '酸鹼平衡', es: 'Equilibrio ácido' }, value: '23', unit: 'mmol/L', range: '22–29', status: 'ok', statusText: inRange },
  { name: { en: 'Albumin', zh: '白蛋白', es: 'Albúmina' }, what: { en: 'Protein and nutrition', zh: '蛋白質與營養', es: 'Proteína y nutrición' }, value: '3.8', unit: 'g/dL', range: '3.5–5.0', status: 'ok', statusText: inRange },
  { name: { en: 'Hemoglobin', zh: '血紅素', es: 'Hemoglobina' }, what: { en: 'Red blood cells', zh: '紅血球', es: 'Glóbulos rojos' }, value: '11.6', unit: 'g/dL', range: '12.0–15.5', status: 'low', statusText: below, note: { en: 'Ask about anemia in CKD', zh: '可向醫生查詢腎病貧血', es: 'Pregunta por la anemia en la ERC' } },
];

export const swaps = [
  { cuisine: 'chinese',
    limit: { en: 'Regular soy sauce', zh: '普通豉油', es: 'Salsa de soya normal' },
    choose: { en: 'Low-sodium soy, measured with a teaspoon, or diluted 1:1 with rice vinegar', zh: '低鈉豉油，用茶匙量；或以米醋 1:1 稀釋', es: 'Soya baja en sodio, medida con cucharadita, o diluida 1:1 con vinagre de arroz' } },
  { cuisine: 'chinese',
    limit: { en: 'Oyster sauce and chicken bouillon powder', zh: '蠔油和雞粉', es: 'Salsa de ostión y consomé de pollo en polvo' },
    choose: { en: 'Ginger-scallion oil, garlic, white pepper and a little rice wine', zh: '薑蔥油、蒜、白胡椒和少許米酒', es: 'Aceite de jengibre y cebollín, ajo, pimienta blanca y un poco de vino de arroz' } },
  { cuisine: 'chinese',
    limit: { en: 'Preserved vegetables (梅菜, 榨菜, salted mustard greens)', zh: '醃菜（梅菜、榨菜、鹹酸菜）', es: 'Verduras en conserva (梅菜, 榨菜, mostaza salada)' },
    choose: { en: 'Fresh choy sum, napa cabbage, or cucumber quick-pickled in unsalted rice vinegar', zh: '新鮮菜心、紹菜，或用無鹽米醋醃的青瓜', es: 'Choy sum fresco, col china o pepino encurtido en vinagre de arroz sin sal' } },
  { cuisine: 'chinese',
    limit: { en: 'Long-boiled bone soup (老火湯)', zh: '豬骨老火湯', es: 'Sopa de hueso de larga cocción (老火湯)' },
    choose: { en: 'Light homemade stock, simmered under an hour, skimmed and unsalted', zh: '自家清湯，煲不超過一小時，撇去浮油，不加鹽', es: 'Caldo casero ligero, menos de una hora, desgrasado y sin sal' } },
  { cuisine: 'chinese',
    limit: { en: 'Dried shrimp, dried scallop, salted fish', zh: '蝦米、瑤柱、鹹魚', es: 'Camarón seco, vieira seca, pescado salado' },
    choose: { en: 'A few fresh shrimp or fresh fish, with ginger and garlic for depth', zh: '少量鮮蝦或鮮魚，以薑蒜提味', es: 'Unos camarones o pescado fresco, con jengibre y ajo' } },
  { cuisine: 'chinese',
    limit: { en: 'Star fruit (楊桃)', zh: '楊桃', es: 'Carambola (楊桃)' },
    choose: { en: 'Avoid completely. Pear, apple, grapes or pineapple instead', zh: '完全避免，改吃梨、蘋果、提子或菠蘿', es: 'Evítala por completo. Mejor pera, manzana, uvas o piña' } },
  { cuisine: 'chinese',
    limit: { en: 'Brown rice and multigrain rice', zh: '糙米和雜糧飯', es: 'Arroz integral y multigrano' },
    choose: { en: 'White jasmine rice', zh: '白香米', es: 'Arroz jazmín blanco' } },
  { cuisine: 'korean',
    limit: { en: 'Kimchi as a full side dish', zh: '整碟泡菜', es: 'Kimchi como guarnición completa' },
    choose: { en: 'Two tablespoons of rinsed kimchi, or fresh cucumber muchim with less salt', zh: '兩湯匙沖洗過的泡菜，或少鹽涼拌青瓜', es: 'Dos cucharadas de kimchi enjuagado, o pepino fresco con menos sal' } },
  { cuisine: 'korean',
    limit: { en: 'Doenjang and gochujang in stews', zh: '燉湯裏的大醬和辣椒醬', es: 'Doenjang y gochujang en guisos' },
    choose: { en: 'Half the paste, with more garlic, onion and zucchini', zh: '醬料減半，多加蒜、洋蔥和翠玉瓜', es: 'La mitad de la pasta, con más ajo, cebolla y calabacita' } },
  { cuisine: 'vietnamese',
    limit: { en: 'Fish sauce (nước mắm) straight', zh: '直接用魚露', es: 'Salsa de pescado (nước mắm) sola' },
    choose: { en: 'Nước chấm with lime, water, garlic and about 1 teaspoon of fish sauce', zh: '用青檸、水、蒜和約 1 茶匙魚露調成蘸汁', es: 'Nước chấm con limón, agua, ajo y 1 cucharadita de salsa de pescado' } },
  { cuisine: 'vietnamese',
    limit: { en: 'Long-simmered beef bone pho broth', zh: '長時間熬煮的牛骨河粉湯', es: 'Caldo de pho de hueso de res de larga cocción' },
    choose: { en: 'Lighter broth with charred ginger, onion and star anise; drink half the bowl', zh: '用烤薑、洋蔥和八角煮清湯，湯只喝一半', es: 'Caldo ligero con jengibre asado, cebolla y anís estrella; toma la mitad' } },
  { cuisine: 'vietnamese',
    limit: { en: 'Banana and coconut water', zh: '香蕉和椰子水', es: 'Plátano y agua de coco' },
    choose: { en: 'Apple, pineapple or longan; plain water or jasmine tea', zh: '蘋果、菠蘿或龍眼；清水或香片茶', es: 'Manzana, piña o longan; agua natural o té de jazmín' } },
];

const g = (en, zh, es) => ({ en, zh, es });
export const grocery = [
  { aisle: g('Produce', '蔬果', 'Frutas y verduras'), items: [
    g('Green cabbage, 1 head', '椰菜 1 個', 'Repollo, 1 pieza'), g('Napa cabbage, 1 head', '紹菜 1 棵', 'Col china, 1 pieza'), g('Winter melon, 1 wedge', '冬瓜 1 件', 'Melón de invierno, 1 trozo'),
    g('Scallions, 2 bunches', '蔥 2 紮', 'Cebollín, 2 manojos'), g('Fresh ginger, 1 large knob', '鮮薑 1 大塊', 'Jengibre fresco, 1 trozo grande'), g('Garlic, 1 bulb', '蒜頭 1 個', 'Ajo, 1 cabeza'),
    g('Bean sprouts, 1 bag', '芽菜 1 包', 'Germinado de soya, 1 bolsa'), g('Snow peas, 200 g', '荷蘭豆 200 克', 'Chícharos chinos, 200 g'), g('Choy sum, 1 bunch', '菜心 1 紮', 'Choy sum, 1 manojo'),
    g('Pears, 3', '雪梨 3 個', 'Peras, 3'), g('Apples, 3', '蘋果 3 個', 'Manzanas, 3'), g('Grapes, 1 small bag', '提子 1 小包', 'Uvas, 1 bolsa chica'), g('Pineapple, 1 small', '菠蘿 1 個（小）', 'Piña, 1 pequeña'),
  ] },
  { aisle: g('Meat & seafood', '肉類及海鮮', 'Carnes y mariscos'), items: [
    g('Chicken thighs, skinless, 1 kg', '去皮雞髀 1 公斤', 'Muslos de pollo sin piel, 1 kg'), g('Whole sea bass, 2', '鱸魚 2 條', 'Lubina entera, 2'),
    g('Fish fillet for congee, 200 g', '魚柳（煲粥用）200 克', 'Filete de pescado para congee, 200 g'), g('Lean minced pork, 250 g', '瘦免治豬肉 250 克', 'Cerdo molido magro, 250 g'),
  ] },
  { aisle: g('Refrigerated', '冷藏', 'Refrigerados'), items: [
    g('Eggs, 1 dozen', '雞蛋 1 打', 'Huevos, 1 docena'), g('Firm tofu, 1 small block', '硬豆腐 1 小盒', 'Tofu firme, 1 bloque chico'), g('Fresh rice noodle sheets', '新鮮腸粉皮', 'Láminas de fideo de arroz frescas'),
  ] },
  { aisle: g('Rice, noodles & pantry', '米、麵及乾貨', 'Arroz, fideos y despensa'), items: [
    g('White jasmine rice', '白香米', 'Arroz jazmín blanco'), g('Thin egg noodles (lo mein)', '幼蛋麵（撈麵用）', 'Fideos de huevo delgados (lo mein)'), g('Glass noodles', '粉絲', 'Fideos de cristal'),
    g('Low-sodium soy sauce', '低鈉豉油', 'Salsa de soya baja en sodio'), g('Rice vinegar', '米醋', 'Vinagre de arroz'), g('Toasted sesame oil', '麻油', 'Aceite de ajonjolí tostado'),
    g('Ground white pepper', '白胡椒粉', 'Pimienta blanca molida'), g('Unsalted rice crackers', '無鹽米餅', 'Galletas de arroz sin sal'),
  ] },
];

export const recipeExamples = [
  { label: { en: 'Mom’s lo mein', zh: '媽媽的撈麵', es: 'El lo mein de mamá' }, dish: { en: 'Mom’s lo mein with soy sauce, oyster sauce and char siu', zh: '媽媽的叉燒撈麵，用豉油和蠔油', es: 'El lo mein de mamá con salsa de soya, salsa de ostión y char siu' }, cuisine: 'chinese' },
  { label: { en: 'Steamed pork with salted fish', zh: '鹹魚蒸肉餅', es: 'Cerdo al vapor con pescado salado' }, dish: { en: 'Steamed minced pork with salted fish (鹹魚蒸肉餅)', zh: '鹹魚蒸肉餅', es: 'Cerdo molido al vapor con pescado salado (鹹魚蒸肉餅)' }, cuisine: 'chinese' },
  { label: { en: 'Winter melon pork bone soup', zh: '冬瓜豬骨湯', es: 'Sopa de melón de invierno con hueso de cerdo' }, dish: { en: 'Winter melon soup with pork bones, dried scallop and salt', zh: '冬瓜瑤柱豬骨湯', es: 'Sopa de melón de invierno con hueso de cerdo, vieira seca y sal' }, cuisine: 'chinese' },
  { label: { en: 'Vietnamese pho', zh: '越南牛肉河粉', es: 'Pho vietnamita' }, dish: { en: 'Vietnamese beef pho with fish sauce and bone broth', zh: '越南牛肉河粉，用魚露和牛骨湯', es: 'Pho vietnamita de res con salsa de pescado y caldo de hueso' }, cuisine: 'vietnamese' },
];
