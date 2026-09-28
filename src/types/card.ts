export type ModuleId = 'containers' | 'js-ts' | 'php-laravel' | 'sql';
export type Status = 'new' | 'need-practice' | 'mastered';

export interface Card {
  id: string;              // seeds: 'seed-containers-1'; custom: crypto.randomUUID()
  module: ModuleId;
  front: string;           // prompt / question
  back: string;            // exact minimal syntax
  isCustom: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;      // tombstone — free now, essential the moment sync exists
}

/** Review state lives separately from card content. */
export interface ReviewState {
  status: Status;
  reviewCount: number;
  correctCount: number;
  lastReviewedAt?: number;
  dueAt?: number;          // SM-2-lite scheduling
  intervalDays?: number;
  ease?: number;           // default 2.5
}

export interface PersistedState {
  schemaVersion: 1;        // bump + migrate() whenever the shape changes
  cards: Record<string, Card>;
  reviews: Record<string, ReviewState>;
}
