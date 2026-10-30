import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

// Short-lived notifications for the result of an action:
//   const toast = useToast();
//   toast.success('Profile updated');  toast.error('Could not save');  toast.info('…')
export const TOAST_DURATION = 4000;
const MAX_VISIBLE = 4;

const ToastContext = createContext(null);

const STYLES = {
  success: { Icon: CheckCircle2, accent: 'bg-green-500', icon: 'text-green-500', ring: 'border-green-200 dark:border-green-500/30' },
  error:   { Icon: AlertCircle,  accent: 'bg-red-500',   icon: 'text-red-500',   ring: 'border-red-200 dark:border-red-500/30' },
  info:    { Icon: Info,         accent: 'bg-blue-500',  icon: 'text-blue-500',  ring: 'border-blue-200 dark:border-blue-500/30' },
};

function ToastItem({ toast, onDismiss }) {
  const s = STYLES[toast.type] || STYLES.info;
  const [shown, setShown] = useState(false);
  const [paused, setPaused] = useState(false);
  const remaining = useRef(TOAST_DURATION);
  const startedAt = useRef(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Count down only while not hovered; hovering pauses so the message can be read
  useEffect(() => {
    if (paused) return;
    startedAt.current = Date.now();
    const timer = setTimeout(() => onDismiss(toast.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, toast.id, onDismiss]);

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`pointer-events-auto relative overflow-hidden w-full sm:w-96 rounded-xl border ${s.ring} bg-white dark:bg-gray-900 shadow-lg
        transition-all duration-300 ${shown ? 'opacity-100 translate-y-0 sm:translate-x-0' : 'opacity-0 -translate-y-2 sm:translate-y-0 sm:translate-x-6'}`}>
      <div className="flex items-start gap-3 px-4 py-3">
        <s.Icon size={20} className={`${s.icon} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          {toast.title && <div className="text-sm font-bold text-gray-900 dark:text-white">{toast.title}</div>}
          <div className="text-sm text-gray-700 dark:text-gray-300 break-words">{toast.message}</div>
        </div>
        <button onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification"
          className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex-shrink-0">
          <X size={16} />
        </button>
      </div>
      {/* Time left */}
      <div className={`absolute bottom-0 left-0 h-1 ${s.accent} opacity-70`}
        style={{ animation: `toast-progress ${TOAST_DURATION}ms linear forwards`, animationPlayState: paused ? 'paused' : 'running' }} />
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts(list => list.filter(t => t.id !== id)), []);

  const show = useCallback((type, message, opts = {}) => {
    if (!message) return;
    const id = nextId.current++;
    // Same message twice in a row (e.g. double click) shows once
    setToasts(list => [...list.filter(t => !(t.type === type && t.message === message)), { id, type, message, title: opts.title }].slice(-MAX_VISIBLE));
    return id;
  }, []);

  const api = useMemo(() => ({
    success: (message, opts) => show('success', message, opts),
    error: (message, opts) => show('error', message, opts),
    info: (message, opts) => show('info', message, opts),
    dismiss,
  }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite"
        className="fixed z-[110] top-3 inset-x-3 sm:inset-x-auto sm:top-4 sm:right-4 flex flex-col gap-2 items-stretch sm:items-end pointer-events-none">
        {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
