import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PersistedState } from '@/types/card';

/** §1's one document. The `v1` segment moves only alongside `schemaVersion`. */
export const STORAGE_KEY = 'syntax-gym/v1/state';

const SCHEMA_VERSION = 1;

/** A rapid session writes on a timer, not once per tap. */
const WRITE_DEBOUNCE_MS = 300;

export interface LoadResult {
  state: PersistedState;
  /**
   * Set when the stored document was written by a newer build of this app. The caller should say so
   * rather than pretend the deck is empty; writes are refused until reload (see `flushState`).
   */
  newerVersion?: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** A fresh install, and the shape `loadState` hands back when nothing is stored yet. */
export function emptyState(): PersistedState {
  return { schemaVersion: SCHEMA_VERSION, cards: {}, reviews: {} };
}

/**
 * One `case` per shape change, applied oldest first — a bump is one case and one `return`, which is
 * the whole reason this is a plain switch and not a registry of migration objects.
 *
 * Returns `null` for anything this build cannot read: a missing or unknown version, or a version
 * match whose shape still fails a basic check (a truncated or hand-edited document must not reach
 * the merge that follows and crash it).
 */
export function migrate(document: unknown): PersistedState | null {
  if (!isRecord(document)) return null;

  switch (document.schemaVersion) {
    case SCHEMA_VERSION:
      return isRecord(document.cards) && isRecord(document.reviews)
        ? (document as unknown as PersistedState)
        : null;
    // The next bump goes here:  case 1:  ->  return { ...document, schemaVersion: 2, … };
    default:
      return null;
  }
}

export async function loadState(): Promise<LoadResult> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw === null) return { state: emptyState() };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Nothing to migrate from. The bytes are left in place rather than overwritten, because a
    // corrupted document may still be recoverable by hand.
    console.error('syntax-gym: stored state is not valid JSON; starting from a fresh one');
    return { state: emptyState() };
  }

  const version = isRecord(parsed) ? parsed.schemaVersion : undefined;

  if (typeof version === 'number' && version > SCHEMA_VERSION) {
    // Newer than this build. Refusing the write is the point: letting a fresh deck overwrite it is
    // the one failure that loses the user's data for good.
    blockedByNewerVersion = version;
    console.error(
      `syntax-gym: stored state is schemaVersion ${version}, this build understands ` +
        `${SCHEMA_VERSION}; leaving it untouched and starting from a fresh state`,
    );
    return { state: emptyState(), newerVersion: version };
  }

  // Older or missing version: migrate() upgrades it, or reports null and we start fresh.
  return { state: migrate(parsed) ?? emptyState() };
}

let pending: PersistedState | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let blockedByNewerVersion: number | null = null;

/**
 * Coalescing, not a trailing reset: the timer is armed once and always writes the newest state, so
 * a change every 200 ms still lands within one window instead of starving the write forever.
 */
export function saveState(state: PersistedState): void {
  pending = state;
  if (timer !== null) return;
  timer = setTimeout(() => {
    void flushState().catch((error: unknown) => {
      // The one failure that loses the deck. Loud beats an unhandled rejection.
      console.error('syntax-gym: failed to persist state', error);
    });
  }, WRITE_DEBOUNCE_MS);
}

/**
 * Write anything pending, right now. Exported because a test and the app-lifecycle paths cannot
 * wait out the timer — and because the debounce above is only safe if a flush exists.
 */
export async function flushState(): Promise<void> {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
  const state = pending;
  if (state === null) return;

  if (blockedByNewerVersion !== null) {
    // A newer document is on disk. Writing now would replace it with a shape this build cannot
    // round-trip, so the write is refused and the document survives until a newer app reads it.
    pending = null;
    console.error(
      `syntax-gym: refusing to overwrite a schemaVersion ${blockedByNewerVersion} document`,
    );
    return;
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  // Cleared only after the write landed, and only if nothing newer arrived during it: a rejected
  // write leaves the document queued rather than silently dropping it.
  if (pending === state) pending = null;
}
