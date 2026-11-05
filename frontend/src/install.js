// Installing the app (PWA). Chrome/Edge (Android, Windows, macOS, Linux) fire 'beforeinstallprompt',
// which lets us show our own Install button. iPhone/iPad have no such event: users add the app
// from Safari's Share menu, so we show instructions there instead.
// Call startInstallListener() as early as possible: the event can fire before React has rendered.

let deferredPrompt = null;
let installed = false;
const subscribers = new Set();
const notify = () => subscribers.forEach(fn => fn());

export function startInstallListener() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // we show our own banner instead of the browser's mini-infobar
    deferredPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installed = true;
    notify();
  });
}

export function subscribeInstall(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export const canPromptInstall = () => !!deferredPrompt;
export const wasJustInstalled = () => installed;

// Shows the browser's install dialog. Resolves to 'accepted', 'dismissed' or 'unavailable'.
export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable';
  const prompt = deferredPrompt;
  deferredPrompt = null; // each prompt can be used once
  notify();
  prompt.prompt();
  const { outcome } = await prompt.userChoice;
  return outcome;
}

// Already running as an installed app
export function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function isIOS() {
  const ua = window.navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
}

// For tests: forget any captured prompt or install
export function _resetInstallState() {
  deferredPrompt = null;
  installed = false;
  notify();
}
