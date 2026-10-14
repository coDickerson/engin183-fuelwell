// Care team tab: message thread with AI triage, visits with a slot picker, and the care circle.
import { initShell, langBadge } from './app-shell.js';
import { dateFromOffset, esc, fmt, icon, initTabs, toast } from './app-ui.js';
import { careCircle, dietitianMessages, exampleQuestions, persona } from '../data/fung.js';
import { triageInquiry } from './ai-client.js';
import { bookVisit, downloadIcs, isTaken, openSlots, pastVisits, upcomingVisits } from './app-visits.js';
import { lang, tr } from './i18n.js';
import { appStrings, t } from './app-strings.js';

const $ = (sel, root = document) => root.querySelector(sel);
let tabs;
// Workspace messages carry a date; messages typed this session keep the time they were sent.
const thread = dietitianMessages.map((m) => ({ ...m, at: dateFromOffset(-m.daysAgo, m.h, m.m) }));

/* ---------- Messages ---------- */
function renderThreadHead() {
  const d = persona.dietitian;
  $('[data-thread-head]').innerHTML = `<span class="avatar avatar--clay avatar--lg" aria-hidden="true">${esc(d.initials)}<span class="presence" aria-hidden="true"></span></span>
    <div class="thread-who"><h2 id="thread-title">${esc(d.name)} ${langBadge()}</h2><p class="muted">${esc(tr(d.role))} · ${esc(t('replies_within'))}</p></div>`;
}

function renderThread() {
  const list = $('[data-thread]');
  list.innerHTML = thread.map((m) => {
    const mine = m.from === 'caregiver';
    const when = m.sentNow ? t('today_at', { time: fmt.time(m.at) }) : `${fmt.short(m.at)} · ${fmt.time(m.at)}`;
    return `<li class="bubble-row${mine ? ' bubble-row--mine' : ''}">
      ${mine ? '' : `<span class="avatar avatar--clay" aria-hidden="true">${esc(persona.dietitian.initials)}</span>`}
      <div class="bubble">
        <p class="bubble-meta"><strong>${mine ? esc(t('you')) : esc(persona.dietitian.name)}</strong> <span class="muted">${esc(when)}</span></p>
        <p class="bubble-text">${esc(tr(m.text))}</p>
        ${m.pending ? `<p class="bubble-status">${icon('clock')}${esc(t('waiting_reply'))}</p>` : ''}
      </div>
    </li>`;
  }).join('');
  list.scrollTop = list.scrollHeight;
}

const urgencyClass = { routine: 'low', soon: 'mid', urgent: 'high' };
const triageBox = () => $('[data-triage]');
let triageView = { state: 'idle' };

function triageHeader(extra = '') {
  return `<div class="triage-head"><span class="triage-icon">${icon('sparkle')}</span><div><h2 id="triage-title">${esc(t('triage_title'))}</h2><p class="muted">${esc(t('triage_sub'))}</p></div>${extra}</div>`;
}

function paintTriage() {
  const v = triageView;
  if (v.state === 'idle') triageIdle();
  else if (v.state === 'loading') triageLoading();
  else if (v.state === 'error') triageError(v.error, v.message);
  else triageResult(v.result);
}

function triageIdle() {
  triageBox().innerHTML = `${triageHeader()}
    <ul class="triage-how">
      <li>${icon('list')}<span>${t('how_sort')}</span></li>
      <li>${icon('alert')}<span>${t('how_flag')}</span></li>
      <li>${icon('care')}<span>${t('how_draft')}</span></li>
      <li>${icon('calendar')}<span>${t('how_slots')}</span></li>
    </ul>
    <p class="muted triage-idle-note">${esc(t('triage_idle'))}</p>`;
}

