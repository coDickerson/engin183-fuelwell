import { applyDom, langToggleHtml, makeT, onLangChange, wireLangToggle } from '../scripts/i18n.js';

const s = (en, zh, es) => ({ en, zh, es });
const strings = {
  home: s('Home', '首頁', 'Inicio'),
  start_eyebrow: s('Your account, your starting point', '你的帳戶，你的起點', 'Tu cuenta, tu punto de partida'),
  start_heading: s('Eat well with the food you grew up with.', '吃得健康，也吃得出家的味道。', 'Come bien con la comida con la que creciste.'),
  start_intro: s('Create your account in one step. You can add food and health preferences later, when you are ready.', '只需一步建立帳戶。準備好時，可再加入飲食與健康偏好。', 'Crea tu cuenta en un paso. Puedes agregar tus preferencias de comida y salud más adelante.'),
  start_demo: s('Want to look around first? Try the sample demo', '想先看看？試用示範', '¿Quieres explorar primero? Prueba la demo'),
  sign_in: s('Sign in', '登入', 'Iniciar sesión'),
  create_account: s('Create account', '建立帳戶', 'Crear cuenta'),
  welcome_back: s('Welcome back', '歡迎回來', 'Te damos la bienvenida'),
  sign_in_intro: s('Sign in to open your private starting point.', '登入以查看你的私人起點。', 'Inicia sesión para abrir tu punto de partida privado.'),
  email: s('Email', '電郵', 'Correo electrónico'),
  password: s('Password', '密碼', 'Contraseña'),
  forgot: s('Forgot password?', '忘記密碼？', '¿Olvidaste tu contraseña?'),
  reset_title: s('Reset your password', '重設密碼', 'Restablece tu contraseña'),
  reset_intro: s('Enter your account email. If it has an account, we’ll send a reset link.', '輸入帳戶電郵。如果帳戶存在，我們會寄送重設連結。', 'Escribe el correo de tu cuenta. Si existe una cuenta, te enviaremos un enlace.'),
  send_reset: s('Send reset link', '寄送重設連結', 'Enviar enlace'),
  back_sign_in: s('Back to sign in', '返回登入', 'Volver a iniciar sesión'),
  new_password_title: s('Choose a new password', '設定新密碼', 'Elige una nueva contraseña'),
  new_password: s('New password', '新密碼', 'Nueva contraseña'),
  password_hint: s('At least 8 characters.', '至少 8 個字元。', 'Al menos 8 caracteres.'),
  save_password: s('Save new password', '儲存新密碼', 'Guardar nueva contraseña'),
  sign_up_title: s('Create your account', '建立你的帳戶', 'Crea tu cuenta'),
  sign_up_intro: s('Just your name, email and password. Preferences are optional after sign-in.', '只需姓名、電郵和密碼。登入後可選擇加入偏好。', 'Solo necesitas nombre, correo y contraseña. Las preferencias son opcionales después de iniciar sesión.'),
  your_name: s('Your name', '你的姓名', 'Tu nombre'),
  show: s('Show', '顯示', 'Mostrar'),
  hide: s('Hide', '隱藏', 'Ocultar'),
  show_password: s('Show password', '顯示密碼', 'Mostrar contraseña'),
  hide_password: s('Hide password', '隱藏密碼', 'Ocultar contraseña'),
  start_title: s('Sign in | FuelWell', '登入 | FuelWell', 'Iniciar sesión | FuelWell'),
  disclaimer: s('FuelWell is a student project (ENGIN 183), not a medical service. Please don’t enter real health information.', 'FuelWell 是 ENGIN 183 學生專題，並非醫療服務。請勿輸入真實健康資料。', 'FuelWell es un proyecto estudiantil (ENGIN 183), no un servicio médico. No ingreses información médica real.'),
};

export const authT = makeT(strings);

export function setupAuthLanguage() {
  const slot = document.querySelector('[data-lang-slot]');
  if (!slot) return;
  slot.innerHTML = langToggleHtml();
  wireLangToggle(slot);
  const paint = () => {
    document.title = authT('start_title');
    applyDom(authT);
    document.querySelectorAll('.password-toggle').forEach((button) => {
      const showing = button.getAttribute('aria-pressed') === 'true';
      button.textContent = authT(showing ? 'hide' : 'show');
      button.setAttribute('aria-label', authT(showing ? 'hide_password' : 'show_password'));
    });
  };
  paint();
  onLangChange(paint);
}
