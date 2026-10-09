export const languages = [
  { code: 'en', label: 'English' },
  { code: 'zh-Hant', label: '繁體中文 (Traditional Chinese)' },
  { code: 'ko', label: '한국어 (Korean)' },
  { code: 'vi', label: 'Tiếng Việt (Vietnamese)' },
];

const KEY = 'fuelwell.language.v1';

export function initLanguagePreference(root, saved) {
  const select = root.querySelector('[data-language]');
  const status = root.querySelector('[data-language-status]');
  const preferred = saved.get(KEY, 'en');
  select.value = languages.some(({ code }) => code === preferred) ? preferred : 'en';
  const updateStatus = () => {
    status.textContent = select.value === 'en'
      ? ''
      : 'Demo content is currently in English.';
  };
  updateStatus();
  select.addEventListener('change', () => {
    saved.set(KEY, select.value);
    updateStatus();
  });
}
