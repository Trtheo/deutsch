import React, { useEffect, useState } from 'react';
import {
  Mail, CalendarDays, Star, BookOpenCheck, ClipboardCheck, Clock, BadgeCheck, MailWarning,
  MessageSquare, Trophy, UserX, UserCheck, ShieldCheck, ShieldOff, Trash2, Ban,
} from 'lucide-react';
import { adminGetUser } from '../../api';
import UserInfoModal, { formatDate, timeAgo } from '../UserInfoModal';

// Admin view of any user: profile, learning statistics and admin actions.
// `user` is the table row (updated after every action); details and stats are loaded on open.
export default function UserDetailsModal({ user, isSelf, onClose, onToggleStatus, onToggleRole, onDelete }) {
  const [details, setDetails] = useState(null);
  const [failed, setFailed] = useState(false);
  const u = { ...(details || {}), ...user }; // the row wins; details add the statistics
  const s = details?.stats;

  useEffect(() => {
    let alive = true;
    adminGetUser(user._id).then(r => alive && setDetails(r.data)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [user._id, user.deactivated, user.role]);

  const stats = s && [
    { Icon: Star, label: 'Total XP', value: s.xp, color: 'text-yellow-600 dark:text-yellow-400' },
    { Icon: BookOpenCheck, label: 'Lessons done', value: s.lessonsCompleted, color: 'text-green-600 dark:text-green-400' },
    { Icon: Clock, label: 'In progress', value: s.lessonsInProgress, color: 'text-blue-600 dark:text-blue-400' },
    { Icon: ClipboardCheck, label: 'Exams taken', value: s.examsTaken, color: 'text-purple-600 dark:text-purple-400' },
    { Icon: Trophy, label: 'Avg / best score', value: s.averageScore == null ? '—' : `${s.averageScore}% / ${s.bestScore}%`, color: 'text-orange-600 dark:text-orange-400' },
    { Icon: MessageSquare, label: 'Comments', value: s.comments, color: 'text-gray-500' },
  ];

  const rows = [
    { Icon: Mail, label: 'Email', value: <a href={`mailto:${u.email}`} className="hover:underline">{u.email}</a> },
    { Icon: u.emailVerified === false ? MailWarning : BadgeCheck, label: 'Email verified',
      value: u.emailVerified === false
        ? <span className="text-orange-600 dark:text-orange-400">Not yet</span>
        : <span className="text-green-600 dark:text-green-400">Verified</span> },
    { Icon: CalendarDays, label: 'Joined', value: formatDate(u.createdAt) },
    { Icon: Clock, label: 'Last active', value: s ? timeAgo(s.lastActivity) : '…' },
    ...(u.deactivated ? [{ Icon: Ban, label: 'Deactivated on', value: formatDate(u.deactivatedAt, true) }] : []),
  ];

  const actions = isSelf ? (
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
        className={`text-sm font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 text-white ${u.deactivated ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
        {u.deactivated ? <><UserCheck size={15} /> Activate</> : <><UserX size={15} /> Deactivate</>}
      </button>
    </>
  );

  return (
    <UserInfoModal user={u} subtitle={isSelf ? 'you' : ''} stats={stats} statsError={failed}
      rows={rows} actions={actions} onClose={onClose} />
  );
}
