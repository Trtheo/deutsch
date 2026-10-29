import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LevelBadge, StatusBadge, ProgressBar } from '../components/UI';
import { getAILessons } from '../api';
import LESSONS, { LESSON_GROUPS } from '../lessons';
import { useAuth } from '../context/AuthContext';
import {
  Flame, Star, CheckCircle2,
  Brain, FolderOpen, Bot, Target, ChevronDown
} from 'lucide-react';

const GOAL_OPTIONS = [20, 50, 100, 150, 200];
const LEVEL_TABS = [...new Set(LESSONS.map(l => l.level))];

export default function Home() {
  const { totalXP, streak, getLessonStatus, todayXP, dailyGoal, setDailyGoal } = useApp();
  const [aiLessons, setAiLessons] = useState([]);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const { user } = useAuth();
  const [levelTab, setLevelTab] = useState(() => LEVEL_TABS.includes(user?.level) ? user.level : LEVEL_TABS[0]);
  const completed = LESSONS.filter(l => getLessonStatus(l.slug) === 'completed').length;
  const goalDone = todayXP >= dailyGoal;

  useEffect(() => {
    getAILessons().then(r => setAiLessons(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">

      {/* Hero */}
      <div className="card border-yellow-300 dark:border-yellow-400/20 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-400/5 dark:to-gray-900">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Willkommen! 👋</h1>
            <p className="text-gray-600 dark:text-gray-400">Welcome to your German learning journey.</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">Every lesson shows English so you can adapt easily.</p>
          </div>
          <div className="text-5xl">🇩🇪</div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1.5">
            <span>Overall Progress</span>
            <span className="font-medium">{completed}/{LESSONS.length} lessons</span>
          </div>
          <ProgressBar value={completed} max={LESSONS.length} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { Icon: Flame, val: streak, label: 'Day Streak', color: 'text-orange-500 dark:text-orange-400' },
          { Icon: Star, val: totalXP, label: 'XP Points', color: 'text-yellow-600 dark:text-yellow-400' },
          { Icon: CheckCircle2, val: completed, label: 'Completed', color: 'text-green-600 dark:text-green-400' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className="flex justify-center mb-1"><s.Icon size={22} className={s.color} /></div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-gray-500 dark:text-gray-400 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Daily Goal */}
      <div className={`card border-2 transition-colors ${
        goalDone
          ? 'border-green-300 dark:border-green-500/40 bg-green-50 dark:bg-green-500/5'
          : 'border-gray-200 dark:border-gray-800'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Target size={20} className={goalDone ? 'text-green-500' : 'text-yellow-500'} />
            <span className="text-gray-900 dark:text-white font-bold">
              {goalDone ? '🎉 Daily Goal Reached!' : 'Daily Goal'}
            </span>
          </div>
          {/* Goal picker */}
          <div className="relative">
            <button
              onClick={() => setShowGoalPicker(s => !s)}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full
                bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300
                hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Goal: {dailyGoal} XP <ChevronDown size={12} />
            </button>
            {showGoalPicker && (
              <div className="absolute right-0 top-8 z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                {GOAL_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setDailyGoal(opt); setShowGoalPicker(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors
                      ${ opt === dailyGoal
                        ? 'bg-yellow-50 dark:bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                  >
                    {opt} XP / day
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            <span>Today's XP</span>
            <span className={`font-semibold ${ goalDone ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400' }`}>
              {todayXP} / {dailyGoal} XP
            </span>
          </div>
          <ProgressBar
            value={todayXP}
            max={dailyGoal}
            color={goalDone ? 'bg-green-400' : 'bg-yellow-400'}
          />
        </div>
        {!goalDone && (
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
            {dailyGoal - todayXP} XP to go — complete a lesson or take an exam!
          </p>
        )}
      </div>

      {/* CEFR Levels */}
      <div className="card">
        <h2 className="text-gray-900 dark:text-white font-bold mb-3">CEFR German Levels</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { level: 'A1', desc: 'Beginner', descDe: 'Anfänger' },
            { level: 'A2', desc: 'Elementary', descDe: 'Grundstufe' },
            { level: 'B1', desc: 'Intermediate', descDe: 'Mittelstufe' },
            { level: 'B2', desc: 'Upper-Intermediate', descDe: 'Obere Mittelstufe' },
          ].map(l => (
            <div key={l.level} className="rounded-xl p-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <LevelBadge level={l.level} />
              <div className="text-gray-800 dark:text-white font-semibold mt-2 text-sm">{l.desc}</div>
              <div className="text-gray-500 text-xs">{l.descDe}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Lessons, by level and topic group */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="text-gray-900 dark:text-white font-bold text-xl">Lessons</h2>
          <div className="flex gap-1.5 flex-wrap">
            {LEVEL_TABS.map(lv => {
              const inLevel = LESSONS.filter(l => l.level === lv);
              const done = inLevel.filter(l => getLessonStatus(l.slug) === 'completed').length;
              return (
                <button key={lv} onClick={() => setLevelTab(lv)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all
                    ${levelTab === lv
                      ? 'bg-yellow-400 text-gray-900 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                  {lv} <span className="opacity-70 text-xs">{done}/{inLevel.length}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-6">
          {LESSON_GROUPS.map(group => {
            const items = LESSONS.filter(l => l.level === levelTab && l.group === group);
            if (!items.length) return null;
            return (
              <div key={group}>
                <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">{group}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(l => {
                    const status = getLessonStatus(l.slug);
                    return (
                      <Link key={l.slug} to={`/lesson/${l.slug}`}
                        className="card hover:border-yellow-400 dark:hover:border-yellow-400/50 hover:shadow-md transition-all group cursor-pointer">
                        <div className="flex items-start justify-between mb-3">
                          <l.Icon size={28} className="text-yellow-500 group-hover:scale-110 transition-transform" />
                          <div className="flex gap-2 items-center flex-wrap justify-end">
                            <LevelBadge level={l.level} />
                            <StatusBadge status={status} />
                          </div>
                        </div>
                        <div className="text-gray-900 dark:text-white font-bold">{l.title}</div>
                        <div className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">{l.titleDe}</div>
                        <div className="text-gray-500 text-xs mt-1">{l.sub}</div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lessons saved by users earlier (no new ones are generated) */}
      {aiLessons.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-900 dark:text-white font-bold text-xl">Your saved lessons</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiLessons.map(l => (
              <Link key={l.slug} to={`/lesson/${l.slug}`}
                className="card hover:border-yellow-400 dark:hover:border-yellow-400/50 hover:shadow-md transition-all group cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <Bot size={28} className="text-purple-500 group-hover:scale-110 transition-transform" />
                  <div className="flex gap-2 items-center flex-wrap justify-end">
                    <LevelBadge level={l.level} />
                  </div>
                </div>
                <div className="text-gray-900 dark:text-white font-bold">{l.title}</div>
                <div className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">{l.titleDe}</div>
                <div className="text-gray-500 text-xs mt-1 capitalize">{l.category}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/exams" className="card hover:border-yellow-400 dark:hover:border-yellow-400/50 hover:shadow-md transition-all text-center py-6 group">
          <div className="flex justify-center mb-2"><Brain size={36} className="text-yellow-500 group-hover:scale-110 transition-transform" /></div>
          <div className="text-gray-900 dark:text-white font-bold">Take an Exam</div>
          <div className="text-gray-500 text-sm">Practice exams for every lesson</div>
        </Link>
        <Link to="/resources" className="card hover:border-yellow-400 dark:hover:border-yellow-400/50 hover:shadow-md transition-all text-center py-6 group">
          <div className="flex justify-center mb-2"><FolderOpen size={36} className="text-yellow-500 group-hover:scale-110 transition-transform" /></div>
          <div className="text-gray-900 dark:text-white font-bold">Find a Topic</div>
          <div className="text-gray-500 text-sm">Search every lesson by word</div>
        </Link>
      </div>
    </div>
  );
}
