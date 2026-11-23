// Today tab: nutrient tiles, today's meals, the next visit and compact calendar and a recipe nudge.
import { initShell } from './app-shell.js';
import { esc, fmt, icon, num, storage, toast } from './app-ui.js';
import { mealSlots, persona, targets, week } from '../data/fung.js';
import { upcomingVisits, downloadIcs } from './app-visits.js';
import { tr } from './i18n.js';
import { t } from './app-strings.js';
import { whoVars } from './who.js';
import { CKD_STAGES, saveProfile } from '../auth/profile.js';

import { createCalendar, dateKey } from './calendar.js';
let calendar;
const progressStore = storage('session');

function renderProgress() {
  const key = `fuelwell.meals.${dateKey(new Date())}`;
  const done = progressStore.get(key, []);
  const n = mealSlots.filter((slot) => done.includes(slot.key)).length;
  const label = t('meals_complete', { n, total: mealSlots.length });
  const box = document.querySelector('[data-daily-progress]');
  box.innerHTML = `<p class="meal-progress-label" role="status">${esc(t('meals_done_short', { n, total: mealSlots.length }))}</p><div class="meter" role="progressbar" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="${mealSlots.length}" aria-valuenow="${n}"><span style="width:${n / mealSlots.length * 100}%"></span></div>`;
}

const $ = (sel) => document.querySelector(sel);
const local = storage('local');
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
  return `<article class="nutrient-row kpi--${st.cls}">
    <div class="nutrient-label"><h3>${esc(name)}</h3><span>${num(value)} / ${num(target)} ${esc(unit)}</span></div>
    <div class="meter" role="progressbar" aria-label="${esc(t('meter_label', { label: name, pct }))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(pct, 100)}"><span style="width:${Math.min(pct, 100)}%"></span></div>
  </article>`;
}

function renderKpis() {
  const totals = { k: 0, p: 0, na: 0 };
  mealSlots.forEach(({ key }) => { ['k', 'p', 'na'].forEach((n) => { totals[n] += todayPlan[key][n]; }); });
  $('[data-kpis]').innerHTML = ['k', 'p', 'na'].map((n) => kpiTile(n, totals[n], targets[n])).join('');
}

