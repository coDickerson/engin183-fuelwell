// /personalize ("My plan"): after sign-up, people enter their kidney score (eGFR), what their care
// team limits and how they eat. The right-hand card turns that into a plan as they type: the KDIGO
// stage and what it means, which nutrients FuelWell will focus on, the protein rule, and 3 catalog
// swaps picked for them. Saved to the person's own profile (owner-only RLS); Meals sends it to the AI.
// The demo shows Fung's plan and never saves.
import { initShell } from './app-shell.js';
import { esc, icon, toast } from './app-ui.js';
import { t } from './app-strings.js';
import { elementBadge } from './app-meals-ask.js';
import { LIMIT_KEYS, saveProfile, stageFromEgfr } from '../auth/profile.js';
import { photoUrl, swapPhotos } from '../data/swap-photos.js';
import { forget, loadMemory } from './family-memory.js';

const $ = (sel, root = document) => root.querySelector(sel);
const form = () => $('[data-pz-form]');

// KDIGO 2024 eGFR bands, low to high, for the meter. Widths are the band's share of 0-90+.
const BANDS = [
  { stage: 'g5', from: 0, to: 15 },
  { stage: 'g4', from: 15, to: 30 },
  { stage: 'g3b', from: 30, to: 45 },
  { stage: 'g3a', from: 45, to: 60 },
  { stage: 'g2', from: 60, to: 90 },
  { stage: 'g1', from: 90, to: 120 },
];
const LATE = ['g4', 'g5', 'g5d'];
const LIMIT_CODE = { sodium: 'Na', potassium: 'K', phosphorus: 'P', fluid: 'Fluid' };
const NUTRIENT_NAME = { sodium: 'sodium', potassium: 'potassium', phosphorus: 'phosphorus', fluid: 'nutrient_fluid' };

// Fung, the demo patient: eGFR 38 (G3b), Cantonese home cooking, potassium limited after a high result.
const DEMO = {
  egfr: 38, dialysis: false, stage: '', diabetes: false, bp: true, fullName: 'Heidi', forWhom: 'family', careFor: 'mom', careForName: '', cuisine: 'Cantonese', usually: 'home',
  limits: { sodium: 'limit', potassium: 'limit', phosphorus: 'unsure', fluid: 'no_limit' },
};

let ctx = null;
let catalog = null;

/* ---------- Reading the form ---------- */
function values() {
  const f = form();
  const radio = (name) => f.querySelector(`input[name="${name}"]:checked`)?.value || null;
  const raw = f.egfr.value.trim();
  const limits = {};
  for (const k of LIMIT_KEYS) limits[k] = radio(`limit_${k}`);
  return {
    egfrRaw: raw,
    egfr: raw === '' ? null : Number(raw),
    dialysis: f.dialysis.checked,
    stage: f.stage.value,
    diabetes: f.diabetes.checked,
    bp: f.bp.checked,
    fullName: f.full_name.value.trim().replace(/\s+/g, ' '),
    forWhom: radio('for_whom'),
    careFor: f.care_for.value || null,
    careForName: f.care_for_name.value.trim().replace(/\s+/g, ' '),
    cuisine: f.cuisine.value.trim(),
    usually: radio('usually'),
    limits,
  };
}

/** The stage to use: dialysis wins, then the eGFR, then the stage they picked. */
function stageOf(v) {
  if (v.dialysis) return 'g5d';
  return stageFromEgfr(v.egfrRaw) || v.stage || null;
}

function fill(v) {
  const f = form();
  f.egfr.value = v.egfr ?? '';
  f.dialysis.checked = Boolean(v.dialysis);
  f.stage.value = v.stage || '';
  f.diabetes.checked = Boolean(v.diabetes);
  f.bp.checked = Boolean(v.bp);
  f.cuisine.value = v.cuisine || '';
  f.full_name.value = v.fullName || '';
  f.care_for.value = v.careFor || '';
  f.care_for_name.value = v.careForName || '';
  const check = (name, value) => { const el = value && f.querySelector(`input[name="${name}"][value="${value}"]`); if (el) el.checked = true; };
  check('for_whom', v.forWhom);
  check('usually', v.usually);
  for (const k of LIMIT_KEYS) check(`limit_${k}`, v.limits?.[k]);
}

