// Local MVP UI. Fictional sample profiles and a deterministic, inspectable API.
const KEY = 'fuelwell.workspaceConcept.v1';
const view = document.querySelector('#workspace-view');
const toastBox = document.querySelector('.workspace-toast');
const allowedRoutes = new Set(['dashboard', 'notes', 'appointments', 'chat']);
const today = new Date();
const dayOffset = (days) => {
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days, 10, 30);
  return date.toISOString();
};
const sampleEvents = [
  { id: 'sample-dietitian', title: 'Nutrition follow-up', type: 'Dietitian', when: dayOffset(5), place: 'Video visit' },
  { id: 'sample-labs', title: 'Kidney care visit', type: 'Kidney care', when: dayOffset(12), place: 'Clinic' },
];
const sampleNotes = [
  { id: 'sample-guide', title: 'Weekly meal guide', type: 'Guide', week: 0, body: 'Plan familiar meals around the instructions in Fung’s care plan. This is sample copy for the concept.', saved: false },
  { id: 'sample-plan', title: 'Family dinner ideas', type: 'Meal plan', week: 0, body: 'Congee, steamed fish, and vegetable sides are examples to discuss with the dietitian.', saved: false },
  { id: 'sample-doctor', title: 'Questions for the next visit', type: 'Care note', week: 1, body: 'Ask which food targets should appear in FuelWell and when they should be reviewed.', saved: false },
];
const emptyState = () => ({ events: [], notes: [], messages: [], taste: {}, patientId: 'fung', mode: 'meal', preference: { takeout: '', cuisine: '', brands: '' } });
let state;
try { state = { ...emptyState(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
catch { state = emptyState(); }
state.preference = { ...emptyState().preference, ...state.preference };
let profiles = [];
const selected = () => profiles.find((p) => p.id === state.patientId) || { id: 'fung', name: 'Fung', condition: 'CKD G3b', cuisine: 'Cantonese home cooking', plan: { status: 'sample', targets: {} } };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* preview still works */ } };
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const dateLabel = (iso, options) => new Intl.DateTimeFormat('en-US', options).format(new Date(iso));
const route = () => allowedRoutes.has(location.hash.slice(1)) ? location.hash.slice(1) : 'dashboard';
const allEvents = () => [...sampleEvents, ...state.events].sort((a, b) => new Date(a.when) - new Date(b.when));
const allNotes = () => [...state.notes, ...sampleNotes];
const notify = (message) => {
  toastBox.textContent = message;
  toastBox.hidden = false;
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => { toastBox.hidden = true; }, 3500);
};

function calendar(events = allEvents()) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const active = new Set(events.filter((event) => {
    const d = new Date(event.when);
    return d.getFullYear() === year && d.getMonth() === month;
  }).map((event) => new Date(event.when).getDate()));
  const cells = Array.from({ length: first }, () => '<span aria-hidden="true"></span>');
  for (let day = 1; day <= days; day += 1) {
    const classes = [active.has(day) && 'has-event', day === today.getDate() && 'today'].filter(Boolean).join(' ');
    cells.push(`<span class="${classes}"${active.has(day) ? ' title="Appointment scheduled"' : ''}>${day}</span>`);
  }
  return `<div class="workspace-card-head"><h2>${dateLabel(today, { month: 'long', year: 'numeric' })}</h2><a href="#appointments">All appointments →</a></div>
    <div class="workspace-calendar" aria-label="Appointment calendar">${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => `<span class="weekday">${d}</span>`).join('')}${cells.join('')}</div>`;
}

function eventList(events, limit) {
  const shown = events.filter((event) => new Date(event.when) >= new Date(today.getFullYear(), today.getMonth(), today.getDate())).slice(0, limit);
  if (!shown.length) return '<p class="workspace-muted">No upcoming appointments yet.</p>';
  return shown.map((event) => `<div class="workspace-event"><span class="workspace-event-date"><small>${dateLabel(event.when, { month: 'short' })}</small><strong>${dateLabel(event.when, { day: 'numeric' })}</strong></span><div><strong>${esc(event.title)}</strong><p>${esc(event.type)} · ${dateLabel(event.when, { weekday: 'short', hour: 'numeric', minute: '2-digit' })} · ${esc(event.place)}</p></div></div>`).join('');
}