function triageLoading() {
  triageBox().setAttribute('aria-busy', 'true');
  const steps = ['step_read', 'step_flags', 'step_draft', 'step_slots'];
  triageBox().innerHTML = `${triageHeader(`<span class="chip">${esc(t('working'))}</span>`)}
    <ol class="triage-progress">${steps.map((s, i) => `<li style="animation-delay:${i * 0.6}s"><span class="spinner" aria-hidden="true"></span>${esc(t(s))}</li>`).join('')}</ol>`;
}

function triageError(error, message) {
  triageBox().setAttribute('aria-busy', 'false');
  triageBox().innerHTML = `${triageHeader()}
    <div class="state-error" role="alert">
      <span class="empty-icon empty-icon--error">${icon('alert')}</span>
      <h3>${esc(t('triage_error_title'))}</h3>
      <p>${esc(t('triage_error_body', { msg: error?.message || '' }))}</p>
      <button class="button" type="button" data-triage-retry>${icon('retry')}${esc(t('try_again'))}</button>
    </div>`;
  $('[data-triage-retry]').addEventListener('click', () => runTriage(message));
}

function triageResult(r) {
  triageBox().setAttribute('aria-busy', 'false');
  const ucls = urgencyClass[r.urgency] || 'low';
  const slots = (r.suggested_slots || []).filter((s) => s && s.iso);
  const ai = r.source === 'ai';
  triageBox().innerHTML = `${triageHeader(`<span class="source-tag source-tag--${ai ? 'ai' : 'rules'}">${esc(t(ai ? 'source_ai' : 'source_rules'))}</span>`)}
    <div class="triage-chips">
      <span class="triage-chip"><span class="muted">${esc(t('topic'))}</span> <span class="chip">${esc(t(`cat_${r.category}`) || t('cat_other'))}</span></span>
      <span class="triage-chip"><span class="muted">${esc(t('urgency'))}</span> <span class="badge badge--${ucls}">${esc(t(`urg_${r.urgency}`))}</span></span>
    </div>
    ${r.red_flag ? `<div class="red-flag" role="alert">${icon('alert')}<div><p class="red-flag-title">${esc(t('warning_title'))}</p><p>${esc(r.escalation || t('warning_default'))}</p></div></div>` : ''}
    <section class="triage-section"><h3>${esc(t('summary'))}</h3><p>${esc(r.summary)}</p></section>
    <section class="triage-section draft">
      <h3>${esc(t('suggested_reply'))}</h3>
      <p class="draft-status"><span class="badge badge--mid">${esc(t('pending_review'))}</span></p>
      <blockquote class="draft-text">${esc(r.draft_reply)}</blockquote>
    </section>
    ${slots.length ? `<section class="triage-section"><h3>${esc(t('suggested_times'))}</h3>
      <div class="slot-suggest">${slots.map((s, i) => `<button class="button button--secondary" type="button" data-suggest="${i}">${icon('calendar')}${esc(slotLabel(s))}</button>`).join('')}</div>
      <p class="muted">${esc(t('choose_time_note'))}</p></section>` : ''}
    ${(r.steps || []).length ? `<details class="steps">
      <summary>${esc(t('how_handled'))} <span class="muted">${esc(t('steps_n', { n: r.steps.length }))}</span></summary>
      <ol class="step-list">${r.steps.map((s) => `<li><code class="tool">${esc(s.tool)}</code><span>${esc(s.detail)}</span></li>`).join('')}</ol>
    </details>` : ''}`;
  triageBox().querySelectorAll('[data-suggest]').forEach((btn) => btn.addEventListener('click', () => {
    booker.suggest(slots[Number(btn.dataset.suggest)]);
    tabs.select('visits');
    $('#tab-visits').focus();
  }));
}

// Slot labels come from the server in English; rebuild them in the reader's language.
const slotLabel = (s) => { const d = new Date(s.iso); return `${fmt.short(d)} · ${fmt.time(d)}`; };

async function runTriage(message) {
  triageView = { state: 'loading' };
  paintTriage();
  try {
    triageView = { state: 'result', result: await triageInquiry({ message, patient_name: persona.patient.name, language: lang() }) };
  } catch (error) {
    triageView = { state: 'error', error, message };
  }
  paintTriage();
}

