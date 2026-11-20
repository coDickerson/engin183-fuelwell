// /join "See it in action": an animated, drawn-in-HTML preview of the demo's three key moments,
// played in a fake app window. Scene 1: someone asks "Mom had pho for lunch. Was that okay?" and
// the answer card builds. Scene 2: My plan, eGFR counts to 38 and the stage appears. Scene 3:
// swap cards with photos slide in and one is saved. Auto-advances while on screen; the step
// buttons jump to a scene. With reduced motion, each scene shows its finished state and nothing
// moves on its own. The window is decorative (aria-hidden); a text summary is in the markup.
import { NUTRIENTS, joinSwaps } from '../data/join-swaps.js';
import { photoUrl, swapPhotos } from '../data/swap-photos.js';

const SCENE_MS = 9000;
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SPARK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5 13.8 9a2 2 0 0 0 1.2 1.2l5.5 1.8-5.5 1.8a2 2 0 0 0-1.2 1.2L12 20.5 10.2 15A2 2 0 0 0 9 13.8L3.5 12 9 10.2A2 2 0 0 0 10.2 9Z"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const HEART = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z"/></svg>';
const DROP = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5c3.4 3.8 6 7.3 6 10.5a6 6 0 0 1-12 0c0-3.2 2.6-6.7 6-10.5Z"/></svg>';

let t = (k) => k;
let locale = 'en';
let root;
let current = 0;
let run = 0;
let visible = false;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const el = (code, name) => `<span class="wl-el wl-el--${code}"><span class="wl-el-sym">${code === 'Fluid' ? DROP : esc(code)}</span><span class="wl-el-name">${esc(name)}</span></span>`;
const nut = (code) => {
  const n = NUTRIENTS[code];
  return n ? (n[locale] || n.en).name : '';
};

/* ---------- Scenes (finished-state HTML; animation reveals parts) ---------- */
function askScene() {
  return `<div class="sc-ask">
    <p class="sc-label">${esc(t('sc_ask'))}</p>
    <div class="sc-input"><span data-type>${esc(t('sc_q'))}</span><span class="sc-caret"></span></div>
    <div class="sc-btn" data-btn>${SPARK}<span>${esc(t('sc_get'))}</span></div>
    <div class="sc-answer sc-reveal" data-r>
      <div class="sc-answer-head"><strong>${esc(t('sc_dish'))}</strong><span class="sc-verdict">${esc(t('sc_verdict'))}</span></div>
      <p class="sc-answer-text">${esc(t('sc_answer'))}</p>
      <p class="sc-sub">${esc(t('sc_watch'))}</p>
      <ul class="sc-list">
        <li class="sc-reveal" data-r>${el('Na', nut('Na'))}<span>${esc(t('sc_w_na'))}</span></li>
        <li class="sc-reveal" data-r>${el('Fluid', t('sc_fluid'))}<span>${esc(t('sc_w_fluid'))}</span></li>
      </ul>
      <p class="sc-sub">${esc(t('sc_swaps'))}</p>
      <ul class="sc-swaps">
        ${['sc_sw1', 'sc_sw2', 'sc_sw3'].map((k) => `<li class="sc-reveal" data-r>${CHECK}<span>${esc(t(k))}</span></li>`).join('')}
      </ul>
      <p class="sc-portion sc-reveal" data-r>${esc(t('sc_portion'))}</p>
    </div>
  </div>`;
}

function planScene() {
  const bands = [['g5', 15], ['g4', 15], ['g3b', 15], ['g3a', 15], ['g2', 30], ['g1', 30]];
  return `<div class="sc-plan">
    <div class="sc-plan-score">
      <p class="sc-label">eGFR</p>
      <p class="sc-egfr"><span data-count>38</span><small>mL/min</small></p>
      <div class="sc-meter">
        ${bands.map(([b, w]) => `<span class="sc-band sc-band--${b}${b === 'g3b' ? ' is-on' : ''}" style="flex-grow:${w}">G${b.slice(1)}</span>`).join('')}
        <span class="sc-marker" data-marker style="left:31.7%"></span>
      </div>
    </div>
    <div class="sc-plan-card sc-reveal" data-r>
      <p class="sc-kicker">${esc(t('sc_plan'))}</p>
      <div class="sc-stage"><span class="sc-stage-tile">G3b</span><div><strong>${esc(t('sc_stage'))} · eGFR 38</strong><p>${esc(t('sc_stage_body'))}</p></div></div>
      <p class="sc-sub">${esc(t('sc_focus'))}</p>
      <ul class="sc-list">
        <li class="sc-reveal" data-r>${el('Na', nut('Na'))}<span>${esc(t('sc_f_limit'))}</span></li>
        <li class="sc-reveal" data-r>${el('K', nut('K'))}<span>${esc(t('sc_f_limit'))}</span></li>
        <li class="sc-reveal" data-r>${el('P', nut('P'))}<span>${esc(t('sc_f_p'))}</span></li>
      </ul>
    </div>
  </div>`;
}

