const app = document.querySelector("#app");

const screens = {
  question: renderQuestion,
  activities: renderActivities,
  watch: renderWatch,
  food: renderFood,
  moon: renderMoon,
  thanks: renderThanks
};

const activityOptions = [
  { id: "watch", label: "watch something", emoji: "📺" },
  { id: "food", label: "go eat something", emoji: "🍝" },
  { id: "moon", label: "a trip to the moon", emoji: "🌙" }
];

const watchOptions = [
  "The Office",
  "Breaking Bad",
  "Friends",
  "Stranger Things",
  "Interstellar",
  "Game of Thrones",
  "The Last of Us",
  "The Notebook"
];

const foodOptions = [
  { label: "sushi", emoji: "🍣" },
  { label: "pizza", emoji: "🍕" },
  { label: "pasta", emoji: "🍝" },
  { label: "burgers", emoji: "🍔" },
  { label: "tacos", emoji: "🌮" },
  { label: "ramen", emoji: "🍜" },
  { label: "dessert", emoji: "🍰" },
  { label: "ice cream", emoji: "🍨" }
];

const state = {
  screen: "question",
  feedback: "",
  feedbackKind: "",
  isSubmitting: false
};

function panel(content, extraClass = "") {
  return `
    <div class="panel">
      <div class="sparkles" aria-hidden="true">
        <span></span><span></span><span></span><span></span>
      </div>
      <div class="screen ${extraClass}">
        ${content}
      </div>
    </div>
  `;
}

function icon(mark) {
  return `<div class="icon-orbit" aria-hidden="true">${mark}</div>`;
}

function renderQuestion() {
  return panel(`
    ${icon("♡")}
    <h1 class="title">Do you want to go on a date with me tonight?</h1>
    <div class="answer-zone" data-answer-zone>
      <button class="answer-button yes-button" type="button" data-action="yes">Yes</button>
      <button class="answer-button no-button" type="button" data-action="no">No</button>
    </div>
  `, "question-screen");
}

function renderActivities() {
  const options = activityOptions
    .map((option) => `
      <button class="option-button" type="button" data-activity="${option.id}">
        <span class="emoji" aria-hidden="true">${option.emoji}</span>
        <span class="option-label">${option.label}</span>
      </button>
    `)
    .join("");

  return panel(`
    ${icon("✦")}
    <h1 class="title small">choose activity</h1>
    <div class="choice-grid">${options}</div>
  `);
}

function renderWatch() {
  const options = watchOptions
    .map((label) => `
      <button class="option-button" type="button" data-watch="${escapeAttr(label)}">
        <span class="option-label">${label}</span>
      </button>
    `)
    .join("");

  return panel(`
    <h1 class="title small">watch something</h1>
    <div class="feedback ${state.feedbackKind}" data-feedback>${state.feedback}</div>
    <div class="movie-grid">${options}</div>
  `, "compact");
}

function renderFood() {
  const options = foodOptions
    .map((option) => `
      <button class="option-button" type="button" data-food="${escapeAttr(option.label)}">
        <span class="option-label">${option.label}</span>
        <span class="emoji" aria-hidden="true">${option.emoji}</span>
      </button>
    `)
    .join("");

  return panel(`
    <h1 class="title small">go eat something</h1>
    <div class="feedback ${state.feedbackKind}" data-feedback>${state.feedback}</div>
    <div class="food-grid">${options}</div>
  `, "compact");
}

function renderMoon() {
  return panel(`
    ${icon("🌙")}
    <h1 class="title small">i am not that rich</h1>
    <button class="back-button" type="button" data-action="back-to-activities">
      go back to date options
    </button>
  `, "moon-screen");
}

function renderThanks() {
  return panel(`
    ${icon("♡")}
    <h1 class="title small">thanks for participating</h1>
  `, "thanks-screen");
}

function render() {
  state.feedback = state.screen === "watch" || state.screen === "food" ? state.feedback : "";
  state.feedbackKind = state.feedback ? state.feedbackKind : "";
  app.innerHTML = screens[state.screen]();
  bindEvents();
  focusFirstHeading();
}

