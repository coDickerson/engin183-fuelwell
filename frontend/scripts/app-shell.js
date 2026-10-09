// Shared app shell for signed-in pages: auth gate, header, navigation, demo banner.
import { authConfigError, getAuthenticatedUser, signOutCurrentSession, supabase } from '../auth/supabase.js';
import { isDemoUser } from '../auth/demo.js';
import { persona } from '../data/fung.js';
import { esc, icon, storage, toast } from './app-ui.js';
import { languages, initLanguagePreference } from './language-preference.js';

const NAV = [
  { key: 'today', href: '/dashboard.html', label: 'Today', short: 'Today', icon: 'today' },
  { key: 'meals', href: '/meals.html', label: 'Meals', short: 'Meals', icon: 'meals' },
  { key: 'care', href: '/care-team.html', label: 'Care team', short: 'Care team', icon: 'care' },
];
const BANNER_KEY = 'fuelwell.banner.dismissed.v1';
const BRAND = '<a class="brand" href="/" aria-label="FuelWell home"><span class="brand-mark" aria-hidden="true"></span>FuelWell</a>';

function displayNameFor(user, demo) {
  if (demo) return persona.caregiver.name;
  const local = (user.email || '').split('@')[0].split(/[._+\-0-9]/).find(Boolean) || 'there';
  return local.charAt(0).toUpperCase() + local.slice(1).toLowerCase();
}

function navLinks(page, cls, short = false) {
  return NAV.map((item) => {
    const text = short ? item.short : item.label;
    const named = text !== item.label ? ` aria-label="${esc(item.label)}"` : '';
    return `<a class="${cls}" href="${item.href}"${named}${item.key === page ? ' aria-current="page"' : ''}>${icon(item.icon)}<span>${esc(text)}</span></a>`;
  }).join('');
}

function buildShell(frame, page, user) {
  const main = frame.querySelector('main');
  const { patient, sister } = persona;

  const rail = document.createElement('aside');
  rail.className = 'app-rail';
  rail.setAttribute('aria-label', 'FuelWell app');
  rail.innerHTML = `<div class="rail-inner">
    <div class="rail-brand">${BRAND}</div>
    <nav class="rail-nav" aria-label="Main">${navLinks(page, 'rail-link')}</nav>
    <div class="rail-foot">
      <div class="rail-card">
        <p class="rail-card-title">${icon('heart')} Caring for ${esc(patient.relation)}</p>
        <p>Bring questions to the care team. Small changes add up.</p>
      </div>
      <a class="rail-help" href="/how-it-works.html">${icon('help')} How FuelWell works</a>
    </div></div>`;

  const top = document.createElement('header');
  top.className = 'app-top';
  top.innerHTML = `
    <div class="top-row">
      <div class="top-brand">${BRAND}</div>
      <div class="top-person">
        <div class="person-switch">
          <button class="person-button" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="person-menu" data-person-button>
            <span class="avatar avatar--teal" aria-hidden="true">F</span>
            <span class="person-text"><span class="person-kicker">Viewing:</span> <strong>${esc(patient.relation)} (${esc(patient.name)})</strong></span>
            ${icon('chevron', 'icon person-chevron')}
          </button>
          <div class="person-menu" id="person-menu" role="menu" aria-label="Choose a family member" hidden>
            <button class="person-item" type="button" role="menuitemradio" aria-checked="true" data-person-item>
              <span class="avatar avatar--teal" aria-hidden="true">F</span>
              <span><strong>${esc(patient.relation)} (${esc(patient.name)})</strong> · ${esc(patient.stage)}<span class="person-sub">Age ${patient.age} · ${esc(patient.cuisine)}</span></span>
              ${icon('check', 'icon person-check')}
            </button>
            <div class="person-sep" role="separator"></div>
            <button class="person-item" type="button" role="menuitem" data-person-item data-add-person>
              <span class="avatar avatar--plain" aria-hidden="true">${icon('plus')}</span>
              <span>Add a family member (demo)</span>
            </button>
          </div>
        </div>
        <a class="chip share-chip" href="/care-team.html#circle">${icon('users')}<span><span class="share-long">Shared with </span>${esc(sister.name)}</span></a>
      </div>
      <div class="top-account">
        <div class="language-picker">
          <label for="preferred-language">Preferred language</label>
          <select id="preferred-language" data-language aria-describedby="language-status">
            ${languages.map(({ code, label }) => `<option value="${code}" lang="${code}">${esc(label)}</option>`).join('')}
          </select>
          <span class="language-status" id="language-status" data-language-status role="status" aria-live="polite"></span>
        </div>
        <span class="sample-pill"><span class="sample-dot" aria-hidden="true"></span><span class="sample-long">Sample workspace</span><span class="sample-short" aria-hidden="true">Sample</span></span>
        <span class="top-email" title="Signed in as ${esc(user.email)}"><span class="sr-only">Signed in as </span>${esc(user.email)}</span>
        <button class="button button--secondary signout" type="button" data-sign-out>${icon('logout')}<span>Sign out</span></button>
      </div>
    </div>`;

  const banner = document.createElement('div');
  banner.className = 'demo-banner';
  banner.setAttribute('role', 'note');
  banner.innerHTML = `${icon('info')}<p><strong>Sample data for a student demo.</strong> Not medical advice. Please don't enter real health information.</p>
    <button class="icon-button" type="button" aria-label="Dismiss demo notice" data-dismiss-banner>${icon('x')}</button>`;
  if (storage().get(BANNER_KEY)) banner.hidden = true;

  const bottom = document.createElement('nav');
  bottom.className = 'bottom-bar';
  bottom.setAttribute('aria-label', 'Main');
  bottom.innerHTML = navLinks(page, 'bottom-link', true);

  frame.prepend(rail);
  frame.insertBefore(top, main);
  main.prepend(banner);
  frame.append(bottom);

  wirePersonMenu(top);
  initLanguagePreference(top, storage());
  banner.querySelector('[data-dismiss-banner]').addEventListener('click', () => {
    banner.hidden = true;
    storage().set(BANNER_KEY, true);
    main.focus({ preventScroll: true });
  });
  top.querySelector('[data-sign-out]').addEventListener('click', signOut);
}

