import { render, screen, fireEvent, within, act } from '@testing-library/react';
import * as api from '../api';
import App from '../App';

jest.mock('../api', () => {
  const actual = jest.requireActual('../api');
  const mocked = {};
  for (const key of Object.keys(actual)) mocked[key] = typeof actual[key] === 'function' ? jest.fn() : actual[key];
  return { __esModule: true, ...mocked, default: actual.default };
});

const admin = { id: 'a1', username: 'boss', email: 'boss@example.com', level: 'B1', role: 'admin' };
const anna = { _id: 'u2', username: 'anna', email: 'anna@example.com', level: 'A1', role: 'user', createdAt: '2026-10-01T00:00:00Z', deactivated: false };

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  window.history.pushState({}, '', '/admin');
  localStorage.setItem('deutsch_token', 'jwt');
  localStorage.setItem('deutsch_user', JSON.stringify(admin));
  api.getProgress.mockResolvedValue({ data: [] });
  api.getAILessons.mockResolvedValue({ data: [] });
  api.adminGetUsers.mockResolvedValue({ data: [{ ...admin, _id: 'a1', createdAt: '2026-01-01T00:00:00Z' }, anna] });
  api.adminGetContacts.mockResolvedValue({ data: [] });
  api.adminGetAnalytics.mockResolvedValue({ data: {} });
});

test('an admin can deactivate and reactivate a user, with a confirmation each time', async () => {
  api.adminSetUserStatus
    .mockResolvedValueOnce({ data: { ...anna, deactivated: true } })
    .mockResolvedValueOnce({ data: { ...anna, deactivated: false } });
  render(<App />);

  const row = (await screen.findByText('anna')).closest('tr');
  expect(within(row).getByText('Active')).toBeInTheDocument();
  // you can't deactivate yourself: no button on your own row
  expect(within(screen.getByText('(you)').closest('tr')).queryByText('Deactivate')).not.toBeInTheDocument();

  fireEvent.click(within(row).getByText('Deactivate'));
  const dialog = screen.getByRole('alertdialog');
  expect(dialog).toHaveTextContent('Deactivate this user?');
  expect(dialog).toHaveTextContent('anna will be signed out right away');
  await act(async () => fireEvent.click(within(dialog).getByText('Deactivate')));

  expect(api.adminSetUserStatus).toHaveBeenLastCalledWith('u2', false);
  expect(within(row).getByText('Deactivated')).toBeInTheDocument();

  fireEvent.click(within(row).getByText('Activate'));
  await act(async () => fireEvent.click(within(screen.getByRole('alertdialog')).getByText('Activate')));
  expect(api.adminSetUserStatus).toHaveBeenLastCalledWith('u2', true);
  expect(within(row).getByText('Active')).toBeInTheDocument();
});

test('cancelling the dialog changes nothing', async () => {
  render(<App />);
  const row = (await screen.findByText('anna')).closest('tr');
  fireEvent.click(within(row).getByText('Deactivate'));
  await act(async () => fireEvent.click(screen.getByText('Cancel')));
  expect(api.adminSetUserStatus).not.toHaveBeenCalled();
  expect(within(row).getByText('Active')).toBeInTheDocument();
});

test('a user signed out because of deactivation sees why on the login screen', () => {
  localStorage.clear();
  sessionStorage.setItem('auth_notice', 'Your account has been deactivated. Please contact support.');
  window.history.pushState({}, '', '/');
  render(<App />);
  expect(screen.getByText(/Your account has been deactivated/)).toBeInTheDocument();
  expect(sessionStorage.getItem('auth_notice')).toBeNull(); // shown once
});
