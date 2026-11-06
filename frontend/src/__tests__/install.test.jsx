import { render, screen, fireEvent, act } from '@testing-library/react';
import { startInstallListener, _resetInstallState } from '../install';
import { ToastProvider } from '../components/Toast';
import { InstallBanner, InstallSidebarButton } from '../components/InstallPrompt';

beforeAll(() => startInstallListener());

const realUA = window.navigator.userAgent;
function setUserAgent(ua) { Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true }); }

// Simulates Chrome/Edge saying "this app can be installed"
function fireInstallable(outcome = 'accepted') {
  const event = new Event('beforeinstallprompt');
  event.prompt = vi.fn();
  event.userChoice = Promise.resolve({ outcome });
  act(() => { window.dispatchEvent(event); });
  return event;
}

const renderBanner = () => render(<ToastProvider><InstallBanner /></ToastProvider>);

beforeEach(() => { localStorage.clear(); setUserAgent(realUA); });
afterEach(() => { act(() => _resetInstallState()); });

test('nothing is shown when the browser cannot install the app', () => {
  renderBanner();
  expect(screen.queryByText('Install Deutsch Lernen')).not.toBeInTheDocument();
});

test('the banner appears by itself and Install opens the browser’s install dialog', async () => {
  renderBanner();
  const event = fireInstallable();
  expect(screen.getByText('Install Deutsch Lernen')).toBeInTheDocument();
  await act(async () => fireEvent.click(screen.getByText('Install')));
  expect(event.prompt).toHaveBeenCalled();
});

test('after installing, the banner goes away and a toast confirms it', () => {
  renderBanner();
  fireInstallable();
  act(() => { window.dispatchEvent(new Event('appinstalled')); });
  expect(screen.queryByText('Install Deutsch Lernen')).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Deutsch Lernen is installed!');
});

test('"Not now" hides the banner for two weeks', () => {
  const { unmount } = renderBanner();
  fireInstallable();
  fireEvent.click(screen.getByText('Not now'));
  expect(screen.queryByText('Install Deutsch Lernen')).not.toBeInTheDocument();
  unmount();
  renderBanner();
  expect(screen.queryByText('Install Deutsch Lernen')).not.toBeInTheDocument();
});

test('on iPhone it explains how to add the app from Safari', () => {
  setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1');
  renderBanner();
  fireEvent.click(screen.getByText('Install'));
  expect(screen.getByText('Add to Home Screen')).toBeInTheDocument();
});

test('the sidebar always offers "Install the app" while installable', async () => {
  render(<ToastProvider><InstallSidebarButton /></ToastProvider>);
  expect(screen.queryByText('Install the app')).not.toBeInTheDocument();
  const event = fireInstallable();
  await act(async () => fireEvent.click(screen.getByText('Install the app')));
  expect(event.prompt).toHaveBeenCalled();
});
