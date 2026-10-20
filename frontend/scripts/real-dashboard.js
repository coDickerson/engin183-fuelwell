import { authConfigError, friendlyAuthError, getAuthenticatedUser, signOutCurrentSession, supabase } from '../auth/supabase.js';
import { isDemoUser } from '../auth/demo.js';
import { loadProfile } from '../auth/profile.js';
import { applyDom, langToggleHtml, makeT, onLangChange, wireLangToggle } from './i18n.js';

const s = (en, zh, es) => ({ en, zh, es });
const strings = {
  title: s('Your dashboard | FuelWell', '你的儀表板 | FuelWell', 'Tu panel | FuelWell'),
  skip: s('Skip to dashboard', '跳到儀表板', 'Ir al panel'),
  nav_dashboard: s('Dashboard', '儀表板', 'Panel'),
  nav_preferences: s('Preferences', '偏好', 'Preferencias'),
  sign_out: s('Sign out', '登出', 'Cerrar sesión'),
  loading: s('Opening your dashboard…', '正在打開你的儀表板…', 'Abriendo tu panel…'),
  preview: s('Local preview. This sample dashboard does not read or save account data.', '本機預覽。此範例儀表板不會讀取或儲存帳戶資料。', 'Vista previa local. Este panel de muestra no lee ni guarda datos de cuenta.'),
  eyebrow: s('Your FuelWell dashboard', '你的 FuelWell 儀表板', 'Tu panel de FuelWell'),
  welcome: s('Welcome, {name}.', '歡迎你，{name}。', 'Te damos la bienvenida, {name}.'),
  hero_intro: s('Your account is ready. Your saved starting point is below, and you can change it whenever you want.', '你的帳戶已準備好。下方是你儲存的起點，你可以隨時修改。', 'Tu cuenta está lista. Abajo verás tu punto de partida guardado; puedes cambiarlo cuando quieras.'),
  edit_preferences: s('Edit preferences', '修改偏好', 'Editar preferencias'),
  account_label: s('Your account', '你的帳戶', 'Tu cuenta'),
  status_saved: s('Starting point saved', '已儲存起點', 'Punto de partida guardado'),
  status_empty: s('Ready to set up', '可以開始設定', 'Lista para configurar'),
  status_loading: s('Loading your details…', '正在載入你的資料…', 'Cargando tus datos…'),
  loading_details: s('Loading…', '載入中…', 'Cargando…'),
  starting_eyebrow: s('Saved to your account', '已儲存到你的帳戶', 'Guardado en tu cuenta'),
  starting_title: s('Your starting point', '你的起點', 'Tu punto de partida'),
  update_link: s('Update details →', '更新資料 →', 'Actualizar datos →'),
  food_label: s('Food you enjoy', '你喜歡的食物', 'Comida que disfrutas'),
  topics_label: s('Topics you selected', '你選擇的主題', 'Temas que elegiste'),
  goal_label: s('Starting goal', '起始目標', 'Meta inicial'),
  not_added: s('Not added yet', '尚未加入', 'Aún no agregado'),
  not_loaded: s('Could not load', '無法載入', 'No se pudo cargar'),
  pressure: s('High blood pressure', '高血壓', 'Presión arterial alta'),
  diabetes: s('Diabetes', '糖尿病', 'Diabetes'),
  kidney: s('Kidney health', '腎臟健康', 'Salud renal'),
  goal_familiar: s('Plan familiar meals', '規劃熟悉的家常菜', 'Planear comidas familiares'),
  goal_healthier: s('Eat healthier day to day', '日常吃得更健康', 'Comer mejor cada día'),
  goal_energy: s('Fuel training and everyday energy', '補充運動與日常能量', 'Energía para entrenar y vivir cada día'),
  goal_options: s('Understand food options', '了解飲食選擇', 'Entender las opciones de comida'),
  goal_visit: s('Prepare for a care-team visit', '準備與照護團隊會面', 'Prepararme para una visita con el equipo de cuidado'),
  saved_note: s('These details come from your account, not the sample demo.', '這些資料來自你的帳戶，而不是示範。', 'Estos datos provienen de tu cuenta, no de la demo.'),
  workspace_eyebrow: s('Your workspace', '你的工作空間', 'Tu espacio'),
  workspace_title: s('What you can do now', '你現在可以做甚麼', 'Qué puedes hacer ahora'),
  action1_title: s('Build your starting point', '建立你的起點', 'Crea tu punto de partida'),
  action1_body: s('Save or change your food preferences and goal. They will be here when you return.', '儲存或修改你的飲食偏好和目標。下次回來時仍會在這裡。', 'Guarda o cambia tus preferencias de comida y tu meta. Estarán aquí cuando regreses.'),
  action1_link: s('Open preferences →', '打開偏好 →', 'Abrir preferencias →'),
  action2_title: s('See how FuelWell works', '了解 FuelWell 如何運作', 'Descubre cómo funciona FuelWell'),
  action2_body: s('Explore the meal planning idea and learn what the sample experience can show you.', '探索餐單規劃構想，了解示範體驗可以展示甚麼。', 'Explora la idea de planes de comidas y descubre qué muestra la experiencia de ejemplo.'),
  action2_link: s('How it works →', '運作方式 →', 'Cómo funciona →'),
  action3_title: s('What comes next', '接下來', 'Qué sigue'),
  action3_body: s('Personal meal plans and care records are still being built. Your saved starting point will be here when you return.', '個人餐單和照護紀錄仍在開發中。下次回來時，你儲存的起點仍會在這裡。', 'Los planes personales de comidas y los historiales de cuidado siguen en desarrollo. Tu punto de partida guardado estará aquí cuando regreses.'),
  footer: s('FuelWell is a student project, not a medical service. Please do not enter real medical information.', 'FuelWell 是學生專題，並非醫療服務。請勿輸入真實醫療資料。', 'FuelWell es un proyecto estudiantil, no un servicio médico. No ingreses información médica real.'),
  load_error: s('We could not load all your saved details. Refresh to try again.', '無法載入你所有已儲存的資料。請重新整理再試。', 'No pudimos cargar todos tus datos guardados. Actualiza la página para intentarlo de nuevo.'),
  sign_out_error: s('We could not sign you out. Please try again.', '無法登出。請再試一次。', 'No pudimos cerrar tu sesión. Inténtalo de nuevo.'),
};
const t = makeT(strings);
const byId = (id) => document.getElementById(id);
const preview = import.meta.env.DEV && new URLSearchParams(location.search).get('preview') === '1';
const goalKeys = {
  'familiar-meals': 'goal_familiar',
  'eat-healthier': 'goal_healthier',
  'fuel-performance': 'goal_energy',
  'understand-options': 'goal_options',
  'prepare-conversation': 'goal_visit',
};
let user = null;
let profile = null;
let goal = null;
let loadingDetails = true;
let profileFailed = false;
let goalFailed = false;

