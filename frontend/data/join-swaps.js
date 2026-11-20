// The swap-guide preview on /join: 6 dishes from FuelWell's swap catalog (data/swap_catalog.csv),
// chosen so the three kidney nutrients (sodium, potassium, phosphorus) each show up in real food.
// Potassium advice always says "if your care team limits potassium" (KDOQI 2020 and NKF: limit it
// only when labs call for it). Photos come from swap-photos.js and are credited on each card.
// `watch` uses the catalog's nutrient codes. The full guide (70 swaps) is Meals > Browse swaps.

// Plain-language explanations of each nutrient, written from NKF patient education
// ("Sodium and your CKD diet", "Potassium in your CKD diet", "Phosphorus and your CKD diet").
export const NUTRIENTS = {
  Na: {
    symbol: 'Na',
    en: { name: 'Sodium', where: 'Soy and fish sauce, broth, canned and restaurant food', body: 'Raises blood pressure and makes the body hold fluid, which strains the heart and kidneys.' },
    'zh-Hans': { name: '钠', where: '酱油、鱼露、汤底、罐头和餐馆食物', body: '会让血压升高，身体积水，加重心脏和肾脏的负担。' },
    'zh-Hant': { name: '鈉', where: '醬油、魚露、湯底、罐頭和餐廳食物', body: '會讓血壓升高，身體積水，加重心臟和腎臟的負擔。' },
    es: { name: 'Sodio', where: 'Salsa de soya y de pescado, caldos, comida enlatada y de restaurante', body: 'Sube la presión y hace que el cuerpo retenga líquido, lo que cansa al corazón y a los riñones.' },
  },
  K: {
    symbol: 'K',
    en: { name: 'Potassium', where: 'Potatoes, spinach, bananas, oranges, beans, long-simmered soup', body: 'Weak kidneys may not clear it, and a high blood level can affect the heartbeat. Limit it only if your labs and care team say so.' },
    'zh-Hans': { name: '钾', where: '土豆、菠菜、香蕉、橙、豆类、老火汤', body: '肾功能弱时可能排不掉，血钾太高会影响心跳。只有化验结果和医疗团队要求时才需要限制。' },
    'zh-Hant': { name: '鉀', where: '馬鈴薯、菠菜、香蕉、橙、豆類、老火湯', body: '腎功能弱時可能排不掉，血鉀太高會影響心跳。只有驗血結果和醫療團隊要求時才需要限制。' },
    es: { name: 'Potasio', where: 'Papa, espinaca, plátano, naranja, frijoles, caldos de larga cocción', body: 'Los riñones débiles quizá no lo eliminen, y un nivel alto en la sangre puede afectar el ritmo del corazón. Limítalo solo si tus análisis y tu equipo médico lo indican.' },
  },
  P: {
    symbol: 'P',
    en: { name: 'Phosphorus', where: 'Cheese, dark cola, processed meat, “phos” additives', body: 'Builds up when kidneys slow down and pulls calcium from bones. The body absorbs additive phosphorus most easily.' },
    'zh-Hans': { name: '磷', where: '芝士、深色可乐、加工肉、名称带“磷酸”的添加剂', body: '肾功能下降时会在体内积累，并从骨骼中带走钙。添加剂里的磷最容易被吸收。' },
    'zh-Hant': { name: '磷', where: '起司、深色可樂、加工肉品、名稱帶「磷酸」的添加劑', body: '腎功能下降時會在體內累積，並從骨骼中帶走鈣。添加劑裡的磷最容易被吸收。' },
    es: { name: 'Fósforo', where: 'Queso, refrescos de cola, carnes procesadas, aditivos con “fosf”', body: 'Se acumula cuando los riñones trabajan menos y saca calcio de los huesos. El de los aditivos es el que más se absorbe.' },
  },
};

