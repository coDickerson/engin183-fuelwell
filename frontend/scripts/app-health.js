// Health & labs tab: simple inline-SVG trend charts and a lab results table.
import { initShell, hydrateIcons } from './app-shell.js';
import { esc, initTabs } from './app-ui.js';
import { labDate, labs, trends } from '../data/fung.js';

const $ = (sel, root = document) => root.querySelector(sel);
const statusClass = { ok: 'low', near: 'mid', low: 'mid', high: 'high' };

function chartSvg(t, width) {
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
  return `<svg class="chart" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(t.label)} over 12 months: ${t.points.map((p) => `${p.month} ${p.value}`).join(', ')} ${esc(t.unit)}. Shaded: ${esc(t.band.label)}.">
    <rect class="chart-band" x="${pad.left}" y="${bandTop}" width="${w}" height="${bandBottom - bandTop}" rx="6"/>
    ${ticks.map((v) => `<line class="chart-rule" x1="${pad.left}" x2="${pad.left + w}" y1="${y(v)}" y2="${y(v)}"/><text class="chart-axis" x="${pad.left - 10}" y="${y(v) + 6}" text-anchor="end">${v}</text>`).join('')}
    <path class="chart-line" d="${line}"/>
    ${t.points.map((p, i) => {
      const out = !isEgfr && outOf(p.value);
      const anchor = i === 0 ? 'start' : i === t.points.length - 1 ? 'end' : 'middle';
      const dx = i === 0 ? -6 : i === t.points.length - 1 ? 6 : 0;
      return `<g class="chart-point">
        <title>${p.month}: ${p.value} ${t.unit}${out ? ' (outside goal)' : ''}</title>
        <circle class="chart-hit" cx="${x(i)}" cy="${y(p.value)}" r="18"/>
        <circle class="chart-dot${out ? ' chart-dot--out' : ''}" cx="${x(i)}" cy="${y(p.value)}" r="6"/>
        <text class="chart-value${out ? ' chart-value--out' : ''}" x="${x(i) + dx}" y="${y(p.value) - 14}" text-anchor="${anchor}">${p.value}${out ? ' High' : ''}</text>
        <text class="chart-axis" x="${x(i) + dx}" y="${height - 10}" text-anchor="${anchor}">${p.month}</text>
      </g>`;
    }).join('')}
  </svg>`;
}

function renderCharts() {
  const grid = $('[data-charts]');
  grid.innerHTML = trends.map((t) => {
    const last = t.points[t.points.length - 1];
    const first = t.points[0];
    const diff = +(last.value - first.value).toFixed(1);
    return `<article class="card chart-card">
      <div class="chart-head">
        <div><h2 class="chart-title">${esc(t.label)}</h2><p class="muted">${esc(t.explain)}</p></div>
        <p class="chart-latest"><strong>${last.value}</strong> <span class="muted">${esc(t.unit)}</span><span class="chart-delta">${diff > 0 ? '+' : ''}${diff} in 12 months</span></p>
      </div>
      <div class="chart-box" data-chart="${t.key}"></div>
      <p class="chart-legend"><span class="legend-swatch" aria-hidden="true"></span>Shaded: ${esc(t.band.label)}</p>
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
  if ('ResizeObserver' in window) new ResizeObserver(draw).observe(grid);
  else window.addEventListener('resize', draw);
  draw();
  return draw;
}

function renderLabs() {
  $('[data-lab-date]').textContent = `Collected ${labDate}`;
  $('[data-lab-rows]').innerHTML = labs.map((l) => `<tr>
    <th scope="row" data-label="Test"><strong>${esc(l.name)}</strong><span class="muted cell-sub">${esc(l.what)}</span></th>
    <td data-label="Result"><span class="lab-value">${esc(l.value)}</span> <span class="muted">${esc(l.unit)}</span></td>
    <td data-label="Typical range">${esc(l.range)}</td>
    <td data-label="Status"><span class="badge badge--${statusClass[l.status]}">${esc(l.statusText)}</span>${l.note ? `<span class="muted cell-sub">${esc(l.note)}</span>` : ''}</td>
    <td data-label="Date">${esc(labDate)}</td>
  </tr>`).join('');
}

initShell({ page: 'health' }).then((ctx) => {
  if (!ctx) return;
  const draw = renderCharts();
  renderLabs();
  hydrateIcons(document);
  initTabs($('[role="tablist"]'), { onChange: (name) => { if (name === 'trends') requestAnimationFrame(draw); } });
});
