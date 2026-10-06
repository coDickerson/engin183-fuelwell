// Care team tab: message thread with AI triage, visits with a slot picker, and the care circle.
import { initShell, hydrateIcons } from './app-shell.js';
import { dateFromOffset, esc, fmt, icon, initTabs, toast } from './app-ui.js';
import { careCircle, dietitianMessages, exampleQuestions, persona } from '../data/fung.js';
import { triageInquiry } from './ai-client.js';
import { bookVisit, downloadIcs, isTaken, openSlots, pastVisits, upcomingVisits } from './app-visits.js';

const $ = (sel, root = document) => root.querySelector(sel);
let tabs;
const thread = dietitianMessages.map((m) => ({ ...m, when: `${fmt.short(dateFromOffset(-m.daysAgo))}, ${m.time}` }));

/* ---------- Messages ---------- */
function renderThreadHead() {
  const d = persona.dietitian;
  $('[data-thread-head]').innerHTML = `<span class="avatar avatar--clay avatar--lg" aria-hidden="true">${esc(d.initials)}</span>
    <div><h2 id="thread-title">${esc(d.name)}</h2><p class="muted">${esc(d.label)} · usually replies in 1 business day</p></div>`;
}

function renderThread() {
  const list = $('[data-thread]');
  list.innerHTML = thread.map((m) => {
    const mine = m.from === 'caregiver';
    return `<li class="bubble-row${mine ? ' bubble-row--mine' : ''}">
      ${mine ? '' : `<span class="avatar avatar--clay" aria-hidden="true">${esc(persona.dietitian.initials)}</span>`}
      <div class="bubble">
        <p class="bubble-meta"><strong>${mine ? 'Heidi (you)' : esc(persona.dietitian.name)}</strong> <span class="muted">${esc(m.when)}</span></p>
        <p class="bubble-text">${esc(m.text)}</p>
        ${m.pending ? '<p class="bubble-status">' + icon('clock') + 'Sent to Mei (sample) · waiting for a reply</p>' : ''}
      </div>
    </li>`;
  }).join('');
  list.scrollTop = list.scrollHeight;
}

const categoryText = { meal_question: 'Meal question', scheduling: 'Scheduling', symptoms: 'Symptoms', labs: 'Labs', billing: 'Billing', other: 'Other' };
const urgencyMap = { routine: ['low', 'Routine'], soon: ['mid', 'Soon'], urgent: ['high', 'Urgent'] };
const triageBox = () => $('[data-triage]');

function triageHeader(extra = '') {
  return `<div class="triage-head"><span class="triage-icon">${icon('sparkle')}</span><div><h2 id="triage-title">FuelWell assistant triage</h2><p class="muted">Sorts each message before the dietitian reads it</p></div>${extra}</div>`;
}

function triageIdle() {
  triageBox().innerHTML = `${triageHeader()}
    <ul class="triage-how">
      <li>${icon('list')}<span><strong>Sorts the question</strong> by topic and urgency</span></li>
      <li>${icon('alert')}<span><strong>Flags warning signs</strong> like swelling or breathlessness</span></li>
      <li>${icon('care')}<span><strong>Drafts a reply</strong> for Mei to check before sending</span></li>
      <li>${icon('calendar')}<span><strong>Finds open visit times</strong> you can book in one tap</span></li>
    </ul>
    <p class="muted triage-idle-note">Send a message to see it work. Try one of the examples under the message box.</p>`;
}

function triageLoading() {
  triageBox().setAttribute('aria-busy', 'true');
  const steps = ['Reading the message', 'Checking for warning signs', 'Drafting a reply for Mei', 'Looking for open visit times'];
  triageBox().innerHTML = `${triageHeader('<span class="chip">Working…</span>')}
    <ol class="triage-progress">${steps.map((s, i) => `<li style="animation-delay:${i * 0.6}s"><span class="spinner" aria-hidden="true"></span>${s}</li>`).join('')}</ol>`;
}

function triageError(error, message) {
  triageBox().setAttribute('aria-busy', 'false');
  triageBox().innerHTML = `${triageHeader()}
    <div class="state-error" role="alert">
      <span class="empty-icon empty-icon--error">${icon('alert')}</span>
      <h3>The assistant couldn't sort this message</h3>
      <p>${esc(error?.message || 'Something went wrong.')} Your message is still in the thread for Mei. You can ask the assistant to try again.</p>
      <button class="button" type="button" data-triage-retry>${icon('retry')}Try again</button>
    </div>`;
  $('[data-triage-retry]').addEventListener('click', () => runTriage(message));
}

