// Today tab: KPI tiles, today's meals, next visit, next step and the latest care-team note.
import { initShell, hydrateIcons } from './app-shell.js';
import { dateFromOffset, esc, fmt, icon, nutrientRow, toast } from './app-ui.js';
import { dietitianMessages, mealSlots, persona, targets, week } from '../data/fung.js';
import { upcomingVisits, downloadIcs } from './app-visits.js';

const todayIndex = (new Date().getDay() + 6) % 7;
const todayPlan = week[todayIndex];
let fluidLogged = targets.fluid.logged;

function greeting(name) {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  return `${part}, ${name}`;
}

function status(pct) {
  if (pct > 100) return { cls: 'high', text: 'Over' };
  if (pct >= 75) return { cls: 'mid', text: 'Watch' };
  return { cls: 'low', text: 'OK' };
}

function kpiTile(key, value, { target, unit, label }, extra = '') {
  const pct = Math.round((value / target) * 100);
  const st = status(pct);
  const tileIcon = { k: 'leaf', p: 'chart', na: 'drop', fluid: 'drop' }[key];
  return `<article class="kpi kpi--${st.cls}" data-kpi="${key}">
    <div class="kpi-top"><h3 class="kpi-label">${icon(tileIcon)}${esc(label)}</h3><span class="badge badge--${st.cls}">${st.text}</span></div>
    <p class="kpi-value"><span data-kpi-value>${value.toLocaleString()}</span> <span class="kpi-unit">${esc(unit)}</span></p>
    <div class="meter" role="progressbar" aria-label="${esc(label)}: ${pct}% of daily target" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(pct, 100)}"><span style="width:${Math.min(pct, 100)}%"></span></div>
    <p class="kpi-foot">${pct}% of ${target.toLocaleString()} ${esc(unit)} target</p>
    ${extra}
  </article>`;
}

function renderKpis() {
  const totals = { k: 0, p: 0, na: 0 };
  mealSlots.forEach(({ key }) => { ['k', 'p', 'na'].forEach((n) => { totals[n] += todayPlan[key][n]; }); });
  const grid = document.querySelector('[data-kpis]');
  grid.innerHTML = ['k', 'p', 'na'].map((n) => kpiTile(n, totals[n], targets[n])).join('')
    + kpiTile('fluid', fluidLogged, targets.fluid, `<button class="button button--ghost kpi-action" type="button" data-log-fluid>${icon('plus')}Log a cup (250 mL)</button>`);
  grid.querySelector('[data-log-fluid]').addEventListener('click', () => {
    fluidLogged += 250;
    renderKpis();
    grid.querySelector('[data-log-fluid]').focus();
    toast(`Logged 250 mL. Mom is at ${fluidLogged.toLocaleString()} mL today (sample).`);
  });
}

function renderMeals() {
  const list = document.querySelector('[data-today-meals]');
  list.innerHTML = mealSlots.filter((s) => s.key !== 'snack').map((slot) => {
    const meal = todayPlan[slot.key];
    return `<li class="meal-item">
      <div class="meal-when"><span class="meal-slot">${slot.label}</span><span class="muted">${slot.time}</span></div>
      <div class="meal-body">
        <h3 class="meal-name">${esc(meal.name)} <span class="meal-zh" lang="zh-Hant">${esc(meal.zh)}</span></h3>
        ${nutrientRow(meal)}
      </div>
    </li>`;
  }).join('');
}

function renderAppointment() {
  const box = document.querySelector('[data-next-appt]');
  const next = upcomingVisits()[0];
  if (!next) {
    box.innerHTML = `<div class="panel-title"><h2 id="appt-title">Next appointment</h2></div><p>No visits booked.</p><a class="button button--secondary" href="/care-team.html#visits">Book a visit</a>`;
    return;
  }
  const d = new Date(next.iso);
  const video = next.mode === 'Video visit';
  box.innerHTML = `<div class="panel-title"><h2 id="appt-title">Next appointment</h2><span class="chip">${icon(video ? 'video' : 'calendar')}${esc(next.mode)}</span></div>
    <div class="appt-main">
      <div class="date-block" aria-hidden="true"><span>${fmt.month(d)}</span><strong>${fmt.dateNum(d)}</strong></div>
      <div><p class="appt-title">${esc(next.title)}</p><p class="muted">${fmt.day(d)} · ${fmt.time(d)}<br>${esc(next.with)}</p></div>
    </div>
    <div class="appt-actions">
      ${video ? `<button class="button" type="button" data-join>${icon('video')}Join video visit</button>` : ''}
      <button class="button button--secondary" type="button" data-ics>${icon('calendar')}Add to calendar</button>
    </div>`;
  box.querySelector('[data-join]')?.addEventListener('click', () => toast('This is a demo, so there is no live video call. In the real app this would open the visit.'));
  box.querySelector('[data-ics]').addEventListener('click', () => { downloadIcs(next); toast('Calendar file downloaded. Open it to add the visit.'); });
}