function wirePersonMenu(top) {
  const button = top.querySelector('[data-person-button]');
  const menu = top.querySelector('#person-menu');
  const items = [...menu.querySelectorAll('[data-person-item]')];
  const setOpen = (open, focusButton = false) => {
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    if (open) items[0].focus();
    else if (focusButton) button.focus();
  };
  button.addEventListener('click', () => setOpen(menu.hidden));
  button.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); }
  });
  menu.addEventListener('keydown', (e) => {
    const i = items.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false, true); }
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    if (e.key === 'Tab') setOpen(false);
  });
  items[0].addEventListener('click', () => setOpen(false, true));
  menu.querySelector('[data-add-person]').addEventListener('click', () => {
    setOpen(false, true);
    toast('Adding another family member is a demo preview. Only Mom (Fung) is set up.');
  });
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !e.target.closest('.person-switch')) setOpen(false);
  });
}

async function signOut(event) {
  const btn = event.currentTarget;
  btn.disabled = true;
  try {
    await signOutCurrentSession();
    try { sessionStorage.removeItem('fuelwell.match.v1'); } catch { /* storage unavailable */ }
    location.replace('/start.html#sign-in');
  } catch {
    btn.disabled = false;
    toast('We could not sign you out. Please try again.');
  }
}

async function loadQuiz(user) {
  let saved = null;
  try {
    const { data } = await supabase
      .from('quiz_results')
      .select('role,stage,goal,has_traditions')
      .eq('user_id', user.id)
      .maybeSingle();
    saved = data;
  } catch { /* The sample workspace works without a saved quiz. */ }
  if (saved) return saved;
  try { return JSON.parse(sessionStorage.getItem('fuelwell.match.v1') || 'null'); } catch { return null; }
}

export function hydrateIcons(root) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    el.outerHTML = icon(el.dataset.icon);
  });
}

/**
 * Gate the page on a signed-in user, then build the shell.
 * Resolves to { user, isDemo, displayName, quiz } or null when redirecting.
 */
export async function initShell({ page, withQuiz = false }) {
  const frame = document.querySelector('[data-app-frame]');
  const loader = document.querySelector('[data-app-loader]');
  if (authConfigError) { location.replace('/start.html#sign-in'); return null; }
  let user;
  try {
    user = await getAuthenticatedUser();
  } catch {
    user = null;
  }
  if (!user) { location.replace('/start.html#sign-in'); return null; }

  const isDemo = isDemoUser(user);
  const quiz = withQuiz && !isDemo ? await loadQuiz(user) : null;
  buildShell(frame, page, user);
  hydrateIcons(document);
  loader?.remove();
  frame.hidden = false;
  document.body.classList.remove('is-loading');
  return { user, isDemo, displayName: displayNameFor(user, isDemo), quiz };
}
