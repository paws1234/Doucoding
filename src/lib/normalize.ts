export interface AnswerComparison {
  correct: boolean;
  /** The typed answer after normalisation — what the feedback UI should diff against. */
  answer: string;
  /** The expected answer after normalisation. */
  expected: string;
}

/**
 * §4 Phase 2: *indentation-insensitive but otherwise exact*.
 *
 * Whitespace is the only thing relaxed — leading indentation, interior spacing runs, line breaks and
 * trailing newlines all collapse to a single separator. Case, quotes, brackets, operators and
 * punctuation are deliberately untouched: a syntax trainer that accepts `=>` for `->` teaches the
 * wrong thing.
 */
const collapseWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

/**
 * The one comparison entry point. Callers must not re-implement this — every verdict in the app,
 * in both Flip and Type mode, comes through here so the two modes can never disagree.
 */
export function compareAnswer(typed: string, expected: string): AnswerComparison {
  const answer = collapseWhitespace(typed);
  const canonical = collapseWhitespace(expected);

  return { correct: answer === canonical, answer, expected: canonical };
}
