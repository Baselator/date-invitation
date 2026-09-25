const app = document.querySelector("#app");

const dateOptions = [
  { id: "moon", label: "A trip to the moon", emoji: "\u{1F319}" },
  { id: "food", label: "Eating", emoji: "\u{1F37D}\uFE0F" },
  { id: "activity", label: "Activity", emoji: "\u{1F3AC}" }
];

const choices = {
  food: [
    { label: "Sushi", emoji: "\u{1F363}" },
    { label: "Steak", emoji: "\u{1F969}" },
    { label: "Seafood", emoji: "\u{1F990}" },
    { label: "Bar", emoji: "\u{1F378}" }
  ],
  activity: [
    { label: "A walk", emoji: "\u{1F33F}" },
    { label: "Bike ride", emoji: "\u{1F6B2}" },
    { label: "Movie", emoji: "\u{1F3AC}" }
  ]
};

const state = { screen: "question", isSubmitting: false, noClicks: 0 };
let disappearanceTimer;

function backButton(destination = "activities") {
  return `<button class="back-button" type="button" data-back="${destination}">
    <span aria-hidden="true">&larr;</span> Go back
  </button>`;
}

function optionButton(option, attribute, value) {
  return `<button class="option-button" type="button" ${attribute}="${value}">
    <span class="emoji" aria-hidden="true">${option.emoji}</span>
    <span class="option-label">${option.label}</span>
    <span class="option-arrow" aria-hidden="true">&rarr;</span>
  </button>`;
}

function screenContent() {
  switch (state.screen) {
    case "question":
      return `<p class="eyebrow">A little invitation</p>
        <h1 class="title question-title">Do you want to go<br class="desktop-break"> on a date with me,<br><em>Viktoria?</em></h1>
        <div class="answer-zone" data-answer-zone>
          <button class="answer-button yes-button" type="button" data-action="yes">Yes</button>
          <button class="answer-button no-button" type="button" data-action="no">No</button>
        </div>`;
    case "activities":
      return `<p class="eyebrow">You, me &amp; a little adventure</p>
        <h1 class="title">Choose our date</h1>
        <div class="choice-grid">${dateOptions.map(option => optionButton(option, "data-screen", option.id)).join("")}</div>
        ${backButton("question")}`;
    case "food":
    case "activity": {
      const isFood = state.screen === "food";
      return `<p class="eyebrow">${isFood ? "A table for two" : "A little time together"}</p>
        <h1 class="title">${isFood ? "What are you craving?" : "Choose an activity"}</h1>
        <div class="choice-grid">${choices[state.screen].map((option, index) => optionButton(option, "data-choice", index)).join("")}</div>
        <p class="feedback" role="status" data-feedback></p>
        ${backButton()}`;
    }
    case "moon":
      return `<span class="scene-symbol" aria-hidden="true">&#127769;</span>
        <h1 class="title">I am not<br><em>that rich.</em></h1>
        ${backButton()}`;
    case "thanks":
      return `<span class="scene-symbol" aria-hidden="true">&#9825;</span>
        <h1 class="title">Thanks for<br><em>participating.</em></h1>
        ${backButton()}`;
  }
}

function render() {
  app.innerHTML = `<div class="screen ${state.screen}-screen">${screenContent()}</div>`;
  app.querySelector('[data-action="yes"]')?.addEventListener("click", () => setScreen("activities"));
  app.querySelector('[data-action="no"]')?.addEventListener("click", moveNoButton);
  app.querySelectorAll("[data-screen]").forEach(button => {
    button.addEventListener("click", () => setScreen(button.dataset.screen));
  });
  app.querySelectorAll("[data-back]").forEach(button => {
    button.addEventListener("click", () => setScreen(button.dataset.back));
  });
  app.querySelectorAll("[data-choice]").forEach(button => {
    button.addEventListener("click", () => chooseFinal(button));
  });
  const heading = app.querySelector("h1");
  heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
}

function setScreen(screen) {
  if (state.isSubmitting) return;
  window.clearTimeout(disappearanceTimer);
  state.screen = screen;
  state.noClicks = 0;
  render();
}

function moveNoButton(event) {
  const button = event.currentTarget;
  if (button.disabled) return;
  state.noClicks += 1;
  if (state.noClicks === 5) {
    button.disabled = true;
    button.classList.add("is-disappearing");
    disappearanceTimer = window.setTimeout(() => {
      if (document.activeElement === button) {
        app.querySelector('[data-action="yes"]')?.focus({ preventScroll: true });
      }
      button.remove();
    }, 850);
    return;
  }
  // Lower-row escapes never cross Yes; proportional coordinates survive rotation.
  const stops = [
    { x: 1, y: 1 },
    { x: 0.08, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 0 }
  ];
  const next = stops[state.noClicks - 1];
  button.style.left = `calc(${next.x * 100}% - var(--answer-width) * ${next.x})`;
  button.style.top = next.y ? "132px" : "24px";
}

async function chooseFinal(button) {
  if (state.isSubmitting) return;
  const activity = state.screen === "food" ? "Eating" : "Activity";
  const detail = choices[state.screen][Number(button.dataset.choice)].label;
  state.isSubmitting = true;
  app.setAttribute("aria-busy", "true");
  app.querySelectorAll("button").forEach(control => { control.disabled = true; });
  button.classList.add("is-good");
  showFeedback("Good choice.", "good");
  try {
    await Promise.all([submitChoice(activity, detail), wait(950)]);
    state.isSubmitting = false;
    setScreen("thanks");
  } catch (error) {
    console.warn("Date response email could not be sent.", error);
    showFeedback("Couldn't send your choice. Please try again.", "error");
    button.classList.remove("is-good");
    app.querySelectorAll("button").forEach(control => { control.disabled = false; });
    state.isSubmitting = false;
  } finally {
    app.removeAttribute("aria-busy");
  }
}

function showFeedback(message, kind) {
  const feedback = app.querySelector("[data-feedback]");
  feedback.textContent = message;
  feedback.className = `feedback ${kind}`;
}

async function submitChoice(activity, detail) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch("/api/send-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        answer: "yes",
        activity,
        detail,
        timestamp: new Date().toISOString(),
        pagePath: window.location.href,
        userAgent: navigator.userAgent
      })
    });
    if (!response.ok) throw new Error(`Email request failed with ${response.status}`);
  } finally {
    window.clearTimeout(timeout);
  }
}

function wait(milliseconds) {
  return new Promise(resolve => window.setTimeout(resolve, milliseconds));
}

render();