function profileCard() {
  const patient = selected();
  return `<section class="workspace-card" aria-labelledby="profile-heading"><div class="workspace-card-head"><h2 id="profile-heading">${esc(patient.name)}’s food plan</h2><span class="workspace-muted">Fictional profile</span></div>
    <p class="workspace-muted">${esc(patient.condition)} · ${esc(patient.cuisine)}</p>
    <div class="workspace-nutrients">${['Potassium', 'Phosphorus', 'Sodium'].map((name) => `<div><div class="workspace-nutrient-top"><span>${name}</span><span>Target not set</span></div><div class="workspace-track" aria-hidden="true"></div></div>`).join('')}</div>
    <p class="workspace-plan-status">Sample plan only · No dietitian-approved targets</p></section>`;
}

function composer(variant = 'full') {
  return `<form class="workspace-composer" data-chat-form data-variant="${variant}"><label class="sr-only" for="chat-prompt-${variant}">Ask about a meal or menu</label>
    <div class="workspace-mode" role="group" aria-label="Choose task"><button type="button" data-select-mode="meal" aria-pressed="${state.mode === 'meal'}">Adapt a meal</button><button type="button" data-select-mode="menu" aria-pressed="${state.mode === 'menu'}">Compare a menu</button></div>
    <textarea id="chat-prompt-${variant}" name="prompt" placeholder="Describe a meal, or ask about a restaurant menu…" maxlength="1200"></textarea>
    <div class="workspace-composer-foot"><div><label class="workspace-upload">＋ Attach text menu or recipe<input name="attachment" type="file" accept=".txt,text/plain" /></label><span class="workspace-file" data-file-name></span></div><button class="workspace-button" type="submit">Analyze →</button></div>
    <p class="workspace-chat-notice">Text attachments are analyzed by the local demo API. Use fictional examples only.</p></form>`;
}

function prompts() {
  return `<div class="workspace-prompt-grid"><button class="workspace-prompt" type="button" data-mode="meal" data-prompt="Chicken lo mein with soy sauce and oyster sauce"><strong>Adapt a meal</strong><span>Keep a familiar dish, with practical swaps.</span></button>
    <button class="workspace-prompt" type="button" data-mode="menu" data-prompt="Steamed fish with rice; Fried chicken with sauce; Vegetable soup"><strong>Help me order out</strong><span>Compare dishes from a menu you provide.</span></button></div>`;
}

function dashboard() {
  return `<header class="workspace-page-head"><div><p class="workspace-eyebrow">FuelWell · Caregiver workspace</p><h1>Make tonight’s meal work.</h1><p>Use a familiar dish or a restaurant menu. The selected patient’s plan guides the answer.</p></div></header>
    <div class="workspace-grid"><div class="workspace-stack"><section class="workspace-card workspace-chat-preview" aria-labelledby="chat-preview-title"><div class="workspace-card-head"><h2 id="chat-preview-title">Meal companion</h2><a href="#chat">Open full chat →</a></div>
    <div class="workspace-chat-intro"><h2>Start with what you want to eat.</h2><p>Get an example adaptation or compare dishes before ordering.</p></div>${prompts()}${composer('preview')}</section></div>
    <div class="workspace-stack">${profileCard()}<section class="workspace-card">${calendar()}<div style="margin-top:17px">${eventList(allEvents(), 2)}</div></section></div></div>`;
}

