import React, { useEffect, useState } from 'react';
import {
  X, Mail, CalendarDays, Star, BookOpenCheck, ClipboardCheck, Clock, BadgeCheck, MailWarning,
  MessageSquare, Trophy, UserX, UserCheck, ShieldCheck, ShieldOff, Trash2, Loader2, Ban,
} from 'lucide-react';
import { adminGetUser } from '../../api';

const formatDate = (d, withTime = false) => d
  ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) })
  : '—';

function timeAgo(d) {
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

function Row({ Icon, label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm"><Icon size={15} /> {label}</dt>
      <dd className="text-sm font-medium text-gray-900 dark:text-white text-right min-w-0 truncate">{children}</dd>
    </div>
  );
}

// Full information about one user, with the admin actions. `user` is the row from the table
// (shown immediately); details and learning stats are loaded on open.
export default function UserDetailsModal({ user, isSelf, onClose, onToggleStatus, onToggleRole, onDelete }) {
  const [details, setDetails] = useState(null);
  const [failed, setFailed] = useState(false);
  // The row (updated after every action) wins; details add the statistics
  const u = { ...(details || {}), ...user };
  const s = details?.stats;
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username;

  useEffect(() => {
    let alive = true;
    adminGetUser(user._id).then(r => alive && setDetails(r.data)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [user._id, user.deactivated, user.role]);

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
      <div role="dialog" aria-modal="true" aria-label={`User details: ${u.username}`}
        onMouseDown={e => e.stopPropagation()}
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-600 to-emerald-500 text-white px-6 pt-6 pb-5 sm:rounded-t-2xl">
          <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 transition-colors">
            <X size={16} />
          </button>
          <div className="flex items-center gap-4">
            <span className="w-16 h-16 rounded-full bg-white/20 ring-2 ring-white/40 flex items-center justify-center text-4xl flex-shrink-0">{u.avatar || '🧑'}</span>
            <div className="min-w-0">
              <div className="text-xl font-bold truncate">{name}</div>
              <div className="text-white/80 text-sm truncate">@{u.username}{isSelf && ' · you'}</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-xs font-bold bg-white/25 rounded-full px-2 py-0.5">{u.level || 'A1'}</span>
                <span className="text-xs font-semibold bg-white/15 rounded-full px-2 py-0.5">{u.role === 'admin' ? 'Admin' : 'Student'}</span>
                <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${u.deactivated ? 'bg-red-500/80' : 'bg-white/15'}`}>
                  {u.deactivated ? 'Deactivated' : 'Active'}
                </span>
              </div>
            </div>
          </div>
          {u.bio && <p className="text-white/85 text-sm italic mt-3">“{u.bio}”</p>}
        </div>

        <div className="p-6 space-y-6">
          {/* Learning */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Learning</h3>
            {!s && !failed && <div className="flex items-center gap-2 text-sm text-gray-400 py-4"><Loader2 size={16} className="animate-spin" /> Loading statistics…</div>}
            {failed && <p className="text-sm text-red-500 py-2">Could not load the statistics.</p>}
            {s && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Stat Icon={Star} label="Total XP" value={s.xp} color="text-yellow-600 dark:text-yellow-400" />
                <Stat Icon={BookOpenCheck} label="Lessons done" value={s.lessonsCompleted} color="text-green-600 dark:text-green-400" />
                <Stat Icon={Clock} label="In progress" value={s.lessonsInProgress} color="text-blue-600 dark:text-blue-400" />
                <Stat Icon={ClipboardCheck} label="Exams taken" value={s.examsTaken} color="text-purple-600 dark:text-purple-400" />
                <Stat Icon={Trophy} label="Avg / best score" value={s.averageScore == null ? '—' : `${s.averageScore}% / ${s.bestScore}%`} color="text-orange-600 dark:text-orange-400" />
                <Stat Icon={MessageSquare} label="Comments" value={s.comments} color="text-gray-500" />
              </div>
            )}
          </section>

          {/* Account */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Account</h3>
            <dl className="divide-y divide-gray-100 dark:divide-gray-800">
              <Row Icon={Mail} label="Email"><a href={`mailto:${u.email}`} className="hover:underline">{u.email}</a></Row>
              <Row Icon={u.emailVerified === false ? MailWarning : BadgeCheck} label="Email verified">
                {u.emailVerified === false
                  ? <span className="text-orange-600 dark:text-orange-400">Not yet</span>
                  : <span className="text-green-600 dark:text-green-400">Verified</span>}
              </Row>
              <Row Icon={CalendarDays} label="Joined">{formatDate(u.createdAt)}</Row>
              <Row Icon={Clock} label="Last active">{s ? timeAgo(s.lastActivity) : '…'}</Row>
              {u.deactivated && <Row Icon={Ban} label="Deactivated on">{formatDate(u.deactivatedAt, true)}</Row>}
            </dl>
          </section>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-6 py-4 flex flex-wrap gap-2 justify-end">
          {isSelf ? (
            <p className="text-xs text-gray-400 mr-auto self-center">This is your own account. Manage it from your profile.</p>
          ) : (
            <>
              <button onClick={() => onDelete(u)} className="mr-auto text-sm font-semibold px-3 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-1.5">
                <Trash2 size={15} /> Delete
              </button>
              <button onClick={() => onToggleRole(u)} className="text-sm font-semibold px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/20 flex items-center gap-1.5">
                {u.role === 'admin' ? <><ShieldOff size={15} /> Revoke admin</> : <><ShieldCheck size={15} /> Make admin</>}
              </button>
              <button onClick={() => onToggleStatus(u)}
                className={`text-sm font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 ${u.deactivated
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'}`}>
                {u.deactivated ? <><UserCheck size={15} /> Activate</> : <><UserX size={15} /> Deactivate</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
