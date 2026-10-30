import React, { useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

// Shared popup layout for showing a person's profile: gradient header, stat tiles, info rows, actions.
// Used for "My profile" (sidebar card) and for user details in the admin panel.

export const formatDate = (d, withTime = false) => d
  ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) })
  : '—';

export function timeAgo(d) {
  if (!d) return 'Never';
  const s = Math.round((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'Just now';
  const units = [[60, 'minute'], [24, 'hour'], [30, 'day'], [12, 'month'], [Infinity, 'year']];
  let v = s / 60;
  for (const [size, name] of units) {
    if (v < size) { const n = Math.floor(v); return `${n} ${name}${n === 1 ? '' : 's'} ago`; }
    v /= size;
  }
  return formatDate(d);
}

function Stat({ Icon, label, value, color }) {
  return (
    <div className="panel p-3">
      <div className={`flex items-center gap-1.5 text-xs font-medium ${color}`}><Icon size={13} /> {label}</div>
      <div className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{value}</div>
    </div>
  );
}

/**
 * user:        { username, firstName, lastName, avatar, level, role, deactivated, bio }
 * subtitle:    text after @username (e.g. "you")
 * stats:       [{ Icon, label, value, color }] or null while loading
 * statsError:  true if statistics couldn't be loaded
 * rows:        [{ Icon, label, value }] for the "Account" section
 * actions:     buttons for the footer
 */
export default function UserInfoModal({ user, subtitle, stats, statsError, rows, actions, onClose }) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username;

  useEffect(() => {
    // Esc closes this popup, unless a confirmation dialog is open on top of it
    const onKey = (e) => e.key === 'Escape' && !document.querySelector('[role="alertdialog"]') && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" />
      <div role="dialog" aria-modal="true" aria-label={`User details: ${user.username}`}
        onMouseDown={e => e.stopPropagation()}
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-600 to-emerald-500 text-white px-6 pt-6 pb-5 sm:rounded-t-2xl">
          <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 transition-colors">
            <X size={16} />
          </button>
          <div className="flex items-center gap-4">
            <span className="w-16 h-16 rounded-full bg-white/20 ring-2 ring-white/40 flex items-center justify-center text-4xl flex-shrink-0">{user.avatar || '🧑'}</span>
            <div className="min-w-0">
              <div className="text-xl font-bold truncate">{name}</div>
              <div className="text-white/80 text-sm truncate">@{user.username}{subtitle && ` · ${subtitle}`}</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-xs font-bold bg-white/25 rounded-full px-2 py-0.5">{user.level || 'A1'}</span>
                <span className="text-xs font-semibold bg-white/15 rounded-full px-2 py-0.5">{user.role === 'admin' ? 'Admin' : 'Student'}</span>
                <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${user.deactivated ? 'bg-red-500/80' : 'bg-white/15'}`}>
                  {user.deactivated ? 'Deactivated' : 'Active'}
                </span>
              </div>
            </div>
          </div>
          {user.bio && <p className="text-white/85 text-sm italic mt-3">“{user.bio}”</p>}
        </div>

        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Learning</h3>
            {!stats && !statsError && <div className="flex items-center gap-2 text-sm text-gray-400 py-4"><Loader2 size={16} className="animate-spin" /> Loading statistics…</div>}
            {statsError && <p className="text-sm text-red-500 py-2">Could not load the statistics.</p>}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {stats.map(st => <Stat key={st.label} {...st} />)}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Account</h3>
            <dl className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map(r => (
                <div key={r.label} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm"><r.Icon size={15} /> {r.label}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white text-right min-w-0 truncate">{r.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {actions && (
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-6 py-4 flex flex-wrap gap-2 justify-end">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