function bindEvents() {
  app.querySelector('[data-action="yes"]')?.addEventListener("click", () => {
    setScreen("activities");
  });

  app.querySelector('[data-action="no"]')?.addEventListener("click", moveNoButton);

  app.querySelectorAll("[data-activity]").forEach((button) => {
    button.addEventListener("click", () => {
      const activity = button.dataset.activity;

      if (activity === "watch") setScreen("watch");
      if (activity === "food") setScreen("food");
      if (activity === "moon") setScreen("moon");
    });
  });

  app.querySelectorAll("[data-watch]").forEach((button) => {
    button.addEventListener("click", () => {
      const choice = button.dataset.watch;

      if (choice === "Game of Thrones") {
        chooseFinal(button, "watch something", choice);
        return;
      }

      button.classList.remove("is-wrong");
      void button.offsetWidth;
      button.classList.add("is-wrong");
      showFeedback("no wrong choice try again", "wrong");
    });
  });

  app.querySelectorAll("[data-food]").forEach((button) => {
    button.addEventListener("click", () => {
      chooseFinal(button, "go eat something", button.dataset.food);
    });
  });

  app.querySelector('[data-action="back-to-activities"]')?.addEventListener("click", () => {
    setScreen("activities");
  });
}

function setScreen(screen) {
  state.screen = screen;
  state.feedback = "";
  state.feedbackKind = "";
  render();
}

function moveNoButton(event) {
  const button = event.currentTarget;
  const zone = app.querySelector("[data-answer-zone]");
  const yes = app.querySelector('[data-action="yes"]');

  if (!button || !zone || !yes) return;

  const zoneRect = zone.getBoundingClientRect();
  const yesRect = yes.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  const yesBox = {
    left: yesRect.left - zoneRect.left,
    right: yesRect.right - zoneRect.left,
    top: yesRect.top - zoneRect.top,
    bottom: yesRect.bottom - zoneRect.top
  };

  let next = { x: 0, y: 0 };
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const x = randomBetween(0, Math.max(0, zoneRect.width - buttonRect.width));
    const y = randomBetween(0, Math.max(0, zoneRect.height - buttonRect.height));
    const candidate = {
      left: x,
      right: x + buttonRect.width,
      top: y,
      bottom: y + buttonRect.height
    };

    if (!boxesOverlap(candidate, yesBox, 12)) {
      next = { x, y };
      break;
    }
  }

  button.style.left = `${next.x}px`;
  button.style.top = `${next.y}px`;
  button.classList.remove("is-running");
  void button.offsetWidth;
  button.classList.add("is-running");
}

function boxesOverlap(a, b, padding = 0) {
  return !(
    a.right + padding < b.left ||
    a.left - padding > b.right ||
    a.bottom + padding < b.top ||
    a.top - padding > b.bottom
  );
}

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

async function chooseFinal(button, activity, detail) {
  if (state.isSubmitting) return;

  state.isSubmitting = true;
  button.classList.add("is-good");
  showFeedback("good choice", "good");
  await wait(950);
  await submitChoice(activity, detail);
  state.isSubmitting = false;
  setScreen("thanks");
}

function showFeedback(message, kind) {
  const feedback = app.querySelector("[data-feedback]");
  state.feedback = message;
  state.feedbackKind = kind;

  if (!feedback) return;

  feedback.textContent = message;
  feedback.className = `feedback ${kind}`;
}

async function submitChoice(activity, detail) {
  const payload = {
    answer: "yes",
    activity,
    detail,
    timestamp: new Date().toISOString(),
    pagePath: window.location.href,
    userAgent: navigator.userAgent
  };

  try {
    const response = await fetch("/api/send-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Email request failed with ${response.status}`);
    }
  } catch (error) {
    console.warn("Date response email could not be sent.", error);
  }
}

function focusFirstHeading() {
  const heading = app.querySelector("h1");
  if (!heading) return;

  heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
}

function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

render();
