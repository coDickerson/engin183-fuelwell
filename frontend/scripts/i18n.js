// Keep the MVP in English. The existing copy dictionaries can be reused when
// every account and family page has complete translations.
export const lang = () => 'en';
export const intl = () => 'en-US';
export const onLangChange = () => () => {};

/** Pick the current language from a { en, zh, es } value; strings pass through. */
export function tr(value) {
  if (value == null) return '';
  if (typeof value !== 'object') return String(value);
  return value.en ?? '';
}

/** Look up `key` in a dictionary of { key: { en, zh, es } } and fill {placeholders}. */
export function makeT(dict) {
  return (key, vars) => {
    let text = tr(dict[key]) || key;
    if (vars) text = text.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
    return text;
  };
}

/**
 * Fill static markup: data-i18n (text), data-i18n-html (our own markup),
 * data-i18n-placeholder, data-i18n-aria, data-i18n-alt.
 */
export function applyDom(t, root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  root.querySelectorAll('[data-i18n-alt]').forEach((el) => { el.alt = t(el.dataset.i18nAlt); });
}

document.documentElement.lang = 'en';