function renderExamples() {
  $('[data-question-examples]').innerHTML = exampleQuestions.map((q, i) => `<button class="chip-button" type="button" data-q="${i}">${esc(tr(q))}</button>`).join('');
}

function initComposer() {
  const form = $('[data-composer]');
  const box = $('#composer-text');
  form.addEventListener('click', (e) => {
    const b = e.target.closest('[data-q]');
    if (!b) return;
    box.value = tr(exampleQuestions[Number(b.dataset.q)]);
    box.focus();
  });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) form.requestSubmit();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = box.value.trim();
    if (!text) { toast(t('write_first')); box.focus(); return; }
    thread.push({ from: 'caregiver', text, at: new Date(), sentNow: true, pending: true });
    renderThread();
    box.value = '';
    runTriage(text);
  });
}

/* ---------- Visits ---------- */
function visitItem(v, past = false) {
  const d = new Date(v.iso);
  return `<li class="visit">
    <div class="date-block${past ? ' date-block--past' : ''}" aria-hidden="true"><span>${fmt.month(d)}</span><strong>${fmt.dateNum(d)}</strong></div>
    <div class="visit-body">
      <p class="visit-title"><strong>${esc(tr(v.title))}</strong>${v.booked ? ` <span class="badge badge--low">${esc(t('booked_now'))}</span>` : ''}</p>
      <p class="muted">${fmt.day(d)} · ${fmt.time(d)} · ${esc(t('minutes', { n: v.minutes }))}</p>
      <p class="muted">${esc(tr(v.with))} · ${esc(tr(v.mode))}</p>
      ${v.note ? `<p class="visit-note">${esc(tr(v.note))}</p>` : ''}
    </div>
    ${past ? '' : `<button class="button button--ghost" type="button" data-ics="${esc(v.id)}">${icon('calendar')}<span>${esc(t('add_calendar'))}</span></button>`}
  </li>`;
}

function renderVisitLists() {
  const upcoming = upcomingVisits();
  $('[data-upcoming]').innerHTML = upcoming.map((v) => visitItem(v)).join('') || `<li class="muted">${esc(t('no_upcoming'))}</li>`;
  $('[data-past]').innerHTML = pastVisits().map((v) => visitItem(v, true)).join('');
  $('[data-upcoming]').querySelectorAll('[data-ics]').forEach((b) => b.addEventListener('click', () => {
    downloadIcs(upcoming.find((v) => v.id === b.dataset.ics));
    toast(t('calendar_done'));
  }));
}

const REASONS = ['reason_checkin', 'reason_labs', 'reason_recipe', 'reason_holiday'];

