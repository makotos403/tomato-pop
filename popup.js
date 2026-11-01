// Popup: the circular timer, plus the settings view in the same 300px area.
// Holds no timer of its own — it reads state from the background worker, ticks
// the display locally while running, and sends events back.

import { resolveLang, loadMessages, makeT } from "./i18n.js";
import { initSettings, localizeSettings, openSettings } from "./settings.js";
import {
  REVIEW_URL,
  isReviewDue,
  nextReview,
} from "./review.js";

const PHASE_LABEL = {
  pomodoro: "phase.work",
  shortBreak: "phase.shortBreak",
  longBreak: "phase.longBreak",
};
const NEXT_CTA = {
  pomodoro: "next.work",
  shortBreak: "next.shortBreak",
  longBreak: "next.longBreak",
};

const el = {
  viewTimer: document.getElementById("view-timer"),
  viewSettings: document.getElementById("view-settings"),
  tabs: document.querySelectorAll(".tab"),
  tabLongBreak: document.getElementById("tab-longBreak"),
  time: document.getElementById("time"),
  progress: document.querySelector(".ring-progress"),
  dots: document.getElementById("dots"),
  today: document.getElementById("today"),
  primary: document.getElementById("btn-primary"),
  reset: document.getElementById("btn-reset"),
  settings: document.getElementById("btn-settings"),
  popout: document.getElementById("btn-popout"),
  back: document.getElementById("btn-back"),
  review: document.getElementById("review"),
  reviewTitle: document.getElementById("review-title"),
  reviewBody: document.getElementById("review-body"),
  reviewRate: document.getElementById("review-rate"),
  reviewLater: document.getElementById("review-later"),
  reviewNever: document.getElementById("review-never"),
};

// "?w=1" -> this page is the detached pop-out window, not the toolbar dropdown.
const windowMode = new URLSearchParams(location.search).get("w") === "1";

// Shared with settings.js — it reads settings + t from here.
const shared = { settings: null, t: (k) => k };
let tickTimer = null;

const send = (message) => chrome.runtime.sendMessage(message);
const getSnapshot = () => send({ type: "GET" });
const dispatch = (event) => send({ type: "EVENT", event });