function notes(filter = 'all') {
  const filtered = allNotes().filter((item) => filter === 'all' || (filter === 'this' ? item.week === 0 : item.week === 1));
  return `<header class="workspace-page-head"><div><p class="workspace-eyebrow">Saved in one place</p><h1>Notes & plans</h1><p>Weekly guides, meal plans, and questions for the care team.</p></div></header>
    <div class="workspace-split"><div><div class="workspace-filters" role="group" aria-label="Filter by week"><button class="workspace-filter" data-week="all" aria-pressed="${filter === 'all'}">All weeks</button><button class="workspace-filter" data-week="this" aria-pressed="${filter === 'this'}">This week</button><button class="workspace-filter" data-week="next" aria-pressed="${filter === 'next'}">Next week</button></div>
    <div class="workspace-note-list">${filtered.length ? filtered.map((item) => `<article class="workspace-card workspace-note"><span class="workspace-note-meta">${esc(item.type)} · ${item.week === 0 ? 'This week' : 'Next week'}</span><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p>${item.type === 'Meal plan' ? `<div class="workspace-actions"><button class="workspace-filter" data-taste="${esc(item.id)}:like" aria-pressed="${state.taste[item.id] === 'like'}">Liked the taste</button><button class="workspace-filter" data-taste="${esc(item.id)}:change" aria-pressed="${state.taste[item.id] === 'change'}">Would change it</button></div>` : ''}</article>`).join('') : '<p class="workspace-muted">No notes for this week.</p>'}</div></div>
    <div class="workspace-stack"><section class="workspace-card"><h2>Add a note</h2><p class="workspace-muted">For meal ideas or questions to ask at a visit.</p><form data-note-form><label class="workspace-field">Title<input name="title" maxlength="80" required placeholder="For example, Friday dinner" /></label><label class="workspace-field">Type<select name="type"><option>Meal plan</option><option>Care note</option><option>Guide</option></select></label><label class="workspace-field">Week<select name="week"><option value="0">This week</option><option value="1">Next week</option></select></label><label class="workspace-field">Note<textarea name="body" maxlength="1200" required></textarea></label><button class="workspace-button" type="submit">Save note</button></form></section>
    <section class="workspace-card"><h2>Food preferences</h2><p class="workspace-muted">These observations can help personalize future ideas. They are not clinical targets.</p><form data-pref-form><label class="workspace-field">Takeout each week<select name="takeout"><option value="">Choose</option>${['0', '1', '2', '3+'].map((v) => `<option value="${v}"${state.preference.takeout === v ? ' selected' : ''}>${v}</option>`).join('')}</select></label><label class="workspace-field">Food traditions<input name="cuisine" maxlength="80" value="${esc(state.preference.cuisine)}" placeholder="Chinese, Mexican, Western-style…" /></label><label class="workspace-field">Brands used at home<input name="brands" maxlength="160" value="${esc(state.preference.brands)}" placeholder="For example, favorite sauces or packaged foods" /></label><button class="workspace-button secondary" type="submit">Save preferences</button></form></section></div></div>`;
}

function appointments() {
  return `<header class="workspace-page-head"><div><p class="workspace-eyebrow">Care schedule</p><h1>Appointments</h1><p>Only the kidney care visits you add appear here.</p></div></header>
    <div class="workspace-split"><div class="workspace-stack"><section class="workspace-card"><div class="workspace-card-head"><h2>Upcoming</h2><span class="workspace-muted">Fictional sample visits</span></div>${eventList(allEvents(), 20)}</section>
    <section class="workspace-card"><h2>Care team messages</h2><p class="workspace-muted">Messaging with a dietitian or clinic will appear here when a care team connection is available.</p><button class="workspace-button secondary" type="button" data-unavailable="Care team messaging is not connected in this prototype.">Message dietitian</button></section></div>
    <div class="workspace-stack"><section class="workspace-card">${calendar()}</section><section class="workspace-card"><h2>Add an appointment</h2><p class="workspace-muted">This saves a date in your browser. It does not book a clinic visit.</p><form data-event-form><label class="workspace-field">Visit name<input name="title" maxlength="80" required placeholder="Dietitian follow-up" /></label><label class="workspace-field">Type<select name="type"><option>Dietitian</option><option>Dialysis</option><option>Kidney care</option><option>Other</option></select></label><label class="workspace-field">Date and time<input name="when" type="datetime-local" required /></label><label class="workspace-field">Where<input name="place" maxlength="80" placeholder="Clinic or video" /></label><button class="workspace-button" type="submit">Add appointment</button></form></section></div></div>`;
}

