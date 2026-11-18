// The swap guide on /join: 12 examples from FuelWell's swap catalog (data/swap_catalog.csv),
// chosen because the advice cuts salt or sugar and is safe whether someone manages high blood
// pressure, diabetes or kidney disease. Anything that depends on a care team's potassium or
// phosphorus limits is left out. Photos come from swap-photos.js (Unsplash, credited on each card).
// `photo` is the catalog meal name used as the key in swapPhotos.

export const SWAP_KINDS = ['home', 'takeout', 'packaged'];

export const joinSwaps = [
  {
    kind: 'home', tag: 'salt', photo: 'Stir-fry with soy sauce and oyster sauce',
    en: { meal: 'Stir-fry with soy sauce and oyster sauce', cuisine: 'Chinese', swap: 'Use about half the sauce and add garlic, ginger, chili and a splash of rice vinegar. Add the sauce at the end so it stays on the surface.', why: 'Fresh aromatics bring the flavor without the salt.' },
    'zh-Hans': { meal: '酱油蚝油小炒', cuisine: '中式', swap: '酱汁减半，多加蒜、姜、辣椒和少许米醋。最后才下酱汁，让味道留在表面。', why: '新鲜的香料就能带出味道，不需要那么多盐。' },
    'zh-Hant': { meal: '醬油蠔油小炒', cuisine: '中式', swap: '醬汁減半，多加蒜、薑、辣椒和少許米醋。最後才下醬汁，讓味道留在表面。', why: '新鮮的辛香料就能帶出味道，不需要那麼多鹽。' },
    es: { meal: 'Salteado con salsa de soya y de ostión', cuisine: 'China', swap: 'Usa la mitad de la salsa y agrega ajo, jengibre, chile y un chorrito de vinagre de arroz. Pon la salsa al final para que quede en la superficie.', why: 'Los aromáticos frescos dan sabor sin tanta sal.' },
  },
  {
    kind: 'home', tag: 'salt', photo: 'Chicken adobo',
    en: { meal: 'Chicken adobo', cuisine: 'Filipino', swap: 'Use half the soy sauce and more vinegar, garlic, bay leaf and black pepper. Serve with rice and sautéed cabbage.', why: 'Vinegar and garlic carry the flavor with less soy sauce.' },
    'zh-Hans': { meal: '菲律宾醋卤鸡（Adobo）', cuisine: '菲律宾', swap: '酱油减半，多放醋、蒜、月桂叶和黑胡椒。配米饭和炒卷心菜。', why: '醋和蒜撑起味道，酱油就可以少放。' },
    'zh-Hant': { meal: '菲律賓醋滷雞（Adobo）', cuisine: '菲律賓', swap: '醬油減半，多放醋、蒜、月桂葉和黑胡椒。配白飯和炒高麗菜。', why: '醋和蒜撐起味道，醬油就可以少放。' },
    es: { meal: 'Adobo de pollo', cuisine: 'Filipina', swap: 'Usa la mitad de la salsa de soya y más vinagre, ajo, laurel y pimienta negra. Sírvelo con arroz y repollo salteado.', why: 'El vinagre y el ajo dan el sabor con menos soya.' },
  },
  {
    kind: 'home', tag: 'salt', photo: 'Congee with salted egg and pickled vegetables',
    en: { meal: 'Congee with salted egg and pickles', cuisine: 'Chinese', swap: 'Plain congee with a fresh egg, ginger, scallion and white pepper. Keep pickles to a spoonful on the side.', why: 'The salted egg and pickles carry most of the salt.' },
    'zh-Hans': { meal: '咸蛋咸菜粥', cuisine: '中式', swap: '白粥配新鲜鸡蛋、姜丝、葱花和白胡椒。咸菜只放一小匙在旁边。', why: '大部分的盐来自咸蛋和咸菜。' },
    'zh-Hant': { meal: '鹹蛋鹹菜粥', cuisine: '中式', swap: '白粥配新鮮雞蛋、薑絲、蔥花和白胡椒。鹹菜只放一小匙在旁邊。', why: '大部分的鹽來自鹹蛋和鹹菜。' },
    es: { meal: 'Congee con huevo salado y encurtidos', cuisine: 'China', swap: 'Congee sencillo con un huevo fresco, jengibre, cebollín y pimienta blanca. Deja los encurtidos en una cucharada aparte.', why: 'El huevo salado y los encurtidos tienen casi toda la sal.' },
  },
  {
    kind: 'home', tag: 'salt', photo: 'Enchiladas with canned sauce and cheese',
    en: { meal: 'Enchiladas with canned sauce and cheese', cuisine: 'Mexican', swap: 'Make the sauce from dried chiles and garlic, use half the cheese, and serve with a cabbage slaw.', why: 'Canned sauce and cheese are the biggest sources of salt.' },
    'zh-Hans': { meal: '罐装酱汁加芝士的墨西哥卷饼（Enchiladas）', cuisine: '墨西哥', swap: '用干辣椒和蒜自己做酱汁，芝士减半，配一份凉拌卷心菜。', why: '罐装酱汁和芝士是盐分的最大来源。' },
    'zh-Hant': { meal: '罐裝醬汁加起司的墨西哥捲餅（Enchiladas）', cuisine: '墨西哥', swap: '用乾辣椒和蒜自己做醬汁，起司減半，配一份涼拌高麗菜。', why: '罐裝醬汁和起司是鹽分的最大來源。' },
    es: { meal: 'Enchiladas con salsa de lata y queso', cuisine: 'Mexicana', swap: 'Haz la salsa con chiles secos y ajo, usa la mitad del queso y sírvelas con ensalada de repollo.', why: 'La salsa de lata y el queso son lo que más sal aporta.' },
  },
  {
    kind: 'home', tag: 'salt', photo: 'Instant ramen',
    en: { meal: 'Instant ramen', cuisine: 'Asian', swap: 'Use a third to half of the seasoning packet. Add an egg, cabbage, bean sprouts and scallion.', why: 'The packet is where most of the salt is.' },
    'zh-Hans': { meal: '方便面', cuisine: '亚洲', swap: '调味包只放三分之一到一半。加一个鸡蛋、卷心菜、豆芽和葱。', why: '大部分的盐都在调味包里。' },
    'zh-Hant': { meal: '泡麵', cuisine: '亞洲', swap: '調味包只放三分之一到一半。加一顆蛋、高麗菜、豆芽和蔥。', why: '大部分的鹽都在調味包裡。' },
    es: { meal: 'Ramen instantáneo', cuisine: 'Asiática', swap: 'Usa de un tercio a la mitad del sobre de sazonador. Agrega un huevo, repollo, germinado de soya y cebollín.', why: 'Casi toda la sal está en el sobre.' },
  },
  {
    kind: 'takeout', tag: 'salt', photo: 'Pho',
    en: { meal: 'Pho', cuisine: 'Vietnamese', swap: 'Enjoy the noodles, meat and herbs, leave about half the broth, and add lime, basil and bean sprouts. Go light on hoisin.', why: 'Most of the salt is in the broth.' },
    'zh-Hans': { meal: '越南河粉', cuisine: '越南', swap: '吃河粉、肉和香草，汤留下一半左右，多加青柠、罗勒和豆芽。海鲜酱少放。', why: '大部分的盐都在汤里。' },
    'zh-Hant': { meal: '越南河粉', cuisine: '越南', swap: '吃河粉、肉和香草，湯留下一半左右，多加萊姆、九層塔和豆芽。海鮮醬少放。', why: '大部分的鹽都在湯裡。' },
    es: { meal: 'Pho', cuisine: 'Vietnamita', swap: 'Disfruta los fideos, la carne y las hierbas, deja más o menos la mitad del caldo y agrega limón, albahaca y germinado. Poca salsa hoisin.', why: 'Casi toda la sal está en el caldo.' },
  },
  {
    kind: 'takeout', tag: 'salt', photo: 'Fried chicken',
    en: { meal: 'Fried chicken', cuisine: 'American', swap: 'Grilled or roasted chicken with the skin off, with coleslaw or green beans.', why: 'The breading and skin hold most of the salt.' },
    'zh-Hans': { meal: '炸鸡', cuisine: '美式', swap: '改吃去皮的烤鸡，配凉拌卷心菜或四季豆。', why: '大部分的盐都在面衣和鸡皮上。' },
    'zh-Hant': { meal: '炸雞', cuisine: '美式', swap: '改吃去皮的烤雞，配涼拌高麗菜或四季豆。', why: '大部分的鹽都在麵衣和雞皮上。' },
    es: { meal: 'Pollo frito', cuisine: 'Estadounidense', swap: 'Pollo a la parrilla o al horno sin piel, con ensalada de repollo o ejotes.', why: 'El empanizado y la piel tienen casi toda la sal.' },
  },
  {
    kind: 'takeout', tag: 'salt', photo: 'Korean BBQ with kimchi',
    en: { meal: 'Korean BBQ with kimchi', cuisine: 'Korean', swap: 'Choose lightly marinated meat, wrap it in lettuce, and keep kimchi and dipping sauces to small portions.', why: 'Marinades, kimchi and ssamjang add up fast.' },
    'zh-Hans': { meal: '韩式烤肉配泡菜', cuisine: '韩式', swap: '选腌得较淡的肉，用生菜包着吃，泡菜和蘸酱只吃一点。', why: '腌料、泡菜和包饭酱加起来盐分很高。' },
    'zh-Hant': { meal: '韓式烤肉配泡菜', cuisine: '韓式', swap: '選醃得較淡的肉，用生菜包著吃，泡菜和沾醬只吃一點。', why: '醃料、泡菜和包飯醬加起來鹽分很高。' },
    es: { meal: 'Barbacoa coreana con kimchi', cuisine: 'Coreana', swap: 'Elige carne poco marinada, envuélvela en lechuga y come poco kimchi y pocas salsas.', why: 'Los marinados, el kimchi y el ssamjang suman mucha sal.' },
  },
  {
    kind: 'takeout', tag: 'salt', photo: 'Sushi with miso soup and soy sauce',
    en: { meal: 'Sushi with miso soup and soy sauce', cuisine: 'Japanese', swap: 'Skip the miso soup, dip lightly, and choose salmon, tuna or cucumber rolls with pickled ginger.', why: 'Miso and soy sauce carry most of the salt.' },
    'zh-Hans': { meal: '寿司配味噌汤和酱油', cuisine: '日式', swap: '不喝味噌汤，酱油轻轻蘸，选三文鱼、金枪鱼或黄瓜卷，配寿司姜。', why: '大部分的盐来自味噌和酱油。' },
    'zh-Hant': { meal: '壽司配味噌湯和醬油', cuisine: '日式', swap: '不喝味噌湯，醬油輕輕沾，選鮭魚、鮪魚或小黃瓜捲，配壽司薑。', why: '大部分的鹽來自味噌和醬油。' },
    es: { meal: 'Sushi con sopa miso y salsa de soya', cuisine: 'Japonesa', swap: 'No tomes la sopa miso, moja poco en la soya y elige rollos de salmón, atún o pepino con jengibre encurtido.', why: 'El miso y la soya tienen casi toda la sal.' },
  },
  {
    kind: 'takeout', tag: 'sugar', photo: 'Boba milk tea',
    en: { meal: 'Boba milk tea', cuisine: 'Taiwanese', swap: 'A smaller size at 25 to 50 percent sugar, with fewer pearls.', why: 'You keep the treat with much less sugar.' },
    'zh-Hans': { meal: '珍珠奶茶', cuisine: '台式', swap: '点小杯，三分糖或五分糖，珍珠少一点。', why: '一样能享受，糖却少很多。' },
    'zh-Hant': { meal: '珍珠奶茶', cuisine: '台式', swap: '點小杯，三分糖或半糖，珍珠少一點。', why: '一樣能享受，糖卻少很多。' },
    es: { meal: 'Té de leche con boba', cuisine: 'Taiwanesa', swap: 'Un tamaño más chico, con 25 a 50 por ciento de azúcar y menos perlas.', why: 'Sigues disfrutándolo con mucho menos azúcar.' },
  },
  {
    kind: 'packaged', tag: 'salt', photo: 'Frozen dumplings with dipping sauce',
    en: { meal: 'Frozen dumplings with dipping sauce', cuisine: 'Chinese', swap: 'Steam or boil them instead of pan-frying, and dip in black vinegar with ginger instead of soy sauce.', why: 'Vinegar and ginger keep the flavor with less salt.' },
    'zh-Hans': { meal: '冷冻饺子配蘸酱', cuisine: '中式', swap: '用蒸或煮代替煎，蘸姜丝黑醋代替酱油。', why: '醋和姜保住味道，盐却少了。' },
    'zh-Hant': { meal: '冷凍餃子配沾醬', cuisine: '中式', swap: '用蒸或煮代替煎，沾薑絲烏醋代替醬油。', why: '醋和薑保住味道，鹽卻少了。' },
    es: { meal: 'Dumplings congelados con salsa', cuisine: 'China', swap: 'Cocínalos al vapor o hervidos en vez de fritos, y mójalos en vinagre negro con jengibre en vez de soya.', why: 'El vinagre y el jengibre mantienen el sabor con menos sal.' },
  },
  {
    kind: 'packaged', tag: 'salt', photo: 'Canned soup',
    en: { meal: 'Canned soup', cuisine: 'Any', swap: 'Homemade soup or a low-sodium can, in a smaller bowl. If you have kidney disease, check the label for potassium chloride.', why: 'Regular canned soup is very salty.' },
    'zh-Hans': { meal: '罐头汤', cuisine: '各种', swap: '自己煮汤，或选低钠罐头汤，用小一点的碗。有肾病的话，看看标签上有没有氯化钾。', why: '一般罐头汤非常咸。' },
    'zh-Hant': { meal: '罐頭湯', cuisine: '各種', swap: '自己煮湯，或選低鈉罐頭湯，用小一點的碗。有腎病的話，看看標籤上有沒有氯化鉀。', why: '一般罐頭湯非常鹹。' },
    es: { meal: 'Sopa de lata', cuisine: 'Cualquiera', swap: 'Sopa casera o una lata baja en sodio, en un plato más chico. Si tienes enfermedad renal, revisa si la etiqueta dice cloruro de potasio.', why: 'La sopa de lata normal tiene mucha sal.' },
  },
];
