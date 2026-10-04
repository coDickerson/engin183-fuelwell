// Small shared helpers for the FuelWell app pages: icons, escaping, toast, badges, sub-tabs.
import { mealThresholds } from '../data/fung.js';

const paths = {
  today: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/>',
  meals: '<path d="M3 11h18a9 9 0 0 1-18 0Z"/><path d="M7 7c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M17 7c0-1.5 1-2 1-3.5"/><path d="M8 20h8"/>',
  care: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/>',
  health: '<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20v-1a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v1"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20v-1a5 5 0 0 0-3.5-4.8"/>',
  logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5M5 12h11"/>',
  video: '<rect x="3" y="6" width="12.5" height="12" rx="2.5"/><path d="m15.5 10.5 5-3v9l-5-3"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  send: '<path d="M4 12 20 4l-5 16-3.5-6.5Z"/><path d="m11.5 13.5 3-3"/>',
  sparkle: '<path d="M12 3.5 13.8 9a2 2 0 0 0 1.2 1.2l5.5 1.8-5.5 1.8a2 2 0 0 0-1.2 1.2L12 20.5 10.2 15A2 2 0 0 0 9 13.8L3.5 12 9 10.2A2 2 0 0 0 10.2 9Z"/>',
  alert: '<path d="M12 4 2.8 19.5h18.4Z"/><path d="M12 10v4.5M12 17.2h.01"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  print: '<path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="8" rx="2"/><path d="M7 14h10v6.5H7Z"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/>',
  swap: '<path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"/>',
  week: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 14h2M12 14h2M16 14h.01M8 17h2"/>',
  chart: '<path d="M4 4v16h16"/><path d="m7.5 14.5 4-4 3 3 5-6"/>',
  table: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10"/>',
  drop: '<path d="M12 3.5c3.4 3.8 6 7.3 6 10.5a6 6 0 0 1-12 0c0-3.2 2.6-6.7 6-10.5Z"/>',
  leaf: '<path d="M5 19c0-8 5-13 15-14-.5 10-6 15-14 15"/><path d="M5 19l7-7"/>',
  retry: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8M12 17h.01"/>',
};

export function icon(name, cls = 'icon') {
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${paths[name] || ''}</svg>`;
}

const escMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => escMap[ch]);
}

export const nutrientNames = { k: 'Potassium', p: 'Phosphorus', na: 'Sodium' };

export function levelFor(key, mg) {
  const [low, high] = mealThresholds[key];
  return mg < low ? 'low' : mg <= high ? 'mid' : 'high';
}

export const levelText = { low: 'Low', mid: 'Med', high: 'High' };

export function badge(level, prefix = '') {
  const lv = ['low', 'mid', 'high'].includes(level) ? level : 'mid';
  return `<span class="badge badge--${lv}">${prefix ? esc(prefix) + ' ' : ''}${levelText[lv]}</span>`;
}

// Three-column nutrient summary used on meal cards.
export function nutrientRow(item) {
  return `<dl class="nutri">${['k', 'p', 'na'].map((key) => `
    <div class="nutri-item"><dt>${nutrientNames[key]}</dt><dd><span class="nutri-mg">${Number(item[key]).toLocaleString()} mg</span>${badge(levelFor(key, item[key]))}</dd></div>`).join('')}</dl>`;
}

let toastTimer;
export function toast(message) {
  const el = document.querySelector('[data-toast]');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 4200);
}

export function storage(kind = 'local') {
  try {
    const s = kind === 'session' ? window.sessionStorage : window.localStorage;
    return {
      get(key, fallback = null) { try { const v = s.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } },
      set(key, value) { try { s.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } },
    };
  } catch {
    return { get: (_k, fallback = null) => fallback, set() {} };
  }
}

export function dateFromOffset(days, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export const fmt = {
  day: (d) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
  short: (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
  time: (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  month: (d) => d.toLocaleDateString('en-US', { month: 'short' }),
  dateNum: (d) => d.getDate(),
};

/**
 * Accessible tabs with arrow keys and the selected tab mirrored in the URL hash.
 * Markup: [role=tablist] > button[role=tab][data-tab=name][aria-controls=panel-id]
 */
export function initTabs(tablist, { onChange } = {}) {
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const names = tabs.map((t) => t.dataset.tab);

  function select(name, { focus = false, updateHash = true } = {}) {
    if (!names.includes(name)) name = names[0];
    tabs.forEach((tab) => {
      const on = tab.dataset.tab === name;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
      if (on && focus) tab.focus();
    });
    if (updateHash && location.hash.slice(1) !== name) {
      history.replaceState(null, '', `${location.pathname}${location.search}#${name}`);
    }
    onChange?.(name);
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab.dataset.tab));
    tab.addEventListener('keydown', (event) => {
      let next = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      event.preventDefault();
      select(tabs[next].dataset.tab, { focus: true });
    });
  });

  window.addEventListener('hashchange', () => {
    const name = location.hash.slice(1);
    if (names.includes(name)) select(name, { updateHash: false });
  });

  const initial = location.hash.slice(1);
  select(names.includes(initial) ? initial : names[0], { updateHash: names.includes(initial) });
  return { select };
}
