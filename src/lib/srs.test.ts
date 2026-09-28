import { queueRank, scheduleReview } from '@/lib/srs';
import type { ReviewState } from '@/types/card';

// Injected, so none of these cases depends on the clock.
const NOW = 1_700_000_000_000;
const DAY_MS = 24 * 60 * 60 * 1000;

it('grows the interval and does not drop ease on a correct answer', () => {
  const first = scheduleReview(undefined, true, NOW);

  expect(first.intervalDays).toBe(1);
  expect(first.ease).toBe(2.5);
  expect(first.dueAt).toBe(NOW + DAY_MS);
  expect(first.reviewCount).toBe(1);
  expect(first.correctCount).toBe(1);
  // A correct answer must not write status — the status buttons own that field (T-3.5).
  expect(first.status).toBe('new');

  const second = scheduleReview(first, true, NOW);

  expect(second.intervalDays ?? 0).toBeGreaterThan(first.intervalDays ?? 0);
  expect(second.ease ?? 0).toBeGreaterThanOrEqual(first.ease ?? 0);
  expect(second.correctCount).toBe(2);
});

it('resets to one day and flags Need Practice on an incorrect answer', () => {
  const practiced: ReviewState = {
    status: 'mastered',
    reviewCount: 4,
    correctCount: 4,
    intervalDays: 21,
    ease: 2.5,
  };

  const next = scheduleReview(practiced, false, NOW);

  expect(next.intervalDays).toBe(1);
  expect(next.dueAt).toBe(NOW + DAY_MS);
  expect(next.status).toBe('need-practice');
  expect(next.ease).toBeLessThan(2.5);
  expect(next.reviewCount).toBe(5);
  // A wrong answer is not a correct one, and it must not inflate mastery.
  expect(next.correctCount).toBe(4);
});

it('will not push ease below the floor, however long the bad streak', () => {
  let state = scheduleReview(undefined, false, NOW);
  for (let i = 0; i < 20; i += 1) state = scheduleReview(state, false, NOW);

  expect(state.ease).toBe(1.3);
  expect(state.intervalDays).toBe(1);
});

it('ranks due before Need Practice before New', () => {
  const due: ReviewState = { status: 'mastered', reviewCount: 3, correctCount: 3, dueAt: NOW - 1 };
  const practice: ReviewState = { status: 'need-practice', reviewCount: 1, correctCount: 0 };
  const fresh: ReviewState = { status: 'new', reviewCount: 0, correctCount: 0 };
  const notDueYet: ReviewState = {
    status: 'mastered',
    reviewCount: 9,
    correctCount: 9,
    dueAt: NOW + DAY_MS,
  };

  expect(queueRank(due, NOW)).toBeLessThan(queueRank(practice, NOW));
  expect(queueRank(practice, NOW)).toBeLessThan(queueRank(fresh, NOW));
  // A card with no review state at all behaves exactly like a New one.
  expect(queueRank(undefined, NOW)).toBe(queueRank(fresh, NOW));
  // Not owed today, so it ranks with New rather than at the front.
  expect(queueRank(notDueYet, NOW)).toBe(queueRank(fresh, NOW));

  // The sort the session screen will actually run, including its stability inside a bucket.
  const deck = [fresh, practice, due];
  const ordered = [...deck].sort((a, b) => queueRank(a, NOW) - queueRank(b, NOW));

  expect(ordered).toEqual([due, practice, fresh]);
});

it('treats a card due exactly now as due', () => {
  const exactly: ReviewState = { status: 'new', reviewCount: 0, correctCount: 0, dueAt: NOW };

  expect(queueRank(exactly, NOW)).toBe(0);
});
