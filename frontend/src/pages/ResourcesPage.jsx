import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { generateLesson, getAILessons, deleteLesson, uploadResource, getLessons } from '../api';
import { LevelBadge, ConfirmDelete } from '../components/UI';
import { Sparkles, BookOpen, Paperclip, Bot, Trash2, AlertCircle, CheckCircle2, Upload, BookMarked, Brain, Lightbulb, Wifi, Library, PenLine, MessageSquare, Save } from 'lucide-react';

const LEVELS = ['A1', 'A2', 'B1', 'B2'];
const CATEGORIES = ['vocabulary', 'grammar', 'reading', 'writing', 'listening', 'speaking', 'verbs', 'tenses'];
const TOPICS = {
  A1: ['Greetings & Introductions', 'Family Members', 'Colors & Shapes', 'Days & Months', 'Food & Drinks', 'Body Parts', 'Animals', 'Weather'],
  A2: ['Shopping & Prices', 'Travel & Transport', 'Health & Doctor', 'Hobbies & Free Time', 'Work & Jobs', 'House & Furniture'],
  B1: ['Environment & Nature', 'Technology & Internet', 'Culture & Traditions', 'Education System', 'Politics & Society'],
  B2: ['Philosophy & Ethics', 'Economics & Business', 'Literature & Arts', 'Science & Research', 'Media & Journalism'],
};

