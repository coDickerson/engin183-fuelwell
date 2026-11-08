// FuelWell v1 (/swap): one screen, three modes, a result card, saved meals and a profile.
// Profile and saved meals live only in this browser (localStorage). The AI runs on the
// server (/api/swap, /api/eatout, /api/recipe); no keys are ever in this file.
import { cardText, catalogResult, renderCard, renderError } from './card.js';
import { initBrowse } from './browse.js';
import { TIPS } from './tips.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const KEYS = { profile: 'fuelwell.v1.profile', saved: 'fuelwell.v1.saved', mode: 'fuelwell.v1.mode' };
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  },
  remove(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } },
};

const MODES = {
  swap: {
    button: 'Get swaps',
    endpoint: '/api/swap',
    placeholder: "Type a meal, like “my mom's congee with salted egg”",
    examples: ['Pho', 'Chicken adobo', 'Congee with salted egg', 'Big Mac and fries', 'Frozen lasagna', 'Ice cream at night'],
  },
  eatout: {
    button: 'Find my picks',
    endpoint: '/api/eatout',
    placeholder: 'e.g. El Pollo Loco',
    examples: ['El Pollo Loco', 'Panda Express', 'Chipotle', "McDonald's", 'A pho restaurant', 'Dim sum'],
  },
  recipe: {
    button: 'Adapt it',
    endpoint: '/api/recipe',
    placeholder: "Paste a recipe, or type a dish like “grandma's braised pork belly”",
    examples: ["Grandma's braised pork belly", 'Sinigang', 'Enchiladas', 'Pork lo mein'],
  },
};
const CUISINES = ['Chinese', 'Filipino', 'Mexican', 'Vietnamese', 'Korean', 'Indian', 'Japanese', 'American / fast food'];
const MAX_SAVED = 50;

const state = { mode: 'swap', photo: null, controller: null, tipTimer: null, current: null };

// ---------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------
function setMode(mode) {
  if (!MODES[mode]) mode = 'swap';
  state.mode = mode;
  store.set(KEYS.mode, mode);
  for (const b of $$('[data-mode]')) b.setAttribute('aria-checked', String(b.dataset.mode === mode));
  for (const f of $$('[data-fields]')) f.hidden = f.dataset.fields !== mode;
  const cfg = MODES[mode];
  $('[data-submit]').textContent = cfg.button;
  const main = mode === 'swap' ? $('#meal') : mode === 'eatout' ? $('#restaurant') : $('#recipe');
  main.placeholder = cfg.placeholder;
  $('#usual').placeholder = 'e.g. the two-piece chicken meal with beans';
  $('[data-chips]').innerHTML = '';
  for (const ex of cfg.examples) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = ex;
    b.addEventListener('click', () => { main.value = ex; main.focus(); });
    $('[data-chips]').append(b);
  }
  showFormError('');
}

function showFormError(msg) {
  const el = $('[data-form-error]');
  el.textContent = msg;
  el.hidden = !msg;
}

