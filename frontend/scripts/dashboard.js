import { authConfigError, getAuthenticatedUser, signOutCurrentSession } from '../auth/supabase.js';

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

  const contextCopy = document.querySelector("[data-context-copy]");
  if (contextCopy) {
    contextCopy.textContent = caregiverView
      ? "A shared sample space for keeping meal ideas and care details together."
      : "Your sample dashboard is ready. Use it to keep meal ideas and care details together.";
  }
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

document.querySelectorAll(".side-link").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".side-link").forEach((item) => {
      item.classList.toggle("is-active", item === link);
      if (item === link) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
  });
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
      const match = JSON.parse(sessionStorage.getItem('fuelwell.match.v1') || 'null');
      if (match?.role === 'caregiver') setActiveView('caregiver');
    } catch { /* The sample dashboard does not need stored quiz answers. */ }
    document.body.hidden = false;
  } catch {
    location.replace('/start.html#sign-in');
  }
}

openDashboard();
