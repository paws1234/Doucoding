import type { ReviewState } from '@/types/card';

const DAY_MS = 24 * 60 * 60 * 1000;

/** §4 Phase 3's numbers: SM-2's default ease, its classic floor, and its penalty step. */
const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;
const EASE_PENALTY = 0.2;

/** SRS-lite starts a card at one day, which is also what a wrong answer resets it to. */
const FIRST_INTERVAL_DAYS = 1;

const EMPTY_REVIEW: ReviewState = { status: 'new', reviewCount: 0, correctCount: 0 };

/** To a tenth, so repeated subtraction cannot leave ease at 1.9000000000000001. */
const round1 = (value: number): number => Math.round(value * 10) / 10;

/**
 * §4 Phase 3: `dueAt = now + intervalDays`; correct → the interval grows ×ease; incorrect → reset to
 * one day and flag Need Practice.
 *
 * Pure, and `now` is injected rather than read from the clock, so the caller owns the only
 * non-deterministic input. `status` is left alone on a correct answer: the manual status buttons own
 * that field, and this function writing it too would give one field two writers.
 *
 * ponytail: no upper bound on `intervalDays`, so a long correct streak does walk a card out to years
 * — the floor keeps `ease` sane, but nothing caps the product. Ceiling: a well-drilled card can
 * effectively disappear from the queue. Upgrade path: an interval cap when the scheduler stops being
 * "lite" (§10).
 */
export function scheduleReview(
  previous: ReviewState | undefined,
  correct: boolean,
  now: number,
): ReviewState {
  const prior = previous ?? EMPTY_REVIEW;

  const ease = correct
    ? round1(prior.ease ?? DEFAULT_EASE)
    : Math.max(MIN_EASE, round1((prior.ease ?? DEFAULT_EASE) - EASE_PENALTY));

  const intervalDays = correct
    ? Math.max(FIRST_INTERVAL_DAYS, Math.round((prior.intervalDays ?? 0) * ease))
    : FIRST_INTERVAL_DAYS;

  return {
    status: correct ? prior.status : 'need-practice',
    reviewCount: prior.reviewCount + 1,
    correctCount: prior.correctCount + (correct ? 1 : 0),
    lastReviewedAt: now,
    intervalDays,
    ease,
    dueAt: now + intervalDays * DAY_MS,
  };
}

/**
 * §4 Phase 3's queue rule — **due, then Need Practice, then New**. Sort ascending on this rank;
 * `Array.prototype.sort` is stable, so cards keep their deck order inside a bucket.
 *
 * Anything else (a mastered card that is not due yet) ranks with New: it is not owed today.
 */
export function queueRank(review: ReviewState | undefined, now: number): number {
  if (review?.dueAt !== undefined && review.dueAt <= now) return 0;
  if (review?.status === 'need-practice') return 1;
  return 2;
}