// ---------------------------------------------------------------------------
// Photo (Swap mode only): shrink in the browser before sending
// ---------------------------------------------------------------------------
async function loadBitmap(file) {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { /* fall through */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function shrinkImage(file, maxSide = 1280) {
  const bmp = await loadBitmap(file);
  const w = bmp.width || bmp.naturalWidth;
  const h = bmp.height || bmp.naturalHeight;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

function setPhoto(dataUrl) {
  state.photo = dataUrl;
  $('[data-photo-chip]').hidden = !dataUrl;
  $('[data-photo-thumb]').src = dataUrl || '';
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
function readProfile() { return store.get(KEYS.profile, null); }

function updateProfileButton() {
  const p = readProfile();
  const btn = $('[data-open-profile]');
  const has = p && Object.keys(p).length > 0;
  btn.toggleAttribute('data-has-profile', Boolean(has));
  $('[data-profile-label]').textContent = has ? 'Profile ✓' : 'Profile';
}

function fillProfileForm() {
  const form = $('[data-profile-form]');
  const p = readProfile() || {};
  form.reset();
  for (const name of ['for_whom', 'stage', 'usually']) {
    const el = form.querySelector(`input[name="${name}"][value="${p[name]}"]`);
    if (el) el.checked = true;
  }
  for (const v of p.also || []) { const el = form.querySelector(`input[name="also"][value="${v}"]`); if (el) el.checked = true; }
  const known = new Set(CUISINES);
  for (const c of p.cuisines || []) { const el = form.querySelector(`input[name="cuisine"][value="${CSS.escape(c)}"]`); if (el) el.checked = true; }
  form.cuisine_other.value = (p.cuisines || []).filter((c) => !known.has(c)).join(', ');
  form.notes.value = p.notes || '';
}

function profileFromForm() {
  const form = $('[data-profile-form]');
  const fd = new FormData(form);
  const other = String(fd.get('cuisine_other') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const p = {
    for_whom: fd.get('for_whom') || undefined,
    stage: fd.get('stage') || undefined,
    also: fd.getAll('also'),
    cuisines: [...fd.getAll('cuisine'), ...other].slice(0, 8).map((c) => String(c).slice(0, 40)),
    usually: fd.get('usually') || undefined,
    notes: String(fd.get('notes') || '').trim().slice(0, 300) || undefined,
  };
  for (const k of Object.keys(p)) if (p[k] === undefined || (Array.isArray(p[k]) && !p[k].length)) delete p[k];
  return p;
}

// ---------------------------------------------------------------------------
// Saved meals
// ---------------------------------------------------------------------------
const readSaved = () => store.get(KEYS.saved, []);
function updateSavedCount() { $('[data-saved-count]').textContent = String(readSaved().length); }

function titleOf(result) {
  const c = result.card || {};
  return c.dish || c.restaurant || c.title || c.meal || 'Saved meal';
}

function isSaved(result) { return readSaved().some((s) => s.key === result._key); }

function toggleSave(result) {
  const saved = readSaved();
  const i = saved.findIndex((s) => s.key === result._key);
  if (i >= 0) {
    saved.splice(i, 1);
    store.set(KEYS.saved, saved);
    toast('Removed from saved meals');
  } else {
    saved.unshift({ key: result._key, savedAt: new Date().toISOString(), result });
    if (!store.set(KEYS.saved, saved.slice(0, MAX_SAVED))) { toast("Couldn't save on this browser"); return false; }
    toast('Saved to My saved meals');
  }
  updateSavedCount();
  return true;
}

function renderSavedList() {
  const list = $('[data-saved-list]');
  const saved = readSaved();
  list.innerHTML = '';
  if (!saved.length) {
    list.innerHTML = '<li class="empty">Nothing saved yet. Tap Save on a result to keep it here.</li>';
    return;
  }
  for (const s of saved) {
    const li = document.createElement('li');
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'open';
    const label = { swap: 'Swap a meal', eatout: 'Eating out', recipe: 'Family recipe', catalog: 'Browse swaps' }[s.result.mode] || '';
    open.innerHTML = `<span></span><small></small>`;
    open.firstChild.textContent = titleOf(s.result);
    open.lastChild.textContent = `${label} · ${new Date(s.savedAt).toLocaleDateString()}`;
    open.addEventListener('click', () => { $('[data-saved-sheet]').close(); showResult(s.result); });
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'icon-btn';
    del.setAttribute('aria-label', `Delete ${titleOf(s.result)}`);
    del.textContent = '✕';
    del.addEventListener('click', () => {
      store.set(KEYS.saved, readSaved().filter((x) => x.key !== s.key));
      updateSavedCount();
      renderSavedList();
    });
    li.append(open, del);
    list.append(li);
  }
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------
function toast(msg) {
  const t = $('[data-toast]');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 2200);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

function showResult(result) {
  state.current = result;
  const root = $('[data-result]');
  root.innerHTML = '';
  root.append(renderCard(result, {
    saved: isSaved(result),
    onSave: (btn) => {
      if (toggleSave(result)) {
        const on = isSaved(result);
        btn.setAttribute('aria-pressed', String(on));
        btn.textContent = on ? 'Saved ✓' : 'Save';
      }
    },
    onCopy: async () => toast((await copyText(cardText(result))) ? 'Copied. Paste it in a text to your family.' : "Couldn't copy on this browser"),
    hasProfile: Boolean(readProfile() && Object.keys(readProfile()).length),
    onOpenProfile: openProfile,
    onPersonalize: result.mode === 'catalog' ? () => personalize(result.card) : undefined,
  }));
  root.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

function startLoading() {
  const box = $('[data-loading]');
  box.hidden = false;
  $('[data-result]').innerHTML = '';
  let i = Math.floor(Math.random() * TIPS.length);
  $('[data-tip]').textContent = TIPS[i];
  state.tipTimer = setInterval(() => { i = (i + 1) % TIPS.length; $('[data-tip]').textContent = TIPS[i]; }, 6000);
  $('[data-submit]').disabled = true;
}

function stopLoading() {
  $('[data-loading]').hidden = true;
  clearInterval(state.tipTimer);
  $('[data-submit]').disabled = false;
}

function buildBody() {
  const profile = readProfile() || undefined;
  if (state.mode === 'swap') {
    const meal = $('#meal').value.trim();
    if (!meal && !state.photo) return { error: 'Type a meal, tap an example, or add a photo.' };
    return { body: { meal: meal || undefined, imageBase64: state.photo || undefined, profile } };
  }
  if (state.mode === 'eatout') {
    const restaurant = $('#restaurant').value.trim();
    if (!restaurant) return { error: 'Type a restaurant, or tap an example.' };
    return { body: { restaurant, usualOrder: $('#usual').value.trim() || undefined, profile } };
  }
  const recipe = $('#recipe').value.trim();
  if (!recipe) return { error: 'Paste a recipe or type a dish name.' };
  return { body: { recipe, profile } };
}

async function submit(event) {
  event.preventDefault();
  const built = buildBody();
  if (built.error) { showFormError(built.error); return; }
  showFormError('');
  await request(state.mode, built.body);
}

/** "Personalize for me" on a catalog card: the normal AI swap chain, with the profile. */
async function personalize(row) {
  if (state.controller) return;
  setMode('swap');
  setPhoto(null);
  $('#meal').value = row.meal;
  await request('swap', { meal: row.meal, profile: readProfile() || undefined });
}

async function request(mode, body) {
  state.controller = new AbortController();
  startLoading();
  $('[data-loading]').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  try {
    const res = await fetch(MODES[mode].endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: state.controller.signal,
    });
    let data = null;
    try { data = await res.json(); } catch { data = null; }
    if (!res.ok || !data?.card) {
      const msg = data?.error || (res.status === 404 ? 'The FuelWell AI is not running here yet.' : 'FuelWell could not answer just now. Please try again.');
      $('[data-result]').append(renderError(msg));
      return;
    }
    data._key = `${mode}:${Date.now()}`;
    showResult(data);
  } catch (err) {
    if (err?.name === 'AbortError') {
      $('[data-result]').append(renderError('Stopped. Change anything you like and try again.'));
    } else {
      $('[data-result]').append(renderError(navigator.onLine === false ? 'You seem to be offline. Check your connection and try again.' : 'FuelWell could not answer just now. Please try again.'));
    }
  } finally {
    stopLoading();
    state.controller = null;
  }
}

function openProfile() {
  fillProfileForm();
  $('[data-profile-sheet]').showModal();
}

// ---------------------------------------------------------------------------
// Wire up
// ---------------------------------------------------------------------------
function init() {
  const cuisineBox = $('[data-cuisines]');
  for (const c of CUISINES) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = 'cuisine';
    input.value = c;
    label.append(input, ` ${c}`);
    cuisineBox.append(label);
  }

  for (const b of $$('[data-mode]')) b.addEventListener('click', () => setMode(b.dataset.mode));
  $('.modes').addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const order = Object.keys(MODES);
    const next = order[(order.indexOf(state.mode) + (e.key === 'ArrowRight' ? 1 : order.length - 1)) % order.length];
    setMode(next);
    $(`[data-mode="${next}"]`).focus();
  });

  $('[data-form]').addEventListener('submit', submit);
  $('[data-stop]').addEventListener('click', () => state.controller?.abort());

  const photoInput = $('[data-photo-input]');
  $('[data-photo-btn]').addEventListener('click', () => photoInput.click());
  photoInput.addEventListener('change', async () => {
    const file = photoInput.files?.[0];
    photoInput.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { showFormError('Please choose a photo.'); return; }
    try {
      setPhoto(await shrinkImage(file));
      showFormError('');
    } catch {
      showFormError("That photo couldn't be opened here. Try a JPEG or PNG, or type the meal.");
    }
  });
  $('[data-photo-remove]').addEventListener('click', () => setPhoto(null));

  const profileSheet = $('[data-profile-sheet]');
  $('[data-open-profile]').addEventListener('click', openProfile);
  $('[data-profile-form]').addEventListener('submit', (e) => {
    e.preventDefault();
    const p = profileFromForm();
    if (Object.keys(p).length) store.set(KEYS.profile, p); else store.remove(KEYS.profile);
    updateProfileButton();
    profileSheet.close();
    if (state.current?.mode === 'catalog') showResult(state.current);
    toast('Profile saved on this phone');
  });
  $('[data-profile-clear]').addEventListener('click', () => {
    store.remove(KEYS.profile);
    fillProfileForm();
    updateProfileButton();
    toast('Profile cleared');
  });

  const savedSheet = $('[data-saved-sheet]');
  $('[data-open-saved]').addEventListener('click', () => { renderSavedList(); savedSheet.showModal(); });

  for (const sheet of [profileSheet, savedSheet]) {
    sheet.querySelector('[data-close]').addEventListener('click', () => sheet.close());
    sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.close(); }); // tap outside
  }

  const params = new URLSearchParams(location.search);
  setMode(params.get('mode') || store.get(KEYS.mode, 'swap'));
  updateProfileButton();
  updateSavedCount();
  initBrowse({ onOpen: (row) => showResult(catalogResult(row)) });
}

init();
