// Today tab: nutrient tiles, today's meals, the dietitian, the next visit and a recipe nudge.
import { initShell, langBadge } from './app-shell.js';
import { esc, fmt, icon, levelPills, num, toast } from './app-ui.js';
import { dietitianMessages, mealSlots, persona, targets, week } from '../data/fung.js';
import { upcomingVisits, downloadIcs } from './app-visits.js';
import { lang, tr } from './i18n.js';
import { t } from './app-strings.js';

const $ = (sel) => document.querySelector(sel);
const todayIndex = (new Date().getDay() + 6) % 7;
const todayPlan = week[todayIndex];

function greeting(name) {
  const h = new Date().getHours();
  return t(h < 12 ? 'greet_morning' : h < 18 ? 'greet_afternoon' : 'greet_evening', { name });
}

function status(pct) {
  if (pct > 100) return { cls: 'high', text: t('status_over') };
  if (pct >= 75) return { cls: 'mid', text: t('status_watch') };
  return { cls: 'low', text: t('status_ok') };
}

function kpiTile(key, value, { target, unit, label }) {
  const pct = Math.round((value / target) * 100);
  const st = status(pct);
  const name = tr(label);
  return `<article class="kpi kpi--${st.cls}">
    <div class="kpi-top"><h3 class="kpi-label">${esc(name)}</h3><span class="badge badge--${st.cls}">${st.text}</span></div>
    <p class="kpi-value">${num(value)} <span class="kpi-unit">${esc(unit)}</span></p>
    <div class="meter" role="progressbar" aria-label="${esc(t('meter_label', { label: name, pct }))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(pct, 100)}"><span style="width:${Math.min(pct, 100)}%"></span></div>
    <p class="kpi-foot">${esc(t('of_target', { pct, target: num(target), unit }))}</p>
  </article>`;
}

function renderKpis() {
  const totals = { k: 0, p: 0, na: 0 };
  mealSlots.forEach(({ key }) => { ['k', 'p', 'na'].forEach((n) => { totals[n] += todayPlan[key][n]; }); });
  $('[data-kpis]').innerHTML = ['k', 'p', 'na'].map((n) => kpiTile(n, totals[n], targets[n])).join('');
}

function renderMeals() {
  const showDish = lang() !== 'zh';
  $('[data-today-meals]').innerHTML = mealSlots.map((slot) => {
    const meal = todayPlan[slot.key];
    return `<li class="meal-item">
      <div class="meal-when"><span class="meal-slot">${esc(tr(slot.label))}</span><span class="muted">${fmt.clock(slot.h, slot.m)}</span></div>
      <div class="meal-body">
        <h3 class="meal-name">${esc(tr(meal.name))}${showDish ? ` <span class="meal-zh" lang="zh-Hant">${esc(meal.dish)}</span>` : ''}</h3>
        ${levelPills(meal)}
      </div>
    </li>`;
  }).join('');
}

function renderDietitian() {
  const d = persona.dietitian;
  const last = [...dietitianMessages].reverse().find((m) => m.from === 'dietitian');
  $('[data-dietitian]').innerHTML = `
    <div class="dt-head">
      <span class="avatar avatar--clay avatar--lg" aria-hidden="true">${esc(d.initials)}<span class="presence" aria-hidden="true"></span></span>
      <div class="dt-who"><p class="eyebrow">${esc(t('dietitian_card_title'))}</p><h2 id="dt-title">${esc(d.name)}</h2></div>
      ${langBadge()}
    </div>
    <blockquote class="dt-quote"><p>${esc(tr(last.text))}</p></blockquote>
    <div class="dt-foot">
      <span class="muted">${esc(t('latest_note', { when: fmt.relative(-last.daysAgo) }))}</span>
      <a class="button button--secondary" href="/care-team.html#messages">${icon('care')}${esc(t('reply_mei'))}</a>
    </div>`;
}

