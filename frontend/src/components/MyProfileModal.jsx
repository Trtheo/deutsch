import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, CalendarDays, Star, BookOpenCheck, ClipboardCheck, Clock, Flame, Trophy, BadgeCheck, MailWarning, UserCog, LogOut } from 'lucide-react';
import { getMe } from '../api';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import UserInfoModal, { formatDate, timeAgo } from './UserInfoModal';

// "My profile" popup from the sidebar card: the signed-in user's info and learning stats.
// Stats come from the progress already loaded in the app; the account details are fetched.
export default function MyProfileModal({ onClose }) {
  const { user, logout } = useAuth();
  const { progress, totalXP, streak } = useApp();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);

  useEffect(() => {
    let alive = true;
    getMe().then(r => alive && setAccount(r.data)).catch(() => {});
    return () => { alive = false; };
  }, []);

  const stats = useMemo(() => {
    const scores = progress.flatMap(p => p.examScores || [])
      .map(s => (s.total > 0 ? Math.round((s.score / s.total) * 100) : s.pct))
      .filter(v => typeof v === 'number');
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    return [
      { Icon: Star, label: 'Total XP', value: totalXP, color: 'text-yellow-600 dark:text-yellow-400' },
      { Icon: Flame, label: 'Day streak', value: streak, color: 'text-orange-600 dark:text-orange-400' },
      { Icon: BookOpenCheck, label: 'Lessons done', value: progress.filter(p => p.status === 'completed').length, color: 'text-green-600 dark:text-green-400' },
      { Icon: Clock, label: 'In progress', value: progress.filter(p => p.status === 'in_progress').length, color: 'text-blue-600 dark:text-blue-400' },
      { Icon: ClipboardCheck, label: 'Exams taken', value: scores.length, color: 'text-purple-600 dark:text-purple-400' },
      { Icon: Trophy, label: 'Avg / best score', value: avg == null ? '—' : `${avg}% / ${Math.max(...scores)}%`, color: 'text-orange-600 dark:text-orange-400' },
    ];
  }, [progress, totalXP, streak]);

  const lastActivity = progress.reduce((latest, p) => (p.lastActivity && (!latest || p.lastActivity > latest) ? p.lastActivity : latest), null);
  const u = { ...user, ...(account || {}) };

  const rows = [
    { Icon: Mail, label: 'Email', value: u.email },
    { Icon: u.emailVerified === false ? MailWarning : BadgeCheck, label: 'Email status',
      value: u.emailVerified === false
        ? <span className="text-orange-600 dark:text-orange-400">Not verified</span>
        : <span className="text-green-600 dark:text-green-400">Verified</span> },
    { Icon: CalendarDays, label: 'Member since', value: account ? formatDate(account.createdAt) : '…' },
    { Icon: Clock, label: 'Last active', value: timeAgo(lastActivity) },
  ];

  const actions = (
    <>
      <button onClick={logout} className="mr-auto text-sm font-semibold px-3 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-1.5">
        <LogOut size={15} /> Log out
      </button>
      <button onClick={() => { onClose(); navigate('/profile'); }}
        className="text-sm font-semibold px-4 py-2 rounded-xl text-white bg-gradient-to-br from-blue-600 to-emerald-500 hover:brightness-110 flex items-center gap-1.5">
        <UserCog size={15} /> Edit profile
      </button>
    </>
  );

  return <UserInfoModal user={u} subtitle="you" stats={stats} rows={rows} actions={actions} onClose={onClose} />;
}
