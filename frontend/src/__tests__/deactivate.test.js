import { render, screen, fireEvent, within, act, waitFor } from '@testing-library/react';
import * as api from '../api';
import App from '../App';

jest.mock('../api', () => {
  const actual = jest.requireActual('../api');
  const mocked = {};
  for (const key of Object.keys(actual)) mocked[key] = typeof actual[key] === 'function' ? jest.fn() : actual[key];
  return { __esModule: true, ...mocked, default: actual.default };
});

const admin = { id: 'a1', username: 'boss', email: 'boss@example.com', level: 'B1', role: 'admin' };
const bossRow = { ...admin, _id: 'a1', createdAt: '2026-01-01T00:00:00Z', deactivated: false };
const anna = { _id: 'u2', username: 'anna', firstName: 'Anna', lastName: 'Schmidt', email: 'anna@example.com', level: 'A1', role: 'user', createdAt: '2026-10-01T00:00:00Z', deactivated: false };

const page = (users, extra = {}) => ({
  data: { users, total: users.length, page: 1, limit: 10, pages: 1, counts: { all: 2, active: 2, deactivated: 0, admins: 1, unverified: 0 }, ...extra },
});

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  window.history.pushState({}, '', '/admin');
  localStorage.setItem('deutsch_token', 'jwt');
  localStorage.setItem('deutsch_user', JSON.stringify(admin));
  api.getProgress.mockResolvedValue({ data: [] });
  api.getAILessons.mockResolvedValue({ data: [] });
  api.getMessages.mockResolvedValue({ data: { messages: [], unread: 0 } });
  api.adminGetBroadcasts?.mockResolvedValue?.({ data: [] });
  api.adminGetUsers.mockResolvedValue({ data: [bossRow, anna] });
  api.adminListUsers.mockResolvedValue(page([anna, bossRow]));
  api.adminGetContacts.mockResolvedValue({ data: [] });
  api.adminGetAnalytics.mockResolvedValue({ data: {} });
  api.adminGetUser.mockResolvedValue({ data: { ...anna, emailVerified: true, stats: { xp: 120, lessonsCompleted: 3, lessonsInProgress: 1, examsTaken: 2, averageScore: 75, bestScore: 90, comments: 1, lastActivity: new Date().toISOString() } } });
});

const table = async () => { await screen.findAllByText('Anna Schmidt'); return screen.getByRole('table'); };
const rowOf = (tbl, text) => within(tbl).getByText(text).closest('tr'); // eslint-disable-line testing-library/no-node-access

test('shows summary cards, rows and the result range', async () => {
  render(<App />);
  const tbl = await table();
  expect(within(rowOf(tbl, 'Anna Schmidt')).getByText('@anna · anna@example.com')).toBeInTheDocument();
  expect(screen.getByText('Total users').closest('button')).toHaveTextContent('2'); // eslint-disable-line testing-library/no-node-access
  expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 1–2 of 2');
  // no actions on your own row
  expect(within(rowOf(tbl, 'boss')).queryByLabelText('Deactivate')).not.toBeInTheDocument();
});

test('search, filters and pagination are sent to the server', async () => {
  api.adminListUsers.mockResolvedValue(page([anna], { total: 25, pages: 3 }));
  render(<App />);
  await table();

  fireEvent.change(screen.getByLabelText('Search users'), { target: { value: 'anna' } });
  await waitFor(() => expect(api.adminListUsers).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'anna', page: 1 })));

  fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'deactivated' } });
  await waitFor(() => expect(api.adminListUsers).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'anna', status: 'deactivated' })));

  fireEvent.click(screen.getByLabelText('Next page'));
  await waitFor(() => expect(api.adminListUsers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })));

  fireEvent.click(screen.getByText('Clear filters'));
  await waitFor(() => expect(api.adminListUsers).toHaveBeenLastCalledWith({ page: 1, limit: 10, sort: 'newest' }));
});

test('deactivating from the table asks first, then updates the row and shows a toast', async () => {
  api.adminSetUserStatus.mockResolvedValue({ data: { ...anna, deactivated: true } });
  // after the change, the server lists anna as deactivated
  api.adminSetUserStatus.mockImplementation(async () => {
    api.adminListUsers.mockResolvedValue(page([{ ...anna, deactivated: true }, bossRow]));
    return { data: { ...anna, deactivated: true } };
  });
  render(<App />);
  const tbl = await table();

  fireEvent.click(within(rowOf(tbl, 'Anna Schmidt')).getByLabelText('Deactivate'));
  const dialog = screen.getByRole('alertdialog');
  expect(dialog).toHaveTextContent('anna will be signed out right away');
  await act(async () => fireEvent.click(within(dialog).getByText('Deactivate')));

  expect(api.adminSetUserStatus).toHaveBeenCalledWith('u2', false);
  expect(within(rowOf(tbl, 'Anna Schmidt')).getByText('Deactivated')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('anna has been deactivated.');
});

test('cancelling changes nothing', async () => {
  render(<App />);
  const tbl = await table();
  fireEvent.click(within(rowOf(tbl, 'Anna Schmidt')).getByLabelText('Deactivate'));
  await act(async () => fireEvent.click(screen.getByText('Cancel')));
  expect(api.adminSetUserStatus).not.toHaveBeenCalled();
});

test('clicking a row opens the full user details with learning stats and actions', async () => {
  const off = { ...anna, deactivated: true, deactivatedAt: new Date().toISOString() };
  api.adminSetUserStatus.mockImplementation(async () => {
    api.adminListUsers.mockResolvedValue(page([off, bossRow]));
    return { data: off };
  });
  render(<App />);
  const tbl = await table();

  fireEvent.click(rowOf(tbl, 'Anna Schmidt'));
  const modal = screen.getByRole('dialog', { name: 'User details: anna' });
  expect(await within(modal).findByText('120')).toBeInTheDocument();          // XP
  expect(within(modal).getByText('75% / 90%')).toBeInTheDocument();          // avg / best score
  expect(within(modal).getByText('Verified')).toBeInTheDocument();
  expect(api.adminGetUser).toHaveBeenCalledWith('u2');

  fireEvent.click(within(modal).getByText('Deactivate'));
  await act(async () => fireEvent.click(within(screen.getByRole('alertdialog')).getByText('Deactivate')));
  expect(within(modal).getByText('Activate')).toBeInTheDocument();           // modal updated in place
  expect(within(modal).getByText('Deactivated on')).toBeInTheDocument();

  fireEvent.click(within(modal).getByLabelText('Close'));
  expect(screen.queryByRole('dialog', { name: 'User details: anna' })).not.toBeInTheDocument();
});

test('no matches shows an empty state', async () => {
  api.adminListUsers.mockResolvedValue(page([], { total: 0 }));
  render(<App />);
  expect(await screen.findByText('No users found')).toBeInTheDocument();
});

test('a user signed out because of deactivation sees why on the login screen', () => {
  localStorage.clear();
  sessionStorage.setItem('auth_notice', 'Your account has been deactivated. Please contact support.');
  window.history.pushState({}, '', '/');
  render(<App />);
  expect(screen.getByText(/Your account has been deactivated/)).toBeInTheDocument();
  expect(sessionStorage.getItem('auth_notice')).toBeNull(); // shown once
});
