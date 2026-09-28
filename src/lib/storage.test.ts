import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEY, emptyState, flushState, loadState, migrate, saveState } from '@/lib/storage';
import type { Card, PersistedState } from '@/types/card';

// The package ships this mock; hand-rolling one would only be a worse copy of it.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const seededCard = {
  id: 'seed-containers-1',
  module: 'containers',
  front: 'Container for actions, parameters, conditions, and execution flow',
  back: '( )',
  isCustom: false,
  createdAt: 1,
  updatedAt: 1,
} satisfies Card;

const customCard = {
  id: 'custom-1',
  module: 'sql',
  front: 'A card the user wrote',
  back: 'SELECT 1;',
  isCustom: true,
  createdAt: 2,
  updatedAt: 3,
  deletedAt: 4,
} satisfies Card;

const document: PersistedState = {
  schemaVersion: 1,
  cards: { [seededCard.id]: { ...seededCard }, [customCard.id]: { ...customCard } },
  reviews: {
    [seededCard.id]: {
      status: 'need-practice',
      reviewCount: 3,
      correctCount: 1,
      lastReviewedAt: 10,
      dueAt: 11,
      intervalDays: 2,
      ease: 2.5,
    },
  },
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

it('migrate() accepts the current version and rejects a document with no version', () => {
  expect(migrate({ schemaVersion: 1, cards: {}, reviews: {} })).toEqual({
    schemaVersion: 1,
    cards: {},
    reviews: {},
  });

  // A version dropped on the floor must not be mistaken for a readable document.
  expect(migrate({ cards: {}, reviews: {} })).toBeNull();
  expect(migrate({ schemaVersion: 2, cards: {}, reviews: {} })).toBeNull();
  expect(migrate('nonsense')).toBeNull();
  expect(migrate(null)).toBeNull();
});

it('yields a valid empty state when nothing is stored yet', async () => {
  const { state, newerVersion } = await loadState();

  expect(state).toEqual({ schemaVersion: 1, cards: {}, reviews: {} });
  expect(state).toEqual(emptyState());
  expect(newerVersion).toBeUndefined();
  // Reading must not create the document.
  expect(await AsyncStorage.getItem(STORAGE_KEY)).toBeNull();
});

it('round-trips a versioned document through save and load unchanged', async () => {
  saveState(document);
  await flushState();

  const { state, newerVersion } = await loadState();

  expect(newerVersion).toBeUndefined();
  // Deep equality, not a spot-check: cards, reviews and the tombstone all have to survive.
  expect(state).toEqual(document);
  expect(state.cards[customCard.id].deletedAt).toBe(4);
  expect(state.reviews[seededCard.id].intervalDays).toBe(2);
});

it('treats unparseable JSON as a fresh state without throwing, and keeps the bytes', async () => {
  await AsyncStorage.setItem(STORAGE_KEY, '{oops');
  const logged = jest.spyOn(console, 'error').mockImplementation(() => {});

  await expect(loadState()).resolves.toEqual({ state: emptyState() });

  expect(logged).toHaveBeenCalled();
  expect(await AsyncStorage.getItem(STORAGE_KEY)).toBe('{oops');
});

it('treats a malformed document as a fresh state without overwriting it', async () => {
  const malformed = '{"schemaVersion":1,"cards":"not-a-map","reviews":{}}';
  await AsyncStorage.setItem(STORAGE_KEY, malformed);

  const { state } = await loadState();

  expect(state).toEqual(emptyState());
  expect(await AsyncStorage.getItem(STORAGE_KEY)).toBe(malformed);
});

// Last on purpose: loadState sets a module-level write block that stands for the module's lifetime,
// so the newer-version case has to run after the tests that need writes to land.
it('reports a newer schemaVersion and refuses to overwrite it', async () => {
  const newer = '{"schemaVersion":2,"cards":{"future":{"id":"future"}},"reviews":{}}';
  await AsyncStorage.setItem(STORAGE_KEY, newer);
  const logged = jest.spyOn(console, 'error').mockImplementation(() => {});

  const { state, newerVersion } = await loadState();

  expect(newerVersion).toBe(2);
  expect(state).toEqual(emptyState());
  expect(logged).toHaveBeenCalled();

  // The real claim: a fresh deck must not land on top of a document this build cannot read.
  saveState({ ...emptyState(), cards: { [customCard.id]: { ...customCard } } });
  await flushState();

  expect(await AsyncStorage.getItem(STORAGE_KEY)).toBe(newer);
});
