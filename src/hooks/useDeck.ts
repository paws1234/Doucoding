import { useCallback, useEffect, useReducer } from 'react';

import { seedCards } from '@/lib/seedCards';
import { emptyState, loadState, saveState } from '@/lib/storage';
import type { Card, PersistedState, ReviewState } from '@/types/card';

export interface DeckState {
  cards: Record<string, Card>;
  reviews: Record<string, ReviewState>;
  /** False until the storage read resolves. First paint does not wait on it (§9). */
  hydrated: boolean;
  /** Set when the stored document came from a newer build — see `storage.ts`. */
  newerVersion?: number;
}

/** The deck plus the only writes the app makes. */
export interface Deck extends DeckState {
  addCard: (input: CardInput) => void;
  updateCard: (id: string, changes: CardInput) => void;
  softDeleteCard: (id: string) => void;
  setReview: (cardId: string, next: ReviewState) => void;
}

/**
 * §1's load rule: seeds unioned with stored cards by id, and stored reviews winning.
 *
 * Kept pure and out of the hook so `T-1.11`'s check can call it without React.
 */
export function mergeDeck(stored: PersistedState): DeckState {
  const cards: Record<string, Card> = {};
  for (const seed of seedCards) cards[seed.id] = seed;

  // A stored card overrides a seed of the same id: a wording fix, a user's edit or a tombstone must
  // not be undone on every launch.
  for (const [id, card] of Object.entries(stored.cards)) cards[id] = card;

  // Seeds ship no review state of their own, so "stored reviews win" is just the stored map.
  return { cards, reviews: stored.reviews, hydrated: true };
}

const INITIAL: DeckState = { cards: {}, reviews: {}, hydrated: false };

/** What the card editor collects — the fields a user owns (`T-4.1`). */
export type CardInput = Pick<Card, 'front' | 'back' | 'module'>;

/**
 * `crypto.randomUUID` is missing on some older web views and is unavailable on a non-secure origin,
 * so fall back instead of throwing in the middle of a save. The fallback only has to be unique
 * inside this one deck, which a timestamp plus randomness is.
 */
const newId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

type DeckAction =
  | { type: 'hydrate'; stored: PersistedState; newerVersion?: number }
  | { type: 'add'; card: Card }
  | { type: 'update'; id: string; changes: CardInput; now: number }
  | { type: 'softDelete'; id: string; now: number }
  | { type: 'setReview'; cardId: string; next: ReviewState };

/**
 * Exported for its one runnable check (`useDeck.test.ts`): every action below is a thin dispatch onto
 * this reducer, so testing it is testing the mutations.
 */
export function deckReducer(state: DeckState, action: DeckAction): DeckState {
  switch (action.type) {
    case 'hydrate':
      return { ...mergeDeck(action.stored), newerVersion: action.newerVersion };

    case 'add':
      return { ...state, cards: { ...state.cards, [action.card.id]: action.card } };

    case 'update': {
      const existing = state.cards[action.id];
      if (existing === undefined) return state;
      return {
        ...state,
        cards: {
          ...state.cards,
          [action.id]: { ...existing, ...action.changes, updatedAt: action.now },
        },
      };
    }

    case 'softDelete': {
      const existing = state.cards[action.id];
      if (existing === undefined) return state;
      // Soft delete: the record survives and only gains a tombstone. `reviews` is deliberately left
      // alone, so un-deleting a card cannot have lost its progress (§4 Phase 3 feature 7).
      return {
        ...state,
        cards: {
          ...state.cards,
          [action.id]: { ...existing, deletedAt: action.now, updatedAt: action.now },
        },
      };
    }

    case 'setReview':
      return { ...state, reviews: { ...state.reviews, [action.cardId]: action.next } };

    default:
      return state;
  }
}

/**
 * Hydrates the deck once, off the render path, and exposes the only writes the app makes. `hydrated`
 * starts false and the content gate reads it, so a slow read costs a loading state rather than the
 * first paint (§9).
 */
export function useDeck(): Deck {
  const [deck, dispatch] = useReducer(deckReducer, INITIAL);

  useEffect(() => {
    void loadState()
      .then(({ state, newerVersion }) => dispatch({ type: 'hydrate', stored: state, newerVersion }))
      .catch((error: unknown) => {
        // A failed read must not leave the app stuck on a loading state forever: fall back to seeds.
        console.error('syntax-gym: could not read the stored deck', error);
        dispatch({ type: 'hydrate', stored: emptyState() });
      });
  }, []);

  // One write path for every mutation, and never before hydration — writing the un-hydrated empty
  // deck would replace the user's document with nothing.
  useEffect(() => {
    if (!deck.hydrated) return;
    saveState({ ...emptyState(), cards: deck.cards, reviews: deck.reviews });
  }, [deck.cards, deck.hydrated, deck.reviews]);

  const addCard = useCallback((input: CardInput) => {
    const now = Date.now();
    dispatch({
      type: 'add',
      card: { ...input, id: newId(), isCustom: true, createdAt: now, updatedAt: now },
    });
  }, []);

  const updateCard = useCallback((id: string, changes: CardInput) => {
    dispatch({ type: 'update', id, changes, now: Date.now() });
  }, []);

  const softDeleteCard = useCallback((id: string) => {
    dispatch({ type: 'softDelete', id, now: Date.now() });
  }, []);

  const setReview = useCallback((cardId: string, next: ReviewState) => {
    dispatch({ type: 'setReview', cardId, next });
  }, []);

  return { ...deck, addCard, updateCard, softDeleteCard, setReview };
}
