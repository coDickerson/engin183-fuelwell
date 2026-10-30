// Shared app shell for signed-in pages: auth gate, header, navigation, language.
import { authConfigError, getAuthenticatedUser, signOutCurrentSession, supabase } from '../auth/supabase.js';
import { isDemoUser } from '../auth/demo.js';
import { clearPendingProfile, loadProfile } from '../auth/profile.js';
import { persona } from '../data/fung.js';
import { esc, icon, toast } from './app-ui.js';
import { applyDom, langToggleHtml, onLangChange, tr, wireLangToggle } from './i18n.js';
import { t } from './app-strings.js';

const NAV = [
  { key: 'today', href: '/dashboard.html', label: 'nav_today', icon: 'today' },
  { key: 'meals', href: '/meals.html', label: 'nav_meals', icon: 'meals' },
  { key: 'care', href: '/care-team.html', label: 'nav_care', icon: 'care' },
  { key: 'health', href: '/health.html', label: 'nav_health', icon: 'health' },
];
const brand = () => `<a class="brand" href="/" aria-label="${esc(t('home_label'))}"><span class="brand-mark" aria-hidden="true"></span>FuelWell</a>`;

function displayNameFor(user, demo, profile) {
  if (demo) return persona.caregiver.name;
  if (profile?.fullName) return profile.fullName.split(' ')[0];
  const local = (user.email || '').split('@')[0].split(/[._+\-0-9]/).find(Boolean) || 'there';
  return local.charAt(0).toUpperCase() + local.slice(1).toLowerCase();
}

function navLinks(page, cls) {
  return NAV.map((item) => `<a class="${cls}" href="${item.href}"${item.key === page ? ' aria-current="page"' : ''}>${icon(item.icon)}<span>${esc(t(item.label))}</span></a>`).join('');
}

/** Small "粵語 · English" badge used wherever the dietitian appears. */
export function langBadge() {
  return `<span class="lang-badge" title="${esc(t('lang_badge_title'))}">${esc(tr(persona.dietitian.languages))}</span>`;
}

function railHtml(page) {
  const d = persona.dietitian;
  return `<div class="rail-inner">
    <div class="rail-brand">${brand()}</div>
    <nav class="rail-nav" aria-label="${esc(t('nav_main'))}">${navLinks(page, 'rail-link')}</nav>
    <div class="rail-foot">
      <p class="rail-kicker">${esc(t('your_dietitian'))}</p>
      <a class="rail-dietitian" href="/care-team.html#messages">
        <span class="avatar avatar--clay" aria-hidden="true">${esc(d.initials)}<span class="presence" aria-hidden="true"></span></span>
        <span class="rail-dietitian-text"><strong>${esc(d.name)}</strong><span>${esc(tr(d.role))}</span></span>
      </a>
      ${langBadge()}
    </div></div>`;
}

function topHtml(ctx) {
  const { patient } = persona;
  const name = ctx.displayName;
  return `<div class="top-row">
      <div class="top-brand">${brand()}</div>
      <div class="person-switch">
        <button class="person-button" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="person-menu" data-person-button>
          <span class="avatar avatar--teal" aria-hidden="true">F</span>
          <span class="person-text"><span class="sr-only">${esc(t('viewing'))}: </span><strong>${esc(tr(patient.relation))}</strong><span class="person-name"> · ${esc(patient.name)}</span></span>
          ${icon('chevron', 'icon person-chevron')}
        </button>
        <div class="person-menu" id="person-menu" role="menu" aria-label="${esc(t('choose_member'))}" hidden>
          <button class="person-item" type="button" role="menuitemradio" aria-checked="true" data-person-item>
            <span class="avatar avatar--teal" aria-hidden="true">F</span>
            <span><strong>${esc(tr(patient.relation))} · ${esc(patient.name)}</strong><span class="person-sub">${esc(t('age', { n: patient.age }))} · ${esc(t('stage', { s: patient.stage }))} · ${esc(tr(patient.cuisine))}</span></span>
            ${icon('check', 'icon person-check')}
          </button>
          <div class="person-sep" role="separator"></div>
          <button class="person-item" type="button" role="menuitem" data-person-item data-add-person>
            <span class="avatar avatar--plain" aria-hidden="true">${icon('plus')}</span>
            <span>${esc(t('add_member'))}</span>
          </button>
        </div>
      </div>
      <div class="top-actions">
        ${langToggleHtml()}
        <div class="account">
          <button class="account-button" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="account-menu" aria-label="${esc(t('account'))}" data-account-button>
            <span class="avatar avatar--clay" aria-hidden="true">${esc(name.charAt(0))}</span>
            ${icon('chevron', 'icon person-chevron')}
          </button>
          <div class="account-menu" id="account-menu" role="menu" hidden>
            <div class="account-who"><strong>${esc(name)}</strong><span>${esc(ctx.isDemo ? t('caregiver_role') : ctx.user.email)}</span></div>
            <div class="person-sep" role="separator"></div>
            <button class="person-item" type="button" role="menuitem" data-sign-out>${icon('logout')}<span>${esc(t('sign_out'))}</span></button>
          </div>
        </div>
      </div>
    </div>`;
}

