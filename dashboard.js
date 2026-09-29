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

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    const caregiverView = button.dataset.view === "caregiver";
    document.querySelectorAll("[data-view]").forEach((option) => {
      const selected = option === button;
      option.classList.toggle("is-selected", selected);
      option.setAttribute("aria-pressed", String(selected));
    });

    const contextCopy = document.querySelector("[data-context-copy]");
    if (contextCopy) {
      contextCopy.textContent = caregiverView
        ? "A shared sample space for keeping meal ideas and care details together."
        : "Your sample dashboard is ready. Use it to keep meal ideas and care details together.";
    }
  });
});

document.querySelectorAll("[data-coming-soon]").forEach((button) => {
  button.addEventListener("click", () => {
    showToast(`${button.dataset.comingSoon} is a preview and isn’t connected yet.`);
  });
});

document.querySelector("[data-sign-out]")?.addEventListener("click", () => {
  showToast("Sign-out will connect during account integration. This sample dashboard has no active session.");
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
