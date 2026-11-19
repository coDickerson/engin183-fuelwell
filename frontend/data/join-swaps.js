// The swap-guide preview on /join: 6 examples from FuelWell's swap catalog (data/swap_catalog.csv),
// chosen because the advice cuts salt or sugar and is safe whether someone manages high blood
// pressure, diabetes or kidney disease. Anything that depends on a care team's potassium or
// phosphorus limits is left out. Photos come from swap-photos.js (Unsplash, credited on each card).
// `photo` is the catalog meal name used as the key in swapPhotos. The full guide (70 swaps)
// is Meals > Browse swaps in the demo.

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
    kind: 'takeout', tag: 'salt', photo: 'Pho',
    en: { meal: 'Pho', cuisine: 'Vietnamese', swap: 'Enjoy the noodles, meat and herbs, leave about half the broth, and add lime, basil and bean sprouts. Go light on hoisin.', why: 'Most of the salt is in the broth.' },
    'zh-Hans': { meal: '越南河粉', cuisine: '越南', swap: '吃河粉、肉和香草，汤留下一半左右，多加青柠、罗勒和豆芽。海鲜酱少放。', why: '大部分的盐都在汤里。' },
    'zh-Hant': { meal: '越南河粉', cuisine: '越南', swap: '吃河粉、肉和香草，湯留下一半左右，多加萊姆、九層塔和豆芽。海鮮醬少放。', why: '大部分的鹽都在湯裡。' },
    es: { meal: 'Pho', cuisine: 'Vietnamita', swap: 'Disfruta los fideos, la carne y las hierbas, deja más o menos la mitad del caldo y agrega limón, albahaca y germinado. Poca salsa hoisin.', why: 'Casi toda la sal está en el caldo.' },
  },
  {
    kind: 'home', tag: 'salt', photo: 'Enchiladas with canned sauce and cheese',
    en: { meal: 'Enchiladas with canned sauce and cheese', cuisine: 'Mexican', swap: 'Make the sauce from dried chiles and garlic, use half the cheese, and serve with a cabbage slaw.', why: 'Canned sauce and cheese are the biggest sources of salt.' },
    'zh-Hans': { meal: '罐装酱汁加芝士的墨西哥卷饼（Enchiladas）', cuisine: '墨西哥', swap: '用干辣椒和蒜自己做酱汁，芝士减半，配一份凉拌卷心菜。', why: '罐装酱汁和芝士是盐分的最大来源。' },
    'zh-Hant': { meal: '罐裝醬汁加起司的墨西哥捲餅（Enchiladas）', cuisine: '墨西哥', swap: '用乾辣椒和蒜自己做醬汁，起司減半，配一份涼拌高麗菜。', why: '罐裝醬汁和起司是鹽分的最大來源。' },
    es: { meal: 'Enchiladas con salsa de lata y queso', cuisine: 'Mexicana', swap: 'Haz la salsa con chiles secos y ajo, usa la mitad del queso y sírvelas con ensalada de repollo.', why: 'La salsa de lata y el queso son lo que más sal aporta.' },
  },
  {
    kind: 'takeout', tag: 'salt', photo: 'Korean BBQ with kimchi',
    en: { meal: 'Korean BBQ with kimchi', cuisine: 'Korean', swap: 'Choose lightly marinated meat, wrap it in lettuce, and keep kimchi and dipping sauces to small portions.', why: 'Marinades, kimchi and ssamjang add up fast.' },
    'zh-Hans': { meal: '韩式烤肉配泡菜', cuisine: '韩式', swap: '选腌得较淡的肉，用生菜包着吃，泡菜和蘸酱只吃一点。', why: '腌料、泡菜和包饭酱加起来盐分很高。' },
    'zh-Hant': { meal: '韓式烤肉配泡菜', cuisine: '韓式', swap: '選醃得較淡的肉，用生菜包著吃，泡菜和沾醬只吃一點。', why: '醃料、泡菜和包飯醬加起來鹽分很高。' },
    es: { meal: 'Barbacoa coreana con kimchi', cuisine: 'Coreana', swap: 'Elige carne poco marinada, envuélvela en lechuga y come poco kimchi y pocas salsas.', why: 'Los marinados, el kimchi y el ssamjang suman mucha sal.' },
  },
  {
    kind: 'takeout', tag: 'sugar', photo: 'Boba milk tea',
    en: { meal: 'Boba milk tea', cuisine: 'Taiwanese', swap: 'A smaller size at 25 to 50 percent sugar, with fewer pearls.', why: 'You keep the treat with much less sugar.' },
    'zh-Hans': { meal: '珍珠奶茶', cuisine: '台式', swap: '点小杯，三分糖或五分糖，珍珠少一点。', why: '一样能享受，糖却少很多。' },
    'zh-Hant': { meal: '珍珠奶茶', cuisine: '台式', swap: '點小杯，三分糖或半糖，珍珠少一點。', why: '一樣能享受，糖卻少很多。' },
    es: { meal: 'Té de leche con boba', cuisine: 'Taiwanesa', swap: 'Un tamaño más chico, con 25 a 50 por ciento de azúcar y menos perlas.', why: 'Sigues disfrutándolo con mucho menos azúcar.' },
  },
];