function renderMeals() {
  const key = `fuelwell.meals.${dateKey(new Date())}`;
  const done = progressStore.get(key, []);
  const list = $('[data-today-meals]');
  list.innerHTML = mealSlots.map((slot) => {
    const meal = todayPlan[slot.key];
    return `<li class="meal-item meal-item--simple${done.includes(slot.key) ? ' is-complete' : ''}">
      <label class="meal-complete"><input type="checkbox" value="${slot.key}" aria-label="${esc(tr(slot.label))}"${done.includes(slot.key) ? ' checked' : ''}></label>
      <div class="meal-body"><div class="meal-line"><span class="meal-slot">${esc(tr(slot.label))}</span><span class="muted">${fmt.clock(slot.h, slot.m)}</span></div>
        <h3 class="meal-name">${esc(tr(meal.name))}</h3>
      </div>
    </li>`;
  }).join('');
  list.querySelectorAll('input').forEach((input) => input.addEventListener('change', () => {
    progressStore.set(key, [...list.querySelectorAll('input:checked')].map((el) => el.value));
    renderProgress();
    input.closest('.meal-item').classList.toggle('is-complete', input.checked);
  }));
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

// Real accounts: three first steps instead of the demo family's sample day. Each is done from real
// data (the profile) or a flag the Meals page sets the first time it's used (fuelwell.started.*).
function renderGetStarted(ctx) {
  const p = ctx.profile || {};
  const hasPlan = Boolean(p.forWhom && (p.stage || p.egfr || Object.values(p.limits || {}).some(Boolean)));
  const steps = [
    { key: 'plan', done: hasPlan, href: '/personalize.html?welcome', icon: 'health' },
    { key: 'ask', done: Boolean(local.get('fuelwell.started.ask')), href: '/meals.html#ask', icon: 'sparkle' },
    { key: 'browse', done: Boolean(local.get('fuelwell.started.browse')), href: '/meals.html#browse', icon: 'heart' },
  ];
  const box = $('[data-get-started]');
  const n = steps.filter((x) => x.done).length;
  box.hidden = n === steps.length;
  if (box.hidden) return;
  box.innerHTML = `
    <div class="panel-title"><div><p class="eyebrow">${esc(t('gs_eyebrow'))}</p><h2 id="gs-title">${esc(t('gs_title'))}</h2></div>
      <p class="gs-count" role="status">${esc(t('gs_count', { n, total: steps.length }))}</p></div>
    <ol class="gs-list">${steps.map((x, i) => `
      <li class="gs-step${x.done ? ' is-done' : ''}">
        <span class="gs-mark" aria-hidden="true">${x.done ? icon('check') : i + 1}</span>
        <div class="gs-text"><strong>${esc(t(`gs_${x.key}`))}</strong><span>${esc(t(`gs_${x.key}_sub`))}</span></div>
        ${x.done ? `<span class="gs-done">${esc(t('gs_done'))}</span>` : `<a class="button${i === steps.findIndex((y) => !y.done) ? '' : ' button--ghost'}" href="${x.href}">${esc(t(`gs_${x.key}_go`))}</a>`}
      </li>`).join('')}</ol>`;
}

function renderNextStep(isDemo) {
  // The demo's example is Mom's lo mein; a real account starts from a blank question.
  const dish = { en: 'Mom’s lo mein with soy sauce, oyster sauce and char siu', zh: '媽媽的叉燒撈麵，用豉油和蠔油', es: 'El lo mein de mamá con salsa de soya, salsa de ostión y char siu' };
  const href = isDemo ? `/meals.html?dish=${encodeURIComponent(tr(dish))}#ask` : '/meals.html#ask';
  $('[data-next-step]').innerHTML = `
    <h2 id="next-title">${esc(t('recipe_cta_title'))}</h2>
    <p>${esc(t(isDemo ? 'recipe_cta_body' : 'recipe_cta_body_real'))}</p>
    <a class="link-arrow" href="${href}">${icon('sparkle')}${esc(t(isDemo ? 'recipe_cta_button' : 'recipe_cta_button_real'))} ${icon('arrow')}</a>`;
}

const goalKey = { 'familiar-meals': 'goal_familiar', 'eat-healthier': 'goal_healthier', 'fuel-performance': 'goal_fuel', 'understand-options': 'goal_understand', 'prepare-conversation': 'goal_prepare' };
const cuisineIdeas = ['Cantonese', 'Chinese', 'Filipino', 'Indian', 'Japanese', 'Korean', 'Mexican', 'Mediterranean', 'Middle Eastern', 'Soul food', 'Vietnamese', 'West African'];
let editingProfile = false;
let profileDraft = null;

const stageLabel = (stage) => {
  if (stage === 'unsure') return t('stage_unsure');
  if (stage === 'g5d') return t('stage_dialysis');
  return stage ? t('stage', { s: `G${stage.slice(1)}` }) : t('profile_not_set');
};
// "Kidney disease · Stage G3" when a stage is known, otherwise just the condition.
const kidneyLabel = (p) => (p.stage && p.stage !== 'unsure' ? `${t('cond_kidney')} · ${stageLabel(p.stage)}` : t('cond_kidney'));
const conditionsOf = (p) => [
  p?.highBloodPressure && t('cond_hbp'),
  p?.diabetes && t('cond_diabetes'),
  p?.kidneyDisease && kidneyLabel(p),
].filter(Boolean);

function profileView(ctx) {
  const p = ctx.profile;
  const role = { caregiver: t('role_caregiver'), patient: t('role_patient') }[ctx.quiz?.role];
  const conditions = conditionsOf(p);
  return `<div class="panel-title"><h2 id="profile-title">${esc(t('profile_title'))}</h2>
      <button class="button button--secondary profile-edit" type="button" data-profile-edit>${esc(t('profile_edit'))}</button></div>
    <p class="profile-name">${esc(p.fullName)}${role ? ` <span class="chip chip--plain">${esc(role)}</span>` : ''}</p>
    <dl class="profile-facts">
      <div><dt>${esc(t('profile_cuisine'))}</dt><dd>${esc(p.cuisine || t('profile_not_set'))}</dd></div>
      <div><dt>${esc(t('profile_conditions'))}</dt><dd>${conditions.length ? conditions.map((c) => `<span class="chip chip--clay">${esc(c)}</span>`).join('') : esc(t('cond_none'))}</dd></div>
    </dl>
    ${ctx.quiz?.role === 'caregiver' ? `<p class="muted profile-note">${esc(t('profile_for_caregiver'))}</p>` : ''}
    ${goalKey[ctx.quiz?.goal] ? `<p class="profile-note">${esc(t(goalKey[ctx.quiz.goal]))}</p>` : ''}`;
}

function profileForm(ctx, d) {
  const check = (name, label, on) => `<label class="profile-check"><input type="checkbox" name="${name}"${on ? ' checked' : ''} /><span>${esc(label)}</span></label>`;
  return `<div class="panel-title"><h2 id="profile-title">${esc(ctx.profile ? t('profile_title') : t('profile_add'))}</h2></div>
    ${ctx.profile ? '' : `<p>${esc(t('profile_empty'))}</p>`}
    <form class="profile-form" novalidate data-profile-form>
      <p class="form-error" role="alert" data-profile-error hidden></p>
      <div class="field"><label for="pf-name">${esc(t('profile_name'))}</label>
        <input id="pf-name" name="fullName" type="text" autocomplete="name" maxlength="80" required value="${esc(d.fullName || '')}" /></div>
      <div class="field"><label for="pf-cuisine">${esc(t('profile_cuisine'))}</label>
        <input id="pf-cuisine" name="cuisine" type="text" list="pf-cuisines" maxlength="80" autocomplete="off" aria-describedby="pf-cuisine-hint" value="${esc(d.cuisine || '')}" />
        <datalist id="pf-cuisines">${cuisineIdeas.map((c) => `<option value="${esc(c)}"></option>`).join('')}</datalist>
        <p class="hint" id="pf-cuisine-hint">${esc(t('profile_cuisine_hint'))}</p></div>
      <fieldset class="field profile-checks"><legend>${esc(t('profile_conditions'))}</legend>
        ${check('highBloodPressure', t('cond_hbp'), d.highBloodPressure)}
        ${check('diabetes', t('cond_diabetes'), d.diabetes)}
        ${check('kidneyDisease', t('cond_kidney'), d.kidneyDisease)}
        <p class="hint">${esc(t('profile_conditions_hint'))}</p></fieldset>
      <div class="field" data-stage-field${d.kidneyDisease ? '' : ' hidden'}><label for="pf-stage">${esc(t('profile_stage'))}</label>
        <select id="pf-stage" name="stage" aria-describedby="pf-stage-hint"><option value="">${esc(t('profile_not_set'))}</option>${CKD_STAGES.map((s) => `<option value="${s}"${d.stage === s ? ' selected' : ''}>${esc(stageLabel(s))}</option>`).join('')}</select>
        <p class="hint" id="pf-stage-hint">${esc(t('profile_stage_hint'))}</p></div>
      <div class="profile-actions">
        <button class="button" type="submit">${esc(t('profile_save'))}</button>
        ${ctx.profile ? `<button class="button button--ghost" type="button" data-profile-cancel>${esc(t('profile_cancel'))}</button>` : ''}
      </div>
      <p class="hint profile-privacy">${esc(t('profile_privacy'))} <a href="/privacy.html">${esc(t('privacy_link'))}</a></p>
    </form>`;
}

function readProfileForm(form) {
  const data = new FormData(form);
  return {
    fullName: String(data.get('fullName') || ''),
    cuisine: String(data.get('cuisine') || ''),
    kidneyDisease: data.has('kidneyDisease'),
    stage: String(data.get('stage') || '') || null,
    highBloodPressure: data.has('highBloodPressure'),
    diabetes: data.has('diabetes'),
  };
}

function renderProfile(ctx) {
  // The demo keeps Heidi's curated persona.
  if (ctx.isDemo) return;
  const box = $('[data-profile]');
  box.hidden = false;
  const openForm = box.querySelector('[data-profile-form]');
  // Re-rendering (for example on a language switch) keeps whatever was typed.
  if (openForm) profileDraft = readProfileForm(openForm);
  if (!editingProfile && ctx.profile) {
    box.innerHTML = profileView(ctx);
    box.querySelector('[data-profile-edit]').addEventListener('click', () => {
      editingProfile = true;
      profileDraft = { ...ctx.profile };
      renderProfile(ctx);
      box.querySelector('#pf-name').focus();
    });
    return;
  }
  const fromQuiz = CKD_STAGES.includes(ctx.quiz?.stage) ? ctx.quiz.stage : null;
  box.innerHTML = profileForm(ctx, profileDraft || { kidneyDisease: Boolean(fromQuiz), stage: fromQuiz });
  const form = box.querySelector('[data-profile-form]');
  // The kidney stage only applies when kidney disease is ticked.
  const kidneyBox = form.querySelector('[name="kidneyDisease"]');
  kidneyBox.addEventListener('change', () => { form.querySelector('[data-stage-field]').hidden = !kidneyBox.checked; });
  const errorBox = form.querySelector('[data-profile-error]');
  const showError = (msg) => { errorBox.textContent = msg; errorBox.hidden = !msg; };
  form.querySelector('[data-profile-cancel]')?.addEventListener('click', () => {
    editingProfile = false;
    profileDraft = null;
    renderProfile(ctx);
    box.querySelector('[data-profile-edit]')?.focus();
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readProfileForm(form);
    if (!values.fullName.trim()) {
      showError(t('profile_name_error'));
      form.querySelector('#pf-name').focus();
      return;
    }
    const controls = [...form.querySelectorAll('input, select, button')];
    controls.forEach((c) => { c.disabled = true; });
    form.querySelector('[type="submit"]').setAttribute('aria-busy', 'true');
    showError('');
    try {
      // Keep the /personalize answers (eGFR, care-team limits) this short form doesn't show.
      ctx.profile = await saveProfile(ctx.user, { ...ctx.profile, ...values });
      editingProfile = false;
      profileDraft = null;
      ctx.repaint();
      $('[data-profile-edit]')?.focus();
      toast(t('profile_saved'));
    } catch {
      controls.forEach((c) => { c.disabled = false; });
      form.querySelector('[type="submit"]').removeAttribute('aria-busy');
      showError(t('profile_save_error'));
    }
  });
}


initShell({
  page: 'today',
  withQuiz: true,
  title: 'title_today',
  render(ctx) {
    $('[data-greeting]').textContent = greeting(ctx.displayName);
    $('[data-today-date]').textContent = t('today_eyebrow', { date: fmt.day(new Date()) });
    // The nutrients, meals and visits on this page are the demo family's sample plan. Real accounts
    // don't see them (they'd look like their own health data); they get their first steps instead.
    document.querySelectorAll('[data-sample]').forEach((el) => { el.hidden = !ctx.isDemo; });
    $('[data-today-sub]').textContent = t(ctx.isDemo ? 'today_sub' : 'today_sub_real', whoVars(ctx.profile, ctx.isDemo));
    if (ctx.isDemo) {
      renderKpis();
      renderProgress();
      if (!calendar) calendar = createCalendar($('[data-care-calendar]'), { visits: upcomingVisits, compact: true });
      else calendar.render();
      renderMeals();
      renderAppointment();
    } else {
      renderGetStarted(ctx);
    }
    renderNextStep(ctx.isDemo);
    renderProfile(ctx);
  },
});