function displayName() {
  return profile?.fullName || String(user?.user_metadata?.full_name || '').trim() || user?.email?.split('@')[0] || 'there';
}

function paint() {
  document.title = t('title');
  applyDom(t);
  if (!user) return;
  const name = displayName();
  byId('dashboard-title').textContent = t('welcome', { name: name.split(' ')[0] });
  byId('dashboard-name').textContent = name;
  byId('dashboard-email').textContent = user.email || '';
  byId('dashboard-status').textContent = t(loadingDetails ? 'status_loading' : profile || goal ? 'status_saved' : 'status_empty');
  const conditions = [profile?.highBloodPressure && t('pressure'), profile?.diabetes && t('diabetes'), profile?.kidneyDisease && t('kidney')].filter(Boolean);
  byId('fact-food').textContent = loadingDetails ? t('loading_details') : profileFailed ? t('not_loaded') : profile?.cuisine || t('not_added');
  byId('fact-topics').textContent = loadingDetails ? t('loading_details') : profileFailed ? t('not_loaded') : conditions.join(' · ') || t('not_added');
  byId('fact-goal').textContent = loadingDetails ? t('loading_details') : goalFailed ? t('not_loaded') : goalKeys[goal?.goal] ? t(goalKeys[goal.goal]) : t('not_added');
}

const slot = document.querySelector('[data-lang-slot]');
slot.innerHTML = langToggleHtml();
wireLangToggle(slot);
paint();
onLangChange(paint);

byId('sign-out').addEventListener('click', async () => {
  if (preview) { location.assign('/start.html#sign-in'); return; }
  const button = byId('sign-out');
  button.disabled = true;
  try {
    await signOutCurrentSession();
    location.replace('/start.html#sign-in');
  } catch (error) {
    button.disabled = false;
    byId('dashboard-error').textContent = friendlyAuthError(error, t('sign_out_error'));
    byId('dashboard-error').hidden = false;
  }
});

async function loadGoal() {
  const { data, error } = await supabase.from('quiz_results')
    .select('role,goal').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return data;
}

async function initialize() {
  if (preview) {
    user = { email: 'alex@example.com', user_metadata: { full_name: 'Alex Rivera' } };
    profile = { fullName: 'Alex Rivera', cuisine: 'Cantonese', highBloodPressure: true, diabetes: false, kidneyDisease: false };
    goal = { role: 'patient', goal: 'familiar-meals' };
    loadingDetails = false;
    byId('preview-notice').hidden = false;
    byId('dashboard-loading').remove();
    byId('dashboard-content').hidden = false;
    paint();
    return;
  }
  if (authConfigError) { location.replace('/start.html#sign-in'); return; }
  try {
    user = await getAuthenticatedUser();
    if (!user) { location.replace('/start.html#sign-in'); return; }
    if (isDemoUser(user)) { location.replace('/demo-dashboard.html'); return; }
    byId('dashboard-loading').remove();
    byId('dashboard-content').hidden = false;
    paint();
    const results = await Promise.allSettled([loadProfile(user), loadGoal()]);
    if (results[0].status === 'fulfilled') profile = results[0].value;
    else profileFailed = true;
    if (results[1].status === 'fulfilled') goal = results[1].value;
    else goalFailed = true;
    loadingDetails = false;
    paint();
    if (profileFailed || goalFailed) {
      byId('dashboard-error').textContent = t('load_error');
      byId('dashboard-error').hidden = false;
    }
  } catch (error) {
    const message = friendlyAuthError(error, t('load_error'));
    const loader = byId('dashboard-loading');
    if (loader) loader.textContent = message;
    else {
      byId('dashboard-error').textContent = message;
      byId('dashboard-error').hidden = false;
    }
  }
}

initialize();