function fmt(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function totalMs(state) {
  return (shared.settings.durations[state.phase] ?? 25) * 60_000;
}

function remainingMs(state) {
  if (state.status === "running") return Math.max(0, state.endTime - Date.now());
  if (state.remainingMs != null) return Math.max(0, state.remainingMs);
  return totalMs(state); // fresh install / never started
}

// --- timer render ---

function renderStatic(state) {
  const t = shared.t;

  el.tabs.forEach((tab) => {
    const phase = tab.dataset.phase;
    tab.textContent = t(PHASE_LABEL[phase]);
    tab.classList.toggle("is-active", phase === state.phase);
  });

  // Long break off: hide its tab and the "progress to a long break" dots.
  // Keep the tab while a long break is somehow still the active phase.
  const lbOn = shared.settings.longBreakEnabled !== false;
  el.tabLongBreak.hidden = !lbOn && state.phase !== "longBreak";
  el.dots.hidden = !lbOn;

  if (lbOn) {
    const total = shared.settings.longBreakInterval;
    const done = Math.min(state.round, total);
    el.dots.replaceChildren(
      ...Array.from({ length: total }, (_, i) => {
        const d = document.createElement("span");
        d.className = "dot" + (i < done ? " is-done" : "");
        return d;
      }),
    );
  } else {
    el.dots.replaceChildren();
  }

  el.today.textContent = t("progress.today", { count: state.completedToday });
  el.viewTimer.dataset.phase = state.phase;

  if (state.status === "running") {
    el.primary.textContent = t("control.pause");
    el.primary.dataset.action = "PAUSE";
  } else if (state.status === "paused") {
    el.primary.textContent = t("control.resume");
    el.primary.dataset.action = "START";
  } else {
    el.primary.textContent = t(NEXT_CTA[state.phase]);
    el.primary.dataset.action = "START";
  }
  el.reset.textContent = t("control.reset");
  el.settings.textContent = t("control.settings");
  el.popout.title = t("control.popOut");
}

function renderTick(state) {
  const rem = remainingMs(state);
  const total = totalMs(state);
  el.time.textContent = fmt(rem);
  // Remaining arc: a full ring that is eaten away clockwise from 12 o'clock.
  // The arc length shrinks and the whole ring rotates so its trailing edge
  // stays pinned at 12 while the leading (eating) edge sweeps clockwise.
  const remainingPct = total > 0 ? Math.min(100, Math.max(0, (rem / total) * 100)) : 100;
  const elapsedDeg = (100 - remainingPct) * 3.6;
  el.progress.setAttribute("stroke-dasharray", `${remainingPct.toFixed(2)} 100`);
  el.progress.style.transform = `rotate(${(-90 + elapsedDeg).toFixed(2)}deg)`;
}

function stopTick() {
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = null;
}

// --- rating prompt (see review.js for the policy) ---

// Set once the user answers; even if saving failed we never ask again this session.
let reviewAnswered = false;

async function loadReview() {
  const { review } = await chrome.storage.local.get("review");
  return review;
}

// Shown only in the dropdown, only while not running, only when due.
// Any storage error means "stay hidden".
async function renderReview(state) {
  if (!el.viewSettings.hidden) return; // never cover the settings view
  let show = false;
  try {
    show = !reviewAnswered && !windowMode && state.status !== "running" && isReviewDue(state.totalCompleted, await loadReview());
  } catch (_) {
    show = false;
  }
  if (show) {
    const t = shared.t;
    el.reviewTitle.textContent = t("review.title");
    el.reviewBody.textContent = t("review.body");
    el.reviewRate.textContent = t("review.rate");
    el.reviewRate.href = REVIEW_URL;
    el.reviewLater.textContent = t("review.later");
    el.reviewNever.textContent = t("review.never");
  }
  el.review.hidden = !show;
  el.viewTimer.hidden = show;
}

// Hide first, then record the choice; a failed write must not block the user.
async function answerReview(answer) {
  reviewAnswered = true;
  try {
    const { state } = await getSnapshot();
    await chrome.storage.local.set({
      review: nextReview(await loadReview(), answer, state.totalCompleted ?? 0),
    });
  } catch (_) {
    /* not saved: the next popup may ask once more, this one will not */
  }
  el.review.hidden = true;
  el.viewTimer.hidden = false;
  refresh();
}

async function refresh() {
  const { state } = await getSnapshot();
  await renderReview(state); // decide timer vs. rating view before drawing
  renderStatic(state);
  renderTick(state);
  stopTick();
  if (state.status === "running") {
    tickTimer = setInterval(() => renderTick(state), 250);
  }
  fitWindow();
}

// In the pop-out window, resize the window to fit the current view's content
// (the toolbar dropdown does this automatically; a window does not).
async function fitWindow() {
  if (!windowMode) return;
  try {
    const win = await chrome.windows.getCurrent();
    // Measure the actual content box — documentElement.scrollHeight can't drop
    // below the viewport, so it never lets the window shrink again.
    const app = document.querySelector(".app");
    const contentH = Math.ceil(app.getBoundingClientRect().bottom) + 2;
    const frame = win.height - window.innerHeight; // title bar + borders
    const target = Math.max(320, Math.min(680, contentH + frame));
    if (Math.abs(target - win.height) > 3) {
      await chrome.windows.update(win.id, { height: target });
    }
  } catch (_) {
    /* window closing */
  }
}

// --- language ---

async function applyLang() {
  const lang = resolveLang(shared.settings.language);
  document.documentElement.lang = lang;
  shared.t = makeT(await loadMessages(lang));
}

async function relocalizeAll() {
  await applyLang();
  localizeSettings();
  await refresh();
}

// --- view switching ---

async function showSettings() {
  stopTick();
  el.viewTimer.hidden = true;
  el.viewSettings.hidden = false;
  await openSettings();
  fitWindow();
}

function showTimer() {
  el.viewSettings.hidden = true;
  el.viewTimer.hidden = false;
  refresh();
}

// --- events ---

el.tabs.forEach((tab) =>
  tab.addEventListener("click", async () => {
    await dispatch({ type: "SELECT_PHASE", phase: tab.dataset.phase });
    refresh();
  }),
);

el.primary.addEventListener("click", async () => {
  await dispatch({ type: el.primary.dataset.action });
  refresh();
});

el.reset.addEventListener("click", async () => {
  await dispatch({ type: "RESET" });
  refresh();
});

el.reviewRate.addEventListener("click", async (e) => {
  e.preventDefault(); // record the answer first; the new tab would close the popup
  await answerReview("rate");
  chrome.tabs.create({ url: REVIEW_URL });
});
el.reviewLater.addEventListener("click", () => answerReview("later"));
el.reviewNever.addEventListener("click", () => answerReview("never"));

el.settings.addEventListener("click", showSettings);
el.back.addEventListener("click", showTimer);

el.popout.addEventListener("click", async () => {
  await send({ type: "OPEN_WINDOW" });
  window.close(); // close the dropdown; the window takes over
});

// react to background-driven changes (e.g. a phase ending while the popup is open)
chrome.storage.local.onChanged.addListener((changes) => {
  if ((changes.state || changes.settings || changes.review) && el.viewSettings.hidden) refresh();
});

// --- boot ---

(async () => {
  if (windowMode) {
    document.documentElement.classList.add("window-mode");
    el.popout.hidden = true; // the window is already "popped out"
  }

  const { settings } = await getSnapshot();
  shared.settings = settings;
  await applyLang();

  initSettings({ send, state: shared, relocalizeAll });
  localizeSettings();

  await refresh();
})();
