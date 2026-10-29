import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { generateExam, getLessons, getExams, deleteExam } from '../api';
import { LevelBadge, ConfirmDelete, MicButton } from '../components/UI';
import { speak } from '../speech';
import { useApp } from '../context/AppContext';
import { PenLine, FileText, Mic, BookMarked, Headphones, Volume2, Bot, Brain, RotateCcw, Trophy, AlertCircle, Lightbulb, Trash2 } from 'lucide-react';

const LEVELS = ['A1', 'A2', 'B1', 'B2'];
const COUNTS = [10, 20, 30];
const PARTS = ['filling', 'writing', 'speaking', 'reading', 'listening'];
const PART_META = {
  filling:   { Icon: PenLine,    label: 'Fill in the Blanks', labelDe: 'Lückentext',   color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-500/10' },
  writing:   { Icon: FileText,   label: 'Writing',            labelDe: 'Schreiben',    color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10' },
  speaking:  { Icon: Mic,        label: 'Speaking',           labelDe: 'Sprechen',     color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
  reading:   { Icon: BookMarked, label: 'Reading',            labelDe: 'Lesen',        color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  listening: { Icon: Headphones, label: 'Listening',          labelDe: 'Hören',        color: 'text-pink-600 dark:text-pink-400',   bg: 'bg-pink-50 dark:bg-pink-500/10' },
};

export default function ExamsPage() {
  const [params] = useSearchParams();
  const [lessons, setLessons] = useState([]);
  const [lessonSlug, setLessonSlug] = useState(params.get('lesson') || 'vocabulary-basics');
  const [level, setLevel] = useState(params.get('level') || 'A1');
  const [questionCount, setQuestionCount] = useState(10);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [activeTab, setActiveTab] = useState('filling');
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [activeMainTab, setActiveMainTab] = useState('new');
  const { markProgress } = useApp();

  useEffect(() => {
    getLessons().then(r => setLessons(r.data)).catch(() => {});
    loadHistory();
  }, []);

  const loadHistory = () => getExams().then(r => setHistory(r.data)).catch(() => {});

  const handleDeleteExam = async (id) => {
    try {
      await deleteExam(id);
      setHistory(h => h.filter(e => e._id !== id));
    } catch (e) {
      setError(e.response?.data?.error || 'Delete failed.');
    }
    setDeleteId(null);
  };

  const handleGenerate = async () => {
    setActiveMainTab('new');
    setLoading(true);
    setError('');
    setExam(null);
    setAnswers({});
    setSubmitted(false);
    setScore(null);

    const msgs = ['Picking questions from the lesson’s question bank...', 'Preparing your exam...'];
    let mi = 0;
    setLoadingMsg(msgs[mi]);
    const interval = setInterval(() => {
      mi = Math.min(mi + 1, msgs.length - 1);
      setLoadingMsg(msgs[mi]);
    }, 1200);

    try {
      const res = await generateExam({ lessonSlug, level, questionCount });
      setExam(res.data);
      setActiveTab('filling');
      loadHistory();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to generate exam. Make sure the backend is running.');
    } finally {
      clearInterval(interval);
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const isOpenEnded = (part) => part === 'writing' || part === 'speaking';

  const handleSubmit = () => {
    if (!exam) return;
    let correct = 0, total = 0;
    PARTS.forEach(part => {
      (exam.parts[part] || []).forEach((q, i) => {
        const key = `${part}-${i}`;
        const ans = answers[key]?.toLowerCase().trim();
        total++;
        if (isOpenEnded(part)) {
          if (ans && ans.length > 0) correct++;
        } else {
          if (ans && ans === q.answer?.toLowerCase().trim()) correct++;
        }
      });
    });
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    setScore({ correct, total, pct });
    setSubmitted(true);
    markProgress(lessonSlug, 'completed', correct * 5, { examId: exam._id, score: correct, total, pct });
    // refresh history so the new score appears immediately
    loadHistory();
  };

  const currentQuestions = exam?.parts?.[activeTab] || [];
  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = exam ? PARTS.reduce((s, p) => s + (exam.parts[p]?.length || 0), 0) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Exams</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Every lesson has its own hand-written question bank: each exam mixes new questions across all 5 parts.
          </p>
        </div>
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

      {/* New Exam tab */}
      {activeMainTab === 'new' && <div className="space-y-4">

      {/* Config */}
      <div className="card space-y-4">
        <h2 className="text-gray-900 dark:text-white font-bold">Configure Exam</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Lesson</label>
            <select className="input" value={lessonSlug} onChange={e => setLessonSlug(e.target.value)}>
              {lessons.map(l => (
                <option key={l.slug} value={l.slug}>{l.title} ({l.level})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">CEFR Level</label>
            <select className="input" value={level} onChange={e => setLevel(e.target.value)}>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Questions</label>
            <select className="input" value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))}>
              {COUNTS.map(n => <option key={n} value={n}>{n} questions (~{Math.floor(n/5)} per part)</option>)}
            </select>
          </div>
        </div>

        {/* Part preview */}
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

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={15} /> {error}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="card text-center py-10 space-y-4">
          <div className="flex justify-center"><Brain size={48} className="text-yellow-400 animate-bounce" /></div>
          <div className="text-gray-900 dark:text-white font-bold text-lg">{loadingMsg}</div>
          <div className="flex justify-center gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Each exam mixes different questions, so you can practise many times.</p>
        </div>
      )}

      {/* Score */}
      {submitted && score && (
        <div className={`card text-center py-8 ${score.pct >= 70 ? 'border-green-300 dark:border-green-500/30 bg-green-50 dark:bg-green-500/5' : 'border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5'}`}>
          <div className="flex justify-center mb-3">
            <Trophy size={48} className={score.pct >= 70 ? 'text-yellow-500' : 'text-gray-400'} />
          </div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white">{score.pct}%</div>
          <div className="text-gray-600 dark:text-gray-400 mt-1">{score.correct} / {score.total} correct</div>
          <div className={`text-lg font-semibold mt-2 ${score.pct >= 70 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {score.pct >= 90 ? 'Ausgezeichnet! (Excellent!)' :
             score.pct >= 70 ? 'Gut gemacht! (Well done!)' :
             score.pct >= 50 ? 'Nicht schlecht! (Not bad!)' : 'Weiter üben! (Keep practicing!)'}
          </div>
          <div className="text-yellow-600 dark:text-yellow-400 text-sm mt-1 font-medium">+{score.correct * 5} XP earned</div>
          <button className="btn-primary mt-4 flex items-center gap-2 mx-auto" onClick={handleGenerate}>
            <RotateCcw size={14} /> Generate New Exam
          </button>
        </div>
      )}

      {/* Exam */}
      {exam && !loading && (
        <div className="space-y-4">
          {/* Exam header */}
          <div className="card">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <LevelBadge level={exam.level} />
                <span className="text-gray-500 dark:text-gray-400 text-sm">{totalQuestions} questions total</span>
                <span className="text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Bot size={11} /> AI Generated
                </span>
              </div>
              {!submitted && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {totalAnswered} / {totalQuestions} answered
                </div>
              )}
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
              return (
                <button key={part} onClick={() => setActiveTab(part)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0
                    ${isActive ? 'bg-yellow-400 text-gray-900 shadow-sm' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-yellow-400'}`}>
                  <meta.Icon size={14} />
                  <span>{meta.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-gray-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    {submitted ? count : `${answered}/${count}`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Part header */}
          <div className={`rounded-2xl p-4 ${PART_META[activeTab].bg}`}>
            <div className={`font-bold text-lg flex items-center gap-2 ${PART_META[activeTab].color}`}>
              {React.createElement(PART_META[activeTab].Icon, { size: 18 })}
              {PART_META[activeTab].label}
              <span className="text-gray-500 dark:text-gray-400 font-normal text-sm">/ {PART_META[activeTab].labelDe}</span>
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">
              {activeTab === 'filling' && 'Choose the correct word to fill in the blank'}
              {activeTab === 'writing' && 'Write your answer in German — there is no single correct answer'}
              {activeTab === 'speaking' && 'Click the speaker to hear the phrase, then practice saying it aloud'}
              {activeTab === 'reading' && 'Read the German text carefully, then answer the question'}
              {activeTab === 'listening' && 'Click the speaker to hear the dialogue, then answer the question'}
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {currentQuestions.length === 0 ? (
              <div className="card text-center py-8 text-gray-500 dark:text-gray-400">
                No questions generated for this part
              </div>
            ) : currentQuestions.map((q, i) => (
              <QuestionCard
                key={i}
                q={q}
                idx={i}
                part={activeTab}
                answer={answers[`${activeTab}-${i}`] || ''}
                setAnswer={val => setAnswers(a => ({ ...a, [`${activeTab}-${i}`]: val }))}
                submitted={submitted}
              />
            ))}
          </div>

          {/* Submit */}
          {!submitted && (
            <div className="flex items-center gap-4">
              <button className="btn-primary flex-1 py-3 text-base" onClick={handleSubmit}>
                Submit Exam
              </button>
              <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
                {totalAnswered}/{totalQuestions} answered
              </div>
            </div>
          )}
        </div>
      )}

      </div>}

      {/* Past Exams tab */}
      {activeMainTab === 'history' && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="card text-center py-12">
              <Trophy size={40} className="text-gray-400 mx-auto mb-3" />
              <div className="text-gray-900 dark:text-white font-bold">No exams yet</div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Generate your first exam above</p>
              <button className="btn-primary mt-4 mx-auto flex items-center gap-2" onClick={() => setActiveMainTab('new')}>
                Generate Exam
              </button>
            </div>
          ) : history.map(e => (
            <div key={e._id} className="card space-y-2">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <LevelBadge level={e.level} />
                  {e.aiGenerated && (
                    <span className="text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Bot size={11} /> AI
                    </span>
                  )}
                  <div>
                    <div className="text-gray-900 dark:text-white font-semibold text-sm">{e.lessonTitle}</div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">{e.questionCount} questions · {new Date(e.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {e.lastScore != null && (
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      e.lastScore >= 70
                        ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                        : e.lastScore >= 50
                          ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                          : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                    }`}>
                      {e.lastScore}%
                    </span>
                  )}
                  <button onClick={() => setDeleteId(e._id)}
                    className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              {deleteId === e._id && (
                <ConfirmDelete
                  message="Delete this exam permanently?"
                  onConfirm={() => handleDeleteExam(e._id)}
                  onCancel={() => setDeleteId(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const OPEN_ENDED = new Set(['writing', 'speaking']);

function QuestionCard({ q, idx, part, answer, setAnswer, submitted }) {
  const openEnded = OPEN_ENDED.has(part);
  const isCorrect = submitted && (openEnded
    ? answer?.trim().length > 0
    : answer?.toLowerCase().trim() === q.answer?.toLowerCase().trim());
  const isWrong = submitted && !isCorrect;
  const meta = PART_META[part];

  return (
    <div className={`card transition-all ${submitted ? (isCorrect ? 'border-green-300 dark:border-green-500/30' : isWrong ? 'border-red-300 dark:border-red-500/30' : 'border-gray-200 dark:border-gray-700') : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${meta.bg} ${meta.color}`}>
          <meta.Icon size={12} /> Q{idx + 1}
        </span>
        {submitted && (
          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
            isCorrect
              ? openEnded
                ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                : 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
              : isWrong
                ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
          }`}>
            {isCorrect ? (openEnded ? '✎ Self-assessed' : '✓ Correct') : isWrong ? '✗ Skipped' : '— Skipped'}
          </span>
        )}
      </div>

      {q.text && (
        <div className="panel p-3 mb-3 cursor-pointer group" onClick={() => speak(q.text, 'de-DE')}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">{q.text}</p>
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-400 text-gray-900 flex-shrink-0 opacity-75 group-hover:opacity-100 group-hover:scale-110 transition-all duration-150">
              <Volume2 size={16} strokeWidth={2.5} />
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-500 text-xs mt-1 italic">{q.textEn}</p>
        </div>
      )}

      {q.script && (
        <div className="panel p-3 mb-3">
          <button className="btn-primary text-sm mb-2 flex items-center gap-2" onClick={() => speak(q.script, 'de-DE', 0.8)}>
            <Volume2 size={16} strokeWidth={2.5} /> Play Dialogue
          </button>
          <div className="space-y-1">
            {q.script.split('\\n').map((line, li) => (
              <div key={li} className="text-gray-700 dark:text-gray-300 text-sm">{line}</div>
            ))}
          </div>
          {q.scriptEn && <p className="text-gray-500 dark:text-gray-500 text-xs mt-2 italic border-t border-gray-200 dark:border-gray-700 pt-2">{q.scriptEn}</p>}
        </div>
      )}

      {part === 'speaking' && q.answer && (
        <div className="panel p-3 mb-3">
          <button className="btn-secondary text-sm flex items-center gap-2" onClick={() => speak(q.answer, 'de-DE', 0.75)}>
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-400 text-gray-900">
              <Volume2 size={16} strokeWidth={2.5} />
            </span>
            Hear Example Pronunciation
          </button>
          {q.pronunciation && (
            <div className="text-gray-500 dark:text-gray-500 text-xs mt-1.5 font-mono">{q.pronunciation}</div>
          )}
        </div>
      )}

      <div className="mb-3">
        <div
          className="text-gray-900 dark:text-white font-semibold cursor-pointer hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors flex items-center gap-2 group"
          onClick={() => speak(q.question, 'de-DE')}
        >
          {q.question}
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-400 text-gray-900 flex-shrink-0 opacity-75 group-hover:opacity-100 group-hover:scale-110 transition-all duration-150">
            <Volume2 size={16} strokeWidth={2.5} />
          </span>
        </div>
        <div className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{q.questionEn}</div>
        {part === 'speaking' && q.tip && (
          <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 mt-1 italic">
            <Lightbulb size={12} /> {q.tip}
          </div>
        )}
      </div>

      {q.options?.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {q.options.map((opt, oi) => {
            let cls = 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-400/5';
            if (!submitted && answer === opt) cls = 'bg-yellow-50 dark:bg-yellow-400/10 border-2 border-yellow-400 text-gray-900 dark:text-white font-medium';
            if (submitted && opt === q.answer) cls = 'bg-green-50 dark:bg-green-500/10 border-2 border-green-400 dark:border-green-500 text-green-700 dark:text-green-400 font-medium';
            if (submitted && answer === opt && opt !== q.answer) cls = 'bg-red-50 dark:bg-red-500/10 border-2 border-red-400 dark:border-red-500 text-red-700 dark:text-red-400';
            return (
              <button key={oi} disabled={submitted}
                className={`px-3 py-2.5 rounded-xl text-sm text-left transition-all ${cls}`}
                onClick={() => setAnswer(opt)}>
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {part === 'speaking' && (
            <MicButton
              disabled={submitted}
              onResult={val => setAnswer(prev => prev ? prev + ' ' + val : val)}
            />
          )}
          <textarea
            className="input text-sm min-h-20 resize-none"
            placeholder={part === 'speaking' ? 'Speak using the mic or type your answer...' : 'Write your answer in German...'}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            disabled={submitted}
          />
        </div>
      )}

      {submitted && (
        <div className={`mt-3 p-3 rounded-xl text-sm ${
          openEnded
            ? 'bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20'
            : isCorrect
              ? 'bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/20'
              : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
        }`}>
          {openEnded ? (
            <div className="space-y-1.5">
              <div className="text-blue-700 dark:text-blue-300 text-xs font-semibold">Model answer — compare with yours:</div>
              <span
                className="text-gray-800 dark:text-gray-200 font-medium cursor-pointer inline-flex items-center gap-2 group"
                onClick={() => speak(q.answer, 'de-DE')}
              >
                {q.answer}
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-400 text-gray-900 flex-shrink-0 opacity-75 group-hover:opacity-100 group-hover:scale-110 transition-all duration-150">
                  <Volume2 size={16} strokeWidth={2.5} />
                </span>
              </span>
              {q.answerEn && <div className="text-gray-500 dark:text-gray-400 text-xs italic">{q.answerEn}</div>}
              {q.tip && <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 italic"><Lightbulb size={12} /> {q.tip}</div>}
            </div>
          ) : (
            <>
              {!isCorrect && (
                <div className="mb-1.5">
                  <span className="text-gray-500 dark:text-gray-400">Correct answer: </span>
                  <span
                    className="text-green-600 dark:text-green-400 font-semibold cursor-pointer hover:underline inline-flex items-center gap-2 group"
                    onClick={() => speak(q.answer, 'de-DE')}
                  >
                    {q.answer}
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-400 text-gray-900 flex-shrink-0 opacity-75 group-hover:opacity-100 group-hover:scale-110 transition-all duration-150">
                      <Volume2 size={16} strokeWidth={2.5} />
                    </span>
                  </span>
                  {q.answerEn && <span className="text-gray-500 dark:text-gray-500 ml-1 text-xs">({q.answerEn})</span>}
                </div>
              )}
              {(q.explanation || q.explanationEn) && (
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs">
                  <Lightbulb size={12} /> {q.explanationEn || q.explanation}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
