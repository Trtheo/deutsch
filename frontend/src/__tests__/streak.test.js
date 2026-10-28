import { calcStreak } from '../context/AppContext';

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

describe('calcStreak', () => {
  test('is 0 with no activity', () => {
    expect(calcStreak([])).toBe(0);
  });

  test('counts consecutive days ending today', () => {
    const progress = [0, 1, 2].map(n => ({ lessonSlug: `l${n}`, lastActivity: daysAgo(n) }));
    expect(calcStreak(progress)).toBe(3);
  });

  test('still counts a streak that ended yesterday', () => {
    const progress = [1, 2].map(n => ({ lessonSlug: `l${n}`, lastActivity: daysAgo(n) }));
    expect(calcStreak(progress)).toBe(2);
  });

  test('is broken after a missed day', () => {
    expect(calcStreak([{ lessonSlug: 'a', lastActivity: daysAgo(2) }])).toBe(0);
  });
});