function browseScene() {
  const picks = [joinSwaps[1], joinSwaps[3], joinSwaps[5]];
  return `<div class="sc-browse">
    <p class="sc-count">${esc(t('sc_browse_count'))}</p>
    <div class="sc-cards">
      ${picks.map((item, i) => {
        const text = item[locale] || item.en;
        const photo = swapPhotos[item.photo];
        return `<div class="sc-card sc-reveal" data-r>
          <div class="sc-card-photo">${photo ? `<img src="${esc(photoUrl(photo, 360, 240))}" alt="" loading="lazy" width="360" height="240">` : ''}
            <span class="sc-heart${i === 0 ? ' is-saved' : ''}" ${i === 0 ? 'data-heart' : ''}>${HEART}</span></div>
          <div class="sc-card-body">
            <p class="sc-card-els">${item.watch.map((c) => el(c, nut(c))).join('')}</p>
            <strong>${esc(text.meal)}</strong>
            <p>${esc(text.swap)}</p>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div class="sc-toast sc-reveal" data-toast>${HEART}<span>${esc(t('sc_saved'))}</span></div>
  </div>`;
}

const ARROW = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

function recipesScene() {
  const stat = (code, mg) => `<span class="sc-rstat"><span class="wl-el-sym wl-el--${code}-sym">${code}</span><span><strong>${mg} mg</strong><small>${esc(t('sc_lv_mid'))}</small></span></span>`;
  const row = (code, from, to) => `<li class="sc-reveal" data-r><span class="wl-el-sym wl-el--${code}-sym">${code}</span><span class="sc-from">${esc(t(from))}</span>${ARROW}<span class="sc-to">${esc(t(to))}</span></li>`;
  return `<div class="sc-recipes">
    <p class="sc-count">${esc(t('sc_rc_count'))}</p>
    <div class="sc-recipe">
      <p class="sc-kicker">NHLBI · NIH</p>
      <strong class="sc-recipe-title">Marinated Chicken (Adobong Manok)</strong>
      <div class="sc-rstats">${stat('Na', 330)}${stat('K', 370)}</div>
      <div class="sc-btn" data-btn>${SPARK}<span>${esc(t('sc_rc_ai'))}</span></div>
    </div>
    <div class="sc-answer sc-reveal" data-r>
      <div class="sc-answer-head"><strong>${esc(t('sc_rc_changed'))}</strong><span class="sc-verdict">${esc(t('sc_plan'))}: G3b</span></div>
      <ul class="sc-changes">${row('Na', 'sc_rc_from1', 'sc_rc_to1')}${row('K', 'sc_rc_from2', 'sc_rc_to2')}</ul>
    </div>
  </div>`;
}

const SCENES = [askScene, browseScene, recipesScene, planScene];
const TABS = ['sc_tab_meals', 'sc_tab_browse', 'sc_tab_recipes', 'sc_tab_plan'];

/* ---------- Animation ---------- */
async function reveal(stage, alive, gap = 260) {
  for (const node of stage.querySelectorAll('[data-r]')) {
    if (!alive()) return;
    node.classList.add('is-in');
    // Scroll the fake window like a real app when the answer runs past the bottom.
    const over = node.getBoundingClientRect().bottom - stage.getBoundingClientRect().bottom + 16;
    if (over > 0) stage.scrollTo({ top: stage.scrollTop + over, behavior: 'smooth' });
    await sleep(gap);
  }
}

const ANIMATE = [
  async (stage, alive) => {
    const typed = stage.querySelector('[data-type]');
    const full = t('sc_q');
    stage.querySelector('.sc-input').classList.add('is-typing');
    // Type the question one character (or CJK glyph) at a time.
    const chars = [...full];
    for (let i = 1; i <= chars.length; i += 1) {
      if (!alive()) return;
      typed.textContent = chars.slice(0, i).join('');
      await sleep(chars.length > 30 ? 38 : 70);
    }
    stage.querySelector('.sc-input').classList.remove('is-typing');
    await sleep(350);
    if (!alive()) return;
    stage.querySelector('[data-btn]').classList.add('is-pressed');
    await sleep(700);
    await reveal(stage, alive, 300);
  },
  async (stage, alive) => {
    const heart = stage.querySelector('[data-heart]');
    heart?.classList.remove('is-saved');
    const cards = [...stage.querySelectorAll('.sc-card')];
    for (const c of cards) {
      if (!alive()) return;
      c.classList.add('is-in');
      await sleep(320);
    }
    await sleep(900);
    if (!alive()) return;
    heart?.classList.add('is-saved', 'is-pop');
    stage.querySelector('[data-toast]').classList.add('is-in');
  },
  async (stage, alive) => {
    await sleep(1200);
    if (!alive()) return;
    stage.querySelector('[data-btn]').classList.add('is-pressed');
    await sleep(800);
    await reveal(stage, alive, 420);
  },
  async (stage, alive) => {
    const count = stage.querySelector('[data-count]');
    const marker = stage.querySelector('[data-marker]');
    const band = stage.querySelector('.sc-band--g3b');
    band.classList.remove('is-on');
    marker.style.left = '0%';
    await sleep(300);
    marker.style.left = '31.7%';
    for (let n = 0; n <= 38; n += 2) {
      if (!alive()) return;
      count.textContent = String(n);
      await sleep(40);
    }
    count.textContent = '38';
    band.classList.add('is-on');
    await sleep(500);
    await reveal(stage, alive, 380);
  },
];

function paintSteps() {
  root.querySelectorAll('[data-sc-step]').forEach((b) => {
    const on = Number(b.dataset.scStep) === current;
    b.setAttribute('aria-pressed', String(on));
    b.classList.toggle('is-active', on);
    const bar = b.querySelector('.wl-sc-progress span');
    bar.style.transition = 'none';
    bar.style.width = on && reduced() ? '100%' : '0%';
  });
  root.querySelector('[data-sc-tabs]').innerHTML = TABS.map((k, i) => `<span class="${i === current ? 'is-on' : ''}">${esc(t(k))}</span>`).join('');
}

/** Draw a scene in its finished state (before it scrolls into view, and with reduced motion). */
function renderFinished(index) {
  current = index;
  run += 1;
  const stage = root.querySelector('[data-sc-stage]');
  stage.classList.remove('is-animating');
  stage.scrollTop = 0;
  stage.innerHTML = `<div class="sc-scene sc-scene--${index}">${SCENES[index]()}</div>`;
  paintSteps();
}

async function play(index) {
  if (reduced()) { renderFinished(index); return; }
  current = index;
  const id = ++run;
  const alive = () => id === run;
  const stage = root.querySelector('[data-sc-stage]');
  stage.classList.add('is-animating');
  stage.scrollTop = 0;
  stage.innerHTML = `<div class="sc-scene sc-scene--${index}">${SCENES[index]()}</div>`;
  paintSteps();
  // Progress bar for this step.
  const bar = root.querySelector(`[data-sc-step="${index}"] .wl-sc-progress span`);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    bar.style.transition = `width ${SCENE_MS}ms linear`;
    bar.style.width = '100%';
  }));
  const started = Date.now();
  await ANIMATE[index](stage, alive);
  await sleep(Math.max(0, SCENE_MS - (Date.now() - started)));
  if (alive() && visible) play((index + 1) % SCENES.length);
}

/** Re-render the current scene (for example after a language change). */
export function relocaleShowcase(nextT, nextLocale) {
  t = nextT;
  locale = nextLocale;
  if (!root) return;
  if (visible) play(current);
  else renderFinished(current);
}

export function initShowcase(nextT, nextLocale) {
  root = document.querySelector('[data-showcase]');
  if (!root) return;
  t = nextT;
  locale = nextLocale;
  root.querySelectorAll('[data-sc-step]').forEach((b) => b.addEventListener('click', () => play(Number(b.dataset.scStep))));
  renderFinished(0); // start animating once it is on screen
  const io = new IntersectionObserver(([entry]) => {
    const was = visible;
    visible = entry.isIntersecting;
    if (visible && !was) play(current);
    if (!visible) run += 1;
  }, { threshold: 0.35 });
  io.observe(root.querySelector('.wl-sc-window'));
}
