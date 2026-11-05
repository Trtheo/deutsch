import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Send, Search, Users, UserRound, Mail, CheckCircle2, AlertTriangle, XCircle, Inbox, Eye, Loader2 } from 'lucide-react';
import { adminBroadcast, adminGetBroadcasts } from '../../api';
import { useDialog } from '../Dialog';
import { useToast } from '../Toast';
import { timeAgo } from '../UserInfoModal';

const SUBJECT_MAX = 150;
const MESSAGE_MAX = 5000;
const EMPTY = { subject: '', message: '', audience: 'all', userIds: [], sendEmail: false };

// What to do about a failed email, based on the provider and the error
function emailHint({ provider, reasons = [] }) {
  const reason = reasons.join(' ');
  if (/BREVO_SMTP_LOGIN/.test(reason)) return 'Add BREVO_SMTP_LOGIN (Brevo → SMTP & API → SMTP → Login) on the API service.';
  if (/Brevo 401/.test(reason)) return 'Brevo rejected the key. Check BREVO_API_KEY on the API service: an API key starts with “xkeysib-”.';
  if (/Brevo 400.*sender|sender.*not valid/i.test(reason)) return 'The sender address isn’t verified in Brevo. Add EMAIL_FROM as a sender under Brevo → Senders.';
  if (/not set up|not configured/i.test(reason)) return 'Email isn’t set up on the server yet.';
  if (/timeout|ETIMEDOUT|ECONNREFUSED/i.test(reason)) {
    return provider === 'gmail' || provider === 'brevo-smtp'
      ? 'The server can’t reach the mail server; Render’s free plan blocks mail ports. Use a Brevo API key (BREVO_API_KEY = xkeysib-…), which sends over normal web traffic.'
      : 'The email service didn’t answer in time. Please try again.';
  }
  return 'Check the email settings on the API service.';
}

// Explains the email part of a broadcast result (or a history entry)
function EmailResult({ email }) {
  if (!email) return <span className="text-gray-400">In-app only</span>;
  const tone = email.failed === 0 ? 'text-green-600 dark:text-green-400' : email.sent === 0 ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400';
  return <span className={tone}>Email: {email.sent} sent{email.failed ? `, ${email.failed} failed` : ''}</span>;
}