/** Saved profile (auth/profile.js shape) -> form values. */
function fromProfile(p) {
  if (!p) return null;
  return {
    egfr: p.egfr,
    dialysis: p.stage === 'g5d',
    // Only show a picked stage when there is no eGFR to work it out from.
    stage: p.egfr == null && p.stage && !['g5d', 'unsure'].includes(p.stage) ? p.stage : '',
    diabetes: p.diabetes,
    bp: p.highBloodPressure,
    fullName: p.fullName,
    forWhom: p.forWhom,
    careFor: p.careFor,
    careForName: p.careForName,
    cuisine: p.cuisine,
    usually: p.usually,
    limits: p.limits,
  };
}

/* ---------- The meter ---------- */
function paintMeter(v) {
  const meter = $('[data-pz-meter]');
  const stage = stageOf(v);
  const egfrStage = stageFromEgfr(v.egfrRaw);
  const max = BANDS.at(-1).to;
  const marker = egfrStage && !v.dialysis ? Math.min(Number(v.egfrRaw), max - 1) / max * 100 : null;
  meter.setAttribute('aria-label', `${t('pz_meter_label')}${stage ? `: ${stageLabel(stage)}` : ''}`);
  meter.innerHTML = `
    <div class="pz-meter-bar">
      ${BANDS.map((b) => `<span class="pz-band pz-band--${b.stage}${stage === b.stage || (stage === 'g5d' && b.stage === 'g5') ? ' is-on' : ''}" style="flex-grow:${b.to - b.from}"><span>${stageCode(b.stage)}</span></span>`).join('')}
      ${marker !== null ? `<span class="pz-marker" style="left:${marker}%"><span>${esc(String(Math.round(Number(v.egfrRaw))))}</span></span>` : ''}
    </div>
    <div class="pz-meter-scale" aria-hidden="true">${[0, 15, 30, 45, 60, 90].map((n) => `<span style="left:${n / max * 100}%">${n}</span>`).join('')}</div>`;
}

/** 'g3b' -> 'G3b' (KDIGO writes the letter in capitals and the a/b in lower case). */
const stageCode = (stage) => `G${stage.slice(1)}`;
const stageLabel = (stage) => (stage === 'g5d' ? t('pz_dialysis') : `${t('pz_stage_word')} ${stageCode(stage)}`);

/* ---------- The plan ---------- */
function focusList(v, stage) {
  const items = [];
  const free = [];
  const limit = v.limits;
  // Sodium: always, at every stage (KDIGO 2024; NKF).
  items.push(['Na', limit.sodium === 'limit' ? t('pz_f_limit') : t('pz_f_na')]);
  for (const k of ['potassium', 'phosphorus']) {
    if (limit[k] === 'limit') items.push([LIMIT_CODE[k], t('pz_f_limit')]);
    else if (limit[k] === 'no_limit') free.push(t(NUTRIENT_NAME[k]));
    else if (stage && (LATE.includes(stage) || stage === 'g3b')) items.push([LIMIT_CODE[k], t(k === 'potassium' ? 'pz_f_k_ask' : 'pz_f_p_ask')]);
  }
  if (limit.fluid === 'limit') items.push(['Fluid', t('pz_f_limit')]);
  else if (limit.fluid !== 'no_limit' && stage === 'g5d') items.push(['Fluid', t('pz_f_fluid_ask')]);
  if (v.diabetes) items.push(['Sugar', t('pz_f_sugar')]);
  return { items, free };
}

// Regional names map to the catalog's family name ("Cantonese" -> "Chinese / Cantonese" and other Chinese rows).
const CUISINE_FAMILY = { cantonese: 'chinese', taiwanese: 'chinese', shanghainese: 'chinese', sichuan: 'chinese', hainanese: 'chinese', hakka: 'chinese', 'hong kong': 'chinese', salvadoran: 'latin', mexican: 'latin', 'soul food': 'american', southern: 'american' };
function cuisineMatch(want, rowCuisine) {
  if (!rowCuisine || rowCuisine === 'any') return false;
  if (rowCuisine.includes(want) || want.includes(rowCuisine.split(/\s*[/-]\s*/)[0])) return true;
  const fam = CUISINE_FAMILY[want];
  return Boolean(fam) && (rowCuisine.includes(fam) || rowCuisine.split(/\s*[/-]\s*/).some((part) => CUISINE_FAMILY[part] === fam));
}

