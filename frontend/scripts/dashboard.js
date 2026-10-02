import { authConfigError, getAuthenticatedUser, signOutCurrentSession, supabase } from '../auth/supabase.js';

const sampleMeals = {
  today: {
    breakfast: ["Warm oats with pear", "A cozy starting point · sample idea"],
    lunch: ["Ginger-scallion rice bowl", "Inspired by familiar home flavors · sample idea"],
    dinner: ["Herbed lentil soup", "A comforting classic · sample idea"],
  },
  tomorrow: {
    breakfast: ["Cinnamon toast with berries", "A simple morning favorite · sample idea"],
    lunch: ["Lemon rice with roasted vegetables", "Bright, familiar flavors · sample idea"],
    dinner: ["Ginger vegetable noodles", "A warm bowl to share · sample idea"],
  },
};

const toast = document.querySelector("[data-toast]");
let toastTimeout;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 3600);
}

document.querySelectorAll("[data-day]").forEach((button) => {
  button.addEventListener("click", () => {
    const meals = sampleMeals[button.dataset.day];
    if (!meals) return;

    document.querySelectorAll("[data-day]").forEach((tab) => {
      const selected = tab === button;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-pressed", String(selected));
    });

    Object.entries(meals).forEach(([meal, [name, note]]) => {
      const nameElement = document.querySelector(`[data-meal="${meal}"]`);
      const noteElement = document.querySelector(`[data-meal-note="${meal}"]`);
      if (nameElement) nameElement.textContent = name;
      if (noteElement) noteElement.textContent = note;
    });
  });
});

function setActiveView(view) {
  const caregiverView = view === "caregiver";
  document.querySelectorAll("[data-view]").forEach((option) => {
    const selected = option.dataset.view === view;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-pressed", String(selected));
  });

  document.querySelectorAll("[data-view-copy]").forEach((copy) => {
    copy.hidden = copy.dataset.viewCopy !== view;
  });

  const contextCopy = document.querySelector("[data-context-copy]");
  if (contextCopy) {
    contextCopy.textContent = caregiverView
      ? "A quick look at your shared sample workspace. Open Meal ideas or Care team for more detail."
      : "Find meal ideas, care-team details, and sample lab information here. Your care team can help you decide what applies to you.";
  }
}

const nextSteps = {
  'familiar-meals': 'Make a short list of familiar meals to discuss with a qualified renal dietitian.',
  'understand-options': 'Bring questions about food choices to a qualified renal dietitian or your care team.',
  'prepare-conversation': 'Write down food questions to bring to your next care-team visit.',
};

const focusDetails = {
  'familiar-meals': {
    title: 'Familiar meals',
    copy: 'Explore meal ideas that keep familiar foods and flavors in the conversation.',
  },
  'understand-options': {
    title: 'Food questions',
    copy: 'Bring questions about food choices to a renal dietitian or care team.',
  },
  'prepare-conversation': {
    title: 'Care conversation',
    copy: 'Gather the questions you want to bring to a care-team visit.',
  },
};

const stageDetails = {
  g3b: {
    score: 'G3b',
    title: 'G3b was selected',
    patientCopy: 'This is the stage you entered in the quiz. Your care team can explain what it means for you.',
    caregiverCopy: 'This is the stage entered in the quiz. The patient’s care team can explain what it means for them.',
  },
  g4: {
    score: 'G4',
    title: 'G4 was selected',
    patientCopy: 'This is the stage you entered in the quiz. Your care team can explain what it means for you.',
    caregiverCopy: 'This is the stage entered in the quiz. The patient’s care team can explain what it means for them.',
  },
  unsure: {
    score: 'Unsure',
    title: 'Not confirmed yet',
    patientCopy: 'You selected “not sure.” Your care team can help confirm which stage applies.',
    caregiverCopy: 'The quiz response is “not sure.” The patient’s care team can help confirm which stage applies.',
  },
};

function showMatch(match) {
  if (!match || !nextSteps[match.goal] || !focusDetails[match.goal] || !stageDetails[match.stage]) return;
  const role = match.role === 'caregiver' ? 'caregiver' : 'patient';
  const caregiverView = role === 'caregiver';
  const stage = stageDetails[match.stage];
  const focus = focusDetails[match.goal];
  const hasTraditions = Boolean(match.has_traditions ?? match.hasTraditions);
  setActiveView(role);
  const matchPanel = document.querySelector('#match-panel');
  if (!matchPanel) return;
  document.querySelector('#match-description').textContent = caregiverView
    ? 'You’re exploring support for someone you care for. Here are the priorities captured in the quiz.'
    : 'Here are the priorities captured in your quiz. Use them as a starting point for a conversation with your care team.';
  document.querySelector('#match-score').textContent = stage.score;
  document.querySelector('#match-score').classList.toggle('is-word', stage.score === 'Unsure');
  document.querySelector('#match-score-visual').setAttribute(
    'aria-label', `Quiz stage response: ${stage.score}. This is not a clinical score.`
  );
  document.querySelector('#match-stage-title').textContent = stage.title;
  document.querySelector('#match-stage-copy').textContent = caregiverView ? stage.caregiverCopy : stage.patientCopy;
  document.querySelector('#match-focus-title').textContent = focus.title;
  document.querySelector('#match-focus-copy').textContent = focus.copy;
  document.querySelector('#match-traditions-title').textContent = hasTraditions
    ? 'Include familiar foods'
    : 'Preferences can be added later';
  document.querySelector('#match-traditions-copy').textContent = hasTraditions
    ? 'You shared that food traditions matter. Bring favorite meals and flavors into future care conversations.'
    : 'Favorite foods and traditions can be included whenever you’re ready.';
  document.querySelector('#match-next-step').textContent = nextSteps[match.goal];
  matchPanel.hidden = false;
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    setActiveView(button.dataset.view);
  });
});

document.querySelectorAll("[data-coming-soon]").forEach((button) => {
  button.addEventListener("click", () => {
    showToast(`${button.dataset.comingSoon} is a preview and isn’t connected yet.`);
  });
});

const sectionLinks = [...document.querySelectorAll('.side-link[href^="#"]')];
function syncSectionNav() {
  const currentHash = location.hash || "#overview";
  sectionLinks.forEach((link) => {
    const selected = link.hash === currentHash;
    link.classList.toggle("is-active", selected);
    if (selected) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}
window.addEventListener("hashchange", syncSectionNav);
syncSectionNav();

document.querySelector("[data-sign-out]")?.addEventListener("click", async (event) => {
  event.currentTarget.disabled = true;
  try {
    await signOutCurrentSession();
    try { sessionStorage.removeItem('fuelwell.match.v1'); } catch { /* Storage may be unavailable. */ }
    location.replace('/start.html#sign-in');
  } catch {
    event.currentTarget.disabled = false;
    showToast('We could not sign you out. Please try again.');
  }
});

async function openDashboard() {
  if (authConfigError) {
    location.replace('/start.html#sign-in');
    return;
  }
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      location.replace('/start.html#sign-in');
      return;
    }
    try {
      const { data } = await supabase
        .from('quiz_results')
        .select('role,stage,goal,has_traditions')
        .eq('user_id', user.id)
        .maybeSingle();
      const sessionMatch = JSON.parse(sessionStorage.getItem('fuelwell.match.v1') || 'null');
      showMatch(data || sessionMatch);
    } catch { /* The sample dashboard still works without a saved quiz result. */ }
    document.body.hidden = false;
  } catch {
    location.replace('/start.html#sign-in');
  }
}

openDashboard();
