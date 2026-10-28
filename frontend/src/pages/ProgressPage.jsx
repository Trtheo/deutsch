import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ProgressBar, LevelBadge, StatusBadge } from '../components/UI';
import { Star, Flame, CheckCircle2, PlayCircle, Map, Trophy, ArrowRight } from 'lucide-react';
import LESSONS from '../lessons';
import { computeAchievements } from '../achievements';

// ── Helpers ───────────────────────────────────────────────
function dateKey(d) { return new Date(d).toDateString(); }

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
}

function getLast30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d;
  });
}

const LEVEL_COLORS = {
  A1: { bar: 'bg-green-400', text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-green-200 dark:border-green-500/20' },
  A2: { bar: 'bg-blue-400',  text: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-500/10',   border: 'border-blue-200 dark:border-blue-500/20' },
  B1: { bar: 'bg-purple-400',text: 'text-purple-600 dark:text-purple-400',bg: 'bg-purple-50 dark:bg-purple-500/10',border: 'border-purple-200 dark:border-purple-500/20' },
  B2: { bar: 'bg-red-400',   text: 'text-red-600 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-500/10',     border: 'border-red-200 dark:border-red-500/20' },
};

export default function ProgressPage() {
  const { progress, totalXP, streak, todayXP, dailyGoal, getLessonStatus } = useApp();

  const completed  = LESSONS.filter(l => getLessonStatus(l.slug) === 'completed').length;
  const inProgress = LESSONS.filter(l => getLessonStatus(l.slug) === 'in_progress').length;
  const getXP      = slug => progress.find(p => p.lessonSlug === slug)?.xp || 0;

  const achievements = useMemo(() => computeAchievements({ totalXP, streak, progress, getLessonStatus }), [totalXP, streak, progress, getLessonStatus]);
  const earnedCount  = achievements.filter(a => a.earned).length;

  // ── 7-day XP chart data ──────────────────────────────────
  const last7 = getLast7Days();
  const xpByDay = useMemo(() => {
    const map = {};
    for (const p of progress) {
      // count exam scores per day
      for (const s of (p.examScores || [])) {
        const k = dateKey(s.date);
        map[k] = (map[k] || 0) + (s.score || 0) * 5;
      }
      // count lesson XP on lastActivity day (10 or 50 XP)
      if (p.lastActivity) {
        const k = dateKey(p.lastActivity);
        if (p.status === 'completed') map[k] = (map[k] || 0) + 50;
        else if (p.status === 'in_progress') map[k] = (map[k] || 0) + 10;
      }
    }
    return map;
  }, [progress]);

  const chartData = last7.map(d => ({ day: d.toLocaleDateString('en', { weekday: 'short' }), xp: xpByDay[dateKey(d)] || 0, isToday: dateKey(d) === dateKey(new Date()) }));
  const maxXP = Math.max(...chartData.map(d => d.xp), 1);

  // ── 30-day activity calendar ─────────────────────────────
  const activeDays = useMemo(() => {
    const set = new Set();
    for (const p of progress) {
      if (p.lastActivity) set.add(dateKey(p.lastActivity));
      for (const s of (p.examScores || [])) {
        if (s.date) set.add(dateKey(s.date));
      }
    }
    return set;
  }, [progress]);

  const last30 = getLast30Days();

  // ── Level breakdown ──────────────────────────────────────
  const levels = ['A1', 'A2', 'B1', 'B2'].map(level => {
    const all = LESSONS.filter(l => l.level === level);
    const done = all.filter(l => getLessonStatus(l.slug) === 'completed').length;
    const pct = all.length > 0 ? Math.round((done / all.length) * 100) : 0;
    return { level, total: all.length, done, pct };
  });

  // ── Best exam scores ─────────────────────────────────────
  const examBests = useMemo(() => {
    const map = {};
    for (const p of progress) {
      for (const s of (p.examScores || [])) {
        if (!map[p.lessonSlug] || s.score > map[p.lessonSlug].score) {
          map[p.lessonSlug] = s;
        }
      }
    }
    return map;
  }, [progress]);

  const examEntries = Object.entries(examBests)
    .map(([slug, s]) => ({ slug, lesson: LESSONS.find(l => l.slug === slug), ...s }))
    .filter(e => e.lesson)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Progress</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Track your German learning journey</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { Icon: Star,         val: totalXP,    label: 'Total XP',    color: 'text-yellow-600 dark:text-yellow-400' },
          { Icon: Flame,        val: streak,     label: 'Day Streak',  color: 'text-orange-600 dark:text-orange-400' },
          { Icon: CheckCircle2, val: completed,  label: 'Completed',   color: 'text-green-600 dark:text-green-400'  },
          { Icon: PlayCircle,   val: inProgress, label: 'In Progress', color: 'text-blue-600 dark:text-blue-400'    },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className="flex justify-center mb-1"><s.Icon size={22} className={s.color} /></div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-gray-500 dark:text-gray-400 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Daily goal */}
      <div className="card">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-900 dark:text-white font-bold text-sm">Today's Goal</span>
          <span className={`text-xs font-semibold ${todayXP >= dailyGoal ? 'text-green-500' : 'text-yellow-500'}`}>
            {todayXP >= dailyGoal ? '🎉 Reached!' : `${todayXP} / ${dailyGoal} XP`}
          </span>
        </div>
        <ProgressBar value={todayXP} max={dailyGoal} color={todayXP >= dailyGoal ? 'bg-green-400' : 'bg-yellow-400'} />
      </div>

      {/* 7-day XP chart */}
      <div className="card">
        <h2 className="text-gray-900 dark:text-white font-bold mb-4">XP This Week</h2>
        <div className="flex items-end gap-2 h-28">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">{d.xp > 0 ? d.xp : ''}</span>
              <div className="w-full rounded-t-lg transition-all duration-500 relative"
                style={{ height: `${Math.max(4, (d.xp / maxXP) * 80)}px` }}>
                <div className={`absolute inset-0 rounded-t-lg ${d.isToday ? 'bg-yellow-400' : 'bg-yellow-200 dark:bg-yellow-400/30'}`} />
              </div>
              <span className={`text-xs font-medium ${d.isToday ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-600'}`}>
                {d.day}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 dark:text-gray-600">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> Today</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-200 dark:bg-yellow-400/30 inline-block" /> Past days</span>
        </div>
      </div>

      {/* 30-day streak calendar */}
      <div className="card">
        <h2 className="text-gray-900 dark:text-white font-bold mb-3">Activity — Last 30 Days</h2>
        <div className="flex flex-wrap gap-1.5">
          {last30.map((d, i) => {
            const active = activeDays.has(dateKey(d));
            const isToday = dateKey(d) === dateKey(new Date());
            return (
              <div
                key={i}
                title={`${d.toLocaleDateString('en', { month: 'short', day: 'numeric' })}${active ? ' — active' : ''}`}
                className={`w-6 h-6 rounded-md transition-all ${
                  isToday
                    ? 'ring-2 ring-yellow-400 ' + (active ? 'bg-yellow-400' : 'bg-yellow-100 dark:bg-yellow-400/20')
                    : active
                      ? 'bg-green-400 dark:bg-green-500'
                      : 'bg-gray-100 dark:bg-gray-800'
                }`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 dark:text-gray-600">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400 inline-block" /> Active</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800 inline-block border border-gray-200 dark:border-gray-700" /> No activity</span>
        </div>
      </div>

      {/* Level breakdown */}
      <div className="card">
        <h2 className="text-gray-900 dark:text-white font-bold mb-4">Progress by Level</h2>
        <div className="grid grid-cols-2 gap-3">
          {levels.map(({ level, total, done, pct }) => {
            const c = LEVEL_COLORS[level];
            return (
              <div key={level} className={`rounded-2xl p-4 border ${c.bg} ${c.border}`}>
                <div className="flex items-center justify-between mb-2">
                  <LevelBadge level={level} />
                  <span className={`text-lg font-bold ${c.text}`}>{pct}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1.5">
                  <div className={`${c.bar} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">{done} / {total} lessons</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lesson breakdown */}
      <div className="card">
        <h2 className="text-gray-900 dark:text-white font-bold mb-4">Lesson Breakdown</h2>
        <div className="space-y-3">
          {LESSONS.map(l => {
            const status = getLessonStatus(l.slug);
            const xp = getXP(l.slug);
            return (
              <Link key={l.slug} to={`/lesson/${l.slug}`} className="flex items-center gap-3 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-gray-900 dark:text-white text-sm font-medium truncate group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">{l.title}</span>
                    <LevelBadge level={l.level} />
                    <StatusBadge status={status} />
                  </div>
                  <ProgressBar
                    value={xp}
                    max={l.maxXP}
                    color={status === 'completed' ? 'bg-green-400' : status === 'in_progress' ? 'bg-yellow-400' : 'bg-gray-300 dark:bg-gray-700'}
                  />
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-yellow-600 dark:text-yellow-400 text-sm font-bold w-14 text-right">{xp} XP</span>
                  <ArrowRight size={13} className="text-gray-300 dark:text-gray-700 group-hover:text-yellow-400 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Best exam scores */}
      {examEntries.length > 0 && (
        <div className="card">
          <h2 className="text-gray-900 dark:text-white font-bold mb-4"><Trophy size={16} className="inline mr-1.5 text-yellow-500" />Best Exam Scores</h2>
          <div className="space-y-3">
            {examEntries.map(({ slug, lesson, score, total, pct }) => {
              const pctVal = total > 0 ? Math.round((score / total) * 100) : (pct || 0);
              return (
                <div key={slug} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-900 dark:text-white text-sm font-medium truncate">{lesson.title}</span>
                      <LevelBadge level={lesson.level} />
                    </div>
                    <ProgressBar
                      value={pctVal}
                      max={100}
                      color={pctVal >= 70 ? 'bg-green-400' : pctVal >= 50 ? 'bg-yellow-400' : 'bg-red-400'}
                    />
                  </div>
                  <span className={`text-sm font-bold w-12 text-right flex-shrink-0 ${
                    pctVal >= 70 ? 'text-green-600 dark:text-green-400' :
                    pctVal >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>{pctVal}%</span>
                </div>
              );
            })}
          </div>
          <Link to="/exams" className="btn-secondary text-sm mt-4 flex items-center justify-center gap-2">
            View All Exams <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* Achievements */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-900 dark:text-white font-bold flex items-center gap-2">
            <Trophy size={16} className="text-yellow-500" /> Achievements
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {earnedCount} / {achievements.length} earned
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {achievements.map(a => (
            <div key={a.id}
              className={`rounded-2xl p-3 border text-center transition-all ${
                a.earned
                  ? 'bg-yellow-50 dark:bg-yellow-400/10 border-yellow-200 dark:border-yellow-400/30'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-50'
              }`}>
              <div className={`text-3xl mb-1.5 ${!a.earned ? 'grayscale' : ''}`}>{a.icon}</div>
              <div className={`text-xs font-bold ${ a.earned ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400' }`}>
                {a.title}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{a.desc}</div>
              {a.earned && <div className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold mt-1">✓ Earned</div>}
            </div>
          ))}
        </div>
      </div>

      {/* CEFR Roadmap */}
      <div className="card">
        <h2 className="text-gray-900 dark:text-white font-bold mb-4"><Map size={16} className="inline mr-1" />CEFR Roadmap</h2>
        <div className="space-y-3">
          {[
            { level: 'A1', desc: 'Beginner',           descEn: 'Everyday expressions and basic phrases',           topics: 'Alphabet, Numbers, Vocabulary, Grammar, Verbs, Reading, Writing, Listening, Speaking' },
            { level: 'A2', desc: 'Elementary',          descEn: 'Communicate in simple and routine tasks',          topics: 'Tenses, Adjectives, Modal Verbs, Daily Life, Emails, Directions' },
            { level: 'B1', desc: 'Intermediate',        descEn: 'Deal with most situations while travelling',       topics: 'Complex Grammar, Extended Vocabulary, Opinions, Debates' },
            { level: 'B2', desc: 'Upper-Intermediate',  descEn: 'Interact with fluency on a wide range of topics',  topics: 'Advanced Grammar, Abstract Topics, Academic Writing' },
          ].map(l => {
            const lv = levels.find(x => x.level === l.level);
            const c = LEVEL_COLORS[l.level];
            return (
              <div key={l.level} className={`rounded-2xl p-3 border ${c.bg} ${c.border} flex gap-3 items-start`}>
                <LevelBadge level={l.level} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-900 dark:text-white text-sm font-semibold">{l.desc}</span>
                    <span className={`text-xs font-bold ${c.text}`}>{lv?.pct ?? 0}%</span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">{l.descEn}</div>
                  <div className="text-gray-400 dark:text-gray-600 text-xs mt-0.5">{l.topics}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
