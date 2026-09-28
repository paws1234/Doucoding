import { deckReducer, mergeDeck } from '@/hooks/useDeck';
import { seedCards } from '@/lib/seedCards';
import { emptyState } from '@/lib/storage';
import type { Card, ReviewState } from '@/types/card';

// `useDeck` imports `storage`, which imports the native module. These cases only exercise the pure
// reducer, but the module still has to load.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const SEED_ID = 'seed-containers-1';
const CUSTOM_ID = 'custom-1';

const customCard: Card = {
  id: CUSTOM_ID,
  module: 'sql',
  front: 'Insert a single row',
  back: 'INSERT INTO t (a) VALUES (1);',
  isCustom: true,
  createdAt: 1,
  updatedAt: 1,
};

const hydrated = mergeDeck(emptyState());

it('unions the seeds with stored cards, letting a stored card win', () => {
  // Guards the assumption the rest of this file leans on.
  expect(seedCards[0].id).toBe(SEED_ID);

  const merged = mergeDeck({
    ...emptyState(),
    cards: { [SEED_ID]: { ...seedCards[0], front: 'Reworded prompt' }, [CUSTOM_ID]: customCard },
  });

  expect(merged.hydrated).toBe(true);
  expect(Object.keys(merged.cards)).toHaveLength(18);
  // A stored card overrides the seed of the same id — a wording fix must not be undone on load.
  expect(merged.cards[SEED_ID].front).toBe('Reworded prompt');
  expect(merged.cards[CUSTOM_ID]).toEqual(customCard);
});

it('adds a card the user wrote', () => {
  const next = deckReducer(hydrated, { type: 'add', card: customCard });

  expect(Object.keys(next.cards)).toHaveLength(18);
  expect(next.cards[CUSTOM_ID]).toEqual(customCard);
  expect(next.cards[CUSTOM_ID].isCustom).toBe(true);
});

it('updates a card, bumping updatedAt and leaving createdAt alone', () => {
  const next = deckReducer(hydrated, {
    type: 'update',
    id: SEED_ID,
    changes: { front: 'new front', back: 'new back', module: 'sql' },
    now: 99,
  });

  expect(next.cards[SEED_ID].front).toBe('new front');
  expect(next.cards[SEED_ID].module).toBe('sql');
  expect(next.cards[SEED_ID].updatedAt).toBe(99);
  expect(next.cards[SEED_ID].createdAt).toBe(hydrated.cards[SEED_ID].createdAt);
});

it('soft-deletes with a tombstone — the record and its review state both survive', () => {
  const review: ReviewState = {
    status: 'mastered',
    reviewCount: 4,
    correctCount: 4,
    intervalDays: 21,
  };
  const withReview = deckReducer(hydrated, { type: 'setReview', cardId: SEED_ID, next: review });

  const deleted = deckReducer(withReview, { type: 'softDelete', id: SEED_ID, now: 42 });

  // The point of the task: a delete is a tombstone, never a removal.
  expect(Object.keys(deleted.cards)).toHaveLength(Object.keys(hydrated.cards).length);
  expect(deleted.cards[SEED_ID].deletedAt).toBe(42);
  expect(deleted.cards[SEED_ID].updatedAt).toBe(42);
  // …and an un-delete must not have lost progress.
  expect(deleted.reviews[SEED_ID]).toEqual(review);
});

it('records review state per card and treats an unknown id as a no-op', () => {
  const review: ReviewState = { status: 'need-practice', reviewCount: 1, correctCount: 0 };
  const next = deckReducer(hydrated, { type: 'setReview', cardId: SEED_ID, next: review });

  expect(next.reviews[SEED_ID]).toEqual(review);
  // Nothing else gained a review…
  expect(Object.keys(next.reviews)).toEqual([SEED_ID]);
  // …and mutating a card that is not there changes nothing, rather than inventing a card.
  expect(deckReducer(hydrated, { type: 'softDelete', id: 'nope', now: 1 })).toBe(hydrated);
  expect(
    deckReducer(hydrated, {
      type: 'update',
      id: 'nope',
      changes: { front: 'a', back: 'b', module: 'sql' },
      now: 1,
    }),
  ).toBe(hydrated);
});