function renderAppointment() {
  const box = $('[data-next-appt]');
  const next = upcomingVisits()[0];
  if (!next) {
    box.innerHTML = `<div class="panel-title"><h2 id="appt-title">${esc(t('next_visit'))}</h2></div><p>${esc(t('no_visits'))}</p><a class="button button--secondary" href="/care-team.html#visits">${esc(t('book_visit'))}</a>`;
    return;
  }
  const d = new Date(next.iso);
  box.innerHTML = `<div class="panel-title"><h2 id="appt-title">${esc(t('next_visit'))}</h2><span class="chip">${icon(next.video ? 'video' : 'calendar')}${esc(tr(next.mode))}</span></div>
    <div class="appt-main">
      <div class="date-block" aria-hidden="true"><span>${fmt.month(d)}</span><strong>${fmt.dateNum(d)}</strong></div>
      <div><p class="appt-title">${esc(tr(next.title))}</p><p class="muted">${fmt.day(d)} · ${fmt.time(d)}<br>${esc(tr(next.with))}</p></div>
    </div>
    <div class="appt-actions">
      ${next.video ? `<button class="button" type="button" data-join>${icon('video')}${esc(t('join_video'))}</button>` : ''}
      <button class="button button--ghost" type="button" data-ics>${icon('calendar')}${esc(t('add_calendar'))}</button>
    </div>`;
  box.querySelector('[data-join]')?.addEventListener('click', () => toast(t('join_toast')));
  box.querySelector('[data-ics]').addEventListener('click', () => { downloadIcs(next); toast(t('calendar_done')); });
}

function renderNextStep() {
  const dish = { en: 'Mom’s lo mein with soy sauce, oyster sauce and char siu', zh: '媽媽的叉燒撈麵，用豉油和蠔油', es: 'El lo mein de mamá con salsa de soya, salsa de ostión y char siu' };
  $('[data-next-step]').innerHTML = `
    <h2 id="next-title">${esc(t('recipe_cta_title'))}</h2>
    <p>${esc(t('recipe_cta_body'))}</p>
    <a class="link-arrow" href="/meals.html?dish=${encodeURIComponent(tr(dish))}#helper">${icon('sparkle')}${esc(t('recipe_cta_button'))} ${icon('arrow')}</a>`;
}

const stageKey = { g3: 'G3', g3b: 'G3b', g4: 'G4' };
const goalKey = { 'familiar-meals': 'goal_familiar', 'understand-options': 'goal_understand', 'prepare-conversation': 'goal_prepare' };

function renderQuiz(ctx) {
  if (ctx.isDemo) return;
  const box = $('[data-quiz]');
  const q = ctx.quiz;
  box.hidden = false;
  const role = q && { caregiver: t('role_caregiver'), patient: t('role_patient') }[q.role];
  const stage = q?.stage === 'unsure' ? t('stage_unsure') : stageKey[q?.stage] ? t('stage', { s: stageKey[q.stage] }) : t('stage_not_set');
  box.innerHTML = role
    ? `<div class="panel-title"><h2 id="quiz-title">${esc(t('quiz_title'))}</h2></div>
       <p class="quiz-chips"><span class="chip">${esc(role)}</span><span class="chip chip--clay">${esc(stage)}</span></p>
       <p>${esc(goalKey[q.goal] ? t(goalKey[q.goal]) : t('quiz_explore'))}</p>
       <a class="link-arrow" href="/start.html">${esc(t('quiz_update'))} ${icon('arrow')}</a>`
    : `<div class="panel-title"><h2 id="quiz-title">${esc(t('quiz_personalise'))}</h2></div>
       <p>${esc(t('quiz_intro'))}</p>
       <a class="link-arrow" href="/start.html">${esc(t('quiz_take'))} ${icon('arrow')}</a>`;
}

initShell({
  page: 'today',
  withQuiz: true,
  title: 'title_today',
  render(ctx) {
    const { patient } = persona;
    $('[data-greeting]').textContent = greeting(ctx.displayName);
    $('[data-today-date]').textContent = t('today_eyebrow', { date: fmt.day(new Date()) });
    $('[data-patient-meta]').innerHTML = `<span class="chip">${icon('heart')}${esc(patient.name)} · ${patient.age} · ${esc(t('stage', { s: patient.stage }))} · eGFR ${patient.egfr}</span>`;
    renderKpis();
    renderMeals();
    renderDietitian();
    renderAppointment();
    renderNextStep();
    renderQuiz(ctx);
  },
});