function renderNextStep() {
  document.querySelector('[data-next-step]').innerHTML = `
    <p class="eyebrow">Next step</p>
    <h2 id="next-title">Make Mom's lo mein kidney-friendly</h2>
    <p>Sunday lunch is her favourite. The recipe helper swaps the oyster sauce and char siu and shows the sodium it saves.</p>
    <a class="button button--accent" href="/meals.html?dish=${encodeURIComponent("Mom's lo mein with soy sauce, oyster sauce and char siu")}#helper">${icon('sparkle')}Open recipe helper</a>`;
}

function renderMessage() {
  const last = [...dietitianMessages].reverse().find((m) => m.from === 'dietitian');
  const when = dateFromOffset(-last.daysAgo);
  document.querySelector('[data-msg-preview]').innerHTML = `
    <div class="panel-title"><h2 id="msg-title">Recent from care team</h2><span class="badge badge--low">1 new</span></div>
    <div class="msg-row">
      <span class="avatar avatar--clay" aria-hidden="true">${esc(persona.dietitian.initials)}</span>
      <div class="msg-body">
        <p class="msg-from"><strong>${esc(persona.dietitian.name)}</strong> <span class="chip chip--clay">Sample · fictional</span> <span class="muted">${fmt.short(when)}, ${esc(last.time)}</span></p>
        <p class="msg-text">${esc(last.text)}</p>
      </div>
      <a class="button button--secondary" href="/care-team.html#messages">${icon('care')}Reply</a>
    </div>`;
}

const roleText = { caregiver: 'Caregiver', patient: 'Patient' };
const stageText = { g3b: 'Stage G3b', g4: 'Stage G4', unsure: 'Stage not confirmed yet' };
const goalText = {
  'familiar-meals': 'Start with familiar meals you enjoy and discuss changes with a renal dietitian.',
  'understand-options': 'Bring your food questions to a renal dietitian or your care team.',
  'prepare-conversation': 'Write down the food questions you want to raise at the next visit.',
};

function renderQuiz(ctx) {
  if (ctx.isDemo) return;
  const box = document.querySelector('[data-quiz]');
  const q = ctx.quiz;
  box.hidden = false;
  box.innerHTML = q && roleText[q.role]
    ? `<div class="panel-title"><h2 id="quiz-title">Your quiz answers</h2></div>
       <p class="quiz-chips"><span class="chip">${roleText[q.role]}</span><span class="chip chip--clay">${stageText[q.stage] || 'Stage not set'}</span></p>
       <p>${esc(goalText[q.goal] || 'Explore the sample workspace to see how FuelWell works.')}</p>
       <a class="link-arrow" href="/start.html">Update your answers ${icon('arrow')}</a>`
    : `<div class="panel-title"><h2 id="quiz-title">Personalise FuelWell</h2></div>
       <p>You're exploring the sample workspace for Fung. Take the short quiz to save your role and stage.</p>
       <a class="link-arrow" href="/start.html">Take the matching quiz ${icon('arrow')}</a>`;
}

initShell({ page: 'today', withQuiz: true }).then((ctx) => {
  if (!ctx) return;
  const { patient } = persona;
  document.querySelector('[data-greeting]').textContent = greeting(ctx.displayName);
  document.querySelector('[data-today-date]').textContent = `Today · ${fmt.day(new Date())}`;
  document.querySelector('[data-patient-meta]').innerHTML = `
    <span class="chip">${icon('heart')}${esc(patient.name)} · ${patient.age}</span>
    <span class="chip">Stage ${esc(patient.stage)} · eGFR ${patient.egfr}</span>`;
  renderKpis();
  renderMeals();
  renderAppointment();
  renderNextStep();
  renderMessage();
  renderQuiz(ctx);
  hydrateIcons(document);
});
