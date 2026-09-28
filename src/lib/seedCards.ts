import type { Card } from '@/types/card';

/**
 * Fixed, so re-seeding is idempotent: a stored seed card must be identical on every launch,
 * or the merge in `useDeck` rewrites all 17 cards on every start.
 *
 * ponytail: one constant for all seeds rather than a real per-card authoring date — nothing
 * displays that yet. Upgrade path: a real value when the deck manager shows one.
 */
const SEEDED_AT = Date.parse('2026-09-28T00:00:00Z');

const SEED_DEFAULTS = { isCustom: false, createdAt: SEEDED_AT, updatedAt: SEEDED_AT } as const;

/**
 * Plan §5, transcribed verbatim — 4 containers, 5 JS/TS, 4 PHP/Laravel, 4 SQL.
 * Do not reword the PHP `??` card: its JavaScript phrasing is deliberate (§5's footnote).
 */
export const seedCards: Card[] = [
  // Module 1 — Containers & Symbols
  {
    id: 'seed-containers-1',
    module: 'containers',
    front: 'Container for actions, parameters, conditions, and execution flow',
    back: '( )',
    ...SEED_DEFAULTS,
  },
  {
    id: 'seed-containers-2',
    module: 'containers',
    front: 'Container exclusively for sequential lists and arrays',
    back: '[ ]',
    ...SEED_DEFAULTS,
  },
  {
    id: 'seed-containers-3',
    module: 'containers',
    front: 'Container for key-value data structures (Objects) and code blocks / scopes',
    back: '{ }',
    ...SEED_DEFAULTS,
  },
  {
    id: 'seed-containers-4',
    module: 'containers',
    front: 'Compact modern wrapper for inline functions',
    back: '=>',
    ...SEED_DEFAULTS,
  },

  // Module 2 — JavaScript & TypeScript Core Operations
  {
    id: 'seed-js-ts-1',
    module: 'js-ts',
    front: 'Declare a block-scoped variable that should not be reassigned',
    back: 'const name = value;',
    ...SEED_DEFAULTS,
  },
  {
    id: 'seed-js-ts-2',
    module: 'js-ts',
    front: 'Access an object property dynamically using a variable key',
    back: 'obj[key]',
    ...SEED_DEFAULTS,
  },
  {
    id: 'seed-js-ts-3',
    module: 'js-ts',
    front: 'Shrink an array to only items that match a boolean condition',
    back: 'array.filter(item => condition)',
    ...SEED_DEFAULTS,
  },
  {
    id: 'seed-js-ts-4',
    module: 'js-ts',
    front: 'Transform every item in an array into a new structure',
    back: 'array.map(item => transformation)',
    ...SEED_DEFAULTS,
  },
  {
    id: 'seed-js-ts-5',
    module: 'js-ts',
    front: 'Write a concise inline if/else decision',
    back: 'condition ? trueValue : falseValue',
    ...SEED_DEFAULTS,
  },

  // Module 3 — PHP & Laravel Syntax Essentials
  {
    id: 'seed-php-laravel-1',
    module: 'php-laravel',
    front: 'Declare a PHP variable (strict prefix rule)',
    back: '$variableName',
    ...SEED_DEFAULTS,
  },
  {
    id: 'seed-php-laravel-2',
    module: 'php-laravel',
    front: 'Write a modern PHP arrow closure',
    back: 'fn($n) => ...',
    ...SEED_DEFAULTS,
  },
  {
    id: 'seed-php-laravel-3',
    module: 'php-laravel',
    front: 'Safely fall back to a default when a value is null or undefined',
    back: '$value ?? $default',
    ...SEED_DEFAULTS,
  },
  {
    id: 'seed-php-laravel-4',
    module: 'php-laravel',
    front: 'Chain Laravel Collection methods to filter and extract attributes',
    back: 'Collection->where(...)->pluck(...)',
    ...SEED_DEFAULTS,
  },

  // Module 4 — SQL & Database Query Structures
  {
    id: 'seed-sql-1',
    module: 'sql',
    front: 'Select specific columns from a table with a condition',
    back: 'SELECT col1, col2 FROM table WHERE condition;',
    ...SEED_DEFAULTS,
  },
  {
    id: 'seed-sql-2',
    module: 'sql',
    front: 'Join two related tables using a foreign key',
    back: 'JOIN other_table ON table.fk = other_table.id',
    ...SEED_DEFAULTS,
  },
  {
    id: 'seed-sql-3',
    module: 'sql',
    front: 'Insert a new record into a table',
    back: 'INSERT INTO table (col1, col2) VALUES (val1, val2);',
    ...SEED_DEFAULTS,
  },
  {
    id: 'seed-sql-4',
    module: 'sql',
    front: 'Create an index on a lookup column for performance',
    back: 'CREATE INDEX idx_name ON table (column);',
    ...SEED_DEFAULTS,
  },
];
