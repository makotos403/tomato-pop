// Single source of truth for the shapes stored in chrome.storage.local.

/** User-adjustable settings. Durations are in minutes. */
export const DEFAULT_SETTINGS = {
  durations: { pomodoro: 25, shortBreak: 5, longBreak: 15 },
  longBreakInterval: 4, // pomodoros before a long break
  sound: "none", // "system" | "chime" | "none"
  volume: 0.5,
  flashTab: false, // needs optional host permission
  inPageBanner: false, // needs optional host permission
  showBadge: true, // remaining minutes on the toolbar icon
  language: "auto", // "auto" | "ja" | "en"
};

/** Live progress. `endTime` is an absolute epoch-ms deadline. */
export const INITIAL_STATE = {
  phase: "pomodoro", // "pomodoro" | "shortBreak" | "longBreak"
  status: "idle", // "idle" | "running" | "paused"
  endTime: null, // set while running
  remainingMs: null, // set while paused / idle (full duration when idle)
  round: 0, // completed pomodoros since the last long break
  completedToday: 0,
  today: null, // "YYYY-MM-DD" (local) that completedToday belongs to
};
