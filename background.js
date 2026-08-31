// Wires chrome.* events to the pure state machine in state.js.
// The service worker is ephemeral: it holds no timer in memory. The absolute
// `endTime` in storage plus a chrome.alarms deadline are the real clock.

import { INITIAL_STATE, DEFAULT_SETTINGS } from "./defaults.js";
import { reduce, remainingMs } from "./state.js";
import { getT } from "./i18n.js";

const ALARM_PHASE_END = "phaseEnd";
const ALARM_BADGE = "badgeTick";

// Badge colours are deeper than the popup's palette so white text stays legible
// on the tiny toolbar badge (the ring in the popup keeps the lighter tones).
const BADGE_TEXT = "#ffffff";
const BADGE_POMODORO = "#c5372a"; // deep tomato
const BADGE_BREAK = "#4e6344"; // deep leaf
const BADGE_ALERT = "#8f2018"; // phase just ended

// --- storage helpers -------------------------------------------------------

async function loadState() {
  const { state } = await chrome.storage.local.get("state");
  return { ...INITIAL_STATE, ...(state ?? {}) };
}

async function loadSettings() {
  const { settings } = await chrome.storage.local.get("settings");
  return {
    ...DEFAULT_SETTINGS,
    ...(settings ?? {}),
    durations: { ...DEFAULT_SETTINGS.durations, ...(settings?.durations ?? {}) },
  };
}

// --- dispatch ------------------------------------------------------------

async function dispatch(event) {
  const [state, settings] = await Promise.all([loadState(), loadSettings()]);
  const { state: next, effects } = reduce(state, settings, event);
  await chrome.storage.local.set({ state: next });
  await runEffects(effects, next, settings);
  return next;
}

async function runEffects(effects, state, settings) {
  for (const e of effects) {
    switch (e.type) {
      case "setAlarm":
        await chrome.alarms.clear(ALARM_PHASE_END);
        chrome.alarms.create(ALARM_PHASE_END, { when: e.at });
        break;
      case "clearAlarm":
        await chrome.alarms.clear(ALARM_PHASE_END);
        break;
      case "startBadgeTicks":
        startBadgeLoop(state);
        chrome.alarms.create(ALARM_BADGE, { periodInMinutes: 1 }); // safety net if the SW is torn down
        break;
      case "stopBadgeTicks":
        stopBadgeLoop();
        await chrome.alarms.clear(ALARM_BADGE);
        break;
      case "updateBadge":
        await updateBadge(state, settings, false);
        break;
      case "badgeAlert":
        await updateBadge(state, settings, true);
        break;
      case "notify":
        await notify(e.finished, e.next, settings);
        break;
      case "playSound":
        await playSound(settings);
        break;
      case "alertTab":
        await alertActiveTab(e.finished, e.next, settings);
        break;
    }
  }
}

// --- badge --------------------------------------------------------------

// Live "MM:SS" on the toolbar icon. A 1s setInterval keeps the SW awake while
// running (each tick calls a chrome API, resetting the idle timer). If the SW
// is still torn down, ALARM_BADGE / the next message revives it and reconciles.

let badgeLoop = null;

function badgeText(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  if (m >= 100) return `${m}`;
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

function startBadgeLoop(state) {
  stopBadgeLoop();
  if (state.status !== "running") return;
  badgeLoop = setInterval(() => {
    const rem = state.endTime - Date.now();
    if (!(rem > 0)) return stopBadgeLoop();
    chrome.action.setBadgeText({ text: badgeText(rem) });
  }, 1000);
}

function stopBadgeLoop() {
  if (badgeLoop) clearInterval(badgeLoop);
  badgeLoop = null;
}

async function updateBadge(state, settings, alert) {
  if (!settings.showBadge || state.status === "idle") {
    await chrome.action.setBadgeText({ text: "" });
    return;
  }
  await chrome.action.setBadgeText({ text: badgeText(remainingMs(state)) });
  await chrome.action.setBadgeBackgroundColor({
    color: alert
      ? BADGE_ALERT
      : state.phase === "pomodoro"
        ? BADGE_POMODORO
        : BADGE_BREAK,
  });
  if (chrome.action.setBadgeTextColor) {
    await chrome.action.setBadgeTextColor({ color: BADGE_TEXT });
  }
}

async function reconcileBadge() {
  const [state, settings] = await Promise.all([loadState(), loadSettings()]);
  await updateBadge(state, settings, false);
  if (state.status === "running" && settings.showBadge) startBadgeLoop(state);
  else stopBadgeLoop();
}

// --- notification ------------------------------------------------------

const DONE_KEYS = {
  pomodoro: ["notify.workDoneTitle", "notify.workDoneBody"],
  shortBreak: ["notify.shortBreakDoneTitle", "notify.shortBreakDoneBody"],
  longBreak: ["notify.longBreakDoneTitle", "notify.longBreakDoneBody"],
};

async function notify(finished, next, settings) {
  const t = await getT(settings.language);
  const [titleKey, bodyKey] = DONE_KEYS[finished];
  const startBtn =
    next === "pomodoro" ? t("notify.btnStartFocus") : t("notify.btnStartBreak");

  await chrome.notifications.create(`tp-${Date.now()}`, {
    type: "basic",
    iconUrl: chrome.runtime.getURL("icons/icon128.png"),
    title: t(titleKey),
    message: t(bodyKey),
    buttons: [{ title: startBtn }],
    requireInteraction: true,
    silent: settings.sound !== "system",
  });
}

chrome.notifications.onButtonClicked.addListener(async (id) => {
  await dispatch({ type: "START" });
  chrome.notifications.clear(id);
});

chrome.notifications.onClicked.addListener((id) => chrome.notifications.clear(id));

// --- sound (offscreen document) ---------------------------------------

let creatingOffscreen;

async function ensureOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  if (!creatingOffscreen) {
    creatingOffscreen = chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Play the timer's end-of-session chime.",
    });
  }
  try {
    await creatingOffscreen;
  } finally {
    creatingOffscreen = null;
  }
}

