import { track } from './track.js';
import { getAuthenticatedUser, supabase } from '../auth/supabase.js';
import { isDemoUser } from '../auth/demo.js';
import { locales, strings } from './waitlist-i18n.js';
import { joinSwaps } from '../data/join-swaps.js';
import { photoPage, photoUrl, swapPhotos } from '../data/swap-photos.js';

const LANG_KEY = 'fuelwell.waitlist.lang.v1'; // kept so returning visitors keep their language
const byId = (id) => document.getElementById(id);
const form = byId('waitlist-form');
const errorBox = byId('form-error');
const submitButton = form.querySelector('[type="submit"]');
const params = new URLSearchParams(location.search);

/* ---------- Language ---------- */

function storage(action, value) {
  try {
    return action === 'get' ? localStorage.getItem(LANG_KEY) : localStorage.setItem(LANG_KEY, value);
  } catch {
    return null;
  }
}

// ?lang= wins so each community post can link straight to its language.
function initialLocale() {
  const fromUrl = params.get('lang');
  const aliases = { zh: 'zh-Hans', 'zh-cn': 'zh-Hans', 'zh-tw': 'zh-Hant', 'zh-hk': 'zh-Hant' };
  const pick = (code) => {
    if (!code) return null;
    const exact = locales.find((l) => l.toLowerCase() === code.toLowerCase());
    return exact || aliases[code.toLowerCase()] || null;
  };
  const fromBrowser = () => {
    for (const tag of navigator.languages || [navigator.language]) {
      const lower = (tag || '').toLowerCase();
      if (/^zh-(tw|hk|mo)|^zh-hant/.test(lower)) return 'zh-Hant';
      if (lower.startsWith('zh')) return 'zh-Hans';
      if (lower.startsWith('es')) return 'es';
      if (lower.startsWith('en')) return 'en';
    }
    return null;
  };
  return pick(fromUrl) || pick(storage('get')) || fromBrowser() || 'en';
}

let locale = initialLocale();
const t = (key) => strings[locale][key] ?? strings.en[key] ?? '';

function applyLocale(next, { save = true } = {}) {
  locale = next;
  if (save) storage('set', next);
  document.documentElement.lang = next;
  document.title = t('title');
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });

  const isChinese = next.startsWith('zh');
  document.querySelectorAll('.lang-option').forEach((b) => {
    const active = b.dataset.lang === (isChinese ? 'zh' : next);
    b.setAttribute('aria-pressed', String(active));
  });
  document.querySelector('.script-group').hidden = !isChinese;
  document.querySelectorAll('.script-option').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.script === next)));
  if (!byId('thanks-view').hidden) renderThanks();
  if (!errorBox.hidden && errorBox.dataset.key) errorBox.textContent = t(errorBox.dataset.key);
  const gateError = byId('gate-error');
  if (!gateError.hidden && gateError.dataset.key) gateError.textContent = t(gateError.dataset.key);
  renderGateDone();
  renderGuide();
}

document.querySelectorAll('.lang-option').forEach((button) => button.addEventListener('click', () => {
  const code = button.dataset.lang;
  if (code === 'zh') applyLocale(locale.startsWith('zh') ? locale : (storage('get')?.startsWith('zh') ? storage('get') : 'zh-Hans'));
  else applyLocale(code);
}));
document.querySelectorAll('.script-option').forEach((button) => button.addEventListener('click', () => applyLocale(button.dataset.script)));

/* ---------- Swap guide preview ---------- */

