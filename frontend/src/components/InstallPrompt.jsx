import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';
import { subscribeInstall, canPromptInstall, wasJustInstalled, promptInstall, isStandalone, isIOS } from '../install';
import { useToast } from './Toast';

const DISMISS_KEY = 'install_banner_dismissed_at';
const DISMISS_DAYS = 14;

function dismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch { return false; }
}

// What can be offered on this device: 'prompt' (one-tap install), 'ios' (instructions), or null
export function useInstall() {
  const canPrompt = useSyncExternalStore(subscribeInstall, canPromptInstall);
  const justInstalled = useSyncExternalStore(subscribeInstall, wasJustInstalled);
  if (isStandalone() || justInstalled) return { mode: null, justInstalled };
  if (canPrompt) return { mode: 'prompt', justInstalled };
  if (isIOS()) return { mode: 'ios', justInstalled };
  return { mode: null, justInstalled };
}

function IOSSteps() {
  return (
    <ol className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300 mt-2">
      <li className="flex items-center gap-2">1. Tap <Share size={16} className="text-blue-500" /> <strong>Share</strong> in Safari’s toolbar</li>
      <li className="flex items-center gap-2">2. Choose <PlusSquare size={16} /> <strong>Add to Home Screen</strong></li>
      <li className="flex items-center gap-2">3. Tap <strong>Add</strong></li>
    </ol>
  );
}

// Appears by itself (once every 14 days at most) when the app can be installed
export function InstallBanner() {
  const { mode, justInstalled } = useInstall();
  const toast = useToast();
  const [hidden, setHidden] = useState(dismissedRecently);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (justInstalled) toast.success('Deutsch Lernen is installed! Open it from your home screen or apps.');
  }, [justInstalled, toast]);

  if (!mode || hidden) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setHidden(true);
  };

  const install = async () => {
    if (mode === 'ios') return setShowSteps(true);
    const outcome = await promptInstall();
    if (outcome === 'dismissed') dismiss();
  };

  return (
    <div role="dialog" aria-label="Install the app"
      className="fixed z-[70] left-3 right-3 bottom-24 lg:bottom-6 lg:left-auto lg:right-6 lg:w-96 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl p-4">
      <button onClick={dismiss} aria-label="Close" className="absolute top-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={16} /></button>
      <div className="flex items-start gap-3 pr-6">
        <img src={`${process.env.PUBLIC_URL}/logo192.png`} alt="" className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="min-w-0">
          <div className="font-bold text-gray-900 dark:text-white">Install Deutsch Lernen</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Open it from your home screen like an app. Lessons work even offline.</p>
        </div>
      </div>
      {showSteps && <IOSSteps />}
      {!showSteps && (
        <div className="flex gap-2 mt-3">
          <button onClick={dismiss} className="btn-secondary flex-1 text-sm">Not now</button>
          <button onClick={install} className="btn-primary flex-1 text-sm flex items-center justify-center gap-1.5">
            <Download size={15} /> Install
          </button>
        </div>
      )}
    </div>
  );
}

// Always-available entry in the sidebar, for people who closed the banner
export function InstallSidebarButton({ onDone }) {
  const { mode } = useInstall();
  const [showSteps, setShowSteps] = useState(false);
  if (!mode) return null;
  const click = async () => {
    if (mode === 'ios') return setShowSteps(s => !s);
    await promptInstall();
    onDone?.();
  };
  return (
    <div>
      <button onClick={click}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
        <Smartphone size={15} /> Install the app
      </button>
      {showSteps && <div className="px-3"><IOSSteps /></div>}
    </div>
  );
}
