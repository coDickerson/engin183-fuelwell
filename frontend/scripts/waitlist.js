import { authConfigError, supabase } from '../auth/supabase.js';
import { locales, strings } from './waitlist-i18n.js';

const LANG_KEY = 'fuelwell.waitlist.lang.v1';
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
}

document.querySelectorAll('.lang-option').forEach((button) => button.addEventListener('click', () => {
  const code = button.dataset.lang;
  if (code === 'zh') applyLocale(locale.startsWith('zh') ? locale : (storage('get')?.startsWith('zh') ? storage('get') : 'zh-Hans'));
  else applyLocale(code);
}));
document.querySelectorAll('.script-option').forEach((button) => button.addEventListener('click', () => applyLocale(button.dataset.script)));

// Picking "Other" for who you are opens a box to say more.
function syncRoleOther() {
  const isOther = form.elements.role.value === 'other';
  byId('role-other-field').hidden = !isOther;
  if (!isOther) byId('role-other').value = '';
}
form.querySelectorAll('input[name="role"]').forEach((input) => input.addEventListener('change', () => {
  syncRoleOther();
  if (form.elements.role.value === 'other') byId('role-other').focus();
}));
syncRoleOther();

// Saying yes to the swap guide makes email the way we send it.
function wantsUpdates() {
  return form.elements.wants_updates.value === 'yes';
}
function syncEmailTag() {
  const tag = byId('email-tag');
  const needed = wantsUpdates();
  tag.dataset.i18n = needed ? 'required' : 'optional';
  tag.textContent = t(tag.dataset.i18n);
  tag.classList.toggle('tag--req', needed);
}
form.querySelectorAll('input[name="wants_updates"]').forEach((input) => input.addEventListener('change', () => {
  syncEmailTag();
  if (errorBox.dataset.key === 'err_email_needed') showError(null);
}));
syncEmailTag();

applyLocale(locale, { save: false });

/* ---------- Submit ---------- */

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

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
let submitted = { name: '', guide: false };

function readForm() {
  const data = new FormData(form);
  const text = (name) => (data.get(name) || '').toString().trim();
  const updates = text('wants_updates');
  return {
    first_name: text('first_name'),
    email: text('email').toLowerCase() || null,
    phone: text('phone') || null,
    role: text('role') || null,
    role_other: text('role') === 'other' ? text('role_other') || null : null,
    conditions: data.getAll('conditions'),
    usual_food: text('usual_food') || null,
    hardest_part: text('hardest_part') || null,
    wants_updates: updates ? updates === 'yes' : null,
    heard_from: text('heard_from') || null,
    language: locale,
  };
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const row = readForm();

  if (!row.first_name) return showError('err_name', byId('first-name'));
  if (row.wants_updates && !row.email) return showError('err_email_needed', byId('email'));
  if (row.email && !EMAIL.test(row.email)) return showError('err_email', byId('email'));
  showError(null);

  submitted = { name: row.first_name, guide: Boolean(row.wants_updates && row.email) };

  // Bots that fill the hidden field get the thank-you page without a saved row.
  if (byId('company').value) return showThanks();
  if (authConfigError) return showError('err_config');

  submitButton.setAttribute('aria-busy', 'true');
  submitButton.disabled = true;
  submitButton.textContent = t('sending');
  try {
    const { error } = await supabase.from('waitlist_signups').insert(row);
    // 23505 = this email already joined; treat a repeat signup as success.
    if (error && error.code !== '23505') throw error;
    window.va?.('event', { name: 'waitlist_signup', data: { role: row.role || 'none', language: row.language } });
    showThanks();
  } catch (error) {
    const offline = /failed to fetch|network|load failed/i.test(error?.message || '');
    showError(offline ? 'err_network' : error?.code === '23514' ? 'err_email' : 'err_generic');
  } finally {
    submitButton.removeAttribute('aria-busy');
    submitButton.disabled = false;
    submitButton.textContent = t('submit');
  }
});

/* ---------- Thank-you view ---------- */

function renderThanks() {
  byId('thanks-title').textContent = t('thanks_title').replace('{name}', submitted.name);
  byId('thanks-body').textContent = t(submitted.guide ? 'thanks_body_guide' : 'thanks_body');
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