const booker = {
  day: 0,
  selected: null,
  suggested: null,
  reason: REASONS[0],
  suggest(slot) {
    this.suggested = slot;
    this.selected = slot.iso;
    this.render();
    toast(t('selected_toast', { label: slotLabel(slot) }));
  },
  render() {
    const box = $('[data-booker]');
    const days = openSlots().map((d) => ({ ...d, slots: d.slots.filter((iso) => !isTaken(iso)) }));
    const day = days[this.day] || days[0];
    const sugg = this.suggested && !isTaken(this.suggested.iso) ? this.suggested : null;
    const chosen = this.selected && !isTaken(this.selected) ? new Date(this.selected) : null;
    box.innerHTML = `<div class="panel-title"><h2 id="book-title">${esc(t('book_title'))}</h2><span class="chip">${icon('video')}${esc(t('video_30'))}</span></div>
      <p class="muted book-with">${esc(t('with_x', { name: persona.dietitian.name }))} · ${esc(tr(persona.dietitian.role))}</p>
      ${sugg ? `<div class="suggested-slot"><p class="eyebrow">${icon('sparkle')} ${esc(t('suggested_by'))}</p>
        <label class="slot slot--wide"><input type="radio" name="slot" value="${esc(sugg.iso)}"${this.selected === sugg.iso ? ' checked' : ''}><span>${esc(slotLabel(sugg))}</span></label></div>` : ''}
      <fieldset class="picker"><legend>${esc(t('choose_day'))}</legend>
        <div class="day-row">${days.map((d, i) => `<label class="day-chip"><input type="radio" name="bday" value="${i}"${i === this.day ? ' checked' : ''}><span><span class="day-name">${esc(fmt.weekdayShort(d.date))}</span><span class="day-num">${d.date.getDate()}</span></span></label>`).join('')}</div>
      </fieldset>
      <fieldset class="picker"><legend>${esc(t('choose_time_on', { date: fmt.short(day.date) }))}</legend>
        <div class="slot-grid">${day.slots.map((iso) => `<label class="slot"><input type="radio" name="slot" value="${iso}"${this.selected === iso ? ' checked' : ''}><span>${fmt.time(new Date(iso))}</span></label>`).join('') || `<p class="muted">${esc(t('no_times'))}</p>`}</div>
      </fieldset>
      <div class="field"><label for="reason">${esc(t('reason'))}</label>
        <select id="reason">${REASONS.map((r) => `<option value="${r}"${r === this.reason ? ' selected' : ''}>${esc(t(r))}</option>`).join('')}</select></div>
      <p class="book-summary" aria-live="polite">${chosen ? t('selected', { when: esc(t('at', { day: fmt.day(chosen), time: fmt.time(chosen) })) }) : esc(t('pick_time'))}</p>
      <button class="button button--block" type="button" data-book${chosen ? '' : ' disabled'}>${icon('check')}${esc(t('book_this'))}</button>`;
    box.querySelectorAll('input[name="bday"]').forEach((r) => r.addEventListener('change', () => {
      this.day = Number(r.value);
      this.render();
      box.querySelector(`input[name="bday"][value="${this.day}"]`).focus();
    }));
    box.querySelectorAll('input[name="slot"]').forEach((r) => r.addEventListener('change', () => {
      this.selected = r.value;
      this.render();
      box.querySelector(`input[name="slot"][value="${CSS.escape(this.selected)}"]`)?.focus();
    }));
    box.querySelector('#reason').addEventListener('change', (e) => { this.reason = e.target.value; });
    box.querySelector('[data-book]').addEventListener('click', () => {
      if (!chosen) return;
      const visit = bookVisit(this.selected, appStrings[this.reason]);
      this.selected = null;
      this.suggested = null;
      renderVisitLists();
      this.render();
      const d = new Date(visit.iso);
      toast(t('booked_toast', { when: `${fmt.short(d)} · ${fmt.time(d)}` }));
      $('#upcoming-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  },
};

/* ---------- Care circle ---------- */
function renderCircle() {
  $('[data-circle]').innerHTML = careCircle.map((p) => `<li class="person">
    <span class="avatar avatar--${p.tone} avatar--lg" aria-hidden="true">${esc(p.initials || p.name[0])}</span>
    <div><p class="person-name"><strong>${esc(p.name)}</strong></p><p class="muted">${esc(tr(p.detail))}</p></div>
    <span class="chip${p.tone === 'clay' ? ' chip--clay' : ''}${p.viewOnly ? ' chip--plain' : ''}">${p.viewOnly ? icon('lock') : ''}${esc(tr(p.role))}</span>
  </li>`).join('');
}

let wired = false;
initShell({
  page: 'care',
  title: 'title_care',
  render() {
    renderThreadHead();
    renderThread();
    renderExamples();
    paintTriage();
    renderVisitLists();
    booker.render();
    renderCircle();
    if (!wired) {
      wired = true;
      initComposer();
      $('[data-invite]').addEventListener('click', () => toast(t('invite_toast')));
      tabs = initTabs($('[role="tablist"]'));
    }
  },
});
