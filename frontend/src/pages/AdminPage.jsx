import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminGetUsers, adminUpdateRole, adminDeleteUser, adminGetContacts, adminMarkRead, adminDeleteContact, adminBroadcast, adminGetAnalytics } from '../api';
import { Trash2, ShieldCheck, ShieldOff, AlertCircle, MessageSquare, Users, Mail, MailOpen, Send, CheckCircle2, BarChart2, TrendingUp, BookOpen, MessageCircle, Star, ClipboardList } from 'lucide-react';
import { useDialog } from '../components/Dialog';

const TYPE_COLORS = {
  Support:     'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400',
  Feedback:    'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400',
  'Bug Report':'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400',
  Other:       'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
};

export default function AdminPage() {
  const { user } = useAuth();
  const { confirm } = useDialog();
  const [tab, setTab] = useState('users');

  // Users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');

  // Contacts
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  // Analytics
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Broadcast
  const [bcast, setBcast] = useState({ subject: '', message: '', userIds: [] });
  const [bcastStatus, setBcastStatus] = useState(''); // '' | 'sending' | 'done' | 'error'
  const [bcastResult, setBcastResult] = useState(null);
  const [bcastError, setBcastError] = useState('');

  useEffect(() => {
    adminGetUsers()
      .then(r => setUsers(r.data))
      .catch(e => setUsersError(e.response?.data?.error || 'Failed to load users'))
      .finally(() => setUsersLoading(false));
    adminGetContacts()
      .then(r => setContacts(r.data))
      .catch(() => {})
      .finally(() => setContactsLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'analytics' && !analytics) {
      setAnalyticsLoading(true);
      adminGetAnalytics()
        .then(r => setAnalytics(r.data))
        .catch(() => {})
        .finally(() => setAnalyticsLoading(false));
    }
  }, [tab, analytics]);

  const toggleRole = async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    try {
      const res = await adminUpdateRole(u._id, newRole);
      setUsers(prev => prev.map(x => x._id === u._id ? res.data : x));
    } catch (e) { setUsersError(e.response?.data?.error || 'Failed to update role'); }
  };

  const deleteUser = async (u) => {
    const ok = await confirm({
      title: 'Delete this user?',
      message: `The account of ${u.username} (${u.email}) will be permanently deleted. This can’t be undone.`,
      confirmLabel: 'Delete user',
    });
    if (!ok) return;
    try {
      await adminDeleteUser(u._id);
      setUsers(prev => prev.filter(x => x._id !== u._id));
    } catch (e) { setUsersError(e.response?.data?.error || 'Failed to delete user'); }
  };

  const handleExpand = async (c) => {
    setExpanded(expanded === c._id ? null : c._id);
    if (!c.read) {
      try {
        await adminMarkRead(c._id);
        setContacts(prev => prev.map(x => x._id === c._id ? { ...x, read: true } : x));
      } catch {}
    }
  };

  const handleDeleteContact = async (c) => {
    const ok = await confirm({
      title: 'Delete this message?',
      message: `The message from ${c.name} will be permanently deleted. This can’t be undone.`,
      confirmLabel: 'Delete message',
    });
    if (!ok) return;
    try {
      await adminDeleteContact(c._id);
      setContacts(prev => prev.filter(x => x._id !== c._id));
      if (expanded === c._id) setExpanded(null);
    } catch {}
  };

  const handleBroadcast = async () => {
    if (!bcast.subject || !bcast.message) return setBcastError('Subject and message are required.');
    setBcastStatus('sending'); setBcastError('');
    try {
      const res = await adminBroadcast(bcast);
      setBcastResult(res.data);
      setBcastStatus('done');
    } catch (e) {
      setBcastError(e.response?.data?.error || 'Failed to send.');
      setBcastStatus('error');
    }
  };

  const toggleUserSelect = (id) => {
    setBcast(b => ({
      ...b,
      userIds: b.userIds.includes(id) ? b.userIds.filter(x => x !== id) : [...b.userIds, id]
    }));
  };

  const unread = contacts.filter(c => !c.read).length;

  if (user?.role !== 'admin') return (
    <div className="flex items-center gap-2 text-red-500 p-6">
      <AlertCircle size={18} /> Access denied — admins only.
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage users and view messages</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === 'users' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}>
          <Users size={15} /> Users <span className="bg-white/40 dark:bg-black/20 px-1.5 rounded-full text-xs">{users.length}</span>
        </button>
        <button onClick={() => setTab('inbox')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === 'inbox' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}>
          <MessageSquare size={15} /> Inbox
          {unread > 0 && (
            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full leading-none">{unread}</span>
          )}
        </button>
        <button onClick={() => setTab('broadcast')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === 'broadcast' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}>
          <Send size={15} /> Broadcast
        </button>
        <button onClick={() => setTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === 'analytics' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}>
          <BarChart2 size={15} /> Analytics
        </button>
      </div>

      {/* ── Users Tab ── */}
      {tab === 'users' && (
        <>
          {usersError && (
            <div className="flex items-center gap-2 text-sm bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl px-3 py-2">
              <AlertCircle size={15} /> {usersError}
            </div>
          )}
          {usersLoading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : (
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Level</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{u.avatar || '🧑'}</span>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{u.username}</div>
                            {(u.firstName || u.lastName) && (
                              <div className="text-xs text-gray-400">{u.firstName} {u.lastName}</div>
                            )}
                          </div>
                          {u._id === user.id && <span className="text-xs text-yellow-600 dark:text-yellow-400">(you)</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="bg-yellow-100 dark:bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full">{u.level}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          u.role === 'admin'
                            ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 dark:text-gray-600 text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {u._id !== user.id && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleRole(u)} title={u.role === 'admin' ? 'Revoke admin' : 'Make admin'}
                              className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-500/10 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                              {u.role === 'admin' ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                            </button>
                            <button onClick={() => deleteUser(u)} title="Delete user"
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Inbox Tab ── */}
      {tab === 'inbox' && (
        <div className="space-y-3">
          {contactsLoading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : contacts.length === 0 ? (
            <div className="card text-center py-12 text-gray-400 dark:text-gray-600">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
              <p>No messages yet</p>
            </div>
          ) : contacts.map(c => (
            <div key={c._id} className={`card p-0 overflow-hidden transition-all ${!c.read ? 'border-yellow-300 dark:border-yellow-400/30' : ''}`}>
              {/* Header row */}
              <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                onClick={() => handleExpand(c)}>
                <div className="flex-shrink-0">
                  {c.read ? <MailOpen size={16} className="text-gray-400" /> : <Mail size={16} className="text-yellow-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-sm ${!c.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      {c.name}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[c.type] || TYPE_COLORS.Other}`}>
                      {c.type}
                    </span>
                    {!c.read && <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{c.email} · {new Date(c.createdAt).toLocaleString()}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); handleDeleteContact(c); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </button>
              {/* Expanded message */}
              {expanded === c._id && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-gray-700 dark:text-gray-300 text-sm mt-3 whitespace-pre-wrap">{c.message}</p>
                  <a href={`mailto:${c.email}?subject=Re: ${c.type}`}
                    className="inline-flex items-center gap-1.5 mt-3 text-xs text-yellow-600 dark:text-yellow-400 hover:underline font-semibold">
                    <Mail size={12} /> Reply to {c.email}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* ── Analytics Tab ── */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          {analyticsLoading || !analytics ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users',       value: analytics.totalUsers,       icon: <Users size={18} />,       color: 'text-blue-500' },
                  { label: 'New This Week',      value: analytics.newUsersThisWeek, icon: <TrendingUp size={18} />,  color: 'text-green-500' },
                  { label: 'Lessons',            value: analytics.totalLessons,     icon: <BookOpen size={18} />,    color: 'text-yellow-500' },
                  { label: 'Exams',              value: analytics.totalExams,       icon: <ClipboardList size={18} />, color: 'text-purple-500' },
                  { label: 'Completed Lessons',  value: analytics.completedLessons, icon: <CheckCircle2 size={18} />, color: 'text-emerald-500' },
                  { label: 'Total XP Earned',    value: analytics.totalXP,          icon: <Star size={18} />,        color: 'text-orange-500' },
                  { label: 'Comments',           value: analytics.totalComments,    icon: <MessageCircle size={18} />, color: 'text-pink-500' },
                  { label: 'Contact Messages',   value: analytics.totalContacts,    icon: <Mail size={18} />,        color: 'text-indigo-500' },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} className="card flex items-center gap-3 p-4">
                    <div className={`${color} flex-shrink-0`}>{icon}</div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</div>
                      <div className="text-xs text-gray-400">{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Signups Last 7 Days */}
              <div className="card">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
                  <TrendingUp size={15} className="text-green-500" /> Signups — Last 7 Days
                </h3>
                {analytics.signupsByDay?.length === 0 ? (
                  <p className="text-gray-400 text-sm">No signups this week.</p>
                ) : (
                  <div className="space-y-2">
                    {analytics.signupsByDay.map(d => (
                      <div key={d._id} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-24 flex-shrink-0">{d._id}</span>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-green-400 h-4 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (d.count / Math.max(...analytics.signupsByDay.map(x => x.count))) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-6 text-right">{d.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Top Lessons */}
                <div className="card">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
                    <BookOpen size={15} className="text-yellow-500" /> Top Completed Lessons
                  </h3>
                  {analytics.topLessons?.length === 0 ? (
                    <p className="text-gray-400 text-sm">No completions yet.</p>
                  ) : (
                    <ol className="space-y-2">
                      {analytics.topLessons.map((l, i) => (
                        <li key={l._id} className="flex items-center gap-3 text-sm">
                          <span className="text-xs font-bold text-gray-400 w-4">{i + 1}.</span>
                          <span className="flex-1 text-gray-700 dark:text-gray-300 truncate">{l._id}</span>
                          <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">{l.count}×</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                {/* Recent Comments */}
                <div className="card">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
                    <MessageCircle size={15} className="text-pink-500" /> Recent Comments
                  </h3>
                  {analytics.recentComments?.length === 0 ? (
                    <p className="text-gray-400 text-sm">No comments yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {analytics.recentComments.map(c => (
                        <li key={c._id} className="flex items-start gap-2">
                          <span className="text-lg flex-shrink-0">{c.avatar}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">{c.username} <span className="font-normal text-gray-400">on {c.lessonSlug}</span></div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.text}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Broadcast Tab ── */}
      {tab === 'broadcast' && (
        <div className="space-y-5 max-w-2xl">
          {bcastStatus === 'done' ? (
            <div className="card text-center py-10 space-y-3">
              <CheckCircle2 size={40} className="mx-auto text-green-500" />
              <p className="text-gray-900 dark:text-white font-bold text-lg">Broadcast Sent!</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                ✅ {bcastResult?.sent} sent &nbsp;·&nbsp;
                {bcastResult?.failed > 0 && <span className="text-red-500">❌ {bcastResult.failed} failed &nbsp;·&nbsp;</span>}
                {bcastResult?.total} total recipients
              </p>
              <button className="btn-secondary mt-2" onClick={() => { setBcastStatus(''); setBcast({ subject: '', message: '', userIds: [] }); setBcastResult(null); }}>
                Send Another
              </button>
            </div>
          ) : (
            <>
              {/* Recipients */}
              <div className="card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Recipients</h3>
                  <span className="text-xs text-gray-400">
                    {bcast.userIds.length === 0 ? 'All users' : `${bcast.userIds.length} selected`}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {users.map(u => (
                    <label key={u._id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                      <input type="checkbox"
                        checked={bcast.userIds.includes(u._id)}
                        onChange={() => toggleUserSelect(u._id)}
                        className="accent-yellow-400 w-4 h-4" />
                      <span className="text-lg">{u.avatar || '🧑'}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.username}</div>
                        <div className="text-xs text-gray-400 truncate">{u.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Leave all unchecked to send to <strong>all users</strong>.
                </p>
              </div>

              {/* Compose */}
              <div className="card space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Compose Message</h3>
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Subject</label>
                  <input className="input" placeholder="e.g. New lessons available!" value={bcast.subject}
                    onChange={e => setBcast(b => ({ ...b, subject: e.target.value }))} />
                </div>
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Message</label>
                  <textarea className="input resize-none" rows={6}
                    placeholder="Write your message here..."
                    value={bcast.message}
                    onChange={e => setBcast(b => ({ ...b, message: e.target.value }))} />
                </div>
                {bcastError && (
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-3 py-2">
                    <span className="text-red-500">✕</span>
                    <p className="text-red-600 dark:text-red-400 text-sm">{bcastError}</p>
                  </div>
                )}
                <button className="btn-primary w-full flex items-center justify-center gap-2"
                  onClick={handleBroadcast} disabled={bcastStatus === 'sending'}>
                  <Send size={15} />
                  {bcastStatus === 'sending'
                    ? 'Sending...'
                    : `Send to ${bcast.userIds.length === 0 ? 'All Users' : `${bcast.userIds.length} User${bcast.userIds.length > 1 ? 's' : ''}`}`}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