const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function renderGuide() {
  byId('swap-list').innerHTML = joinSwaps.map((item, index) => {
    const text = item[locale] || item.en;
    const photo = swapPhotos[item.photo];
    const cuisine = text.cuisine && item.en.cuisine !== 'Any' ? `${esc(text.cuisine)} · ` : '';
    return `<li><article class="wl-swap" aria-labelledby="swap-${index}">
      <div class="wl-swap-media">
        ${photo ? `<img class="wl-swap-photo" src="${esc(photoUrl(photo))}" alt="" loading="lazy" width="640" height="420">` : ''}
        <span class="wl-swap-tag wl-swap-tag--${item.tag}">${esc(t(`tag_${item.tag}`))}</span>
      </div>
      <div class="wl-swap-body">
        <p class="wl-swap-meta">${cuisine}${esc(t(`kind_${item.kind}`))}</p>
        <h3 id="swap-${index}"><span class="wl-swap-label">${esc(t('instead'))}</span>${esc(text.meal)}</h3>
        <div class="wl-swap-try">
          <p class="wl-swap-label wl-swap-label--try"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>${esc(t('try'))}</p>
          <p>${esc(text.swap)}</p>
        </div>
        <p class="wl-swap-why"><strong>${esc(t('why'))}:</strong> ${esc(text.why)}</p>
        ${photo ? `<p class="wl-swap-credit">${esc(t('photo_by'))} <a href="${esc(photoPage(photo))}" target="_blank" rel="noopener noreferrer">${esc(photo.by)}</a> / Unsplash</p>` : ''}
      </div>
    </article></li>`;
  }).join('');
}

applyLocale(locale, { save: false });

/* ---------- Account sign-up ---------- */
// Both forms on this page (the main card and the sign-up box) create a real FuelWell
// account with Supabase Auth. "Confirm email" is off, so the account signs in right away.
// Optional phone and story go on the person's own profile (owner-only RLS).

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MIN_PASSWORD = 8;
// 7 to 15 digits, allowing spaces, dashes, dots, brackets and a leading +.
const PHONE = /^\+?[\d\s().-]+$/;
function phoneOk(value) {
  const digits = (value.match(/\d/g) || []).length;
  return PHONE.test(value) && digits >= 7 && digits <= 15;
}

const JOINED = 'fuelwell.join.done.v1';
const NUDGE_DONE = 'fuelwell.nudge.done.v1'; // the demo's own join prompts (signup-nudge.js)
function local(action, key, value) {
  try {
    return action === 'get' ? localStorage.getItem(key) : localStorage.setItem(key, value);
  } catch {
    return null;
  }
}
function markJoined() {
  local('set', JOINED, '1');
  local('set', NUDGE_DONE, '1');
}

// Someone already signed in (not the shared demo account) skips the sign-up box.
let signedIn = false;
if (supabase) {
  getAuthenticatedUser().then((user) => { signedIn = Boolean(user && !isDemoUser(user)); }).catch(() => {});
}

function authErrorKey(error) {
  const text = `${error?.code || ''} ${error?.message || ''}`;
  if (/failed to fetch|network|load failed/i.test(error?.message || '')) return 'err_network';
  if (/already.*(registered|exists)|user_already_exists|email_exists/i.test(text)) return 'err_exists';
  if (/weak_password|password/i.test(text)) return 'err_password';
  if (error?.status === 429 || /rate.?limit|over_email_send_rate/i.test(text)) return 'err_rate';
  if (/email_address_invalid|invalid.*email|email.*invalid/i.test(text)) return 'err_email';
  return 'err_generic';
}

/** Asks the server to send the welcome email with the swap-guide link. Never blocks sign-up. */
async function sendWelcome(session) {
  try {
    const response = await fetch('/api/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ language: locale }),
    });
    const data = await response.json().catch(() => ({}));
    return response.ok && data.emailed === true;
  } catch {
    return false;
  }
}

/**
 * Creates the account, saves the profile and sends the welcome email.
 * Resolves to { emailed } or throws an Error whose `key` is a strings key.
 */
