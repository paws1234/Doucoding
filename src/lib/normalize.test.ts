import { compareAnswer } from '@/lib/normalize';
import { seedCards } from '@/lib/seedCards';

/** §5's real answers, so these cases cannot drift from the dataset the app actually ships. */
const seedBack = (id: string): string => {
  const card = seedCards.find((candidate) => candidate.id === id);
  if (card === undefined) throw new Error(`seed card ${id} is missing`);
  return card.back;
};

const jsSeed = seedBack('seed-js-ts-1'); // const name = value;
const sqlSeed = seedBack('seed-sql-1'); // SELECT col1, col2 FROM table WHERE condition;

describe('judged correct', () => {
  it.each([
    { label: 'a seed answer typed exactly', typed: jsSeed, expected: jsSeed },
    { label: 'differing leading indentation', typed: `\t\t${jsSeed}`, expected: jsSeed },
    { label: 'extra interior spaces', typed: 'const   name   =   value;', expected: jsSeed },
    { label: 'spaces before and after the answer', typed: `   ${jsSeed}   `, expected: jsSeed },
    { label: 'a trailing newline', typed: `${jsSeed}\n`, expected: jsSeed },
    { label: 'tabs standing in for the spaces', typed: 'const\tname\t=\tvalue;', expected: jsSeed },
    {
      label: 'a multi-line answer split where the seed has a space',
      typed: 'SELECT col1, col2\n   FROM table\n   WHERE condition;',
      expected: sqlSeed,
    },
  ])('accepts $label', ({ typed, expected }) => {
    expect(compareAnswer(typed, expected).correct).toBe(true);
  });
});

describe('judged incorrect', () => {
  it.each([
    { label: 'a changed bracket', typed: 'obj(key)', expected: seedBack('seed-js-ts-2') },
    { label: 'the wrong container bracket', typed: '[ ]', expected: seedBack('seed-containers-1') },
    {
      label: 'a changed operator',
      typed: 'array.filter(item = condition)',
      expected: seedBack('seed-js-ts-3'),
    },
    { label: 'reordered words', typed: 'const value = name;', expected: jsSeed },
    { label: 'a missing semicolon where the seed has one', typed: 'const name = value', expected: jsSeed },
    { label: 'a changed case', typed: 'SELECT col1, col2 FROM TABLE WHERE condition;', expected: sqlSeed },
    { label: 'a quoted key where the seed is unquoted', typed: "obj['key']", expected: seedBack('seed-js-ts-2') },
  ])('rejects $label', ({ typed, expected }) => {
    expect(compareAnswer(typed, expected).correct).toBe(false);
  });
});

it('returns the normalised forms so the feedback UI can render the expected answer', () => {
  const verdict = compareAnswer('   array.filter(item  =>  condition)  ', seedBack('seed-js-ts-3'));

  expect(verdict.correct).toBe(true);
  expect(verdict.answer).toBe('array.filter(item => condition)');
  expect(verdict.expected).toBe('array.filter(item => condition)');
});
