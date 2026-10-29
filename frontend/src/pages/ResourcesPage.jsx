import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { searchLessons, getAILessons, deleteLesson, uploadResource, getLessons } from '../api';
import { LevelBadge, ConfirmDelete } from '../components/UI';
import { Search, BookOpen, Paperclip, Trash2, CheckCircle2, Upload, BookMarked, Brain, Loader2, SearchX } from 'lucide-react';

// Quick suggestions: everyday situations learners search for most
const SUGGESTIONS = ['doctor', 'Apotheke', 'train', 'shopping', 'Wohnung', 'job interview', 'Perfekt', 'weather', 'bank', 'restaurant'];

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState('search');
  const [error, setError] = useState('');

  // Topic search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null); // null = not searched yet
  const [searching, setSearching] = useState(false);

  // Lessons saved earlier by users (no new ones are generated)
  const [savedLessons, setSavedLessons] = useState([]);
  const [allLessons, setAllLessons] = useState([]);
  const [deleteSlug, setDeleteSlug] = useState(null);

  // Upload
  const [uploadSlug, setUploadSlug] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    Promise.all([getAILessons(), getLessons()]).then(([saved, all]) => {
      setSavedLessons(saved.data);
      setAllLessons(all.data);
      if (all.data.length > 0) setUploadSlug(all.data[0].slug);
    }).catch(() => {});
  }, []);

  const runSearch = async (q = query) => {
    const term = q.trim();
    if (term.length < 2) return setError('Type at least 2 letters.');
    setQuery(term); setSearching(true); setError('');
    try {
      const res = await searchLessons(term);
      setResults(res.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Search failed. Please try again.');
    } finally { setSearching(false); }
  };

  const handleDelete = async (slug) => {
    try {
      await deleteLesson(slug);
      setSavedLessons(prev => prev.filter(l => l.slug !== slug));
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

  const tabs = [
    { id: 'search', Icon: Search, label: 'Find a topic' },
    ...(savedLessons.length ? [{ id: 'saved', Icon: BookOpen, label: `Saved lessons (${savedLessons.length})` }] : []),
    { id: 'resources', Icon: Paperclip, label: 'Add resource' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resources</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Find the lessons for any situation, in English or German, and attach your own learning materials.
        </p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setError(''); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5
              ${activeTab === t.id
                ? 'border-yellow-400 text-yellow-600 dark:text-yellow-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <t.Icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Find a topic */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <div className="flex gap-2">
              <input className="input flex-1" placeholder='e.g. "doctor", "Apotheke", "train ticket", "Perfekt"'
                value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runSearch()}
                aria-label="Search topic" />
              <button className="btn-primary flex items-center gap-2" onClick={() => runSearch()} disabled={searching}>
                {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Search
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => runSearch(s)}
                  className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-yellow-500/10 hover:text-yellow-700 dark:hover:text-yellow-400 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>

          {results && results.length === 0 && (
            <div className="card text-center py-10">
              <SearchX size={36} className="text-gray-400 mx-auto mb-2" />
              <div className="text-gray-900 dark:text-white font-semibold">No lessons found for “{query}”</div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Try a shorter word, or the German word for it.</p>
            </div>
          )}

          {results && results.length > 0 && (
            <div className="space-y-3">
              <div className="text-gray-500 dark:text-gray-400 text-sm">{results.length} lesson{results.length !== 1 ? 's' : ''} for “{query}”</div>
              {results.map(r => (
                <div key={r.slug} className="card hover:border-yellow-400 dark:hover:border-yellow-400/50 transition-all">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <LevelBadge level={r.level} />
                        <span className="text-xs text-gray-400 capitalize">{r.category}</span>
                      </div>
                      <div className="text-gray-900 dark:text-white font-bold">{r.title}</div>
                      <div className="text-yellow-600 dark:text-yellow-400 text-sm">{r.titleDe}</div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/lesson/${r.slug}`} className="btn-primary text-xs flex items-center gap-1"><BookMarked size={12} /> Study</Link>
                      <Link to={`/exams?lesson=${r.slug}&level=${r.level}`} className="btn-secondary text-xs flex items-center gap-1"><Brain size={12} /> Exam</Link>
                    </div>
                  </div>
                  {r.matches.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.matches.map((m, i) => (
                        <span key={i} className="text-xs panel px-2.5 py-1">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{m.de}</span>
                          <span className="text-gray-500"> · {m.en}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Saved lessons (made earlier; kept so nobody loses their work) */}
      {activeTab === 'saved' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {savedLessons.map(l => (
            <div key={l.slug} className="card hover:border-yellow-400 dark:hover:border-yellow-400/50 transition-all">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex gap-2 flex-wrap">
                  <LevelBadge level={l.level} />
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full capitalize">{l.category}</span>
                </div>
                <button onClick={() => setDeleteSlug(l.slug)} className="text-gray-400 hover:text-red-500 transition-colors" aria-label="Delete lesson">
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="text-gray-900 dark:text-white font-bold">{l.title}</div>
              <div className="text-yellow-600 dark:text-yellow-400 text-sm">{l.titleDe}</div>
              <div className="text-gray-400 dark:text-gray-500 text-xs mt-1">{new Date(l.createdAt).toLocaleDateString()}</div>
              {deleteSlug === l.slug && (
                <div className="mt-2">
                  <ConfirmDelete message="Delete this lesson and its exams?" onConfirm={() => handleDelete(l.slug)} onCancel={() => setDeleteSlug(null)} />
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <Link to={`/lesson/${l.slug}`} className="btn-primary text-xs flex-1 text-center flex items-center justify-center gap-1"><BookMarked size={12} /> Study</Link>
                <Link to={`/exams?lesson=${l.slug}&level=${l.level}`} className="btn-secondary text-xs flex-1 text-center flex items-center justify-center gap-1"><Brain size={12} /> Exam</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add resource */}
      {activeTab === 'resources' && (
        <div className="card space-y-4">
          <h2 className="text-gray-900 dark:text-white font-bold">Attach a learning resource</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Attach a text file or a link to any lesson for reference.</p>

          <div>
            <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Attach to lesson</label>
            <select className="input" value={uploadSlug} onChange={e => setUploadSlug(e.target.value)}>
              {allLessons.map(l => <option key={l.slug} value={l.slug}>{l.title} ({l.level})</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Resource title *</label>
            <input className="input" placeholder="e.g. Grammar reference" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">URL (optional)</label>
            <input className="input" placeholder="https://..." value={uploadUrl} onChange={e => setUploadUrl(e.target.value)} />
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">File (optional — .txt, .md, max 1 MB)</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-yellow-400 transition-colors"
              onClick={() => fileRef.current?.click()}>
              {uploadFile
                ? <div className="text-green-600 dark:text-green-400 font-medium flex items-center justify-center gap-1"><CheckCircle2 size={14} /> {uploadFile.name}</div>
                : <div className="text-gray-400 dark:text-gray-500">Click to choose a file</div>}
            </div>
            <input ref={fileRef} type="file" accept=".txt,.md" className="hidden" onChange={e => setUploadFile(e.target.files[0])} />
          </div>
          <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={handleUpload} disabled={uploading}>
            <Upload size={15} /> {uploading ? 'Uploading...' : 'Upload resource'}
          </button>
          {uploadDone && (
            <div className="bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/20 rounded-xl p-3 text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
              <CheckCircle2 size={15} /> Resource uploaded!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
