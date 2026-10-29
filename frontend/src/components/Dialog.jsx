import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Info, Trash2 } from 'lucide-react';

// App-styled replacement for window.confirm / window.alert:
//   const { confirm, alert } = useDialog();
//   if (!(await confirm({ title: 'Delete this user?', message: '…', confirmLabel: 'Delete', tone: 'danger' }))) return;
const DialogContext = createContext(null);

const TONES = {
  danger:  { Icon: Trash2,        circle: 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400',
             button: 'bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-400' },
  warning: { Icon: AlertTriangle, circle: 'bg-yellow-100 dark:bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
             button: 'bg-yellow-400 hover:bg-yellow-500 text-gray-900 focus-visible:ring-yellow-300' },
  info:    { Icon: Info,          circle: 'bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400',
             button: 'bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-blue-400' },
};

function DialogBox({ dialog, onClose }) {
  const { title, message, confirmLabel = 'OK', cancelLabel = 'Cancel', tone = 'info', alertOnly } = dialog;
  const t = TONES[tone] || TONES.info;
  const [shown, setShown] = useState(false);
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    // Destructive actions start on Cancel, so a stray Enter can't delete anything
    (tone === 'danger' && !alertOnly ? cancelRef : confirmRef).current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose(false);
      if (e.key === 'Tab') { // keep focus inside the dialog
        const items = [cancelRef.current, confirmRef.current].filter(Boolean);
        const i = items.indexOf(document.activeElement);
        e.preventDefault();
        items[(i + (e.shiftKey ? -1 : 1) + items.length) % items.length]?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, tone, alertOnly]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4" onMouseDown={() => onClose(false)}>
      <div className={`absolute inset-0 bg-gray-950/60 backdrop-blur-sm transition-opacity duration-200 ${shown ? 'opacity-100' : 'opacity-0'}`} />
      <div
        role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-message"
        onMouseDown={e => e.stopPropagation()}
        className={`relative w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6
          transition-all duration-200 ${shown ? 'opacity-100 translate-y-0 sm:scale-100' : 'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'}`}>
        <div className="flex flex-col items-center text-center">
          <span className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${t.circle}`}>
            <t.Icon size={26} strokeWidth={2.2} />
          </span>
          <h2 id="dialog-title" className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          {message && <p id="dialog-message" className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{message}</p>}
        </div>
        <div className={`mt-6 grid gap-3 ${alertOnly ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {!alertOnly && (
            <button ref={cancelRef} onClick={() => onClose(false)}
              className="py-2.5 rounded-xl font-semibold text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400">
              {cancelLabel}
            </button>
          )}
          <button ref={confirmRef} onClick={() => onClose(true)}
            className={`py-2.5 rounded-xl font-semibold text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${t.button}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  const open = useCallback((options) => new Promise(resolve => {
    resolver.current = resolve;
    setDialog(options);
  }), []);

  const close = useCallback((result) => {
    resolver.current?.(result);
    resolver.current = null;
    setDialog(null);
  }, []);

  const confirm = useCallback((opts) => open({ tone: 'danger', confirmLabel: 'Delete', ...opts }), [open]);
  const alert = useCallback((opts) => open({ tone: 'info', confirmLabel: 'OK', ...opts, alertOnly: true }).then(() => undefined), [open]);

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {dialog && <DialogBox dialog={dialog} onClose={close} />}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used inside <DialogProvider>');
  return ctx;
}
