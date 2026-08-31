// Pure state machine for the timer. No chrome.* calls here so it stays testable.
// reduce(state, settings, event) -> { state, effects }
// The service worker executes the returned effects.

import { DEFAULT_SETTINGS } from "./defaults.js";

export const PHASES = ["pomodoro", "shortBreak", "longBreak"];

/** Whether the long-break part of the cycle is in use (default: yes). */
export function longBreakActive(settings) {
  return settings?.longBreakEnabled !== false;
}

/** Full length of a phase in milliseconds. */
export function phaseDurationMs(phase, settings) {
  const min = settings?.durations?.[phase] ?? DEFAULT_SETTINGS.durations[phase];
  return Math.round(min * 60_000);
}

/** Milliseconds left right now, whatever the status. */
export function remainingMs(state, now = Date.now()) {
  if (state.status === "running") return Math.max(0, state.endTime - now);
  return Math.max(0, state.remainingMs ?? 0);
}

function localDay(now) {
  const d = new Date(now);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Reset current phase to a full, idle timer. */
function toIdle(state, settings) {
  return {
    ...state,
    status: "idle",
    endTime: null,
    remainingMs: phaseDurationMs(state.phase, settings),
  };
}

export function reduce(state, settings, event, now = Date.now()) {
  switch (event.type) {
    case "SELECT_PHASE": {
      if (!PHASES.includes(event.phase)) return { state, effects: [] };
      if (event.phase === "longBreak" && !longBreakActive(settings)) {
        return { state, effects: [] };
      }
      const next = toIdle({ ...state, phase: event.phase }, settings);
      return {
        state: next,
        effects: [
          { type: "clearAlarm" },
          { type: "stopBadgeTicks" },
          { type: "updateBadge" },
        ],
      };
    }

    case "START": {
      if (state.status === "running") return { state, effects: [] };
      let left = state.remainingMs;
      if (left == null || left <= 0) left = phaseDurationMs(state.phase, settings);
      const endTime = now + left;
      return {
        state: { ...state, status: "running", endTime, remainingMs: null },
        effects: [
          { type: "setAlarm", at: endTime },
          { type: "startBadgeTicks" },
          { type: "updateBadge" },
        ],
      };
    }

    case "PAUSE": {
      if (state.status !== "running") return { state, effects: [] };
      const left = Math.max(0, state.endTime - now);
      return {
        state: { ...state, status: "paused", endTime: null, remainingMs: left },
        effects: [
          { type: "clearAlarm" },
          { type: "stopBadgeTicks" },
          { type: "updateBadge" },
        ],
      };
    }

    case "RESET": {
      return {
        state: toIdle(state, settings),
        effects: [
          { type: "clearAlarm" },
          { type: "stopBadgeTicks" },
          { type: "updateBadge" },
        ],
      };
    }

    // "I'm done for now": stop, clear the round count, back to a fresh Pomodoro.
    case "END_SESSION": {
      return {
        state: {
          ...state,
          phase: "pomodoro",
          status: "idle",
          endTime: null,
          remainingMs: phaseDurationMs("pomodoro", settings),
          round: 0,
        },
        effects: [
          { type: "clearAlarm" },
          { type: "stopBadgeTicks" },
          { type: "updateBadge" },
        ],
      };
    }

    case "PHASE_END": {
      const finished = state.phase;
      const today = localDay(now);
      let round = state.round;
      let completedToday = state.today === today ? state.completedToday : 0;
      let next;

      if (finished === "pomodoro") {
        round += 1;
        completedToday += 1;
        next =
          longBreakActive(settings) && round >= settings.longBreakInterval
            ? "longBreak"
            : "shortBreak";
      } else {
        if (finished === "longBreak") round = 0;
        next = "pomodoro";
      }

      // Pre-select the suggested next phase; user starts it manually.
      const nextState = {
        ...state,
        phase: next,
        status: "idle",
        endTime: null,
        remainingMs: phaseDurationMs(next, settings),
        round,
        completedToday,
        today,
      };
      return {
        state: nextState,
        effects: [
          { type: "clearAlarm" },
          { type: "stopBadgeTicks" },
          { type: "notify", finished, next },
          { type: "playSound" },
          { type: "alertTab", finished, next },
          { type: "badgeAlert" },
        ],
      };
    }

    case "DATE_CHECK": {
      const today = localDay(now);
      if (state.today === today) return { state, effects: [] };
      return { state: { ...state, today, completedToday: 0 }, effects: [] };
    }

    default:
      return { state, effects: [] };
  }
}