function messages() {
  if (!state.messages.length) return `<div class="workspace-empty"><div><strong>No messages yet</strong><p>Start with a meal you want to make or a menu you want to order from.</p></div></div>`;
  return state.messages.map((item) => {
    if (item.role === 'user') return `<article class="workspace-message user"><p>${esc(item.text)}</p></article>`;
    const result = item.result?.response;
    if (!result) return `<article class="workspace-message"><p>${esc(item.text || 'Response unavailable.')}</p></article>`;
    const details = result.kind === 'meal'
      ? `<ul>${result.swaps.map((swap) => `<li>${esc(swap)}</li>`).join('')}</ul>${result.after ? `<p><strong>Example serving estimate:</strong> sodium ${result.after.sodiumMg} mg · potassium ${result.after.potassiumMg} mg · phosphorus ${result.after.phosphorusMg} mg</p><p class="workspace-muted">Original example: sodium ${result.before.sodiumMg} mg. Quantities and food records are listed in the API response.</p>` : ''}`
      : `<ol>${result.items.map((choice) => `<li><strong>${esc(choice.name)}</strong> — ${esc(choice.category)}. ${esc(choice.reasons.join(' '))}</li>`).join('')}</ol>`;
    const pipeline = item.result.pipeline;
    return `<article class="workspace-message"><h3>${esc(result.title)}</h3><p>${esc(result.summary)}</p>${details}<p class="workspace-muted">${esc(result.assumptions.join(' '))}</p><details><summary>Sources used</summary>${result.evidence.map((source) => `<p><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.source)}</a>: ${esc(source.text)}</p>`).join('')}</details>${pipeline ? `<details><summary>How the backend made this answer</summary><p>Profile: ${esc(pipeline.profile)} · Workflow: ${esc(pipeline.workflow)} · Computation: ${esc(pipeline.computation)} · Generation: ${esc(pipeline.generation)}</p><p>Retrieved guidance: ${esc(pipeline.retrieval.join(', '))}</p></details>` : ''}<button class="workspace-text-button" type="button" data-save-message="${esc(item.noteId)}">Save to notes</button></article>`;
  }).join('');
}

function chat() {
  return `<header class="workspace-page-head"><div><p class="workspace-eyebrow">Meal companion</p><h1>Ask about food</h1><p>Adapt a familiar meal or compare choices from a specific menu.</p></div></header>
    <div class="workspace-grid"><section class="workspace-card workspace-chat-panel" aria-label="Chat"><div class="workspace-card-head"><h2>Conversation</h2><span class="workspace-muted">Browser-local preview</span></div><div class="workspace-messages" aria-live="polite">${messages()}</div>${prompts()}${composer()}</section>
    <div class="workspace-stack">${profileCard()}<section class="workspace-card"><h2>How answers will work</h2><p class="workspace-muted">FuelWell will use the selected patient’s reviewed plan, food information, and the meal or menu you provide. Unknown ingredients and portions will be called out.</p><a class="workspace-button secondary" href="#notes">See saved notes</a></section></div></div>`;
}