async function createAccount({ name, email, password, phone = null, story = null, via }) {
  if (!supabase) throw Object.assign(new Error('config'), { key: 'err_config' });
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: new URL('/dashboard.html', location.origin).href, data: { full_name: name } },
  });
  if (error) throw Object.assign(error, { key: authErrorKey(error) });
  // With "Confirm email" on, an existing address comes back with no identities.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw Object.assign(new Error('exists'), { key: 'err_exists' });
  }
  track('signup', `account:join_${via}`);
  window.va?.('event', { name: 'account_signup', data: { via, language: locale } });
  markJoined();
  if (!data.session) return { emailed: false, confirm: true };
  signedIn = true;
  const { error: profileError } = await supabase.from('profiles').upsert({
    user_id: data.user.id, full_name: name, phone, story, updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (profileError) console.warn('Profile not saved yet; the dashboard will ask again.', profileError.message);
  return { emailed: await sendWelcome(data.session), confirm: false };
}

function showError(key, field) {
  errorBox.dataset.key = key || '';
  errorBox.textContent = key ? t(key) : '';
  errorBox.hidden = !key;
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  if (field) {
    field.setAttribute('aria-invalid', 'true');
    field.focus();
  }
}

let submitted = { name: '', story: false, emailed: false, confirm: false };

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const value = (id) => byId(id).value.trim();
  const name = value('first-name');
  const email = value('email').toLowerCase();
  const password = byId('password').value;
  const phone = value('phone');
  const story = value('story');

  if (!name) return showError('err_name', byId('first-name'));
  if (!email) return showError('err_email_missing', byId('email'));
  if (!EMAIL.test(email)) return showError('err_email', byId('email'));
  if (password.length < MIN_PASSWORD) return showError('err_password', byId('password'));
  if (phone && !phoneOk(phone)) return showError('err_phone', byId('phone'));
  showError(null);

  // Bots that fill the hidden field get the thank-you page without an account.
  if (byId('company').value) {
    submitted = { name, story: false, emailed: false, confirm: false };
    return showThanks();
  }

  submitButton.setAttribute('aria-busy', 'true');
  submitButton.disabled = true;
  submitButton.textContent = t('sending');
  try {
    const result = await createAccount({ name, email, password, phone: phone || null, story: story || null, via: 'form' });
    submitted = { name, story: Boolean(story), emailed: result.emailed, confirm: result.confirm };
    showThanks();
  } catch (error) {
    showError(error.key || 'err_generic', error.key === 'err_password' ? byId('password') : error.key === 'err_exists' || error.key === 'err_email' ? byId('email') : null);
  } finally {
    submitButton.removeAttribute('aria-busy');
    submitButton.disabled = false;
    submitButton.textContent = t('submit');
  }
});

/* ---------- Sign-up box: "Browse the swap guide" and the 5-second popup ---------- */
// "Browse the swap guide" asks for name, email and password, creates the account, then
// opens the full guide in the person's own account (Meals > Browse swaps). The same box
// pops up once after 5 seconds. Anyone already signed in goes straight to the guide.

const POPUP_AT = 'fuelwell.join.popup.v1';
const POPUP_DELAY_MS = 5000;
const POPUP_AGAIN_MS = 3 * 24 * 60 * 60 * 1000;

const gate = byId('gate');
const gateForm = byId('gate-form');
const gateError = byId('gate-error');
const gateSubmit = gateForm.querySelector('[type="submit"]');
let gateSource = 'hero';

function showGateError(key, field) {
  gateError.dataset.key = key || '';
  gateError.textContent = key ? t(key) : '';
  gateError.hidden = !key;
  gateForm.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  if (field) {
    field.setAttribute('aria-invalid', 'true');
    field.focus();
  }
}

function openGate(source) {
  if (gate.open) return;
  gateSource = source;
  gateForm.hidden = false;
  byId('gate-done').hidden = true;
  showGateError(null);
  // Carry over anything already typed in the main form.
  if (!byId('gate-name').value) byId('gate-name').value = byId('first-name').value;
  if (!byId('gate-email').value) byId('gate-email').value = byId('email').value;
  gate.showModal();
  byId(byId('gate-name').value ? 'gate-email' : 'gate-name').focus();
  track('signup_prompt_shown', `join_${source}`);
}

function closeGate() {
  gate.close();
  if (!gateForm.hidden) track('signup_prompt_dismiss', `join_${gateSource}`);
}

document.querySelectorAll('[data-gate]').forEach((link) => link.addEventListener('click', (event) => {
  if (signedIn) return; // already has an account: the link opens the guide
  event.preventDefault();
  openGate(link.dataset.gate);
}));
byId('gate-close').addEventListener('click', closeGate);
gate.addEventListener('cancel', (event) => { event.preventDefault(); closeGate(); });
gate.addEventListener('click', (event) => { if (event.target === gate) closeGate(); });

gateForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = byId('gate-name').value.trim();
  const email = byId('gate-email').value.trim().toLowerCase();
  const password = byId('gate-password').value;
  if (!name) return showGateError('err_name', byId('gate-name'));
  if (!email) return showGateError('err_email_missing', byId('gate-email'));
  if (!EMAIL.test(email)) return showGateError('err_email', byId('gate-email'));
  if (password.length < MIN_PASSWORD) return showGateError('err_password', byId('gate-password'));
  showGateError(null);
  if (byId('gate-company').value) return showGateDone(name, email, false, false);

  gateSubmit.setAttribute('aria-busy', 'true');
  gateSubmit.disabled = true;
  gateSubmit.textContent = t('sending');
  try {
    const result = await createAccount({ name, email, password, via: gateSource });
    showGateDone(name, email, result.emailed, result.confirm);
  } catch (error) {
    showGateError(error.key || 'err_generic', error.key === 'err_password' ? byId('gate-password') : error.key === 'err_exists' || error.key === 'err_email' ? byId('gate-email') : null);
  } finally {
    gateSubmit.removeAttribute('aria-busy');
    gateSubmit.disabled = false;
    gateSubmit.textContent = t('gate_submit');
  }
});

// After signing up in the box: a welcome, with the guide one click away.
// var, not let: applyLocale() runs before this line and calls renderGateDone().
var gateDone = null; // eslint-disable-line no-var
function renderGateDone() {
  if (!gateDone) return;
  byId('gate-done-title').textContent = t('welcome_title').replace('{name}', gateDone.name);
  const key = gateDone.confirm ? 'done_confirm' : gateDone.emailed ? 'done_emailed' : 'done_ready';
  byId('gate-done-body').textContent = t(key).replace('{email}', gateDone.email);
}
function showGateDone(name, email, emailed, confirm) {
  gateDone = { name, email, emailed, confirm };
  renderGateDone();
  gateForm.hidden = true;
  byId('gate-done').hidden = false;
  byId('gate-done-title').focus();
}

// The 5-second popup: once every few days, never for someone signed in or already
// signed up here, and never while someone is filling in the form or reading the welcome.
function maybePopup() {
  if (signedIn || local('get', JOINED) === '1' || gate.open || !byId('thanks-view').hidden) return;
  const last = Number(local('get', POPUP_AT) || 0);
  if (last && Date.now() - last < POPUP_AGAIN_MS) return;
  const busy = form.contains(document.activeElement) || ['first-name', 'email', 'password', 'phone', 'story'].some((id) => byId(id).value.trim());
  if (busy) return;
  local('set', POPUP_AT, String(Date.now()));
  openGate('popup');
}
setTimeout(maybePopup, POPUP_DELAY_MS);

/* ---------- Thank-you view ---------- */

function renderThanks() {
  byId('thanks-title').textContent = t('welcome_title').replace('{name}', submitted.name);
  const key = submitted.confirm ? 'done_confirm' : submitted.emailed ? 'thanks_emailed' : 'thanks_ready';
  byId('thanks-body').textContent = [t(key).replace('{email}', ''), submitted.story ? t('thanks_story') : ''].filter(Boolean).join(' ');
}

function showThanks() {
  renderThanks();
  byId('signup-view').hidden = true;
  byId('thanks-view').hidden = false;
  window.scrollTo({ top: 0 });
  byId('thanks-title').focus();
}

byId('share-button').addEventListener('click', async () => {
  const url = new URL('/join', location.origin);
  url.searchParams.set('lang', locale);
  const status = byId('share-status');
  try {
    if (navigator.share) {
      await navigator.share({ title: 'FuelWell', text: t('share_text'), url: url.href });
      return;
    }
    await navigator.clipboard.writeText(`${t('share_text')} ${url.href}`);
    status.textContent = t('copied');
  } catch (error) {
    if (error?.name !== 'AbortError') status.textContent = url.href;
  }
});