export default function BroadcastPanel({ users }) {
  const { confirm } = useDialog();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [filter, setFilter] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const activeUsers = useMemo(() => users.filter(u => !u.deactivated), [users]);
  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? activeUsers.filter(u => [u.username, u.email, u.firstName, u.lastName].some(v => v?.toLowerCase().includes(q))) : activeUsers;
  }, [activeUsers, filter]);
  const recipientCount = form.audience === 'all' ? activeUsers.length : form.userIds.length;

  const loadHistory = useCallback(() => {
    adminGetBroadcasts().then(r => setHistory(r.data)).catch(() => setHistory([]));
  }, []);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const toggleUser = (id) => set('userIds', form.userIds.includes(id) ? form.userIds.filter(x => x !== id) : [...form.userIds, id]);
  const allShownSelected = shown.length > 0 && shown.every(u => form.userIds.includes(u._id));
  const toggleAllShown = () => set('userIds', allShownSelected
    ? form.userIds.filter(id => !shown.some(u => u._id === id))
    : [...new Set([...form.userIds, ...shown.map(u => u._id)])]);

  const send = async () => {
    if (!form.subject.trim() || !form.message.trim()) return toast.error('Please write a subject and a message.');
    if (!recipientCount) return toast.error('Choose at least one recipient.');
    const ok = await confirm({
      tone: 'info', confirmLabel: 'Send',
      title: `Send to ${recipientCount} user${recipientCount === 1 ? '' : 's'}?`,
      message: `“${form.subject.trim()}” will appear in their Messages${form.sendEmail ? ' and be sent by email' : ''}.`,
    });
    if (!ok) return;
    setSending(true);
    try {
      const res = await adminBroadcast({
        subject: form.subject, message: form.message, sendEmail: form.sendEmail,
        userIds: form.audience === 'all' ? [] : form.userIds,
      });
      setResult(res.data);
      loadHistory();
      const { email } = res.data;
      if (email && email.failed) toast.error(`Delivered in the app, but ${email.failed} email${email.failed === 1 ? '' : 's'} failed.`);
      else toast.success(`Message delivered to ${res.data.inApp} user${res.data.inApp === 1 ? '' : 's'}.`);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to send.');
    } finally { setSending(false); }
  };

  const reset = () => { setForm(EMPTY); setResult(null); setFilter(''); };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
      <div className="xl:col-span-3 space-y-5">
        {result ? (
          // ── Result ──
          <div className="card space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={32} className="text-green-500 flex-shrink-0" />
              <div>
                <div className="font-bold text-gray-900 dark:text-white text-lg">Message delivered</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{result.inApp} user{result.inApp === 1 ? '' : 's'} can read it in their Messages.</div>
              </div>
            </div>
            {result.email && (
              <div className={`rounded-xl border p-4 text-sm ${result.email.failed === 0
                ? 'border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/5'
                : result.email.sent === 0 ? 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5' : 'border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/5'}`}>
                <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                  {result.email.failed === 0 ? <Mail size={16} className="text-green-600" /> : result.email.sent === 0 ? <XCircle size={16} className="text-red-600" /> : <AlertTriangle size={16} className="text-orange-600" />}
                  Email: {result.email.sent} sent · {result.email.failed} failed
                  {result.email.provider && <span className="text-xs font-normal text-gray-500">via {result.email.provider}</span>}
                </div>
                {result.email.reasons?.length > 0 && (
                  <ul className="mt-2 space-y-1 text-gray-700 dark:text-gray-300">
                    {result.email.reasons.map(r => <li key={r} className="font-mono text-xs break-words">• {r}</li>)}
                  </ul>
                )}
                {result.email.sent === 0 && result.email.failed > 0 && (
                  <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                    {emailHint(result.email)} The message itself was still delivered in the app.
                  </p>
                )}
              </div>
            )}
            <button className="btn-secondary" onClick={reset}>Write another message</button>
          </div>
        ) : (
          <>
            {/* ── Recipients ── */}
            <div className="card space-y-3">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Recipients</h3>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Recipients">
                {[
                  { id: 'all', Icon: Users, label: 'All active users', sub: `${activeUsers.length} users` },
                  { id: 'selected', Icon: UserRound, label: 'Selected users', sub: `${form.userIds.length} selected` },
                ].map(o => (
                  <button key={o.id} type="button" role="radio" aria-checked={form.audience === o.id} onClick={() => set('audience', o.id)}
                    className={`text-left rounded-xl border-2 p-3 transition-colors ${form.audience === o.id
                      ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-400/5' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                    <div className="flex items-center gap-2 font-semibold text-sm text-gray-900 dark:text-white"><o.Icon size={16} /> {o.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{o.sub}</div>
                  </button>
                ))}
              </div>
              {form.audience === 'selected' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input className="input pl-9 py-2 text-sm" placeholder="Find users…" value={filter} onChange={e => setFilter(e.target.value)} aria-label="Find recipients" />
                    </div>
                    <button type="button" onClick={toggleAllShown} className="btn-secondary text-xs whitespace-nowrap">
                      {allShownSelected ? 'Unselect shown' : 'Select shown'}
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                    {shown.length === 0 && <p className="text-sm text-gray-400 p-3">No users match.</p>}
                    {shown.map(u => (
                      <label key={u._id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <input type="checkbox" checked={form.userIds.includes(u._id)} onChange={() => toggleUser(u._id)} className="accent-yellow-400 w-4 h-4" />
                        <span className="text-lg">{u.avatar || '🧑'}</span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-gray-900 dark:text-white truncate">{[u.firstName, u.lastName].filter(Boolean).join(' ') || u.username}</span>
                          <span className="block text-xs text-gray-400 truncate">{u.email}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">Deactivated users are not listed and never receive broadcasts.</p>
                </div>
              )}
            </div>

            {/* ── Compose ── */}
            <div className="card space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Message</h3>
              <div>
                <div className="flex justify-between mb-1.5">
                  <label htmlFor="bc-subject" className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">Subject</label>
                  <span className="text-xs text-gray-400">{form.subject.length}/{SUBJECT_MAX}</span>
                </div>
                <input id="bc-subject" className="input" maxLength={SUBJECT_MAX} placeholder="e.g. New B1 lessons are online!"
                  value={form.subject} onChange={e => set('subject', e.target.value)} />
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <label htmlFor="bc-message" className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">Message</label>
                  <span className="text-xs text-gray-400">{form.message.length}/{MESSAGE_MAX}</span>
                </div>
                <textarea id="bc-message" className="input resize-y" rows={7} maxLength={MESSAGE_MAX}
                  placeholder="Write your announcement…" value={form.message} onChange={e => set('message', e.target.value)} />
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-700 p-3 cursor-pointer">
                <input type="checkbox" className="accent-yellow-400 w-4 h-4 mt-0.5" checked={form.sendEmail} onChange={e => set('sendEmail', e.target.checked)} />
                <span>
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5"><Mail size={14} /> Also send by email</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">The message always appears in users’ Messages in the app. Email is extra.</span>
                </span>
              </label>
              <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={send} disabled={sending}>
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                {sending ? (form.sendEmail ? 'Sending emails…' : 'Sending…') : `Send to ${recipientCount} user${recipientCount === 1 ? '' : 's'}`}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── History ── */}
      <div className="xl:col-span-2">
        <div className="card p-0 overflow-hidden">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2"><Inbox size={15} /> Sent messages</h3>
          {history === null && <div className="flex items-center gap-2 text-sm text-gray-400 p-4"><Loader2 size={15} className="animate-spin" /> Loading…</div>}
          {history?.length === 0 && <p className="text-sm text-gray-400 p-4">Nothing sent yet.</p>}
          <ul className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[560px] overflow-y-auto">
            {history?.map(m => (
              <li key={m._id} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">{m.subject}</span>
                  <span className="text-[11px] text-gray-400 flex-shrink-0">{timeAgo(m.createdAt)}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{m.body}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs">
                  <span className="text-gray-500 dark:text-gray-400">{m.toAll ? 'All users' : 'Selected'} · {m.recipientCount}</span>
                  <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1"><Eye size={12} /> Read by {m.readCount}/{m.recipientCount}</span>
                  <EmailResult email={m.email} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
