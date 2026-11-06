import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Paperclip, ExternalLink, FileText, Trash2, X, Loader2, Lock, Plus } from 'lucide-react';
import { getLessonResources, getResource, deleteResource } from '../api';
import { useAuth } from '../context/AuthContext';
import { useDialog } from './Dialog';
import { useToast } from './Toast';

const hostOf = (url) => { try { return new URL(url).hostname; } catch { return url; } };

// Links and text files attached to a lesson. Admins' resources are shared with everyone;
// a student's own resources are private (marked with a lock).
export default function LessonResources({ slug }) {
  const { user } = useAuth();
  const { confirm } = useDialog();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [reading, setReading] = useState(null); // { title, text } or { loading: true }

  const load = useCallback(() => {
    getLessonResources(slug).then(r => setItems(r.data)).catch(() => setItems([]));
  }, [slug]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!reading) return;
    const onKey = (e) => e.key === 'Escape' && setReading(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reading]);

  const open = async (r) => {
    setReading({ title: r.title, loading: true });
    try {
      const res = await getResource(r._id);
      setReading({ title: r.title, text: res.data.text });
    } catch {
      setReading(null);
      toast.error('Could not open this resource.');
    }
  };

  const remove = async (r) => {
    const ok = await confirm({ title: 'Delete this resource?', message: `“${r.title}” will be removed${r.shared ? ' for everyone' : ''}.`, confirmLabel: 'Delete' });
    if (!ok) return;
    try {
      await deleteResource(r._id);
      setItems(list => list.filter(x => x._id !== r._id));
      toast.success('Resource deleted.');
    } catch (e) { toast.error(e.response?.data?.error || 'Delete failed.'); }
  };

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Paperclip size={17} /> Resources</h3>
        <Link to={`/resources?add=${encodeURIComponent(slug)}`} className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 hover:underline flex items-center gap-1">
          <Plus size={13} /> Add
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No extra materials for this lesson yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {items.map(r => (
            <li key={r._id} className="flex items-center gap-3 py-2.5">
              {r.url ? <ExternalLink size={16} className="text-blue-500 flex-shrink-0" /> : <FileText size={16} className="text-gray-500 flex-shrink-0" />}
              <div className="min-w-0 flex-1">
                {r.url
                  ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-900 dark:text-white hover:underline truncate block">{r.title}</a>
                  : <button onClick={() => open(r)} className="text-sm font-medium text-gray-900 dark:text-white hover:underline truncate block text-left">{r.title}</button>}
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  {!r.shared && <><Lock size={11} /> Only you · </>}
                  {r.fileName || (r.url && hostOf(r.url))}
                </div>
              </div>
              {r.url && r.hasText && <button onClick={() => open(r)} className="text-xs text-gray-500 hover:underline">Read</button>}
              {(user?.role === 'admin' || r.createdBy?.id === String(user?.id)) && (
                <button onClick={() => remove(r)} aria-label={`Delete ${r.title}`} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
              )}
            </li>
          ))}
        </ul>
      )}

      {reading && (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4" onMouseDown={() => setReading(null)}>
          <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" />
          <div role="dialog" aria-modal="true" aria-label={reading.title} onMouseDown={e => e.stopPropagation()}
            className="relative w-full sm:max-w-2xl max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white truncate">{reading.title}</h3>
              <button onClick={() => setReading(null)} aria-label="Close" className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto px-5 py-4">
              {reading.loading
                ? <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 size={16} className="animate-spin" /> Loading…</div>
                : <pre className="whitespace-pre-wrap break-words font-sans text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{reading.text}</pre>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