function wireMenu(button, menu, items, onPick) {
  const setOpen = (open, focusButton = false) => {
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    if (open) items[0]?.focus();
    else if (focusButton) button.focus();
  };
  button.addEventListener('click', () => setOpen(menu.hidden));
  button.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); } });
  menu.addEventListener('keydown', (e) => {
    const i = items.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false, true); }
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    if (e.key === 'Tab') setOpen(false);
  });
  onPick?.(setOpen);
  return setOpen;
}

function buildShell(frame, page, ctx) {
  const main = frame.querySelector('main');
  const rail = document.createElement('aside');
  rail.className = 'app-rail';
  const top = document.createElement('header');
  top.className = 'app-top';
  const bottom = document.createElement('nav');
  bottom.className = 'bottom-bar';
  frame.prepend(rail);
  frame.insertBefore(top, main);
  frame.append(bottom);

  const closers = [];
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.person-switch, .account')) closers.forEach((close) => close(false));
  });

  const render = () => {
    closers.length = 0;
    rail.setAttribute('aria-label', t('app_label'));
    rail.innerHTML = railHtml(page);
    top.innerHTML = topHtml(ctx);
    bottom.setAttribute('aria-label', t('nav_main'));
    bottom.innerHTML = navLinks(page, 'bottom-link');
    wireLangToggle(top);

    const personMenu = top.querySelector('#person-menu');
    const personItems = [...personMenu.querySelectorAll('[data-person-item]')];
    const closePerson = wireMenu(top.querySelector('[data-person-button]'), personMenu, personItems);
    personItems[0].addEventListener('click', () => closePerson(false, true));
    personMenu.querySelector('[data-add-person]').addEventListener('click', () => {
      closePerson(false, true);
      toast(t('add_member_toast'));
    });
    const accountMenu = top.querySelector('#account-menu');
    const closeAccount = wireMenu(top.querySelector('[data-account-button]'), accountMenu, [...accountMenu.querySelectorAll('[role="menuitem"]')]);
    closers.push(closePerson, closeAccount);
    top.querySelector('[data-sign-out]').addEventListener('click', signOut);
  };
  render();
  onLangChange(render);
  return render;
}

async function signOut(event) {
  const btn = event.currentTarget;
  btn.disabled = true;
  try {
    await signOutCurrentSession();
    try { sessionStorage.removeItem('fuelwell.match.v1'); } catch { /* storage unavailable */ }
    clearPendingProfile();
    location.replace('/start.html#sign-in');
  } catch {
    btn.disabled = false;
    toast(t('sign_out_error'));
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
  } catch { /* The workspace works without a saved quiz. */ }
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
 * `render(ctx)` draws the page and runs again whenever the language changes.
 * Resolves to { user, isDemo, displayName, quiz, profile } or null when redirecting.
 * After changing ctx (for example a saved profile), call ctx.repaint().
 */
export async function initShell({ page, withQuiz = false, title, render }) {
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
  const [quiz, profile] = await Promise.all([
    withQuiz && !isDemo ? loadQuiz(user) : null,
    // The demo keeps its curated persona; real accounts show their own profile.
    isDemo ? null : loadProfile(user).catch(() => null),
  ]);
  const ctx = { user, isDemo, displayName: displayNameFor(user, isDemo, profile), quiz, profile };
  const renderShell = buildShell(frame, page, ctx);

  const paint = () => {
    if (title) document.title = t(title);
    applyDom(t, document);
    render?.(ctx);
    hydrateIcons(document);
  };
  ctx.repaint = () => {
    ctx.displayName = displayNameFor(user, isDemo, ctx.profile);
    renderShell();
    paint();
  };
  paint();
  onLangChange(paint);
  loader?.remove();
  frame.hidden = false;
  document.body.classList.remove('is-loading');
  return ctx;
}
