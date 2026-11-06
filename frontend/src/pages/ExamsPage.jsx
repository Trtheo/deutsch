import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { generateExam, getLessons, getExams, getExam, deleteExam, submitExam } from '../api';
import { LevelBadge, ConfirmDelete, MicButton } from '../components/UI';
import { speak } from '../speech';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { AVAILABLE_LEVELS } from '../lessons';
import {
  PenLine, FileText, Mic, BookMarked, Headphones, Volume2, Brain, RotateCcw, Trophy, Lightbulb, Trash2,
  Shuffle, Eye, CheckCircle2, Wrench,
} from 'lucide-react';

const COUNTS = [10, 25, 50, 100];
const PARTS = ['filling', 'writing', 'speaking', 'reading', 'listening'];
const PART_META = {
  filling:   { Icon: PenLine,    label: 'Fill in the Blanks', labelDe: 'Lückentext', color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-500/10',     bar: 'bg-blue-500' },
  writing:   { Icon: FileText,   label: 'Writing',            labelDe: 'Schreiben',  color: 'text-green-600 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-500/10',   bar: 'bg-green-500' },
  speaking:  { Icon: Mic,        label: 'Speaking',           labelDe: 'Sprechen',   color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', bar: 'bg-purple-500' },
  reading:   { Icon: BookMarked, label: 'Reading',            labelDe: 'Lesen',      color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', bar: 'bg-orange-500' },
  listening: { Icon: Headphones, label: 'Listening',          labelDe: 'Hören',      color: 'text-pink-600 dark:text-pink-400',     bg: 'bg-pink-50 dark:bg-pink-500/10',     bar: 'bg-pink-500' },
};
const PART_HELP = {
  filling: 'Choose the right word for each question.',
  writing: 'Write in German. You’ll see exactly which words were right, which were missing and how to fix them.',
  speaking: 'Press Speak and say it in German (Chrome or Edge), or type what you would say.',
  reading: 'Read the German text carefully, then answer the question.',
  listening: 'Press Play and listen (as often as you like); the text appears after you submit.',
};
const STATUS = {
  correct: { label: '✓ Correct',     badge: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400',    border: 'border-green-300 dark:border-green-500/30',   box: 'bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-500/20' },
  done:    { label: '✓ Done',        badge: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400',        border: 'border-blue-300 dark:border-blue-500/30',     box: 'bg-blue-50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/20' },
  close:   { label: '≈ Almost',      badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400',    border: 'border-amber-300 dark:border-amber-500/30',   box: 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20' },
  wrong:   { label: '✗ Not quite',   badge: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400',            border: 'border-red-300 dark:border-red-500/30',       box: 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20' },
  skipped: { label: '– Not answered', badge: 'bg-gray-100 dark:bg-gray-800 text-gray-500',                             border: 'border-gray-200 dark:border-gray-700',        box: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' },
};
const SPOKEN = '[spoken]';
const isMistake = s => s === 'wrong' || s === 'close' || s === 'skipped';

// Exams graded before per-question feedback existed only have the score
function fallbackFeedback(q, part, given) {
  if (!given) return { status: 'skipped', tips: [] };
  if (q.options?.length) return { status: given.trim().toLowerCase() === String(q.answer).trim().toLowerCase() ? 'correct' : 'wrong', tips: [] };
  return { status: 'done', tips: [] };
}

function SpeakIcon() {
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-400 text-gray-900 flex-shrink-0 opacity-75 group-hover:opacity-100 group-hover:scale-110 transition-all duration-150">
      <Volume2 size={16} strokeWidth={2.5} />
    </span>
  );
}

export default function ExamsPage() {
  const [params] = useSearchParams();
  const [lessons, setLessons] = useState([]);
  const [lessonSlug, setLessonSlug] = useState(params.get('lesson') || `level-${params.get('level') || 'A1'}`);
  const [questionCount, setQuestionCount] = useState(25);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('filling');
  const [answers, setAnswers] = useState({});
  const [onlyMistakes, setOnlyMistakes] = useState(false);
  const toast = useToast();
  const [history, setHistory] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [activeMainTab, setActiveMainTab] = useState('new');
  const { applyServerProgress } = useApp();

  const result = exam?.result || null;
  const submitted = !!result;

  useEffect(() => {
    getLessons().then(r => setLessons(r.data)).catch(() => {});
    loadHistory();
  }, []);

  const loadHistory = () => getExams().then(r => setHistory(r.data)).catch(() => {});

  const lessonsByLevel = useMemo(() => {
    const groups = {};
    for (const l of lessons) (groups[l.level] ||= []).push(l);
    return groups;
  }, [lessons]);

  const handleDeleteExam = async (id) => {
    try {
      await deleteExam(id);
      setHistory(h => h.filter(e => e._id !== id));
    } catch (e) {
      toast.error(e.response?.data?.error || 'Delete failed.');
    }
    setDeleteId(null);
  };

  const showExam = (data) => {
    setExam(data);
    setAnswers(data.result?.answers || {});
    setOnlyMistakes(false);
    setActiveTab('filling');
  };

  const handleGenerate = async () => {
    setActiveMainTab('new');
    setLoading(true);
    setExam(null);
    setAnswers({});
    try {
      const res = await generateExam({ lessonSlug, questionCount });
      showExam(res.data);
      loadHistory();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not start the exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openPastExam = async (id) => {
    try {
      const res = await getExam(id);
      setActiveMainTab('new');
      showExam(res.data);
      window.scrollTo?.({ top: 0, behavior: 'smooth' });
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not open this exam.');
    }
  };

  // The server grades the exam and returns it with answers, explanations and feedback
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (!exam || submitting) return;
    setSubmitting(true);
    try {
      const res = await submitExam(exam._id, answers);
      const graded = res.data.result;
      setExam({ ...res.data.exam, result: res.data.exam.result || graded });
      applyServerProgress(res.data.progress);
      toast.success(`${graded.correct} of ${graded.total} correct · +${graded.xp} XP`);
      // Start the review where there is something to learn
      const firstWithMistake = PARTS.find(p => graded.parts && graded.parts[p]?.total && graded.parts[p].points < graded.parts[p].total);
      if (firstWithMistake) setActiveTab(firstWithMistake);
      loadHistory();
      window.scrollTo?.({ top: 0, behavior: 'smooth' });
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not submit the exam. Check your connection and try again.');
    } finally { setSubmitting(false); }
  };

  const feedbackFor = (part, i, q) => {
    const key = `${part}-${i}`;
    return result?.items?.[key] || fallbackFeedback(q, part, answers[key]);
  };

  const currentQuestions = (exam?.parts?.[activeTab] || [])
    .map((q, i) => ({ q, i }))
    .filter(({ q, i }) => !(submitted && onlyMistakes) || isMistake(feedbackFor(activeTab, i, q).status));
  const totalAnswered = Object.values(answers).filter(Boolean).length;
  const totalQuestions = exam ? PARTS.reduce((s, p) => s + (exam.parts[p]?.length || 0), 0) : 0;
  const pct = result?.pct ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Exams</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Thousands of questions from every lesson — each exam is a new random mix, and every answer is explained.
        </p>
      </div>

      {/* Main tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        {[{ id: 'new', label: 'New Exam' }, { id: 'history', label: `Past Exams (${history.length})` }].map(t => (
          <button key={t.id} onClick={() => setActiveMainTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
              ${activeMainTab === t.id
                ? 'border-yellow-400 text-yellow-600 dark:text-yellow-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeMainTab === 'new' && <div className="space-y-4">

      {/* Config */}
      <div className="card space-y-4">
        <h2 className="text-gray-900 dark:text-white font-bold">Configure Exam</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="exam-lesson" className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">What to practise</label>
            <select id="exam-lesson" className="input" value={lessonSlug} onChange={e => setLessonSlug(e.target.value)}>
              <optgroup label="Mixed practice (all lessons of a level)">
                {AVAILABLE_LEVELS.map(l => <option key={l} value={`level-${l}`}>All {l} lessons — mixed</option>)}
              </optgroup>
              {Object.entries(lessonsByLevel).map(([level, list]) => (
                <optgroup key={level} label={`${level} lessons`}>
                  {list.map(l => <option key={l.slug} value={l.slug}>{l.title} ({l.level})</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="exam-count" className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Questions</label>
            <select id="exam-count" className="input" value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))}>
              {COUNTS.map(n => <option key={n} value={n}>{n} questions (~{Math.floor(n / 5)} per part)</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {PARTS.map(p => {
            const { Icon, label, bg, color } = PART_META[p];
            return (
              <span key={p} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${bg} ${color}`}>
                <Icon size={12} /> {label}
              </span>
            );
          })}
        </div>

        <button className="btn-primary w-full py-3 text-base" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Preparing...' : 'Start Exam'}
        </button>
      </div>

      {loading && (
        <div className="card text-center py-10 space-y-3">
          <div className="flex justify-center"><Brain size={44} className="text-yellow-400 animate-bounce" /></div>
          <div className="text-gray-900 dark:text-white font-bold">Picking a fresh mix of questions…</div>
        </div>
      )}

      {/* Result summary */}
      {submitted && (
        <div className={`card py-6 space-y-4 ${pct >= 70 ? 'border-green-300 dark:border-green-500/30 bg-green-50 dark:bg-green-500/5' : 'border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5'}`}>
          <div className="text-center">
            <Trophy size={44} className={`mx-auto mb-2 ${pct >= 70 ? 'text-yellow-500' : 'text-gray-400'}`} />
            <div className="text-4xl font-bold text-gray-900 dark:text-white">{pct}%</div>
            <div className="text-gray-600 dark:text-gray-400 mt-1">{result.correct} / {result.total} points</div>
            <div className={`text-lg font-semibold mt-1 ${pct >= 70 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {pct >= 90 ? 'Ausgezeichnet! (Excellent!)' :
               pct >= 70 ? 'Gut gemacht! (Well done!)' :
               pct >= 50 ? 'Nicht schlecht! (Not bad!)' : 'Weiter üben! (Keep practising — every mistake below is explained.)'}
            </div>
            {result.xp != null && <div className="text-yellow-600 dark:text-yellow-400 text-sm mt-1 font-medium">+{result.xp} XP earned</div>}
          </div>

          {result.parts && (
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {PARTS.filter(p => result.parts[p]?.total).map(p => {
                const { points, total } = result.parts[p];
                const share = Math.round((points / total) * 100);
                return (
                  <button key={p} onClick={() => setActiveTab(p)} className="text-left p-2 rounded-xl bg-white/70 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 hover:border-yellow-400">
                    <div className={`text-xs font-semibold flex items-center gap-1 ${PART_META[p].color}`}>
                      {React.createElement(PART_META[p].Icon, { size: 12 })} {PART_META[p].label}
                    </div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{points} / {total}</div>
                    <div className="mt-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800">
                      <div className={`h-1.5 rounded-full ${PART_META[p].bar}`} style={{ width: `${share}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap gap-2 justify-center">
            <button className="btn-primary flex items-center gap-2" onClick={handleGenerate}>
              <RotateCcw size={14} /> New exam (new questions)
            </button>
            <button className="btn-secondary flex items-center gap-2" onClick={() => setOnlyMistakes(v => !v)}>
              <Eye size={14} /> {onlyMistakes ? 'Show all questions' : 'Show only my mistakes'}
            </button>
          </div>
        </div>
      )}

      {/* Exam */}
      {exam && !loading && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <LevelBadge level={exam.level} />
                {exam.lessonTitle && <span className="text-gray-900 dark:text-white text-sm font-semibold">{exam.lessonTitle}</span>}
                <span className="text-gray-500 dark:text-gray-400 text-sm">{totalQuestions} questions</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Shuffle size={11} /> Random mix
                </span>
              </div>
              {!submitted && <div className="text-sm text-gray-500 dark:text-gray-400">{totalAnswered} / {totalQuestions} answered</div>}
            </div>
            {!submitted && (
              <div className="mt-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5">
                <div className="bg-yellow-400 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0}%` }} />
              </div>
            )}
          </div>

          {/* Part tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {PARTS.map(part => {
              const meta = PART_META[part];
              const count = exam.parts[part]?.length || 0;
              const answered = (exam.parts[part] || []).filter((_, i) => answers[`${part}-${i}`]).length;
              const isActive = activeTab === part;
              const partScore = result?.parts?.[part];
              return (
                <button key={part} onClick={() => setActiveTab(part)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0
                    ${isActive ? 'bg-yellow-400 text-gray-900 shadow-sm' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-yellow-400'}`}>
                  <meta.Icon size={14} />
                  <span>{meta.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-gray-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    {submitted ? (partScore ? `${partScore.points}/${partScore.total}` : count) : `${answered}/${count}`}
                  </span>
                </button>
              );
            })}
          </div>

          <div className={`rounded-2xl p-4 ${PART_META[activeTab].bg}`}>
            <div className={`font-bold text-lg flex items-center gap-2 ${PART_META[activeTab].color}`}>
              {React.createElement(PART_META[activeTab].Icon, { size: 18 })}
              {PART_META[activeTab].label}
              <span className="text-gray-500 dark:text-gray-400 font-normal text-sm">/ {PART_META[activeTab].labelDe}</span>
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">{PART_HELP[activeTab]}</div>
          </div>

          <div className="space-y-4">
            {currentQuestions.length === 0 ? (
              <div className="card text-center py-8 text-gray-500 dark:text-gray-400">
                {submitted && onlyMistakes ? <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> No mistakes in this part — sehr gut!</span> : 'No questions in this part'}
              </div>
            ) : currentQuestions.map(({ q, i }) => (
              <QuestionCard
                key={`${exam._id}-${activeTab}-${i}`}
                q={q}
                idx={i}
                part={activeTab}
                answer={answers[`${activeTab}-${i}`] || ''}
                setAnswer={val => setAnswers(a => ({ ...a, [`${activeTab}-${i}`]: typeof val === 'function' ? val(a[`${activeTab}-${i}`] || '') : val }))}
                submitted={submitted}
                feedback={submitted ? feedbackFor(activeTab, i, q) : null}
              />
            ))}
          </div>

          {!submitted && (
            <div className="flex items-center gap-4">
              <button className="btn-primary flex-1 py-3 text-base" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Grading…' : 'Submit Exam'}
              </button>
              <div className="text-sm text-gray-500 dark:text-gray-400 text-right">{totalAnswered}/{totalQuestions} answered</div>
            </div>
          )}
        </div>
      )}

      </div>}

      {/* Past exams */}
      {activeMainTab === 'history' && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="card text-center py-12">
              <Trophy size={40} className="text-gray-400 mx-auto mb-3" />
              <div className="text-gray-900 dark:text-white font-bold">No exams yet</div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Start your first exam above</p>
              <button className="btn-primary mt-4 mx-auto flex items-center gap-2" onClick={() => setActiveMainTab('new')}>Start Exam</button>
            </div>
          ) : history.map(e => (
            <div key={e._id} className="card space-y-2">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <LevelBadge level={e.level} />
                  <div>
                    <div className="text-gray-900 dark:text-white font-semibold text-sm">{e.lessonTitle}</div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">{e.questionCount} questions · {new Date(e.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {e.lastScore != null && (
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      e.lastScore >= 70 ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                        : e.lastScore >= 50 ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                          : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'}`}>
                      {e.lastScore}%
                    </span>
                  )}
                  <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => openPastExam(e._id)}>
                    {e.lastScore != null ? 'Review' : 'Continue'}
                  </button>
                  <button onClick={() => setDeleteId(e._id)} title="Delete exam"
                    className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              {deleteId === e._id && (
                <ConfirmDelete message="Delete this exam permanently?" onConfirm={() => handleDeleteExam(e._id)} onCancel={() => setDeleteId(null)} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Word-by-word comparison: green = right, amber = small fix, red = missing, grey = not needed
function DiffView({ diff }) {
  if (!diff?.length) return null;
  return (
    <div className="flex flex-wrap gap-1 my-1.5" aria-label="Word by word">
      {diff.map((d, i) => {
        if (d.type === 'ok') return <span key={i} className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300 text-sm">{d.word}</span>;
        if (d.type === 'missing') return <span key={i} title="missing" className="px-1.5 py-0.5 rounded border border-dashed border-red-400 text-red-700 dark:text-red-400 text-sm">+ {d.word}</span>;
        if (d.type === 'extra') return <span key={i} title="not needed" className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 line-through text-sm">{d.word}</span>;
        return (
          <span key={i} title={d.type} className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-sm">
            <span className="line-through opacity-70">{d.given}</span> → {d.word}
          </span>
        );
      })}
    </div>
  );
}

function QuestionCard({ q, idx, part, answer, setAnswer, submitted, feedback }) {
  const meta = PART_META[part];
  const status = feedback ? STATUS[feedback.status] || STATUS.done : null;
  const readAloud = part === 'speaking' && q.check === 'speech' && !q.hideAnswer;
  const canSpeak = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const lines = String(q.script || '').split(/\n|\\n/);
  const given = feedback?.given ?? answer;

  return (
    <div className={`card transition-all ${status ? status.border : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${meta.bg} ${meta.color}`}>
          <meta.Icon size={12} /> Q{idx + 1}
        </span>
        {status && <span className={`text-xs font-bold px-2 py-1 rounded-lg ${status.badge}`}>{status.label}</span>}
      </div>

      {/* Reading text (its translation only after submitting) */}
      {q.text && (
        <div className="panel p-3 mb-3 cursor-pointer group" onClick={() => speak(q.text, 'de-DE')}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-line">{q.text}</p>
            <SpeakIcon />
          </div>
          {submitted && q.textEn && <p className="text-gray-500 text-xs mt-1 italic">{q.textEn}</p>}
        </div>
      )}

      {/* Listening: audio first, the transcript is part of the review */}
      {q.script && (
        <div className="panel p-3 mb-3">
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary text-sm flex items-center gap-2" onClick={() => speak(lines.join(' '), 'de-DE', 0.85)}>
              <Volume2 size={16} strokeWidth={2.5} /> Play
            </button>
            <button className="btn-secondary text-sm" onClick={() => speak(lines.join(' '), 'de-DE', 0.6)}>Slower</button>
          </div>
          {submitted && (
            <div className="mt-2 space-y-1">
              {lines.map((line, li) => <div key={li} className="text-gray-700 dark:text-gray-300 text-sm">{line}</div>)}
              {q.scriptEn && <p className="text-gray-500 text-xs mt-2 italic border-t border-gray-200 dark:border-gray-700 pt-2">{q.scriptEn}</p>}
            </div>
          )}
        </div>
      )}

      {/* Speaking: the sentence to read aloud, or the hidden German of a "say it in German" task */}
      {part === 'speaking' && q.answer && (readAloud || submitted || !q.check) && (
        <div className="panel p-3 mb-3">
          {readAloud && <p className="text-gray-900 dark:text-white font-semibold mb-2">{q.answer}</p>}
          <button className="btn-secondary text-sm flex items-center gap-2 group" onClick={() => speak(q.answer, 'de-DE', 0.75)}>
            <SpeakIcon /> {readAloud ? 'Hear it first' : 'Hear the example'}
          </button>
        </div>
      )}

      <div className="mb-3">
        <div className="text-gray-900 dark:text-white font-semibold cursor-pointer hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors flex items-center gap-2 group"
          onClick={() => speak(q.question, 'de-DE')}>
          {q.question}
          <SpeakIcon />
        </div>
        <div className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{q.questionEn}</div>
        {part === 'speaking' && q.tip && !submitted && (
          <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 mt-1 italic"><Lightbulb size={12} /> {q.tip}</div>
        )}
      </div>

      {q.options?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {q.options.map((opt, oi) => {
            let cls = 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-400/5';
            if (!submitted && answer === opt) cls = 'bg-yellow-50 dark:bg-yellow-400/10 border-2 border-yellow-400 text-gray-900 dark:text-white font-medium';
            if (submitted && opt === q.answer) cls = 'bg-green-50 dark:bg-green-500/10 border-2 border-green-400 dark:border-green-500 text-green-700 dark:text-green-400 font-medium';
            if (submitted && given === opt && opt !== q.answer) cls = 'bg-red-50 dark:bg-red-500/10 border-2 border-red-400 dark:border-red-500 text-red-700 dark:text-red-400';
            return (
              <button key={oi} disabled={submitted} className={`px-3 py-2.5 rounded-xl text-sm text-left transition-all ${cls}`} onClick={() => setAnswer(opt)}>
                {opt}
              </button>
            );
          })}
        </div>
      ) : !submitted ? (
        <div className="space-y-2">
          {part === 'speaking' && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Speech is compared word by word: a new recording replaces the old one */}
              <MicButton onResult={val => setAnswer(prev => (q.check === 'speech' || !prev ? val : `${prev} ${val}`))} />
              {!canSpeak && q.check === 'speech' && (
                <button type="button" className="btn-secondary text-xs px-3 py-1.5" onClick={() => setAnswer(SPOKEN)}>
                  I said it aloud
                </button>
              )}
              {answer && answer !== SPOKEN && <span className="text-xs text-gray-500">Heard: “{answer}”</span>}
              {answer === SPOKEN && <span className="text-xs text-green-600">Marked as spoken ✓</span>}
            </div>
          )}
          {answer !== SPOKEN && (
            <textarea
              className="input text-sm min-h-20 resize-none"
              placeholder={part === 'speaking' ? 'Speak using the mic, or type what you would say…' : 'Write your answer in German…'}
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              lang="de"
              spellCheck={false}
            />
          )}
        </div>
      ) : given && given !== SPOKEN ? (
        <div className="text-sm">
          <span className="text-gray-500 dark:text-gray-400">Your answer: </span>
          <span className="text-gray-800 dark:text-gray-200">{given}</span>
        </div>
      ) : null}

      {feedback && <Feedback q={q} part={part} feedback={feedback} status={status} />}
    </div>
  );
}

function Feedback({ q, part, feedback, status }) {
  const choice = q.options?.length > 0;
  const showExpected = q.answer && !(choice && feedback.status === 'correct');
  const freeTask = !choice && !q.check; // hand-written writing/speaking: a model to compare with
  const tips = feedback.tips || [];
  return (
    <div className={`mt-3 p-3 rounded-xl text-sm border space-y-2 ${status.box}`}>
      {!choice && feedback.diff?.length > 0 && feedback.status !== 'skipped' && (
        <div>
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">Word by word:</div>
          <DiffView diff={feedback.diff} />
        </div>
      )}

      {showExpected && (
        <div>
          <span className="text-gray-600 dark:text-gray-400 text-xs font-semibold">
            {freeTask ? 'Model answer — compare with yours: ' : feedback.status === 'correct' ? 'Answer: ' : 'Correct answer: '}
          </span>
          <span className="text-green-700 dark:text-green-400 font-semibold cursor-pointer inline-flex items-center gap-2 group" onClick={() => speak(q.answer, 'de-DE')}>
            {q.answer}
            <SpeakIcon />
          </span>
          {q.answerEn && <span className="text-gray-500 ml-1 text-xs italic">({q.answerEn})</span>}
        </div>
      )}

      {tips.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1">
            {feedback.status === 'correct' || feedback.status === 'done' ? <><Lightbulb size={12} /> Why</> : <><Wrench size={12} /> Why, and how to fix it</>}
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-gray-700 dark:text-gray-300">
            {tips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      )}

      {/* Older exams without server feedback: the stored explanation */}
      {!tips.length && (q.explanationEn || q.explanation) && (
        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs"><Lightbulb size={12} /> {q.explanationEn || q.explanation}</div>
      )}
      {(part === 'writing' || part === 'speaking') && q.tip && (
        <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 italic"><Lightbulb size={12} /> {q.tip}</div>
      )}
    </div>
  );
}