export default function ResourcesPage() {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('A1');
  const [category, setCategory] = useState('vocabulary');
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [error, setError] = useState('');
  const [aiLessons, setAiLessons] = useState([]);
  const [allLessons, setAllLessons] = useState([]);
  const [deleteSlug, setDeleteSlug] = useState(null);

  const [activeTab, setActiveTab] = useState('generate');
  const [uploadSlug, setUploadSlug] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      const [ai, all] = await Promise.all([getAILessons(), getLessons()]);
      setAiLessons(ai.data);
      setAllLessons(all.data);
      if (all.data.length > 0) setUploadSlug(all.data[0].slug);
    } catch {}
  };

  const genSteps = [
    { Icon: Wifi,          text: 'Connecting to AI...' },
    { Icon: Library,       text: 'Building lesson structure...' },
    { Icon: PenLine,       text: 'Writing content...' },
    { Icon: MessageSquare, text: 'Creating dialogue...' },
    { Icon: Save,          text: 'Saving to database...' },
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) return setError('Please enter a topic');
    setGenerating(true);
    setError('');
    setGenStep(0);
    const iv = setInterval(() => setGenStep(s => Math.min(s + 1, genSteps.length - 1)), 2000);
    try {
      const res = await generateLesson({ topic: topic.trim(), level, category });
      await loadLessons();
      setTopic('');
      setActiveTab('saved');
      if (res.data.fallback) setError('⚠️ OpenAI unavailable — a template lesson was created. Add credits to generate AI content.');
    } catch (e) {
      setError(e.response?.data?.error || 'Generation failed. Check backend is running.');
    } finally {
      clearInterval(iv);
      setGenerating(false);
      setGenStep(0);
    }
  };

  const handleDelete = async (slug) => {
    try {
      await deleteLesson(slug);
      setAiLessons(prev => prev.filter(l => l.slug !== slug));
    } catch (e) {
      setError(e.response?.data?.error || 'Delete failed.');
    }
    setDeleteSlug(null);
  };

  const handleUpload = async () => {
    if (!uploadTitle || !uploadSlug) return setError('Select a lesson and add a title');
    setUploading(true);
    const fd = new FormData();
    fd.append('title', uploadTitle);
    if (uploadUrl) fd.append('url', uploadUrl);
    if (uploadFile) fd.append('file', uploadFile);
    try {
      await uploadResource(uploadSlug, fd);
      setUploadDone(true);
      setUploadTitle(''); setUploadUrl(''); setUploadFile(null);
      setTimeout(() => setUploadDone(false), 3000);
    } catch (e) { setError(e.response?.data?.error || 'Upload failed.'); }
    setUploading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Lesson Generator</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Generate custom German lessons with AI — saved permanently to your database
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        {[
          { id: 'generate', Icon: Sparkles, label: 'Generate Lesson' },
          { id: 'saved', Icon: BookOpen, label: `Saved AI Lessons (${aiLessons.length})` },
          { id: 'resources', Icon: Paperclip, label: 'Upload Resources' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
              ${activeTab === t.id
                ? 'border-yellow-400 text-yellow-600 dark:text-yellow-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <t.Icon size={14} className="inline mr-1" />{t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={15} /> {error} <button className="ml-2 underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="text-gray-900 dark:text-white font-bold">Create a New AI Lesson</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">CEFR Level</label>
                <select className="input" value={level} onChange={e => setLevel(e.target.value)}>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Category</label>
                <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Topic *</label>
              <input
                className="input"
                placeholder="e.g. Ordering food at a restaurant, Family vocabulary, Modal verbs..."
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              />
            </div>

            {/* Quick topic suggestions */}
            <div>
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs mb-2">
                <Lightbulb size={13} className="text-yellow-500" /> Quick suggestions for {level}:
              </div>
              <div className="flex flex-wrap gap-2">
                {(TOPICS[level] || []).map(t => (
                  <button key={t} onClick={() => setTopic(t)}
                    className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-yellow-100 dark:hover:bg-yellow-400/10 hover:text-yellow-700 dark:hover:text-yellow-400 transition-colors border border-gray-200 dark:border-gray-700">
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2" onClick={handleGenerate} disabled={generating}>
              <Sparkles size={16} /> {generating ? 'Generating...' : 'Generate AI Lesson'}
            </button>
          </div>

          {/* Loading */}
          {generating && (
            <div className="card text-center py-8 space-y-3">
              <div className="flex justify-center"><Bot size={40} className="text-yellow-400 animate-bounce" /></div>
              <div className="flex items-center justify-center gap-2 text-gray-900 dark:text-white font-bold">
                {React.createElement(genSteps[genStep].Icon, { size: 18, className: 'text-yellow-500' })}
                {genSteps[genStep].text}
              </div>
              <div className="flex justify-center gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                ))}
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Lesson will be saved to your database automatically</p>
            </div>
          )}

          {/* How it works */}
          <div className="card">
            <h3 className="text-gray-900 dark:text-white font-bold mb-3">How It Works</h3>
            <div className="space-y-2">
              {[
                { n: '1', t: 'Enter any German topic and select level + category' },
                { n: '2', t: 'AI generates a complete lesson with vocabulary, examples, and dialogue' },
                { n: '3', t: 'Lesson is saved to MongoDB — available every time you open the app' },
                { n: '4', t: 'Go to Exams to generate a test based on your new lesson' },
                { n: '5', t: 'Click any German text to hear pronunciation' },
              ].map(s => (
                <div key={s.n} className="flex gap-3 items-start text-sm">
                  <span className="w-6 h-6 rounded-full bg-yellow-400 text-gray-900 font-bold text-xs flex items-center justify-center flex-shrink-0">{s.n}</span>
                  <span className="text-gray-600 dark:text-gray-400">{s.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Saved AI Lessons Tab */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {aiLessons.length === 0 ? (
            <div className="card text-center py-12">
              <div className="flex justify-center mb-3"><Bot size={40} className="text-gray-400" /></div>
              <div className="text-gray-900 dark:text-white font-bold">No AI lessons yet</div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Generate your first lesson above</p>
              <button className="btn-primary mt-4 flex items-center gap-2 mx-auto" onClick={() => setActiveTab('generate')}><Sparkles size={14} /> Generate Lesson</button>
            </div>
          ) : (
            <>
              <div className="text-gray-500 dark:text-gray-400 text-sm">{aiLessons.length} AI-generated lesson{aiLessons.length !== 1 ? 's' : ''} saved in your database</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {aiLessons.map(l => (
                  <div key={l.slug} className="card hover:border-yellow-400 dark:hover:border-yellow-400/50 transition-all group space-y-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex gap-2 flex-wrap">
                        <LevelBadge level={l.level} />
                        <span className="text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Bot size={11} /> AI
                        </span>
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full capitalize">{l.category}</span>
                      </div>
                      <button onClick={() => setDeleteSlug(l.slug)}
                        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="text-gray-900 dark:text-white font-bold">{l.title}</div>
                    <div className="text-yellow-600 dark:text-yellow-400 text-sm">{l.titleDe}</div>
                    <div className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                      {new Date(l.createdAt).toLocaleDateString()}
                    </div>
                    {deleteSlug === l.slug && (
                      <div className="mt-2">
                        <ConfirmDelete
                          message="Delete this lesson and its exams?"
                          onConfirm={() => handleDelete(l.slug)}
                          onCancel={() => setDeleteSlug(null)}
                        />
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Link to={`/lesson/${l.slug}`} className="btn-primary text-xs flex-1 text-center flex items-center justify-center gap-1">
                        <BookMarked size={12} /> Study
                      </Link>
                      <Link to={`/exams?lesson=${l.slug}&level=${l.level}`} className="btn-secondary text-xs flex-1 text-center flex items-center justify-center gap-1">
                        <Brain size={12} /> Exam
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Upload Resources Tab */}
      {activeTab === 'resources' && (
        <div className="card space-y-4">
          <h2 className="text-gray-900 dark:text-white font-bold">Upload Learning Resource</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Attach files or URLs to any lesson for reference</p>

          <div>
            <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Attach to Lesson</label>
            <select className="input" value={uploadSlug} onChange={e => setUploadSlug(e.target.value)}>
              {allLessons.map(l => <option key={l.slug} value={l.slug}>{l.title} ({l.level})</option>)}
            </select>
          </div>

          <div>
            <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Resource Title *</label>
            <input className="input" placeholder="e.g. Grammar reference PDF" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} />
          </div>

          <div>
            <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">URL (optional)</label>
            <input className="input" placeholder="https://..." value={uploadUrl} onChange={e => setUploadUrl(e.target.value)} />
          </div>

          <div>
            <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">File (optional — .txt, .md)</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-yellow-400 transition-colors"
              onClick={() => fileRef.current?.click()}>
              {uploadFile
                ? <div className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1"><CheckCircle2 size={14} /> {uploadFile.name}</div>
                : <div className="text-gray-400 dark:text-gray-500">Click to upload or drag & drop</div>}
            </div>
            <input ref={fileRef} type="file" accept=".txt,.md" className="hidden" onChange={e => setUploadFile(e.target.files[0])} />
          </div>

          <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={handleUpload} disabled={uploading}>
            <Upload size={15} /> {uploading ? 'Uploading...' : 'Upload Resource'}
          </button>

          {uploadDone && (
            <div className="bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/20 rounded-xl p-3 text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
              <CheckCircle2 size={15} /> Resource uploaded successfully!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
