// Health & labs tab: simple inline-SVG trend charts and a lab results table.
import { initShell } from './app-shell.js';
import { esc, fmt, initTabs } from './app-ui.js';
import { labDate, labs, trends } from '../data/fung.js';
import { tr } from './i18n.js';
import { t as TT } from './app-strings.js';

const pointLabel = ([y, m]) => fmt.monthYear(new Date(y, m - 1, 1));
const pt = (p) => ({ month: pointLabel(p), value: p[2] });
const labDay = () => fmt.date(new Date(labDate[0], labDate[1] - 1, labDate[2]));

const $ = (sel, root = document) => root.querySelector(sel);
const statusClass = { ok: 'low', near: 'mid', low: 'mid', high: 'high' };

function chartSvg(trend, width) {
  const t = { ...trend, label: tr(trend.label), band: { ...trend.band, label: tr(trend.band.label) }, points: trend.points.map(pt) };
  const height = 220;
  const pad = { top: 34, right: 28, bottom: 40, left: 52 };
  const w = Math.max(width - pad.left - pad.right, 120);
  const h = height - pad.top - pad.bottom;
  const [min, max] = t.domain;
  const x = (i) => pad.left + (t.points.length === 1 ? w / 2 : (i * w) / (t.points.length - 1));
  const y = (v) => pad.top + h - ((v - min) / (max - min)) * h;
  const bandTop = y(Math.min(t.band.high, max));
  const bandBottom = y(Math.max(t.band.low, min));
  const line = t.points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const outOf = (v) => v < t.band.low || v > t.band.high;
  const isEgfr = t.key === 'egfr';
  const ticks = [t.band.low, t.band.high];
  return `<svg class="chart" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(t.label)} · 12 months: ${t.points.map((p) => `${p.month} ${p.value}`).join(', ')} ${esc(t.unit)}. ${esc(t.band.label)}.">
    <rect class="chart-band" x="${pad.left}" y="${bandTop}" width="${w}" height="${bandBottom - bandTop}" rx="6"/>
    ${ticks.map((v) => `<line class="chart-rule" x1="${pad.left}" x2="${pad.left + w}" y1="${y(v)}" y2="${y(v)}"/><text class="chart-axis" x="${pad.left - 10}" y="${y(v) + 6}" text-anchor="end">${v}</text>`).join('')}
    <path class="chart-line" d="${line}"/>
    ${t.points.map((p, i) => {
      const out = !isEgfr && outOf(p.value);
      const anchor = i === 0 ? 'start' : i === t.points.length - 1 ? 'end' : 'middle';
      const dx = i === 0 ? -6 : i === t.points.length - 1 ? 6 : 0;
      return `<g class="chart-point">
        <title>${p.month}: ${p.value} ${t.unit}${out ? ` (${TT('outside_goal')})` : ''}</title>
        <circle class="chart-hit" cx="${x(i)}" cy="${y(p.value)}" r="18"/>
        <circle class="chart-dot${out ? ' chart-dot--out' : ''}" cx="${x(i)}" cy="${y(p.value)}" r="6"/>
        <text class="chart-value${out ? ' chart-value--out' : ''}" x="${x(i) + dx}" y="${y(p.value) - 14}" text-anchor="${anchor}">${p.value}${out ? ` ${TT('high_short')}` : ''}</text>
        <text class="chart-axis" x="${x(i) + dx}" y="${height - 10}" text-anchor="${anchor}">${p.month}</text>
      </g>`;
    }).join('')}
  </svg>`;
}

let observer;
function renderCharts() {
  const grid = $('[data-charts]');
  grid.innerHTML = trends.map((tn) => {
    const last = tn.points[tn.points.length - 1][2];
    const first = tn.points[0][2];
    const diff = +(last - first).toFixed(1);
    return `<article class="card chart-card">
      <div class="chart-head">
        <div><h2 class="chart-title">${esc(tr(tn.label))}</h2><p class="muted">${esc(tr(tn.explain))}</p></div>
        <p class="chart-latest"><strong>${last}</strong> <span class="muted">${esc(tn.unit)}</span><span class="chart-delta">${esc(TT('in_12', { d: `${diff > 0 ? '+' : ''}${diff}` }))}</span></p>
      </div>
      <div class="chart-box" data-chart="${tn.key}"></div>
      <p class="chart-legend"><span class="legend-swatch" aria-hidden="true"></span>${esc(TT('shaded', { label: tr(tn.band.label) }))}</p>
    </article>`;
  }).join('');
  const draw = () => grid.querySelectorAll('[data-chart]').forEach((box) => {
    const t = trends.find((tr) => tr.key === box.dataset.chart);
    const width = Math.floor(box.clientWidth);
    if (width > 0 && Number(box.dataset.w) !== width) {
      box.dataset.w = String(width);
      box.innerHTML = chartSvg(t, width);
    }
  });
  observer?.disconnect();
  if ('ResizeObserver' in window) { observer = new ResizeObserver(draw); observer.observe(grid); }
  draw();
  return draw;
}

function renderLabs() {
  $('[data-lab-date]').textContent = TT('collected', { date: labDay() });
  $('[data-lab-rows]').innerHTML = labs.map((l) => `<tr>
    <th scope="row" data-label="${esc(TT('col_test'))}"><strong>${esc(tr(l.name))}</strong><span class="muted cell-sub">${esc(tr(l.what))}</span></th>
    <td data-label="${esc(TT('col_result'))}"><span class="lab-value">${esc(l.value)}</span> <span class="muted">${esc(l.unit)}</span></td>
    <td data-label="${esc(TT('col_range'))}">${esc(tr(l.range))}</td>
    <td data-label="${esc(TT('col_status'))}"><span class="badge badge--${statusClass[l.status]}">${esc(tr(l.statusText))}</span>${l.note ? `<span class="muted cell-sub">${esc(tr(l.note))}</span>` : ''}</td>
    <td data-label="${esc(TT('col_date'))}">${esc(labDay())}</td>
  </tr>`).join('');
}

let draw = () => {};
let wired = false;
initShell({
  page: 'health',
  title: 'title_health',
  render() {
    draw = renderCharts();
    renderLabs();
    if (!wired) {
      wired = true;
      initTabs($('[role="tablist"]'), { onChange: (name) => { if (name === 'trends') requestAnimationFrame(() => draw()); } });
    }
  },
});
