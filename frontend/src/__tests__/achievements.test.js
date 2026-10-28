import { computeAchievements } from '../achievements';

const earned = (list) => list.filter(a => a.earned).map(a => a.id);

describe('computeAchievements', () => {
  test('a new user has no achievements', () => {
    const result = computeAchievements({ totalXP: 0, streak: 0, progress: [], getLessonStatus: () => 'not_started' });
    expect(earned(result)).toEqual([]);
  });

  test('awards XP, streak and exam achievements', () => {
    const progress = [{ lessonSlug: 'alphabet', examScores: [{ score: 10, total: 10 }] }];
    const result = computeAchievements({
      totalXP: 600, streak: 7, progress,
      getLessonStatus: slug => (slug === 'alphabet' ? 'completed' : 'not_started'),
    });
    expect(earned(result)).toEqual(expect.arrayContaining([
      'streak_3', 'streak_7', 'xp_100', 'xp_500', 'lesson_1', 'exam_first', 'exam_perfect', 'exam_pass',
    ]));
    expect(earned(result)).not.toContain('xp_1000');
    expect(earned(result)).not.toContain('lesson_all');
  });
});
