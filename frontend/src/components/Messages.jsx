import React, { useCallback, useEffect, useState } from 'react';
import { Inbox, X, CheckCheck, Megaphone } from 'lucide-react';
import { getMessages, markMessageRead, markAllMessagesRead } from '../api';
import { timeAgo } from './UserInfoModal';

// In-app messages that admins broadcast. Loaded on start, every minute and when the tab regains focus.
const POLL_MS = 60000;

export function useMessages() {
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(() => {
    getMessages().then(r => { setMessages(r.data.messages); setUnread(r.data.unread); }).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    window.addEventListener('focus', load);
    return () => { clearInterval(timer); window.removeEventListener('focus', load); };
  }, [load]);

  const markRead = useCallback((id) => {
    setMessages(list => list.map(m => (m._id === id ? { ...m, read: true } : m)));
    setUnread(n => Math.max(0, n - 1));
    markMessageRead(id).catch(load);
  }, [load]);

  const markAllRead = useCallback(() => {
    setMessages(list => list.map(m => ({ ...m, read: true })));
    setUnread(0);
    markAllMessagesRead().catch(load);
  }, [load]);

  return { messages, unread, markRead, markAllRead, reload: load };
}

export function MessagesButton({ unread, onClick, className = '' }) {
  return (
    <button type="button" onClick={onClick} title="Messages"
      aria-label={unread ? `Messages, ${unread} unread` : 'Messages'}
      className={`relative w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors ${className}`}>
      <Inbox size={16} />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}

export function MessagesPanel({ messages, unread, onClose, onRead, onReadAll }) {
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggle = (m) => {
    setOpenId(id => (id === m._id ? null : m._id));
    if (!m.read) onRead(m._id);
  };

  return (
    <div className="fixed inset-0 z-[80]" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-gray-950/40" />
      <aside role="dialog" aria-modal="true" aria-label="Messages" onMouseDown={e => e.stopPropagation()}
        className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col">
        <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Inbox size={18} /> Messages</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{unread ? `${unread} unread` : 'You’re all caught up'}</p>
          </div>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <button onClick={onReadAll} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center gap-1">
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
            <button onClick={onClose} aria-label="Close messages" className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={16} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center px-6 py-16">
              <Megaphone size={36} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
              <div className="font-semibold text-gray-900 dark:text-white">No messages yet</div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Announcements from your teachers will appear here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {messages.map(m => {
                const open = openId === m._id;
                return (
                  <li key={m._id}>
                    <button onClick={() => toggle(m)} aria-expanded={open}
                      className={`w-full text-left px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40 ${m.read ? '' : 'bg-blue-50/60 dark:bg-blue-500/5'}`}>
                      <div className="flex items-start gap-3">
                        <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${m.read ? 'bg-transparent' : 'bg-blue-500'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className={`truncate text-sm ${m.read ? 'font-medium text-gray-700 dark:text-gray-300' : 'font-bold text-gray-900 dark:text-white'}`}>{m.subject}</span>
                            <span className="text-[11px] text-gray-400 flex-shrink-0">{timeAgo(m.createdAt)}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">From {m.from}</div>
                          <p className={`text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap break-words ${open ? '' : 'line-clamp-2'}`}>{m.body}</p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