function triageResult(t) {
  triageBox().setAttribute('aria-busy', 'false');
  const [ucls, utext] = urgencyMap[t.urgency] || urgencyMap.routine;
  const slots = (t.suggested_slots || []).filter((s) => s && s.iso);
  triageBox().innerHTML = `${triageHeader(`<span class="source-tag source-tag--${t.source === 'ai' ? 'ai' : 'rules'}">${t.source === 'ai' ? 'AI' : 'Rule-based'}</span>`)}
    <div class="triage-chips">
      <span class="triage-chip"><span class="muted">Topic</span> <span class="chip">${esc(categoryText[t.category] || 'Other')}</span></span>
      <span class="triage-chip"><span class="muted">Urgency</span> <span class="badge badge--${ucls}">${utext}</span></span>
    </div>
    ${t.red_flag ? `<div class="red-flag" role="alert">${icon('alert')}<div><p class="red-flag-title">Possible warning sign</p><p>${esc(t.escalation || 'This may need medical attention today. Call the kidney clinic now. If Mom has trouble breathing, chest pain or confusion, call 911.')}</p></div></div>` : ''}
    <section class="triage-section"><h3>Summary</h3><p>${esc(t.summary)}</p></section>
    <section class="triage-section draft">
      <h3>Suggested reply from the care team</h3>
      <p class="draft-status"><span class="badge badge--mid">Pending dietitian review</span></p>
      <blockquote class="draft-text">${esc(t.draft_reply)}</blockquote>
    </section>
    ${slots.length ? `<section class="triage-section"><h3>Suggested visit times</h3>
      <div class="slot-suggest">${slots.map((s, i) => `<button class="button button--secondary" type="button" data-suggest="${i}">${icon('calendar')}${esc(s.label)}</button>`).join('')}</div>
      <p class="muted">Choosing a time opens Visits with it selected.</p></section>` : ''}
    ${(t.steps || []).length ? `<details class="steps">
      <summary>How the agent handled this <span class="muted">(${t.steps.length} steps)</span></summary>
      <ol class="step-list">${t.steps.map((s) => `<li><code class="tool">${esc(s.tool)}</code><span>${esc(s.detail)}</span></li>`).join('')}</ol>
    </details>` : ''}`;
  triageBox().querySelectorAll('[data-suggest]').forEach((btn) => btn.addEventListener('click', () => {
    const slot = slots[Number(btn.dataset.suggest)];
    booker.suggest(slot);
    tabs.select('visits');
    $('#tab-visits').focus();
  }));
}

async function runTriage(message) {
  triageLoading();
  try {
    triageResult(await triageInquiry({ message, patient_name: persona.patient.name }));
  } catch (error) {
    triageError(error, message);
  }
}