export const joinSwaps = [
  {
    kind: 'home', watch: ['K', 'Na'], photo: 'Potato curry or palak (spinach) with dal',
    en: { meal: 'Potato curry or palak with dal', cuisine: 'Indian', swap: 'Keep the spices, lemon and dal. If your care team limits potassium, use cauliflower, cabbage or green beans in place of potato or spinach.', why: 'Potatoes, spinach and lentils are some of the highest-potassium foods in the kitchen.', portion: 'Rice or roti, one vegetable dish, and dal in a small bowl.' },
    'zh-Hans': { meal: '土豆咖喱或菠菜配扁豆（dal）', cuisine: '印度', swap: '保留香料、柠檬和扁豆。如果医疗团队要你限钾，用花椰菜、卷心菜或四季豆代替土豆或菠菜。', why: '土豆、菠菜和扁豆是厨房里含钾最高的食物之一。', portion: '米饭或薄饼、一道蔬菜，扁豆用小碗装。' },
    'zh-Hant': { meal: '馬鈴薯咖哩或菠菜配扁豆（dal）', cuisine: '印度', swap: '保留香料、檸檬和扁豆。如果醫療團隊要你限鉀，用花椰菜、高麗菜或四季豆代替馬鈴薯或菠菜。', why: '馬鈴薯、菠菜和扁豆是廚房裡含鉀最高的食物之一。', portion: '白飯或薄餅、一道蔬菜，扁豆用小碗裝。' },
    es: { meal: 'Curry de papa o palak con dal', cuisine: 'India', swap: 'Conserva las especias, el limón y el dal. Si tu equipo médico limita el potasio, usa coliflor, repollo o ejotes en lugar de papa o espinaca.', why: 'La papa, la espinaca y las lentejas están entre los alimentos con más potasio.', portion: 'Arroz o roti, un plato de verdura y el dal en un tazón pequeño.' },
  },
  {
    kind: 'home', watch: ['Na', 'K'], photo: 'Cantonese slow-cooked soup (lo foh tong)',
    en: { meal: 'Slow-cooked soup (lo foh tong)', cuisine: 'Cantonese', swap: 'Have a small bowl, eat the meat and vegetables from the pot, and salt lightly at the table. Ask your care team before adding medicinal herbs.', why: 'Hours of simmering pull potassium and salt out of the ingredients and into the broth.', portion: 'A small rice bowl of soup, not a big bowl.' },
    'zh-Hans': { meal: '老火汤', cuisine: '广东', swap: '喝一小碗，吃锅里的肉和菜，上桌后再少量加盐。加药材前先问医疗团队。', why: '长时间熬煮会把食材里的钾和盐都溶进汤里。', portion: '一小饭碗的汤，不要用大碗。' },
    'zh-Hant': { meal: '老火湯', cuisine: '廣東', swap: '喝一小碗，吃鍋裡的肉和菜，上桌後再少量加鹽。加藥材前先問醫療團隊。', why: '長時間熬煮會把食材裡的鉀和鹽都溶進湯裡。', portion: '一小飯碗的湯，不要用大碗。' },
    es: { meal: 'Sopa cantonesa de larga cocción (lo foh tong)', cuisine: 'Cantonesa', swap: 'Toma un tazón pequeño, come la carne y las verduras de la olla y sala poco en la mesa. Consulta a tu equipo médico antes de agregar hierbas medicinales.', why: 'Horas de hervor sacan el potasio y la sal de los ingredientes hacia el caldo.', portion: 'Un tazón de arroz pequeño de sopa, no uno grande.' },
  },
  {
    kind: 'packaged', watch: ['P'], photo: 'Cola or dark soda',
    en: { meal: 'Cola or dark soda', cuisine: 'Any', swap: 'Sparkling water with lime, or unsweetened iced tea.', why: 'Dark colas get their tang from phosphoric acid, the form of phosphorus the body absorbs almost completely.', portion: 'If you have a soda, a small can, not a large cup.' },
    'zh-Hans': { meal: '可乐或深色汽水', cuisine: '不限', swap: '加青柠的气泡水，或无糖冰茶。', why: '深色可乐的酸味来自磷酸，这种磷几乎会被身体完全吸收。', portion: '想喝汽水时，选小罐，不要大杯。' },
    'zh-Hant': { meal: '可樂或深色汽水', cuisine: '不限', swap: '加萊姆的氣泡水，或無糖冰茶。', why: '深色可樂的酸味來自磷酸，這種磷幾乎會被身體完全吸收。', portion: '想喝汽水時，選小罐，不要大杯。' },
    es: { meal: 'Refresco de cola u oscuro', cuisine: 'Cualquiera', swap: 'Agua mineral con limón o té helado sin azúcar.', why: 'Las colas oscuras deben su sabor ácido al ácido fosfórico, un fósforo que el cuerpo absorbe casi por completo.', portion: 'Si tomas refresco, una lata pequeña, no un vaso grande.' },
  },
  {
    kind: 'home', watch: ['Na', 'P', 'K'], photo: 'Enchiladas with canned sauce and cheese',
    en: { meal: 'Enchiladas with canned sauce and cheese', cuisine: 'Mexican', swap: 'Make the sauce from dried chiles and garlic, use half the cheese, rinse canned beans, and serve with cabbage slaw.', why: 'Canned sauce brings the sodium, cheese brings the phosphorus, and rinsing beans lowers both sodium and potassium.', portion: 'Two enchiladas with a big scoop of slaw instead of three.' },
    'zh-Hans': { meal: '罐装酱汁加芝士的墨西哥卷饼（Enchiladas）', cuisine: '墨西哥', swap: '用干辣椒和蒜自己做酱汁，芝士减半，罐头豆子先冲洗，配凉拌卷心菜。', why: '罐装酱汁带来钠，芝士带来磷，冲洗豆子能同时减少钠和钾。', portion: '两个卷饼配一大勺凉拌菜，不要吃三个。' },
    'zh-Hant': { meal: '罐裝醬汁加起司的墨西哥捲餅（Enchiladas）', cuisine: '墨西哥', swap: '用乾辣椒和蒜自己做醬汁，起司減半，罐頭豆子先沖洗，配涼拌高麗菜。', why: '罐裝醬汁帶來鈉，起司帶來磷，沖洗豆子能同時減少鈉和鉀。', portion: '兩個捲餅配一大勺涼拌菜，不要吃三個。' },
    es: { meal: 'Enchiladas con salsa de lata y queso', cuisine: 'Mexicana', swap: 'Haz la salsa con chiles secos y ajo, usa la mitad del queso, enjuaga los frijoles de lata y sírvelas con ensalada de repollo.', why: 'La salsa de lata aporta el sodio, el queso el fósforo, y enjuagar los frijoles baja el sodio y el potasio.', portion: 'Dos enchiladas con una buena porción de ensalada en vez de tres.' },
  },
  {
    kind: 'packaged', watch: ['Na', 'P'], photo: 'Store-bought rotisserie chicken',
    en: { meal: 'Store-bought rotisserie chicken', cuisine: 'American', swap: 'Pull off the skin, or roast your own with lemon, garlic and herbs. On the label, look for “solution” or “broth” added to the meat.', why: 'Many store chickens are injected with salt water and phosphate additives to stay juicy.', portion: 'Keep your usual amount of chicken; take the skin off.' },
    'zh-Hans': { meal: '超市烤鸡', cuisine: '美式', swap: '去掉鸡皮，或自己用柠檬、蒜和香草烤。看标签上是否写着肉里加了“溶液”或“高汤”。', why: '很多超市烤鸡都注射了盐水和磷酸盐添加剂来保持多汁。', portion: '鸡肉照平常的份量吃，去掉鸡皮。' },
    'zh-Hant': { meal: '超市烤雞', cuisine: '美式', swap: '去掉雞皮，或自己用檸檬、蒜和香草烤。看標籤上是否寫著肉裡加了「溶液」或「高湯」。', why: '很多超市烤雞都注射了鹽水和磷酸鹽添加劑來保持多汁。', portion: '雞肉照平常的份量吃，去掉雞皮。' },
    es: { meal: 'Pollo rostizado de supermercado', cuisine: 'Estadounidense', swap: 'Quítale la piel o ásalo en casa con limón, ajo y hierbas. En la etiqueta, busca “solución” o “caldo” añadido a la carne.', why: 'Muchos pollos de tienda se inyectan con agua salada y aditivos de fosfato para que queden jugosos.', portion: 'Come tu porción habitual de pollo, sin la piel.' },
  },
  {
    kind: 'home', watch: ['Na'], photo: 'Stir-fry with soy sauce and oyster sauce',
    en: { meal: 'Stir-fry with soy sauce and oyster sauce', cuisine: 'Chinese', swap: 'Use about half the sauce and add garlic, ginger, chili and a splash of rice vinegar. Add the sauce at the end so it stays on the surface.', why: 'One tablespoon of regular soy sauce holds a large share of a day’s sodium; aromatics bring flavor without it.', portion: 'Half the plate vegetables, then the meat or tofu, then rice.' },
    'zh-Hans': { meal: '酱油蚝油小炒', cuisine: '中式', swap: '酱汁减半，多加蒜、姜、辣椒和少许米醋。最后才下酱汁，让味道留在表面。', why: '一汤匙普通酱油就占了一天钠摄入的一大部分；蒜姜等香料不用盐也有味道。', portion: '半碟蔬菜，再来肉或豆腐，然后才是米饭。' },
    'zh-Hant': { meal: '醬油蠔油小炒', cuisine: '中式', swap: '醬汁減半，多加蒜、薑、辣椒和少許米醋。最後才下醬汁，讓味道留在表面。', why: '一湯匙普通醬油就佔了一天鈉攝取的一大部分；蒜薑等辛香料不用鹽也有味道。', portion: '半盤蔬菜，再來肉或豆腐，然後才是白飯。' },
    es: { meal: 'Salteado con salsa de soya y de ostión', cuisine: 'China', swap: 'Usa la mitad de la salsa y agrega ajo, jengibre, chile y un chorrito de vinagre de arroz. Pon la salsa al final para que quede en la superficie.', why: 'Una cucharada de soya normal tiene buena parte del sodio de un día; los aromáticos dan sabor sin él.', portion: 'Medio plato de verduras, luego la carne o el tofu, luego el arroz.' },
  },
];
