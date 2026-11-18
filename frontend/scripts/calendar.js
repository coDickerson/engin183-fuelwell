// Shared month calendar for the dashboard and appointment workspace.
import { esc, fmt } from './app-ui.js';
import { intl, tr } from './i18n.js';
import { t } from './app-strings.js';

export const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function createCalendar(root, { visits = () => [], onSelect, compact = false } = {}) {
  let selected = new Date();
  let month = new Date(selected.getFullYear(), selected.getMonth(), 1);
  function render() {
    const items = visits();
    const today = dateKey(new Date());
    const key = dateKey(selected);
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const label = new Intl.DateTimeFormat(intl(), { month: 'long', year: 'numeric' }).format(month);
    const weekday = new Intl.DateTimeFormat(intl(), { weekday: 'narrow' });
    const dayVisits = items.filter((v) => dateKey(new Date(v.iso)) === key);
    root.innerHTML = `<div class="panel-title"><h2>${esc(t('calendar_title'))}</h2><button type="button" class="button button--ghost" data-cal-today>${esc(t('calendar_today'))}</button></div>
      <div class="calendar-nav"><button type="button" class="button button--ghost" data-cal-prev aria-label="${esc(t('calendar_prev'))}">‹</button><strong aria-live="polite">${esc(label)}</strong><button type="button" class="button button--ghost" data-cal-next aria-label="${esc(t('calendar_next'))}">›</button></div>
      <div class="calendar-grid">${Array.from({ length: 7 }, (_, i) => `<span class="calendar-weekday" aria-hidden="true">${esc(weekday.format(new Date(2026, 10, 1 + i)))}</span>`).join('')}
      ${'<span aria-hidden="true"></span>'.repeat(month.getDay())}${Array.from({ length: count }, (_, i) => {
        const date = new Date(month.getFullYear(), month.getMonth(), i + 1);
        const dayKey = dateKey(date);
        const n = items.filter((v) => dateKey(new Date(v.iso)) === dayKey).length;
        return `<button type="button" class="calendar-day${n ? ' has-visits' : ''}" data-cal-day="${i + 1}" aria-pressed="${dayKey === key}"${dayKey === today ? ' aria-current="date"' : ''} aria-label="${esc(fmt.day(date))}${n ? `, ${esc(t('calendar_visits', { n }))}` : ''}">${i + 1}${n ? '<span class="calendar-dot" aria-hidden="true"></span>' : ''}</button>`;
      }).join('')}</div>
      <div class="calendar-agenda" aria-live="polite"${compact && !dayVisits.length ? ' hidden' : ''}><p><strong>${esc(fmt.day(selected))}</strong></p>${dayVisits.map((v) => `<p>${esc(fmt.time(new Date(v.iso)))} · ${esc(tr(v.title))}<br><span class="muted">${esc(tr(v.with))}</span></p>`).join('') || `<p class="muted">${esc(t('calendar_empty'))}</p>`}</div>`;
    const focus = (selector) => root.querySelector(selector)?.focus();
    root.querySelector('[data-cal-prev]').onclick = () => { month.setMonth(month.getMonth() - 1); render(); focus('[data-cal-prev]'); };
    root.querySelector('[data-cal-next]').onclick = () => { month.setMonth(month.getMonth() + 1); render(); focus('[data-cal-next]'); };
    root.querySelector('[data-cal-today]').onclick = () => { selected = new Date(); month = new Date(selected.getFullYear(), selected.getMonth(), 1); render(); focus('[data-cal-today]'); onSelect?.(selected); };
    root.querySelectorAll('[data-cal-day]').forEach((button) => { button.onclick = () => {
      selected = new Date(month.getFullYear(), month.getMonth(), Number(button.dataset.calDay));
      render(); focus(`[data-cal-day="${selected.getDate()}"]`); onSelect?.(selected);
    }; });
  }
  render();
  return { render };
}
