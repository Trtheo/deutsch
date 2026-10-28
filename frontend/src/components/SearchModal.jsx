import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import LESSONS from '../lessons';
import { LevelBadge } from './UI';

export default function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const results = q.length < 1 ? LESSONS : LESSONS.filter(l =>
    l.title.toLowerCase().includes(q) ||
    l.titleDe.toLowerCase().includes(q) ||
    l.sub.toLowerCase().includes(q) ||
    l.level.toLowerCase().includes(q) ||
    l.slug.toLowerCase().includes(q)
  );

  const go = (slug) => { navigate(`/lesson/${slug}`); onClose(); };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-base"
            placeholder="Search lessons..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-gray-600 text-sm">
              No lessons found for "{query}"
            </div>
          ) : (
            results.map(l => (
              <button key={l.slug} onClick={() => go(l.slug)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                <l.Icon size={20} className="text-yellow-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-gray-900 dark:text-white font-semibold text-sm">{l.title}</div>
                  <div className="text-yellow-600 dark:text-yellow-400 text-xs">{l.titleDe} · {l.sub}</div>
                </div>
                <LevelBadge level={l.level} />
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="text-xs text-gray-400">{results.length} lesson{results.length !== 1 ? 's' : ''}</span>
          <span className="text-xs text-gray-400">Press <kbd className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
