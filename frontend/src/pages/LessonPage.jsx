import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLesson, getComments, postComment, deleteComment } from '../api';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { SpeakText, LevelBadge } from '../components/UI';
import { CheckCircle2, ClipboardList, ArrowLeft, ArrowRight, Loader2, SearchX, Brain, MessageSquare, Send, Trash2 } from 'lucide-react';
import LESSONS from '../lessons';
import AlphabetLesson from './lessons/AlphabetLesson';
import VocabularyLesson from './lessons/VocabularyLesson';
import NumbersLesson from './lessons/NumbersLesson';
import GrammarLesson from './lessons/GrammarLesson';
import VerbsLesson from './lessons/VerbsLesson';
import TensesLesson from './lessons/TensesLesson';
import ReadingLesson from './lessons/ReadingLesson';
import WritingLesson from './lessons/WritingLesson';
import ListeningLesson from './lessons/ListeningLesson';
import SpeakingLesson from './lessons/SpeakingLesson';
import AILesson from './lessons/AILesson';
import TopicLesson from './lessons/TopicLesson';

const lessonComponents = {
  alphabet:   AlphabetLesson,
  vocabulary: VocabularyLesson,
  numbers:    NumbersLesson,
  grammar:    GrammarLesson,
  verbs:      VerbsLesson,
  tenses:     TensesLesson,
  reading:    ReadingLesson,
  writing:    WritingLesson,
  listening:  ListeningLesson,
  speaking:   SpeakingLesson,
  topic:       TopicLesson,
  certificate: TopicLesson,
};

export default function LessonPage() {
  const { slug } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const { markProgress, getLessonStatus } = useApp();
  const { user } = useAuth();

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const staticIdx = LESSONS.findIndex(l => l.slug === slug);
  const prevLesson = staticIdx > 0 ? LESSONS[staticIdx - 1] : null;
  const nextLesson = staticIdx >= 0 && staticIdx < LESSONS.length - 1 ? LESSONS[staticIdx + 1] : null;

  useEffect(() => {
    setLoading(true);
    const isNew = getLessonStatus(slug) === 'not_started';
    getLesson(slug).then(r => {
      setLesson(r.data);
      markProgress(slug, 'in_progress', isNew ? 10 : 0);
    }).catch(() => setLesson(null)).finally(() => setLoading(false));
    getComments(slug).then(r => setComments(r.data)).catch(() => {});
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    setCommentLoading(true);
    try {
      const res = await postComment(slug, { text: commentText.trim() });
      setComments(prev => [res.data, ...prev]);
      setCommentText('');
    } catch {}
    setCommentLoading(false);
  };

  const handleDeleteComment = async (id) => {
    try {
      await deleteComment(slug, id);
      setComments(prev => prev.filter(c => c._id !== id));
    } catch {}
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={40} className="text-yellow-400 animate-spin" />
    </div>
  );

  if (!lesson) return (
    <div className="card text-center py-12">
      <SearchX size={48} className="text-gray-400 mx-auto mb-3" />
      <div className="text-gray-900 dark:text-white font-bold">Lesson not found</div>
      <Link to="/" className="btn-primary mt-4 inline-flex items-center gap-2"><ArrowLeft size={15} /> Back to Home</Link>
    </div>
  );

  const LessonComponent = lesson.content?.aiGenerated ? AILesson : lessonComponents[lesson.category];
  const status = getLessonStatus(slug);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <LevelBadge level={lesson.level} />
              <span className="text-gray-400 dark:text-gray-500 text-sm capitalize">{lesson.category}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{lesson.title}</h1>
            <SpeakText text={lesson.titleDe} className="text-yellow-600 dark:text-yellow-400 text-lg font-semibold mt-0.5" />
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">{lesson.content?.descriptionEn}</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 italic">{lesson.content?.description}</p>
          </div>
          <div className="flex flex-col gap-2 min-w-fit">
            <button
              onClick={() => markProgress(slug, 'completed', 50)}
              className={`btn-primary text-sm flex items-center gap-2 ${status === 'completed' ? 'opacity-60' : ''}`}
            >
              <CheckCircle2 size={15} strokeWidth={2.5} />
              {status === 'completed' ? 'Completed' : 'Mark Complete +50 XP'}
            </button>
            <Link to={`/exams?lesson=${slug}&level=${lesson.level}`} className="btn-secondary text-sm text-center flex items-center gap-2">
              <Brain size={15} strokeWidth={2.5} /> Take Exam
            </Link>
          </div>
        </div>
      </div>

      {/* Lesson Content */}
      {LessonComponent ? (
        <LessonComponent lesson={lesson} />
      ) : (
        <div className="card text-gray-500">No renderer for: {lesson.category}</div>
      )}

      {/* Navigation */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        {/* Prev */}
        {prevLesson ? (
          <Link to={`/lesson/${prevLesson.slug}`}
            className="btn-secondary flex items-center gap-2 text-sm truncate">
            <ArrowLeft size={15} className="flex-shrink-0" />
            <span className="truncate">{prevLesson.title}</span>
          </Link>
        ) : (
          <Link to="/" className="btn-secondary flex items-center gap-2 text-sm">
            <ArrowLeft size={15} /> Home
          </Link>
        )}

        {/* Exam */}
        <Link to={`/exams?lesson=${slug}&level=${lesson.level}`}
          className="btn-secondary flex items-center justify-center gap-1.5 text-sm">
          <ClipboardList size={15} /> Exam
        </Link>

        {/* Next */}
        {nextLesson ? (
          <Link to={`/lesson/${nextLesson.slug}`}
            className="btn-primary flex items-center justify-end gap-2 text-sm truncate">
            <span className="truncate">{nextLesson.title}</span>
            <ArrowRight size={15} className="flex-shrink-0" />
          </Link>
        ) : (
          <Link to="/exams"
            className="btn-primary flex items-center justify-end gap-2 text-sm">
            All Exams <ArrowRight size={15} />
          </Link>
        )}
      </div>

      {/* Comments */}
      <div className="card space-y-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare size={17} /> Comments
          <span className="text-sm font-normal text-gray-400">({comments.length})</span>
        </h3>

        {user ? (
          <div className="flex gap-3">
            <span className="text-2xl flex-shrink-0">{user.avatar || '🧑'}</span>
            <div className="flex-1 flex gap-2">
              <textarea
                className="input resize-none flex-1 text-sm"
                rows={2}
                placeholder="Share your thoughts or ask a question..."
                value={commentText}
                maxLength={500}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }}
              />
              <button
                onClick={handlePostComment}
                disabled={commentLoading || !commentText.trim()}
                className="btn-primary px-3 self-end flex items-center gap-1.5 text-sm disabled:opacity-50">
                <Send size={14} />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">Sign in to leave a comment.</p>
        )}

        <div className="space-y-3">
          {comments.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No comments yet. Be the first!</p>
          )}
          {comments.map(c => (
            <div key={c._id} className="flex gap-3 group">
              <span className="text-xl flex-shrink-0">{c.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{c.username}</span>
                  <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                  {(user?.id === c.userId || user?.role === 'admin') && (
                    <button onClick={() => handleDeleteComment(c._id)}
                      className="ml-auto opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-300 hover:text-red-500 transition-all">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 whitespace-pre-wrap">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
