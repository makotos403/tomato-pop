// Pure logic for the "please rate us" request. No chrome.* calls so it stays testable.
//
// One shared record, `review`, drives the two interrupting surfaces (the popup's
// rating view and the in-page banner); settings only holds a quiet link.
//   undefined                                  never answered
//   { status: "active", laterCount, nextAt }   "later" was pressed (laterCount times)
//   { status: "done" }                         rated / "don't show again" / "later" used up
// Anything unreadable or unrecognised means "do not ask" (fail safe).

export const REVIEW_URL =
  "https://chromewebstore.google.com/detail/ghajmjggajkifojhgdegfcdfaphmijeg/reviews";

/** Completed pomodoros (lifetime) before the first ask. */
export const REVIEW_AFTER = 3;
/** Extra completed pomodoros before asking again after "later". */
export const REVIEW_LATER_STEP = 5;
/** Presses of "later" that end the asking for good. */
export const REVIEW_MAX_LATER = 2;

/** Should the request interrupt the user now? */
export function isReviewDue(totalCompleted, review) {
  if (!Number.isFinite(totalCompleted)) return false;
  if (review == null) return totalCompleted >= REVIEW_AFTER;
  if (review.status !== "active" || !Number.isFinite(review.nextAt)) return false;
  return totalCompleted >= Math.max(REVIEW_AFTER, review.nextAt);
}

/** The record to store after an answer: "rate" | "later" | "never". */
export function nextReview(review, answer, totalCompleted) {
  if (answer === "later") {
    const laterCount = (review?.laterCount ?? 0) + 1;
    if (laterCount >= REVIEW_MAX_LATER) return { status: "done" };
    return { status: "active", laterCount, nextAt: totalCompleted + REVIEW_LATER_STEP };
  }
  return { status: "done" }; // "rate", "never" (and anything unexpected)
}