/** Score catalog rows for this person: their cuisine first, then the nutrients they focus on. */
function picks(v, focusCodes) {
  if (!catalog?.length) return [];
  const want = new Set(focusCodes);
  const cuisine = v.cuisine.toLowerCase();
  const avoidOnly = new Set(Object.entries(v.limits).filter(([, x]) => x === 'no_limit').map(([k]) => LIMIT_CODE[k]));
  return catalog
    .map((r) => {
      const watch = r.watch || [];
      if (watch.length && watch.every((n) => avoidOnly.has(n))) return null;
      let score = watch.filter((n) => want.has(n)).length * 2;
      if (cuisine && cuisineMatch(cuisine, String(r.cuisine || '').toLowerCase())) score += 8;
      if (v.usually && r.eater_type === v.usually) score += 2;
      if (swapPhotos[r.meal]) score += 1;
      return { r, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.r);
}

function paintPlan() {
  const v = values();
  paintMeter(v);
  const stage = stageOf(v);
  const plan = $('[data-pz-plan]');
  const { items, free } = focusList(v, stage);
  const chosen = picks(v, items.map(([code]) => code));
  plan.innerHTML = `
    <p class="eyebrow" id="pz-plan-kicker">${esc(t('pz_plan_kicker'))}</p>
    ${stage ? `<div class="pz-stage">
        <span class="pz-stage-tile pz-band--${stage === 'g5d' ? 'g5' : stage}">${esc(stage === 'g5d' ? 'D' : stageCode(stage))}</span>
        <div><p class="pz-stage-name">${esc(stageLabel(stage))}${Number.isFinite(v.egfr) && !v.dialysis && stageFromEgfr(v.egfrRaw) ? ` · eGFR ${esc(String(Math.round(v.egfr)))}` : ''}</p>
        <p class="pz-stage-body">${esc(t(`pz_st_${stage}`))}</p></div>
      </div>` : `<p class="muted pz-plan-empty">${esc(t('pz_plan_empty'))}</p>`}
    <h3 class="pz-plan-h">${esc(t('pz_focus_h'))}</h3>
    <ul class="pz-focus">
      ${items.map(([code, why]) => `<li>${elementBadge(code)}<span>${esc(why)}</span></li>`).join('')}
      <li class="pz-protein">${icon('leaf')}<span>${esc(t(stage === 'g5d' ? 'pz_protein_dialysis' : 'pz_protein_ckd'))}</span></li>
    </ul>
    ${free.length ? `<p class="muted pz-free">${esc(t('pz_f_free', { list: free.join(', ') }))}</p>` : ''}
    ${chosen.length ? `<h3 class="pz-plan-h">${esc(t('pz_picks_h'))}</h3>
      <ul class="pz-picks">${chosen.map((r) => {
        const photo = swapPhotos[r.meal];
        return `<li><a class="pz-pick" href="/meals.html#browse">
          ${photo ? `<img src="${esc(photoUrl(photo, 160, 120))}" alt="" loading="lazy" width="80" height="60">` : `<span class="pz-pick-blank">${icon('meals')}</span>`}
          <span class="pz-pick-text"><strong>${esc(r.meal)}</strong><span>${esc(r.swap)}</span></span>
        </a></li>`;
      }).join('')}</ul>` : ''}
    <p class="notice pz-numbers">${icon('info')}<span>${esc(t('pz_numbers_note'))}</span></p>`;
}

/** "Who do you cook for?" and their name only apply when the swaps are for a family member. */
function paintCare() {
  $('[data-pz-care]').hidden = values().forWhom !== 'family';
}

function paintStatic() {
  paintCare();
  document.querySelectorAll('[data-limit-badge]').forEach((el) => { el.innerHTML = elementBadge(el.dataset.limitBadge); });
  const cuisines = [...new Set((catalog || []).map((r) => String(r.cuisine || '').split(/\s*[/-]\s*/)[0].trim()).filter((c) => c && c !== 'Any'))].sort();
  $('[data-pz-cuisines]').innerHTML = cuisines.map((c) => `<option value="${esc(c)}"></option>`).join('');
}

/* ---------- Saving ---------- */
function egfrValid(v) {
  return v.egfrRaw === '' || Boolean(stageFromEgfr(v.egfrRaw));
}

async function save(e) {
  e.preventDefault();
  const v = values();
  const err = $('#pz-egfr-err');
  const ok = egfrValid(v);
  err.hidden = ok;
  form().egfr.setAttribute('aria-invalid', String(!ok));
  if (!ok) { form().egfr.focus(); return; }

  if (ctx.isDemo) {
    toast(t('pz_demo_saved'));
    setTimeout(() => location.assign('/meals.html'), 1800);
    return;
  }
  const stage = stageOf(v);
  const button = $('[data-pz-save]');
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  $('[data-pz-error]').hidden = true;
  try {
    const p = ctx.profile || {};
    const meta = ctx.user.user_metadata || {};
    ctx.profile = await saveProfile(ctx.user, {
      ...p,
      fullName: v.fullName || p.fullName || meta.full_name || String(ctx.user.email || '').split('@')[0] || 'Me',
      cuisine: v.cuisine || null,
      // A stage means kidney disease; keep what they ticked before otherwise.
      kidneyDisease: Boolean(stage) || Boolean(p.kidneyDisease),
      stage: stage || (p.kidneyDisease ? p.stage || 'unsure' : null),
      highBloodPressure: v.bp,
      diabetes: v.diabetes,
      egfr: v.dialysis ? null : v.egfr,
      forWhom: v.forWhom,
      careFor: v.careFor,
      careForName: v.careForName,
      usually: v.usually,
      limits: v.limits,
    });
    toast(t('pz_saved'));
    setTimeout(() => location.assign('/meals.html'), 900);
  } catch {
    const el = $('[data-pz-error]');
    el.textContent = t('pz_save_err');
    el.hidden = false;
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
}

/* ---------- Start ---------- */
let wired = false;
function wire() {
  if (wired) return;
  wired = true;
  const f = form();
  f.addEventListener('input', paintPlan);
  f.addEventListener('change', paintPlan);
  f.addEventListener('change', paintCare);
  f.addEventListener('submit', save);
  // A new account starts with the name they signed up with.
  fill(ctx.isDemo ? DEMO : fromProfile(ctx.profile) || { limits: {}, fullName: ctx.user?.user_metadata?.full_name || '' });
  const params = new URLSearchParams(location.search);
  $('[data-pz-welcome]').hidden = ctx.isDemo || !params.has('welcome');
  $('[data-pz-demo]').hidden = !ctx.isDemo;
  fetch('/api/catalog')
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => { catalog = Array.isArray(data?.rows) ? data.rows : []; paintStatic(); paintPlan(); })
    .catch(() => { catalog = []; });
}

// "What FuelWell remembers": the family's memory notes (family-memory.js), each with Forget.
async function paintMemory() {
  const box = document.querySelector('[data-pz-memory]');
  if (!box) return;
  const notes = await loadMemory();
  box.innerHTML = `<h2 id="mem-title">${esc(t('mem_title'))}</h2>
    <p class="muted">${esc(t('mem_sub'))}</p>
    ${notes.length ? `<ul class="mem-list">${notes.map((m, i) => `<li class="mem-item${i < 8 ? ' is-used' : ''}">
        <span class="chip chip--plain">${esc(t(`mem_kind_${m.kind}`))}</span>
        <span class="mem-text">${esc(m.text)}</span>
        <button class="button button--ghost button--small" type="button" data-forget="${esc(String(m.id))}" aria-label="${esc(t('mem_forget_label', { x: m.text }))}">${esc(t('mem_forget'))}</button>
      </li>`).join('')}</ul>` : `<p class="empty">${esc(t('mem_empty'))}</p>`}`;
}

let memoryWired = false;
function wireMemory() {
  if (memoryWired) return;
  memoryWired = true;
  document.querySelector('[data-pz-memory]')?.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-forget]');
    if (!b) return;
    b.disabled = true;
    const id = /^\d+$/.test(b.dataset.forget) ? Number(b.dataset.forget) : b.dataset.forget;
    await forget(id);
    await paintMemory();
    toast(t('mem_forgotten'));
    document.querySelector('[data-pz-memory] h2')?.setAttribute('tabindex', '-1');
    document.querySelector('[data-pz-memory] h2')?.focus();
  });
}

initShell({
  page: 'personalize',
  title: 'title_personalize',
  render(c) {
    ctx = c;
    wire();
    paintStatic();
    paintPlan();
    wireMemory();
    paintMemory();
  },
});
