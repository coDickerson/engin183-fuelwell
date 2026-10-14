// Home page copy in English, Traditional Chinese and Spanish. Keys match data-i18n
// attributes in index.html. *_html values hold our own inline markup, never user input.
import { makeT } from './i18n.js';

const s = (en, zh, es) => ({ en, zh, es });
const arrow = '<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

export const landingStrings = {
  doc_title: s('FuelWell | Helping your parent eat well for their kidneys', 'FuelWell | 幫父母吃得護腎又安心', 'FuelWell | Ayuda a tu mamá o papá a comer bien para sus riñones'),
  skip: s('Skip to content', '跳到主要內容', 'Ir al contenido'),
  home_label: s('FuelWell home', 'FuelWell 首頁', 'Inicio de FuelWell'),
  main_nav: s('Main navigation', '主選單', 'Navegación principal'),
  open_menu: s('Open menu', '打開選單', 'Abrir menú'),
  close_menu: s('Close menu', '關閉選單', 'Cerrar menú'),
  nav_how: s('How it works', '運作方式', 'Cómo funciona'),
  nav_families: s('For families', '給家人', 'Para familias'),
  nav_meals: s('Meal planning', '餐單規劃', 'Planear comidas'),
  nav_questions: s('Questions', '常見問題', 'Preguntas'),
  nav_signin: s('Sign in', '登入', 'Iniciar sesión'),
  try_demo: s('Try the demo', '試用示範', 'Probar la demo'),

  hero_pill: s('For families managing a kidney diet', '為照顧腎病飲食的家庭而設', 'Para familias que cuidan una dieta renal'),
  hero_h1_html: s('Helping your parent eat well <em>for their kidneys.</em>', '幫父母吃得好，<em class="nowrap">也護腎。</em>', 'Ayuda a tu mamá o papá a comer bien <em>por sus riñones.</em>'),
  hero_lead: s(
    'FuelWell turns the kidney diet into everyday meals you can cook this week, with your family’s own traditions added in, keeps labs and health records in one place, and puts a renal dietitian and Mom or Dad’s care team a message away. Made for chronic kidney disease stages G3 and G4.',
    'FuelWell 把腎病飲食變成這星期就能煮的家常菜，保留你家的飲食傳統；把化驗和健康紀錄集中一處；只需一則訊息，就能聯絡腎病營養師和爸媽的醫療團隊。專為慢性腎病 G3 及 G4 期而設。',
    'FuelWell convierte la dieta renal en comidas de todos los días que puedes cocinar esta semana, con las tradiciones de tu familia; reúne análisis e historial de salud en un solo lugar, y te deja a un mensaje de un dietista renal y del equipo de salud de tu mamá o papá. Hecho para la enfermedad renal crónica en etapas G3 y G4.'),
  join_waitlist: s('Join the waitlist', '加入候補名單', 'Únete a la lista de espera'),
  hero_note: s('The demo shows Heidi, who plans meals for her mom, Fung (78, CKD stage G3b), who loves Cantonese home cooking.', '示範中的 Heidi 為媽媽 Fung（78 歲，慢性腎病 G3b 期）規劃餐單，媽媽最愛廣東家常菜。', 'La demo muestra a Heidi, que planea las comidas de su mamá, Fung (78 años, ERC etapa G3b), a quien le encanta la comida casera cantonesa.'),
  hero_alt: s('An older East Asian woman and her adult daughter hugging and smiling outdoors', '一位年長的東亞女士和成年女兒在戶外擁抱微笑', 'Una mujer mayor del este de Asia y su hija adulta abrazadas y sonriendo al aire libre'),
  tag_viewing: s('Viewing: Mom (Fung)', '正在查看：媽媽（Fung）', 'Viendo: Mamá (Fung)'),
  tag_potassium: s('Potassium today', '今日鉀攝取', 'Potasio hoy'),
  on_track: s('On track', '達標', 'Bien'),
  photo: s('Photo:', '相片：', 'Foto:'),

  reassure_title: s('Made for the people who do the cooking', '為負責下廚的人而設', 'Hecho para quienes cocinan'),
  reassure_1: s('Adult children', '成年子女', 'Hijos adultos'),
  reassure_2: s('Partners and caregivers', '伴侶和照顧者', 'Parejas y cuidadores'),
  reassure_3: s('Patients themselves', '病人自己', 'Los propios pacientes'),

  pillars_eyebrow: s('What FuelWell does', 'FuelWell 做甚麼', 'Qué hace FuelWell'),
  pillars_h2_html: s('Meals you can cook, and <em>care you can reach.</em>', '煮得到的餐，<em class="nowrap">找得到的照顧。</em>', 'Comidas que puedes cocinar y <em>apoyo a tu alcance.</em>'),
  pillars_p: s('Two things matter most for kidney health at home: what goes on the plate, and staying in close touch with the people who guide the diet.', '在家護腎，最重要是兩件事：碟上吃甚麼，以及與指導飲食的專業人員保持緊密聯繫。', 'Para cuidar los riñones en casa importan dos cosas: lo que va en el plato y mantenerse en contacto con quienes guían la dieta.'),
  p1_eyebrow: s('1 · Meal planning', '1 · 餐單規劃', '1 · Planear comidas'),
  p1_h3: s('A week of meals built from the food they already eat', '用他們平日吃的菜，砌出一星期餐單', 'Una semana de comidas con lo que ya comen'),
  p1_li1: s('Start from the dishes your family already cooks, from steamed fish and congee to roast chicken and pasta.', '由你家平日煮的菜開始，清蒸魚、粥，或燒雞、意粉都可以。', 'Empieza con lo que tu familia ya cocina, del pescado al vapor y el congee al pollo al horno y la pasta.'),
  p1_li2: s('Every dish gets a simple potassium, phosphorus and sodium check.', '每道菜都有簡單的鉀、磷、鈉檢查。', 'Cada platillo tiene una revisión sencilla de potasio, fósforo y sodio.'),
  p1_li3: s('Small swaps keep favorite dishes on the table, plus a grocery list for the week.', '小小替換，讓心愛的菜繼續上桌，再附一星期的購物清單。', 'Pequeños cambios mantienen los platillos favoritos en la mesa, con lista del súper para la semana.'),
  p1_row1: s('Steamed fish with ginger', '薑蔥清蒸魚', 'Pescado al vapor con jengibre'),
  p1_row1_badge: s('Sodium low', '鈉 低', 'Sodio bajo'),
  p1_row2: s('Ginger chicken congee', '薑絲雞粥', 'Congee de pollo con jengibre'),
  p1_row2_badge: s('Potassium low', '鉀 低', 'Potasio bajo'),
  p1_link: s('How meal planning works', '餐單規劃如何運作', 'Cómo funciona la planeación'),
  p2_eyebrow: s('2 · Health records and care team', '2 · 健康紀錄與醫療團隊', '2 · Historial de salud y equipo'),
  p2_h3: s('Labs, records and a dietitian, all in one place', '化驗、紀錄和營養師，集中一處', 'Análisis, historial y dietista en un solo lugar'),
  p2_li1: s('Keep lab results like eGFR, potassium and phosphorus together, with trends in plain language.', '把 eGFR、鉀、磷等化驗結果放在一起，用淺白語言解釋趨勢。', 'Guarda resultados como eGFR, potasio y fósforo juntos, con tendencias en palabras sencillas.'),
  p2_li2: s('Message a FuelWell renal dietitian who speaks your family’s language, and book a visit when questions come up.', '向懂你家語言的 FuelWell 腎病營養師發訊息，有疑問時隨時預約。', 'Escribe a un dietista renal de FuelWell que habla el idioma de tu familia y reserva una cita cuando tengas dudas.'),
  p2_li3: s('Share the meal plan and labs with your own doctor, dietitian and care team.', '與你的醫生、營養師和醫療團隊分享餐單和化驗結果。', 'Comparte el plan y los análisis con tu médico, dietista y equipo de salud.'),
  p2_row1_badge: s('Steady', '穩定', 'Estable'),
  p2_row2: s('Mei Chen, RD replied', 'Mei Chen, RD 已回覆', 'Mei Chen, RD respondió'),
  p2_row2_quote: s('“Try fresh choy sum instead of 梅菜.”', '「梅菜可以改用新鮮菜心。」', '“Prueba choy sum fresco en vez de 梅菜.”'),
  p2_link: s('See the care team in the demo', '在示範中查看醫療團隊', 'Ver el equipo de salud en la demo'),

  explore_eyebrow: s('Explore FuelWell', '探索 FuelWell', 'Explora FuelWell'),
  explore_h2_html: s('Less guesswork at <em>every meal.</em>', '<em>每一餐</em>都少一點估估下。', 'Menos adivinanzas en <em>cada comida.</em>'),
  explore_p: s('Potassium, phosphorus, sodium and protein limits are hard to keep in your head. FuelWell does the checking so you can focus on cooking.', '鉀、磷、鈉和蛋白質的限制很難全部記住。FuelWell 幫你檢查，你可以專心煮飯。', 'Es difícil recordar los límites de potasio, fósforo, sodio y proteína. FuelWell los revisa para que te enfoques en cocinar.'),
  e1_alt: s('A woman checking a recipe on her laptop in the kitchen', '一位女士在廚房用手提電腦查看食譜', 'Una mujer revisando una receta en su laptop en la cocina'),
  e1_eyebrow: s('How it works', '運作方式', 'Cómo funciona'),
  e1_title: s('From the care plan to tonight’s dinner', '由護理計劃到今晚的晚餐', 'Del plan de cuidado a la cena de hoy'),
  e1_copy: s('Enter a few details once, then get daily meals with a simple nutrient check.', '只需輸入一次基本資料，就能每天收到附營養檢查的餐單。', 'Ingresa unos datos una vez y recibe comidas diarias con una revisión sencilla de nutrientes.'),
  e1_more: s('See how it works', '了解運作方式', 'Ver cómo funciona'),
  e2_alt: s('An adult daughter holding her elderly mother’s hands while they talk', '成年女兒握著年邁母親的手傾談', 'Una hija adulta sostiene las manos de su madre mayor mientras conversan'),
  e2_eyebrow: s('For families', '給家人', 'Para familias'),
  e2_title: s('One plan the whole family can see', '全家都看得到的一份計劃', 'Un plan que toda la familia puede ver'),
  e2_copy: s('Share view-only access with a sister or brother so everyone cooks the same way.', '與兄弟姊妹分享只供查看的權限，大家煮法一致。', 'Comparte acceso de solo lectura con tus hermanos para que todos cocinen igual.'),
  e2_more: s('Caring together', '一起照顧', 'Cuidar juntos'),
  e3_alt: s('Steamed fish topped with scallions, served with rice', '清蒸魚鋪上蔥絲，配白飯', 'Pescado al vapor con cebollín, servido con arroz'),
  e3_eyebrow: s('Meal planning', '餐單規劃', 'Planear comidas'),
  e3_title: s('The dishes they grew up with, adjusted for the kidneys', '他們從小吃到大的菜，為腎臟調整', 'Los platillos con los que crecieron, ajustados para los riñones'),
  e3_copy: s('Family favorites like steamed fish or congee, plus weeknight staples, with small swaps.', '清蒸魚、粥等家常好菜，加上平日快餐，只需小小替換。', 'Favoritos como pescado al vapor o congee, y comidas de diario, con pequeños cambios.'),
  e3_more: s('Plan meals', '規劃餐單', 'Planear comidas'),
  credits_html: s(
    'Photos: <a href="https://www.pexels.com/photo/focused-asian-woman-browsing-laptop-in-kitchen-5094085/" rel="noopener">Kamaji Ogino</a>, <a href="https://www.pexels.com/photo/elderly-woman-sharing-a-moment-with-adult-daughter-36578169/" rel="noopener">Kimymoto</a> and <a href="https://www.pexels.com/photo/11830200/" rel="noopener">Jan Kao</a> / Pexels',
    '相片：<a href="https://www.pexels.com/photo/focused-asian-woman-browsing-laptop-in-kitchen-5094085/" rel="noopener">Kamaji Ogino</a>、<a href="https://www.pexels.com/photo/elderly-woman-sharing-a-moment-with-adult-daughter-36578169/" rel="noopener">Kimymoto</a> 及 <a href="https://www.pexels.com/photo/11830200/" rel="noopener">Jan Kao</a> / Pexels',
    'Fotos: <a href="https://www.pexels.com/photo/focused-asian-woman-browsing-laptop-in-kitchen-5094085/" rel="noopener">Kamaji Ogino</a>, <a href="https://www.pexels.com/photo/elderly-woman-sharing-a-moment-with-adult-daughter-36578169/" rel="noopener">Kimymoto</a> y <a href="https://www.pexels.com/photo/11830200/" rel="noopener">Jan Kao</a> / Pexels'),

  closing_eyebrow: s('See it for yourself', '親身看看', 'Compruébalo tú'),
  closing_h2_html: s('Spend two minutes as <em>Heidi.</em>', '用兩分鐘，做一次 <em>Heidi。</em>', 'Pasa dos minutos como <em>Heidi.</em>'),
  closing_p: s('Open the demo to see a week of kidney-friendly meals planned for her mom, Fung. No sign-up needed.', '打開示範，看看 Heidi 為媽媽 Fung 規劃的一星期護腎餐單。無需註冊。', 'Abre la demo para ver una semana de comidas para los riñones planeadas para su mamá, Fung. Sin registrarte.'),
  closing_waitlist: s('Join the waitlist to be a first user', '加入候補名單，成為首批用戶', 'Únete a la lista de espera para ser de los primeros'),
  closing_account: s('Or create an account', '或建立帳戶', 'O crea una cuenta'),

  footer_blurb: s('Kidney-friendly meal planning, health records and care-team support for the family you care for.', '為你照顧的家人提供護腎餐單、健康紀錄和醫療團隊支援。', 'Planeación de comidas para los riñones, historial de salud y apoyo del equipo de salud para la familia que cuidas.'),
  footer_label: s('Footer', '頁尾', 'Pie de página'),
  footer_built: s('How it was built', '開發過程', 'Cómo se construyó'),
  footer_emergency: s('In an emergency, call 911.', '如遇緊急情況，請撥打 911。', 'En caso de emergencia, llama al 911.'),
  footer_disclaimer: s(
    'FuelWell is a student project (ENGIN 183), not a medical service, and does not give medical advice. Please don’t enter real health information. Photos from Pexels, credited where they appear.',
    'FuelWell 是學生專題（ENGIN 183），不是醫療服務，也不提供醫療建議。請勿輸入真實的健康資料。相片來自 Pexels，已於相關位置註明。',
    'FuelWell es un proyecto estudiantil (ENGIN 183), no un servicio médico, y no da consejos médicos. No ingreses información de salud real. Fotos de Pexels, con crédito donde aparecen.'),
};

export const arrowSvg = arrow;
export const t = makeT(landingStrings);
