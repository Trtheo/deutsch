// Light / dark theme. Until the user picks one with the toggle, the app follows the device's setting
// (light when the device has none). Only a deliberate choice is saved.
// The key is new on purpose: the old 'theme' key was saved automatically (as dark) for everyone.
const CHOICE_KEY = 'theme_choice';

const systemQuery = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null);

export function savedThemeChoice() {
  try {
    const v = localStorage.getItem(CHOICE_KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch { return null; }
}

export function initialDark() {
  const choice = savedThemeChoice();
  if (choice) return choice === 'dark';
  return !!systemQuery()?.matches;
}

export function saveThemeChoice(dark) {
  try { localStorage.setItem(CHOICE_KEY, dark ? 'dark' : 'light'); } catch {}
}

export function applyTheme(dark) {
  document.documentElement.classList.toggle('dark', dark);
}

// Calls onChange(dark) when the device setting changes, as long as the user hasn't chosen a theme
export function watchSystemTheme(onChange) {
  const q = systemQuery();
  if (!q) return () => {};
  const handler = (e) => { if (!savedThemeChoice()) onChange(e.matches); };
  q.addEventListener ? q.addEventListener('change', handler) : q.addListener(handler);
  return () => (q.removeEventListener ? q.removeEventListener('change', handler) : q.removeListener(handler));
}