async function playChime(volume) {
  await ensureOffscreen();
  // The offscreen doc may not have wired its listener on the very first call.
  for (let i = 0; i < 3; i++) {
    try {
      const res = await chrome.runtime.sendMessage({
        target: "offscreen",
        type: "PLAY_CHIME",
        volume,
      });
      if (res?.played) return;
    } catch (_) {
      /* no receiver yet */
    }
    await new Promise((r) => setTimeout(r, 120));
  }
}

async function playSound(settings) {
  if (settings.sound !== "chime") return; // "system" rides on the notification, "none" is silent
  await playChime(settings.volume ?? 0.5);
}

// --- in-page alert: slide-in banner + tab-title flash ----------------
// Both live in content.js, injected on demand. They need the optional
// scripting + host permission; without it we silently rely on the OS
// notification (which always fires).

const HOST_PERM = { permissions: ["scripting"], origins: ["*://*/*"] };

async function alertActiveTab(finished, next, settings) {
  if (!settings.flashTab && !settings.inPageBanner) return;
  if (!(await chrome.permissions.contains(HOST_PERM))) return;

  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.id || !/^https?:/i.test(tab.url || "")) return; // not a scriptable page

  const t = await getT(settings.language);
  const [titleKey, bodyKey] = DONE_KEYS[finished];
  const payload = {
    type: "TP_ALERT",
    flash: settings.flashTab ? { label: t("flash.title") } : null,
    banner: settings.inPageBanner
      ? {
          kind: finished,
          title: t(titleKey),
          body: t(bodyKey),
          cta:
            next === "pomodoro"
              ? t("notify.btnStartFocus")
              : t("notify.btnStartBreak"),
          dismiss: t("notify.dismiss"),
        }
      : null,
  };

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
    await chrome.tabs.sendMessage(tab.id, payload);
  } catch (_) {
    // page not scriptable (Web Store, PDF viewer, etc.) — OS notification covers it
  }
}

// --- chrome event wiring ----------------------------------------------

chrome.runtime.onInstalled.addListener(async () => {
  const cur = await chrome.storage.local.get(["state", "settings"]);
  if (!cur.settings) await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  if (!cur.state) await chrome.storage.local.set({ state: INITIAL_STATE });
  await dispatch({ type: "DATE_CHECK" });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_PHASE_END) {
    await dispatch({ type: "PHASE_END" });
  } else if (alarm.name === ALARM_BADGE) {
    await reconcileBadge(); // also restarts the 1s loop if the SW was revived
  }
});

// keep the badge in sync when settings change (e.g. "show remaining minutes" off)
chrome.storage.local.onChanged.addListener((changes) => {
  if (changes.settings) reconcileBadge();
});

// SW woke up (browser start, crash recovery): resume the live badge if running
reconcileBadge();

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg?.type) {
      case "GET":
        sendResponse({
          state: await loadState(),
          settings: await loadSettings(),
        });
        break;
      case "EVENT":
        sendResponse({ state: await dispatch(msg.event) });
        break;
      case "SET_SETTINGS": {
        const merged = { ...(await loadSettings()), ...msg.patch };
        await chrome.storage.local.set({ settings: merged });
        sendResponse({ settings: merged });
        break;
      }
      case "PREVIEW_SOUND": {
        const s = await loadSettings();
        await playChime(s.volume ?? 0.5);
        sendResponse({ ok: true });
        break;
      }
      default:
        // ignore messages meant for other contexts (e.g. target: "offscreen")
        if (!msg?.target) sendResponse({ error: "unknown message" });
    }
  })();
  return true; // async response
});