function initComposer() {
  const form = $('[data-composer]');
  const box = $('#composer-text');
  $('[data-question-examples]').innerHTML = exampleQuestions.map((q, i) => `<button class="chip-button" type="button" data-q="${i}">${esc(q)}</button>`).join('');
  form.addEventListener('click', (e) => {
    const b = e.target.closest('[data-q]');
    if (!b) return;
    box.value = exampleQuestions[Number(b.dataset.q)];
    box.focus();
  });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) form.requestSubmit();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = box.value.trim();
    if (!text) { toast('Write a message first, or tap one of the examples.'); box.focus(); return; }
    thread.push({ from: 'caregiver', text, when: `Today, ${fmt.time(new Date())}`, pending: true });
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
      <p class="visit-title"><strong>${esc(v.title)}</strong>${v.booked ? ' <span class="badge badge--low">Booked just now</span>' : ''}</p>
      <p class="muted">${fmt.day(d)} · ${fmt.time(d)} · ${v.minutes} min</p>
      <p class="muted">${esc(v.with)} · ${esc(v.mode)}</p>
      ${v.note ? `<p class="visit-note">${esc(v.note)}</p>` : ''}
    </div>
    ${past ? '' : `<button class="button button--ghost" type="button" data-ics="${esc(v.id)}">${icon('calendar')}<span>Add to calendar</span></button>`}
  </li>`;
}

function renderVisitLists() {
  const upcoming = upcomingVisits();
  $('[data-upcoming]').innerHTML = upcoming.map((v) => visitItem(v)).join('') || '<li class="muted">No upcoming visits.</li>';
  $('[data-past]').innerHTML = pastVisits().map((v) => visitItem(v, true)).join('');
  $('[data-upcoming]').querySelectorAll('[data-ics]').forEach((b) => b.addEventListener('click', () => {
    downloadIcs(upcoming.find((v) => v.id === b.dataset.ics));
    toast('Calendar file downloaded. Open it to add the visit.');
  }));
}

const booker = {
  day: 0,
  selected: null,
  suggested: null,
  suggest(slot) {
    this.suggested = slot;
    this.selected = slot.iso;
    this.render();
    toast(`Selected ${slot.label}. Check the details, then press Book.`);
  },
  render() {
    const box = $('[data-booker]');
    const days = openSlots().map((d) => ({ ...d, slots: d.slots.filter((iso) => !isTaken(iso)) }));
    const day = days[this.day] || days[0];
    const sugg = this.suggested && !isTaken(this.suggested.iso) ? this.suggested : null;
    const chosen = this.selected && !isTaken(this.selected) ? new Date(this.selected) : null;
    box.innerHTML = `<div class="panel-title"><h2 id="book-title">Book a visit</h2><span class="chip">${icon('video')}Video · 30 min</span></div>
      <p class="muted book-with">With ${esc(persona.dietitian.label)}</p>
      ${sugg ? `<div class="suggested-slot"><p class="eyebrow">${icon('sparkle')} Suggested by the assistant</p>
        <label class="slot slot--wide"><input type="radio" name="slot" value="${esc(sugg.iso)}"${this.selected === sugg.iso ? ' checked' : ''}><span>${esc(sugg.label)}</span></label></div>` : ''}
      <fieldset class="picker"><legend>Choose a day</legend>
        <div class="day-row">${days.map((d, i) => `<label class="day-chip"><input type="radio" name="bday" value="${i}"${i === this.day ? ' checked' : ''}><span><span class="day-name">${d.date.toLocaleDateString('en-US', { weekday: 'short' })}</span><span class="day-num">${d.date.getDate()}</span></span></label>`).join('')}</div>
      </fieldset>
      <fieldset class="picker"><legend>Choose a time on ${day.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</legend>
        <div class="slot-grid">${day.slots.map((iso) => `<label class="slot"><input type="radio" name="slot" value="${iso}"${this.selected === iso ? ' checked' : ''}><span>${fmt.time(new Date(iso))}</span></label>`).join('') || '<p class="muted">No open times this day.</p>'}</div>
      </fieldset>
      <div class="field"><label for="reason">Reason for visit</label>
        <select id="reason"><option>Nutrition check-in</option><option>Questions about lab results</option><option>Review a family recipe</option><option>Holiday meal planning</option></select></div>
      <p class="book-summary" aria-live="polite">${chosen ? `Selected: <strong>${fmt.day(chosen)} at ${fmt.time(chosen)}</strong>` : 'Pick a day and time to continue.'}</p>
      <button class="button button--block" type="button" data-book${chosen ? '' : ' disabled'}>${icon('check')}Book this visit</button>`;
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
    box.querySelector('[data-book]').addEventListener('click', () => {
      if (!chosen) return;
      const visit = bookVisit(this.selected, $('#reason').value);
      this.selected = null;
      this.suggested = null;
      renderVisitLists();
      this.render();
      toast(`Booked ${fmt.short(new Date(visit.iso))} at ${fmt.time(new Date(visit.iso))} with Mei Chen, RD. Sample booking only.`);
      $('#upcoming-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  },
};

/* ---------- Care circle ---------- */
function renderCircle() {
  $('[data-circle]').innerHTML = careCircle.map((p) => `<li class="person">
    <span class="avatar avatar--${p.tone} avatar--lg" aria-hidden="true">${esc(p.name[0])}</span>
    <div><p class="person-name"><strong>${esc(p.name)}</strong></p><p class="muted">${esc(p.detail)}</p></div>
    <span class="chip${p.tone === 'clay' ? ' chip--clay' : ''}${p.role === 'View-only' ? ' chip--plain' : ''}">${p.role === 'View-only' ? icon('lock') : ''}${esc(p.role)}</span>
  </li>`).join('');
}

initShell({ page: 'care' }).then((ctx) => {
  if (!ctx) return;
  $('[data-dietitian-label]').textContent = `${persona.dietitian.label}. Messages and visits are sample data kept in this browser.`;
  renderThreadHead();
  renderThread();
  triageIdle();
  initComposer();
  renderVisitLists();
  booker.render();
  renderCircle();
  hydrateIcons(document);
  tabs = initTabs($('[role="tablist"]'));
});
