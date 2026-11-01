// Sanity checks for the rating-request policy. Run: node dev/review.test.mjs
import assert from "node:assert/strict";
import { DEFAULT_SETTINGS, INITIAL_STATE } from "../defaults.js";
import { reduce } from "../state.js";
import {
  REVIEW_AFTER,
  REVIEW_LATER_STEP,
  REVIEW_MAX_LATER,
  isReviewDue,
  nextReview,
} from "../review.js";

let passed = 0;
const test = (name, fn) => {
  fn();
  passed++;
  console.log(`ok  ${name}`);
};

test("lifetime counter grows on each finished pomodoro, not on breaks", () => {
  let s = { ...INITIAL_STATE, status: "running", endTime: 1 };
  s = reduce(s, DEFAULT_SETTINGS, { type: "PHASE_END" }, 1).state;
  assert.equal(s.totalCompleted, 1);
  s = reduce({ ...s, status: "running" }, DEFAULT_SETTINGS, { type: "PHASE_END" }, 2).state;
  assert.equal(s.totalCompleted, 1);
});

test("old saved state without the counter is treated as 0", () => {
  const { totalCompleted: _omit, ...legacy } = INITIAL_STATE;
  const s = reduce({ ...legacy, status: "running" }, DEFAULT_SETTINGS, { type: "PHASE_END" }, 1).state;
  assert.equal(s.totalCompleted, 1);
});

test("first ask happens at REVIEW_AFTER, not before", () => {
  assert.equal(isReviewDue(REVIEW_AFTER - 1, undefined), false);
  assert.equal(isReviewDue(REVIEW_AFTER, undefined), true);
});

test("rate and never end the asking for good", () => {
  for (const answer of ["rate", "never"]) {
    const r = nextReview(undefined, answer, 3);
    assert.deepEqual(r, { status: "done" });
    assert.equal(isReviewDue(999, r), false);
  }
});

test("later waits for the step before asking again", () => {
  const r = nextReview(undefined, "later", REVIEW_AFTER);
  assert.equal(isReviewDue(REVIEW_AFTER + REVIEW_LATER_STEP - 1, r), false);
  assert.equal(isReviewDue(REVIEW_AFTER + REVIEW_LATER_STEP, r), true);
});

test("later used up (REVIEW_MAX_LATER) ends the asking", () => {
  let r;
  for (let i = 0; i < REVIEW_MAX_LATER; i++) r = nextReview(r, "later", 10 * i);
  assert.deepEqual(r, { status: "done" });
  assert.equal(isReviewDue(9999, r), false);
});

test("fail safe: corrupt or unreadable values never ask", () => {
  for (const bad of [{ status: "weird" }, { status: "active" }, { status: "snoozed", nextAt: 1 }]) {
    assert.equal(isReviewDue(10, bad), false);
  }
  assert.equal(isReviewDue(undefined, undefined), false);
  assert.equal(isReviewDue(NaN, undefined), false);
});

console.log(`\n${passed} passed`);
