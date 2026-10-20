import { applyDom, langToggleHtml, makeT, onLangChange, wireLangToggle } from '../scripts/i18n.js';

const s = (en, zh, es) => ({ en, zh, es });
const strings = {
  title: s('Your account | FuelWell', '你的帳戶 | FuelWell', 'Tu cuenta | FuelWell'),
  skip: s('Skip to your account', '跳到你的帳戶', 'Ir a tu cuenta'),
  sign_out: s('Sign out', '登出', 'Cerrar sesión'),
  loading: s('Opening your account…', '正在打開你的帳戶…', 'Abriendo tu cuenta…'),
  preview: s('Local preview. This sample account shows the layout and interactions. Nothing is saved.', '本機預覽。此範例帳戶只顯示版面和操作，不會儲存資料。', 'Vista previa local. Esta cuenta de ejemplo muestra el diseño y las interacciones. No se guarda nada.'),
  eyebrow: s('Your private starting point', '你的私人起點', 'Tu punto de partida privado'),
  welcome: s('Welcome, {name}.', '歡迎你，{name}。', 'Te damos la bienvenida, {name}.'),
  intro: s('Your account is ready. Add a little about the food you enjoy whenever you want. Your answers stay in your account and can be changed later.', '你的帳戶已準備好。隨時加入你喜歡的食物。答案只存在你的帳戶中，日後可以修改。', 'Tu cuenta está lista. Agrega lo que te gusta comer cuando quieras. Tus respuestas quedan en tu cuenta y puedes cambiarlas después.'),
  add_preferences: s('Edit preferences', '修改偏好', 'Editar preferencias'),
  dashboard_link: s('Dashboard', '儀表板', 'Panel'),
  your_account: s('Your account', '你的帳戶', 'Tu cuenta'),
  preferences_started: s('Preferences started', '已開始填寫偏好', 'Preferencias iniciadas'),
  preferences_empty: s('Preferences not added yet', '尚未加入偏好', 'Aún no agregas preferencias'),
  next_eyebrow: s('What happens next', '接下來', 'Qué sigue'),
  next_title: s('Start at your own pace.', '按自己的步調開始。', 'Comienza a tu ritmo.'),
  step1_title: s('Add your preferences', '加入你的偏好', 'Agrega tus preferencias'),
  step1_body: s('Save a name, the food you enjoy and a goal for future meal planning. You can skip this for now.', '儲存姓名、喜歡的食物和未來餐單規劃的目標。你也可以暫時略過。', 'Guarda tu nombre, la comida que disfrutas y una meta para futuros planes de comidas. Puedes omitirlo por ahora.'),
  step1_link: s('Go to preferences →', '前往偏好 →', 'Ir a preferencias →'),
  step2_title: s('See how FuelWell works', '了解 FuelWell 如何運作', 'Descubre cómo funciona FuelWell'),
  step2_body: s('Explore the meal planning idea and sample care experience before deciding what fits you.', '先探索餐單規劃構想和示範照護體驗，再決定甚麼適合你。', 'Explora la idea de planes de comidas y la experiencia de cuidado de muestra antes de decidir qué te conviene.'),
  step2_link: s('How it works →', '運作方式 →', 'Cómo funciona →'),
  step3_title: s('Return to your dashboard', '返回你的儀表板', 'Vuelve a tu panel'),
  step3_body: s('Your saved preferences and starting goal appear on your private dashboard.', '你儲存的偏好和起始目標會顯示在私人儀表板上。', 'Tus preferencias y tu meta inicial aparecen en tu panel privado.'),
  step3_link: s('Open dashboard →', '打開儀表板 →', 'Abrir panel →'),
  optional: s('Optional', '可選填', 'Opcional'),
  preferences_title: s('Your preferences', '你的偏好', 'Tus preferencias'),
  preferences_intro: s('These answers belong to your account and do not change the fictional demo. FuelWell is a student project, so please do not enter real medical information.', '這些答案只屬於你的帳戶，不會改變虛構示範。FuelWell 是學生專題，請勿輸入真實醫療資料。', 'Estas respuestas pertenecen a tu cuenta y no cambian la demo ficticia. FuelWell es un proyecto estudiantil; no ingreses información médica real.'),
  food_title: s('About you and your food', '關於你和你的飲食', 'Sobre ti y tu comida'),
  name: s('Name', '姓名', 'Nombre'),
  cuisine: s('Food or cuisine you enjoy', '你喜歡的食物或菜系', 'Comida o cocina que disfrutas'),
  optional_paren: s('(optional)', '（選填）', '(opcional)'),
  cuisine_example: s('For example, Cantonese or Mexican', '例如廣東菜或墨西哥菜', 'Por ejemplo, comida cantonesa o mexicana'),
  topics: s('Topics you are interested in', '你感興趣的主題', 'Temas que te interesan'),
  pressure: s('High blood pressure', '高血壓', 'Presión arterial alta'),
  diabetes: s('Diabetes', '糖尿病', 'Diabetes'),
  kidney: s('Kidney health', '腎臟健康', 'Salud renal'),
  kidney_stage: s('Kidney stage', '腎臟病分期', 'Etapa renal'),
  skip_stage: s('Not sure / skip', '不確定／略過', 'No sé / omitir'),
  dialysis: s('Dialysis', '透析', 'Diálisis'),
  save_preferences: s('Save preferences', '儲存偏好', 'Guardar preferencias'),
  goal_title: s('Your starting goal', '你的起始目標', 'Tu meta inicial'),
  goal_intro: s('Choose a direction for future meal planning. You can decide later.', '為未來的餐單規劃選擇方向。你也可以稍後再決定。', 'Elige una dirección para futuros planes de comidas. Puedes decidirlo después.'),
  goal_who: s('Who are you exploring for?', '你是為誰探索？', '¿Para quién estás explorando?'),
  choose_one: s('Choose one', '請選擇', 'Elige una opción'),
  myself: s('Myself', '我自己', 'Para mí'),
  someone: s('Someone I care for', '我照顧的人', 'Alguien a quien cuido'),
  goal_help: s('What would help most?', '甚麼最有幫助？', '¿Qué te ayudaría más?'),
  goal_familiar: s('Plan familiar meals', '規劃熟悉的家常菜', 'Planear comidas familiares'),
  goal_healthier: s('Eat healthier day to day', '日常吃得更健康', 'Comer mejor cada día'),
  goal_energy: s('Fuel training and everyday energy', '補充運動與日常能量', 'Energía para entrenar y vivir cada día'),
  goal_options: s('Understand food options', '了解飲食選擇', 'Entender las opciones de comida'),
  goal_visit: s('Prepare for a care-team visit', '準備與照護團隊會面', 'Prepararme para una visita con el equipo de cuidado'),
  save_goal: s('Save starting goal', '儲存起始目標', 'Guardar meta inicial'),
  footer: s('FuelWell is a student project, not a medical service. The care dashboard contains fictional sample data.', 'FuelWell 是學生專題，並非醫療服務。照護儀表板使用虛構範例資料。', 'FuelWell es un proyecto estudiantil, no un servicio médico. El panel de cuidado contiene datos ficticios de muestra.'),
  preview_saved: s('Preview updated. Nothing was saved.', '預覽已更新，沒有儲存資料。', 'Vista previa actualizada. No se guardó nada.'),
  preferences_saved: s('Your preferences were saved.', '你的偏好已儲存。', 'Se guardaron tus preferencias.'),
  goal_saved: s('Your starting goal was saved.', '你的起始目標已儲存。', 'Se guardó tu meta inicial.'),
  name_required: s('Please add a name before saving.', '請先填寫姓名再儲存。', 'Agrega un nombre antes de guardar.'),
  goal_required: s('Choose who this is for and what would help most.', '請選擇這是為誰而設，以及甚麼最有幫助。', 'Elige para quién es y qué ayudaría más.'),
  goal_sync_error: s('Your preferences were saved, but the starting goal could not be updated. Save the goal again to finish syncing it.', '你的偏好已儲存，但起始目標未能更新。請再次儲存目標以完成同步。', 'Se guardaron tus preferencias, pero no se pudo actualizar la meta inicial. Guarda la meta otra vez para sincronizarla.'),
};

export const accountT = makeT(strings);

export function setupAccountLanguage() {
  const slot = document.querySelector('[data-lang-slot]');
  slot.innerHTML = langToggleHtml();
  wireLangToggle(slot);
  const paint = () => {
    document.title = accountT('title');
    applyDom(accountT);
  };
  paint();
  onLangChange(paint);
}
