import { authConfigError, supabase } from '../auth/supabase.js';
import { locales, strings } from './waitlist-i18n.js';

const LANG_KEY = 'fuelwell.waitlist.lang.v1';
const byId = (id) => document.getElementById(id);
const form = byId('waitlist-form');
const errorBox = byId('form-error');
const submitButton = form.querySelector('[type="submit"]');
const params = new URLSearchParams(location.search);

// Optional tap questions. `type: 'radio'` allows one answer (tap again to clear).
const chipGroups = [
  { name: 'interests', type: 'checkbox', legend: 'interests_legend',
    options: [['meal_planning', 'i_meals'], ['health_records', 'i_records'], ['dietitian', 'i_dietitian'], ['care_team', 'i_care_team']] },
  { name: 'kidney_stage', type: 'radio', legend: { self: 'stage_legend_self', other: 'stage_legend_other' },
    options: [['stage_3', 'stage_3'], ['stage_4', 'stage_4'], ['stage_2', 'stage_earlier'], ['dialysis', 'stage_dialysis'], ['not_sure', 'stage_not_sure']] },
  { name: 'conditions', type: 'checkbox', legend: 'conditions_legend',
    options: [['diabetes', 'cond_diabetes'], ['high_blood_pressure', 'cond_hbp']] },
  { name: 'cuisines', type: 'checkbox', legend: { self: 'cuisines_legend_self', other: 'cuisines_legend_other' }, hint: 'cuisines_hint',
    options: ['chinese', 'vietnamese', 'korean', 'japanese', 'filipino', 'south_asian', 'mexican_latin', 'caribbean', 'soul_food', 'middle_eastern', 'american', 'other'].map((v) => [v, `c_${v}`]) },
  { name: 'challenge', type: 'radio', legend: 'challenge_legend',
    options: ['safe_foods', 'family_recipes', 'cooking_for_all', 'labs', 'groceries', 'other'].map((v) => [v, `ch_${v}`]) },
  { name: 'heard_from', type: 'radio', legend: 'heard_legend',
    options: ['reddit', 'facebook', 'friend', 'clinic', 'other'].map((v) => [v, `h_${v}`]) },
];

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

function role() {
  return form.elements.role.value || null;
}

function legendKey(legend) {
  if (typeof legend === 'string') return legend;
  return role() === 'patient' ? legend.self : legend.other;
}

function applyLocale(next, { save = true } = {}) {
  locale = next;
  if (save) storage('set', next);
  document.documentElement.lang = next;
  document.title = t('title');
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  document.querySelectorAll('[data-legend]').forEach((el) => {
    el.textContent = t(legendKey(chipGroups.find((g) => g.name === el.dataset.legend).legend));
  });

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

/* ---------- Optional tap questions ---------- */

function buildChips() {
  const root = document.querySelector('[data-chip-groups]');
  for (const group of chipGroups) {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'chip-group';
    const legend = document.createElement('legend');
    legend.dataset.legend = group.name;
    fieldset.append(legend);
    if (group.hint) {
      const hint = document.createElement('p');
      hint.className = 'hint';
      hint.dataset.i18n = group.hint;
      fieldset.append(hint);
    }
    const chips = document.createElement('div');
    chips.className = 'chips';
    for (const [value, key] of group.options) {
      const label = document.createElement('label');
      label.className = 'tap-chip';
      const input = document.createElement('input');
      input.type = group.type;
      input.name = group.name;
      input.value = value;
      const text = document.createElement('span');
      text.dataset.i18n = key;
      label.append(input, text);
      chips.append(label);
    }
    fieldset.append(chips);
    root.append(fieldset);
  }

  // Optional single-choice questions: tapping the chosen chip again clears it.
  root.querySelectorAll('input[type="radio"]').forEach((input) => {
    let wasChecked = false;
    input.addEventListener('pointerdown', () => { wasChecked = input.checked; });
    input.addEventListener('click', () => {
      if (wasChecked) input.checked = false;
      wasChecked = false;
    });
  });

  const other = root.querySelector('input[name="cuisines"][value="other"]');
  other.addEventListener('change', () => {
    byId('cuisine-other-field').hidden = !other.checked;
    if (other.checked) byId('cuisine-other').focus();
  });
}

buildChips();

// Pre-select "How did you hear about us?" from ?ref=reddit / ?ref=facebook links.
const ref = params.get('ref')?.toLowerCase();
const refInput = ref && form.querySelector(`input[name="heard_from"][value="${CSS.escape(ref)}"]`);
if (refInput) refInput.checked = true;

// Wording of "your" vs "their" questions follows the chosen role.
form.querySelectorAll('input[name="role"]').forEach((input) => input.addEventListener('change', () => {
  applyLocale(locale, { save: false });
  if (errorBox.dataset.key === 'err_role') showError(null);
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
let submitted = { name: '', phone: false };

function readForm() {
  const data = new FormData(form);
  const text = (name) => (data.get(name) || '').toString().trim();
  const cuisines = data.getAll('cuisines');
  return {
    first_name: text('first_name'),
    email: text('email').toLowerCase(),
    phone: text('phone') || null,
    role: text('role'),
    kidney_stage: text('kidney_stage') || null,
    interests: data.getAll('interests'),
    conditions: data.getAll('conditions'),
    cuisines,
    cuisine_other: cuisines.includes('other') ? text('cuisine_other') || null : null,
    challenge: text('challenge') || null,
    heard_from: text('heard_from') || null,
    language: locale,
  };
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const row = readForm();

  if (!row.role) return showError('err_role', form.querySelector('input[name="role"]'));
  if (!row.first_name) return showError('err_name', byId('first-name'));
  if (!EMAIL.test(row.email)) return showError('err_email', byId('email'));
  showError(null);

  submitted = { name: row.first_name, phone: Boolean(row.phone) };

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
    window.va?.('event', { name: 'waitlist_signup', data: { role: row.role, language: row.language } });
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
  byId('thanks-body').textContent = t(submitted.phone ? 'thanks_body_phone' : 'thanks_body');
}

function showThanks() {
  renderThanks();
  byId('signup-view').hidden = true;
  byId('thanks-view').hidden = false;
  window.scrollTo({ top: 0 });
  byId('thanks-title').focus();
}

byId('share-button').addEventListener('click', async () => {
  const url = new URL('/waitlist', location.origin);
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
