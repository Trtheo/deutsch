import LESSONS, { LESSON_GROUPS } from '../lessons';

const LEVELS = ['A1', 'A2', 'B1', 'B2'];

test('every lesson slug is unique', () => {
  const slugs = LESSONS.map(l => l.slug);
  expect(new Set(slugs).size).toBe(slugs.length);
});

test('lessons follow the level order, with certificate practice last in each level', () => {
  const rank = l => LEVELS.indexOf(l.level) * 2 + (l.category === 'certificate' ? 1 : 0);
  const ranks = LESSONS.map(rank);
  expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
});

test('every lesson has what its card needs', () => {
  for (const l of LESSONS) {
    expect(l.Icon).toBeTruthy();
    expect(LEVELS).toContain(l.level);
    expect(LESSON_GROUPS).toContain(l.group);
    expect(l.title && l.titleDe && l.sub).toBeTruthy();
  }
});
