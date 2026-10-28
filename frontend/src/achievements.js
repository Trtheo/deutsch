import LESSONS from './lessons';

export const ACHIEVEMENTS = [
  // Streak
  { id: 'streak_3',    icon: '🔥', title: 'On Fire',        desc: '3-day streak',          check: ({ streak })    => streak >= 3  },
  { id: 'streak_7',    icon: '🔥', title: 'Week Warrior',   desc: '7-day streak',          check: ({ streak })    => streak >= 7  },
  { id: 'streak_30',   icon: '🔥', title: 'Unstoppable',    desc: '30-day streak',         check: ({ streak })    => streak >= 30 },

  // XP
  { id: 'xp_100',      icon: '⭐', title: 'First Steps',    desc: 'Earn 100 XP',           check: ({ totalXP })   => totalXP >= 100  },
  { id: 'xp_500',      icon: '⭐', title: 'Rising Star',    desc: 'Earn 500 XP',           check: ({ totalXP })   => totalXP >= 500  },
  { id: 'xp_1000',     icon: '🌟', title: 'XP Master',      desc: 'Earn 1000 XP',          check: ({ totalXP })   => totalXP >= 1000 },
  { id: 'xp_5000',     icon: '💫', title: 'Legend',         desc: 'Earn 5000 XP',          check: ({ totalXP })   => totalXP >= 5000 },

  // Lessons
  { id: 'lesson_1',    icon: '📖', title: 'First Lesson',   desc: 'Complete 1 lesson',     check: ({ completed }) => completed >= 1  },
  { id: 'lesson_5',    icon: '📚', title: 'Bookworm',       desc: 'Complete 5 lessons',    check: ({ completed }) => completed >= 5  },
  { id: 'lesson_10',   icon: '🎓', title: 'Scholar',        desc: 'Complete 10 lessons',   check: ({ completed }) => completed >= 10 },
  { id: 'lesson_all',  icon: '🏆', title: 'Graduate',       desc: 'Complete all lessons',  check: ({ completed }) => completed >= LESSONS.length },

  // Levels
  { id: 'a1_done',     icon: '🟢', title: 'A1 Complete',    desc: 'Finish all A1 lessons', check: ({ getLessonStatus }) => LESSONS.filter(l => l.level === 'A1').every(l => getLessonStatus(l.slug) === 'completed') },
  { id: 'a2_done',     icon: '🔵', title: 'A2 Complete',    desc: 'Finish all A2 lessons', check: ({ getLessonStatus }) => LESSONS.filter(l => l.level === 'A2').every(l => getLessonStatus(l.slug) === 'completed') },

  // Exams
  { id: 'exam_first',  icon: '📝', title: 'Test Taker',     desc: 'Complete your first exam',      check: ({ examCount })  => examCount >= 1  },
  { id: 'exam_5',      icon: '📝', title: 'Exam Pro',       desc: 'Complete 5 exams',              check: ({ examCount })  => examCount >= 5  },
  { id: 'exam_perfect',icon: '💯', title: 'Perfectionist',  desc: 'Score 100% on any exam',        check: ({ bestScore })  => bestScore >= 100 },
  { id: 'exam_pass',   icon: '✅', title: 'Passing Grade',  desc: 'Score 70%+ on any exam',        check: ({ bestScore })  => bestScore >= 70  },
];

export function computeAchievements({ totalXP, streak, progress, getLessonStatus }) {
  const completed  = LESSONS.filter(l => getLessonStatus(l.slug) === 'completed').length;
  const examScores = progress.flatMap(p => p.examScores || []);
  const examCount  = examScores.length;
  const bestScore  = examScores.length
    ? Math.max(...examScores.map(s => s.total > 0 ? Math.round((s.score / s.total) * 100) : (s.pct || 0)))
    : 0;

  return ACHIEVEMENTS.map(a => ({
    ...a,
    earned: a.check({ totalXP, streak, completed, getLessonStatus, examCount, bestScore }),
  }));
}