function render(filter = 'all') {
  const page = route();
  document.querySelector('.workspace-top strong').innerHTML = `<label class="sr-only" for="patient-select">Patient</label><select id="patient-select" class="workspace-patient-select">${profiles.length ? profiles.map((p) => `<option value="${esc(p.id)}"${state.patientId === p.id ? ' selected' : ''}>${esc(p.name)} · ${esc(p.condition)}</option>`).join('') : '<option>Loading profiles…</option>'}</select>`;
  document.querySelectorAll('[data-route]').forEach((link) => {
    if (link.dataset.route === page) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  view.innerHTML = ({ dashboard, notes: () => notes(filter), appointments, chat })[page]();
  wire(page, filter);
  if (page === 'chat') {
    const pending = sessionStorage.getItem('fuelwell.workspacePendingPrompt');
    if (pending) {
      const field = view.querySelector('[data-chat-form] textarea');
      field.value = pending;
      field.focus();
      sessionStorage.removeItem('fuelwell.workspacePendingPrompt');
    }
  }
}

function wire(page, filter) {
  document.querySelector('#patient-select')?.addEventListener('change', (event) => { state.patientId = event.target.value; state.messages = []; save(); render(filter); });
  view.querySelectorAll('[data-select-mode]').forEach((button) => button.addEventListener('click', () => { state.mode = button.dataset.selectMode; save(); view.querySelectorAll('[data-select-mode]').forEach((other) => other.setAttribute('aria-pressed', String(other === button))); }));
  view.querySelectorAll('[data-prompt]').forEach((button) => button.addEventListener('click', () => {
    state.mode = button.dataset.mode;
    save();
    if (page !== 'chat') { sessionStorage.setItem('fuelwell.workspacePendingPrompt', button.dataset.prompt); location.hash = 'chat'; }
    else { const field = view.querySelector('[data-chat-form] textarea'); field.value = button.dataset.prompt; field.focus(); }
  }));
  view.querySelectorAll('[data-chat-form]').forEach((form) => {
    const attachment = form.querySelector('[name="attachment"]');
    const prompt = form.querySelector('[name="prompt"]');
    attachment.addEventListener('change', () => { form.querySelector('[data-file-name]').textContent = attachment.files[0]?.name || ''; });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      let text = prompt.value.trim();
      const file = attachment.files[0];
      if (file) text += `\n${(await file.text()).slice(0, 4000)}`;
      if (!text) { notify('Describe a meal or attach a text menu or recipe.'); return; }
      const submit = form.querySelector('[type="submit"]');
      submit.disabled = true; submit.textContent = 'Analyzing…';
      try {
        const response = await fetch('/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ patientId: state.patientId, mode: state.mode, message: text }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Analysis failed.');
        state.messages.push({ role: 'user', text });
        state.messages.push({ role: 'system', result, noteId: `chat-${Date.now()}` });
        save(); location.hash = 'chat'; render();
        view.querySelector('.workspace-messages')?.scrollTo({ top: 999999 });
      } catch (error) { notify(`Local API error: ${error.message}. Run npm run dev:api.`); submit.disabled = false; submit.textContent = 'Analyze →'; }
    });
  });
  view.querySelectorAll('[data-week]').forEach((button) => button.addEventListener('click', () => render(button.dataset.week)));
  view.querySelector('[data-note-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    state.notes.unshift({ id: `note-${Date.now()}`, title: String(data.get('title')).trim(), type: String(data.get('type')), week: Number(data.get('week')), body: String(data.get('body')).trim() });
    save(); render(filter); notify('Note saved in this browser.');
  });
  view.querySelector('[data-pref-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    state.preference = { takeout: String(data.get('takeout')), cuisine: String(data.get('cuisine')).trim(), brands: String(data.get('brands')).trim() };
    save(); notify('Food preferences saved in this browser.');
  });
  view.querySelectorAll('[data-taste]').forEach((button) => button.addEventListener('click', () => {
    const [id, value] = button.dataset.taste.split(':');
    state.taste[id] = value;
    save(); render(filter); notify('Taste feedback saved.');
  }));
  view.querySelector('[data-event-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const when = new Date(String(data.get('when')));
    if (!Number.isFinite(when.getTime()) || when < new Date()) { notify('Choose a future appointment time.'); return; }
    state.events.push({ id: `event-${Date.now()}`, title: String(data.get('title')).trim(), type: String(data.get('type')), when: when.toISOString(), place: String(data.get('place')).trim() || 'Location not set' });
    save(); render(); notify('Appointment added in this browser.');
  });
  view.querySelectorAll('[data-unavailable]').forEach((button) => button.addEventListener('click', () => notify(button.dataset.unavailable)));
  view.querySelectorAll('[data-save-message]').forEach((button) => button.addEventListener('click', () => {
    const item = state.messages.find((message) => message.noteId === button.dataset.saveMessage);
    if (!item) return;
    state.notes.unshift({ id: `note-${Date.now()}`, title: item.result?.response?.title || 'Saved chat note', type: 'Meal plan', week: 0, body: item.result?.response?.summary || item.text });
    save(); notify('Message saved to notes.');
  }));
}

window.addEventListener('hashchange', () => render());
fetch('/api/profiles').then((response) => response.json()).then((data) => { profiles = data.profiles || []; render(); }).catch(() => { render(); notify('Start the local API with npm run dev:api.'); });
render();
