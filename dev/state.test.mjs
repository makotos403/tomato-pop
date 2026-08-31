// Quick sanity checks for the state machine. Run: node dev/state.test.mjs
import assert from "node:assert/strict";
import { DEFAULT_SETTINGS, INITIAL_STATE } from "../defaults.js";
import { reduce, remainingMs } from "../state.js";

const S = DEFAULT_SETTINGS;
const T0 = 1_700_000_000_000;
let passed = 0;
const test = (name, fn) => {
  fn();
  passed++;
  console.log(`ok  ${name}`);
};

test("START sets an absolute deadline and schedules an alarm", () => {
  const { state, effects } = reduce(INITIAL_STATE, S, { type: "START" }, T0);
  assert.equal(state.status, "running");
  assert.equal(state.endTime, T0 + 25 * 60_000);
  assert.deepEqual(effects[0], { type: "setAlarm", at: T0 + 25 * 60_000 });
});

test("PAUSE freezes the remaining time", () => {
  let s = reduce(INITIAL_STATE, S, { type: "START" }, T0).state;
  s = reduce(s, S, { type: "PAUSE" }, T0 + 60_000).state;
  assert.equal(s.status, "paused");
  assert.equal(s.remainingMs, 24 * 60_000);
});

test("RESUME continues from the frozen remainder", () => {
  let s = reduce(INITIAL_STATE, S, { type: "START" }, T0).state;
  s = reduce(s, S, { type: "PAUSE" }, T0 + 60_000).state;
  s = reduce(s, S, { type: "START" }, T0 + 5 * 60_000).state;
  assert.equal(s.endTime, T0 + 5 * 60_000 + 24 * 60_000);
});

test("RESET returns the current phase to a full idle timer", () => {
  let s = reduce(INITIAL_STATE, S, { type: "START" }, T0).state;
  s = reduce(s, S, { type: "RESET" }, T0 + 60_000).state;
  assert.equal(s.status, "idle");
  assert.equal(remainingMs(s), 25 * 60_000);
});

test("pomodoro end -> short break, counts the round", () => {
  const running = { ...INITIAL_STATE, phase: "pomodoro", status: "running", endTime: T0 };
  const { state } = reduce(running, S, { type: "PHASE_END" }, T0);
  assert.equal(state.phase, "shortBreak");
  assert.equal(state.status, "idle");
  assert.equal(state.round, 1);
  assert.equal(state.completedToday, 1);
});

test("4th pomodoro end -> long break", () => {
  const running = {
    ...INITIAL_STATE, phase: "pomodoro", status: "running", endTime: T0, round: 3,
  };
  const { state } = reduce(running, S, { type: "PHASE_END" }, T0);
  assert.equal(state.phase, "longBreak");
  assert.equal(state.round, 4);
});

test("long break end -> pomodoro, round resets", () => {
  const running = {
    ...INITIAL_STATE, phase: "longBreak", status: "running", endTime: T0, round: 4,
  };
  const { state } = reduce(running, S, { type: "PHASE_END" }, T0);
  assert.equal(state.phase, "pomodoro");
  assert.equal(state.round, 0);
});

test("PHASE_END emits notify + tab-alert + sound effects", () => {
  const running = { ...INITIAL_STATE, phase: "pomodoro", status: "running", endTime: T0 };
  const { effects } = reduce(running, S, { type: "PHASE_END" }, T0);
  const types = effects.map((e) => e.type);
  assert.ok(types.includes("notify"));
  assert.ok(types.includes("alertTab"));
  assert.ok(types.includes("playSound"));
  assert.ok(types.includes("badgeAlert"));
});

test("SELECT_PHASE switches and resets to full", () => {
  let s = reduce(INITIAL_STATE, S, { type: "START" }, T0).state;
  s = reduce(s, S, { type: "SELECT_PHASE", phase: "longBreak" }, T0).state;
  assert.equal(s.phase, "longBreak");
  assert.equal(s.status, "idle");
  assert.equal(remainingMs(s), 15 * 60_000);
});

test("completedToday rolls over on a new day", () => {
  const day1 = { ...INITIAL_STATE, phase: "pomodoro", status: "running", endTime: T0,
    completedToday: 3, today: "2023-11-14" };
  // T0 + 2 days is a different local day
  const { state } = reduce(day1, S, { type: "PHASE_END" }, T0 + 2 * 86_400_000);
  assert.equal(state.completedToday, 1);
});

console.log(`\n${passed} passed`);
