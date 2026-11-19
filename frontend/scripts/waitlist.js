import { authConfigError, supabase } from '../auth/supabase.js';
import { track } from './track.js';
import { locales, strings } from './waitlist-i18n.js';
import { joinSwaps } from '../data/join-swaps.js';
import { photoPage, photoUrl, swapPhotos } from '../data/swap-photos.js';

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
  renderGuide();
}

document.querySelectorAll('.lang-option').forEach((button) => button.addEventListener('click', () => {
  const code = button.dataset.lang;
  if (code === 'zh') applyLocale(locale.startsWith('zh') ? locale : (storage('get')?.startsWith('zh') ? storage('get') : 'zh-Hans'));
  else applyLocale(code);
}));
document.querySelectorAll('.script-option').forEach((button) => button.addEventListener('click', () => applyLocale(button.dataset.script)));

/* ---------- Swap guide ---------- */

const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
let guideKind = 'all';

function renderGuide() {
  const shown = joinSwaps.filter((item) => guideKind === 'all' || item.kind === guideKind);
  byId('guide-count').textContent = t('guide_count').replace('{n}', shown.length);
  byId('swap-list').innerHTML = shown.map((item, index) => {
    const text = item[locale] || item.en;
    const photo = swapPhotos[item.photo];
    const cuisine = text.cuisine && item.en.cuisine !== 'Any' ? ` · ${esc(text.cuisine)}` : '';
    return `<li><article class="wl-swap" aria-labelledby="swap-${index}">
      ${photo ? `<img class="wl-swap-photo" src="${esc(photoUrl(photo))}" alt="" loading="lazy" width="640" height="420">` : ''}
      <div class="wl-swap-body">
        <p class="wl-swap-meta"><span class="wl-swap-tag wl-swap-tag--${item.tag}">${esc(t(`tag_${item.tag}`))}</span><span>${esc(t(`kind_${item.kind}`))}${cuisine}</span></p>
        <p class="wl-swap-label">${esc(t('instead'))}</p>
        <h3 id="swap-${index}">${esc(text.meal)}</h3>
        <p class="wl-swap-label wl-swap-label--try">${esc(t('try'))}</p>
        <p class="wl-swap-try">${esc(text.swap)}</p>
        <p class="wl-swap-why"><strong>${esc(t('why'))}:</strong> ${esc(text.why)}</p>
        ${photo ? `<p class="wl-swap-credit">${esc(t('photo_by'))} <a href="${esc(photoPage(photo))}" target="_blank" rel="noopener noreferrer">${esc(photo.by)}</a> / Unsplash</p>` : ''}
      </div>
    </article></li>`;
  }).join('');
}

document.querySelectorAll('.wl-guide-filters [data-kind]').forEach((button) => button.addEventListener('click', () => {
  guideKind = button.dataset.kind;
  document.querySelectorAll('.wl-guide-filters [data-kind]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
  renderGuide();
}));

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
// 7 to 15 digits, allowing spaces, dashes, dots, brackets and a leading +.
const PHONE = /^\+?[\d\s().-]+$/;
function phoneOk(value) {
  const digits = (value.match(/\d/g) || []).length;
  return PHONE.test(value) && digits >= 7 && digits <= 15;
}
let submitted = { name: '', story: false };

function readForm() {
  const data = new FormData(form);
  const text = (name) => (data.get(name) || '').toString().trim();
  return {
    first_name: text('first_name'),
    email: text('email').toLowerCase() || null,
    phone: text('phone') || null,
    story: text('story') || null,
    language: locale,
  };
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const row = readForm();

  if (!row.first_name) return showError('err_name', byId('first-name'));
  if (!row.email) return showError('err_email_missing', byId('email'));
  if (!EMAIL.test(row.email)) return showError('err_email', byId('email'));
  if (row.phone && !phoneOk(row.phone)) return showError('err_phone', byId('phone'));
  showError(null);

  submitted = { name: row.first_name, story: Boolean(row.story) };

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
    window.va?.('event', { name: 'waitlist_signup', data: { story: Boolean(row.story), language: row.language } });
    track('signup', `waitlist${new URLSearchParams(location.search).get('from') === 'demo' ? ':from_demo' : ''}`);
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
  byId('thanks-body').textContent = t(submitted.story ? 'thanks_body_story' : 'thanks_body');
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
