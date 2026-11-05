import { render, screen, fireEvent } from '@testing-library/react';
import { initialDark, saveThemeChoice, watchSystemTheme } from '../theme';
import App from '../App';

// jsdom has no matchMedia; simulate the device setting
let systemDark = false;
let listeners = [];
beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  systemDark = false;
  listeners = [];
  window.matchMedia = jest.fn(() => ({
    get matches() { return systemDark; },
    addEventListener: (_, fn) => listeners.push(fn),
    removeEventListener: (_, fn) => { listeners = listeners.filter(l => l !== fn); },
  }));
});
afterEach(() => { delete window.matchMedia; });

test('first visit is light when the device is light or has no setting', () => {
  expect(initialDark()).toBe(false);
  delete window.matchMedia;
  expect(initialDark()).toBe(false);
});

test('first visit follows a dark device', () => {
  systemDark = true;
  expect(initialDark()).toBe(true);
});

test('the old automatically saved "dark" is ignored', () => {
  localStorage.setItem('theme', 'dark');
  expect(initialDark()).toBe(false);
});

test('a deliberate choice wins over the device', () => {
  systemDark = true;
  saveThemeChoice(false);
  expect(initialDark()).toBe(false);
});

test('device changes are followed only until the user chooses', () => {
  const seen = [];
  watchSystemTheme(d => seen.push(d));
  listeners.forEach(fn => fn({ matches: true }));
  saveThemeChoice(false);
  listeners.forEach(fn => fn({ matches: true }));
  expect(seen).toEqual([true]);
});

test('the login screen starts light and remembers the toggle', () => {
  render(<App />);
  expect(document.documentElement).not.toHaveClass('dark');
  fireEvent.click(screen.getByLabelText('Switch to dark mode'));
  expect(document.documentElement).toHaveClass('dark');
  expect(localStorage.getItem('theme_choice')).toBe('dark');
});
