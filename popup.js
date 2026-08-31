// Popup: the circular timer, plus the settings view in the same 300px area.
// Holds no timer of its own — it reads state from the background worker, ticks
// the display locally while running, and sends events back.

import { resolveLang, loadMessages, makeT } from "./i18n.js";
import { initSettings, localizeSettings, openSettings } from "./settings.js";

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
  back: document.getElementById("btn-back"),
};

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

async function refresh() {
  const { state } = await getSnapshot();
  renderStatic(state);
  renderTick(state);
  stopTick();
  if (state.status === "running") {
    tickTimer = setInterval(() => renderTick(state), 250);
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

el.settings.addEventListener("click", showSettings);
el.back.addEventListener("click", showTimer);

// react to background-driven changes (e.g. a phase ending while the popup is open)
chrome.storage.local.onChanged.addListener((changes) => {
  if ((changes.state || changes.settings) && !el.viewTimer.hidden) refresh();
});

// --- boot ---

(async () => {
  const { settings } = await getSnapshot();
  shared.settings = settings;
  await applyLang();

  initSettings({ send, state: shared, relocalizeAll });
  localizeSettings();

  await refresh();
})();
