import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { sendContact } from '../api';
import SearchModal from './SearchModal';
import {
  Home, BarChart2, Brain, FolderOpen, Type, BookOpen, Hash,
  FileText, Zap, BookMarked, PenLine, Headphones, Mic, Clock,
  Sun, Moon, Flame, Star, LogOut, BookOpenCheck, WifiOff, Layers, Bell, BellOff, ShieldCheck, MessageSquare, X, Search, Languages
} from 'lucide-react';
import { useToast } from './Toast';
import MyProfileModal from './MyProfileModal';
import { InstallSidebarButton } from './InstallPrompt';
import { useMessages, MessagesButton, MessagesPanel } from './Messages';
import { isSupported, requestPermission, scheduleDailyReminder, cancelDailyReminder, getNotifSettings } from '../notifications';

const bottomTabs = [
  { path: '/',            Icon: Home,      label: 'Home'       },
  { path: '/progress',   Icon: BarChart2,  label: 'Progress'   },
  { path: '/flashcards', Icon: Layers,     label: 'Flashcards' },
  { path: '/exams',      Icon: Brain,      label: 'Exams'      },
  { path: '/resources',  Icon: FolderOpen, label: 'Resources'  },
];

const navGroups = [
  {
    label: 'Main',
    items: [
      { path: '/', Icon: Home, label: 'Home' },
      { path: '/progress',   Icon: BarChart2,  label: 'Progress'   },
      { path: '/flashcards', Icon: Layers,     label: 'Flashcards' },
      { path: '/exams',      Icon: Brain,      label: 'Exams'      },
      { path: '/translate',  Icon: Languages,  label: 'Translator' },
      { path: '/resources',  Icon: FolderOpen, label: 'Resources'  },
    ],
  },
  {
    label: 'Lessons — A1',
    items: [
      { path: '/lesson/alphabet', Icon: Type, label: 'Alphabet' },
      { path: '/lesson/vocabulary-basics', Icon: BookOpen, label: 'Vocabulary' },
      { path: '/lesson/numbers', Icon: Hash, label: 'Numbers' },
      { path: '/lesson/grammar-articles', Icon: FileText, label: 'Grammar' },
      { path: '/lesson/verbs-present', Icon: Zap, label: 'Verbs' },
      { path: '/lesson/reading-a1', Icon: BookMarked, label: 'Reading' },
      { path: '/lesson/writing-a1', Icon: PenLine, label: 'Writing' },
      { path: '/lesson/listening-a1', Icon: Headphones, label: 'Listening' },
      { path: '/lesson/speaking-a1', Icon: Mic, label: 'Speaking' },
    ],
  },
  {
    label: 'Lessons — A2',
    items: [
      { path: '/lesson/tenses',        Icon: Clock,      label: 'Tenses' },
      { path: '/lesson/grammar-a2',    Icon: FileText,   label: 'Adjectives' },
      { path: '/lesson/vocabulary-a2', Icon: BookOpen,   label: 'Daily Life' },
      { path: '/lesson/verbs-a2',      Icon: Zap,        label: 'Modal Verbs' },
      { path: '/lesson/reading-a2',    Icon: BookMarked, label: 'Reading' },
      { path: '/lesson/writing-a2',    Icon: PenLine,    label: 'Writing' },
      { path: '/lesson/listening-a2',  Icon: Headphones, label: 'Listening' },
      { path: '/lesson/speaking-a2',   Icon: Mic,        label: 'Speaking' },
    ],
  },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const inbox = useMessages();
  const [searchOpen, setSearchOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', type: 'Support', message: '' });
  const [contactSending, setContactSending] = useState(false);
  const toast = useToast();
  const { pathname } = useLocation();
  const { totalXP, streak, darkMode, setDarkMode, isOnline } = useApp();
  const { user, logout } = useAuth();
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username;

  const openContact = () => {
    setContactForm({ name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || '', email: user?.email || '', type: 'Support', message: '' });
    setContactOpen(true);
  };

  const handleContact = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) return toast.error('Please fill in your name, email and message.');
    setContactSending(true);
    try {
      await sendContact(contactForm);
      setContactOpen(false);
      toast.success(`Message sent! We'll get back to you at ${contactForm.email}.`);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to send. Try again.');
    } finally { setContactSending(false); }
  };

  const [notifEnabled, setNotifEnabled] = useState(() => getNotifSettings()?.enabled || false);
  const [reminderTime, setReminderTime] = useState(() => getNotifSettings()?.reminderTime || '08:00');
  const [notifStatus, setNotifStatus] = useState('');

  // Ctrl+K / Cmd+K to open search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleToggleNotif = async () => {
    if (notifEnabled) {
      cancelDailyReminder();
      setNotifEnabled(false);
      return;
    }
    const perm = await requestPermission();
    if (perm === 'granted') {
      await scheduleDailyReminder(reminderTime);
      setNotifEnabled(true);
      setNotifStatus('granted');
    } else {
      setNotifStatus(perm);
    }
  };

  const handleTimeChange = async (t) => {
    setReminderTime(t);
    if (notifEnabled) await scheduleDailyReminder(t);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-y-auto [@media(min-height:720px)]:overflow-hidden">

      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={`${process.env.PUBLIC_URL}/logo.svg`} alt="" className="w-10 h-10" />
            <div>
              <div className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                Deutsch Lernen
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-xs">Learn German</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
          <MessagesButton unread={inbox.unread} onClick={() => { setSidebarOpen(false); setMessagesOpen(true); }} />
          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode(d => !d)}
            className="w-9 h-9 rounded-xl flex items-center justify-center
                       bg-gray-100 dark:bg-gray-800
                       hover:bg-gray-200 dark:hover:bg-gray-700
                       text-gray-600 dark:text-gray-300
                       transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-3 flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-medium bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-full">
            <Flame size={12} /> {streak} streak
          </span>
          <span className="flex items-center gap-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 px-2.5 py-1 rounded-full">
            <Star size={12} /> {totalXP} XP
          </span>
        </div>
      </div>

      {/* Scrollable nav */}
      <nav className="flex-none [@media(min-height:720px)]:flex-1 [@media(min-height:720px)]:overflow-y-auto px-3 py-3 space-y-4">
        {/* Search */}
        <button onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm">
          <Search size={15} />
          <span className="flex-1 text-left">Search lessons...</span>
          <kbd className="text-xs bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">⌘K</kbd>
        </button>
        <InstallSidebarButton onDone={() => setSidebarOpen(false)} />
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-600 px-3 mb-1">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ path, Icon, label }) => {
                const active = pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setSidebarOpen(false)}
                    className={`nav-link ${active ? 'nav-link-active' : 'nav-link-inactive'}`}
                  >
                    <Icon size={16} className="w-6 flex-shrink-0" />
                    <span className="truncate">{label}</span>
                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Admin link */}
        {user?.role === 'admin' && (
          <div className="px-3">
            <Link
              to="/admin"
              onClick={() => setSidebarOpen(false)}
              className={`nav-link ${pathname === '/admin' ? 'nav-link-active' : 'nav-link-inactive'}`}
            >
              <ShieldCheck size={16} className="w-6 flex-shrink-0 text-purple-500" />
              <span className="truncate font-semibold text-purple-600 dark:text-purple-400">Admin Panel</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Footer: profile card (with level progress) and a row of quick actions */}
      <div className="px-3 pt-3 pb-2 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 space-y-2">
        {/* Account card: opens the "My profile" popup */}
        <button type="button" onClick={() => { setSidebarOpen(false); setProfileOpen(true); }}
          aria-label="Open my profile"
          className={`w-full text-left rounded-2xl p-3 bg-gradient-to-br from-blue-600 to-emerald-500 text-white shadow-md
            hover:shadow-lg hover:brightness-110 transition-all ${pathname === '/profile' ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : ''}`}>
          <span className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-full bg-white/20 ring-2 ring-white/40 flex items-center justify-center text-xl flex-shrink-0">
              {user?.avatar || '🧑'}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold leading-tight line-clamp-2 break-words">{displayName}</span>
              <span className="block text-[11px] text-white/80 truncate mt-0.5">@{user?.username}</span>
            </span>
            <span className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-[10px] font-bold bg-white/25 rounded-full px-2 py-0.5">{user?.level || 'A1'}</span>
              <span className="text-[10px] font-semibold bg-white/15 rounded-full px-2 py-0.5">{user?.role === 'admin' ? 'Admin' : 'Student'}</span>
            </span>
          </span>
          {/* Level progress */}
          <span className="block mt-2.5">
            <span className="flex justify-between text-[10px] text-white/85 mb-1">
              <span>{totalXP >= 1000 ? 'Level complete 🎉' : `${1000 - totalXP} XP to next level`}</span>
              <span className="font-semibold">{totalXP}/1000</span>
            </span>
            <span className="block h-1.5 rounded-full bg-white/25 overflow-hidden">
              <span className="block h-full bg-yellow-300 rounded-full" style={{ width: `${Math.min(100, totalXP / 10)}%` }} />
            </span>
          </span>
        </button>

        {/* Quick actions */}
        <div className={`grid gap-1.5 ${isSupported() ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {isSupported() && (
            <button onClick={handleToggleNotif} aria-pressed={notifEnabled}
              title={notifEnabled ? 'Daily reminder is on' : 'Turn on a daily reminder'}
              className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-colors
                ${notifEnabled ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              {notifEnabled ? <Bell size={15} /> : <BellOff size={15} />} Reminder
            </button>
          )}
          <button onClick={openContact} title="Contact / Feedback"
            className="flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <MessageSquare size={15} /> Feedback
          </button>
          <button onClick={logout} title="Log out"
            className="flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors">
            <LogOut size={15} /> Log out
          </button>
        </div>
        {notifEnabled && (
          <label className="flex items-center justify-between gap-2 text-[11px] text-gray-500 dark:text-gray-400 px-1">
            Remind me at
            <input type="time" value={reminderTime} onChange={e => handleTimeChange(e.target.value)} className="input text-xs py-1 px-2 h-7 w-auto" />
          </label>
        )}
        {notifStatus === 'denied' && (
          <p className="text-red-500 dark:text-red-400 text-[11px] px-1">Notifications are blocked. Allow them in your browser settings.</p>
        )}
        <div className="text-[10px] text-center text-gray-400 dark:text-gray-600">
          Powered by <span className="font-semibold text-yellow-600 dark:text-yellow-500">Best Scholars Africa</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">

      {/* Desktop sidebar — always visible */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-30 sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar — slide in (lessons nav) */}
      <aside className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 sidebar flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">

        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 top-header px-4 flex items-center gap-3" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)', paddingBottom: '10px' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center
                       bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300
                       hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Open lessons menu"
          >
            <BookOpenCheck size={18} />
          </button>
          <span className="text-gray-900 dark:text-white font-bold text-sm flex items-center gap-2">
            <img src={`${process.env.PUBLIC_URL}/logo.svg`} alt="" className="w-6 h-6" /> Deutsch Lernen
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setSearchOpen(true)}
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <Search size={15} />
            </button>
            <span className="flex items-center gap-1 text-xs bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full"><Flame size={11} /> {streak}</span>
            <span className="flex items-center gap-1 text-xs bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-full"><Star size={11} /> {totalXP}</span>
            <MessagesButton unread={inbox.unread} onClick={() => setMessagesOpen(true)} className="w-8 h-8" />
            <button type="button" onClick={() => setProfileOpen(true)} aria-label="Open my profile" title={displayName}
              className="w-8 h-8 rounded-full flex items-center justify-center text-base bg-gradient-to-br from-blue-600 to-emerald-500 ring-2 ring-white dark:ring-gray-900 shadow">
              {user?.avatar || '🧑'}
            </button>
            <button
              onClick={() => setDarkMode(d => !d)}
              className="w-8 h-8 rounded-xl flex items-center justify-center
                         bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300
                         hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 max-w-5xl mx-auto w-full">
          {/* Offline banner */}
          {!isOnline && (
            <div className="mb-4 flex items-center gap-2 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-xl px-4 py-2.5 text-orange-700 dark:text-orange-400 text-sm">
              <WifiOff size={15} className="flex-shrink-0" />
              <span>You are offline — lessons still work. Progress will sync when you reconnect.</span>
            </div>
          )}
          {/* Rendered once; on mobile the padding keeps content clear of the fixed bottom nav */}
          <div className="bottom-nav-clearance">{children}</div>
        </main>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="bottom-nav">
        {bottomTabs.map(({ path, Icon, label }) => {
          const active = pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`bottom-nav-item${active ? ' active' : ''}`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      {/* Search Modal */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* ── Contact Modal ── */}
      {contactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-gray-900 dark:text-white font-bold text-lg flex items-center gap-2">
                <MessageSquare size={18} className="text-yellow-500" /> Contact & Feedback
              </h2>
              <button onClick={() => setContactOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <X size={18} />
              </button>
            </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Name</label>
                    <input className="input" placeholder="Your name" value={contactForm.name}
                      onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Email</label>
                    <input className="input" type="email" placeholder="you@example.com" value={contactForm.email}
                      onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Type</label>
                  <div className="flex gap-2">
                    {['Support', 'Feedback', 'Bug Report', 'Other'].map(t => (
                      <button key={t} type="button"
                        onClick={() => setContactForm(f => ({ ...f, type: t }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          contactForm.type === t
                            ? 'bg-yellow-400 text-gray-900'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Message</label>
                  <textarea className="input resize-none" rows={4} placeholder="Describe your issue or feedback..."
                    value={contactForm.message}
                    onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} />
                </div>
                <div className="flex gap-3">
                  <button className="btn-secondary flex-1" onClick={() => setContactOpen(false)}>Cancel</button>
                  <button className="btn-primary flex-1" onClick={handleContact} disabled={contactSending}>
                    {contactSending ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
          </div>
        </div>
      )}
      {profileOpen && <MyProfileModal onClose={() => setProfileOpen(false)} />}
      {messagesOpen && (
        <MessagesPanel messages={inbox.messages} unread={inbox.unread} onClose={() => setMessagesOpen(false)}
          onRead={inbox.markRead} onReadAll={inbox.markAllRead} />
      )}
    </div>
  );
}
