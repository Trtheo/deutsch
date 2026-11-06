import { render, screen, fireEvent, within, act, waitFor } from '@testing-library/react';
import * as api from '../api';
import App from '../App';

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal();
  const mocked = {};
  for (const key of Object.keys(actual)) mocked[key] = typeof actual[key] === 'function' ? vi.fn() : actual[key];
  return { __esModule: true, ...mocked, default: actual.default };
});

const now = new Date().toISOString();
const student = { id: 's1', username: 'anna', email: 'anna@example.com', level: 'A1', role: 'user' };
const admin = { id: 'a1', username: 'boss', email: 'boss@example.com', level: 'B1', role: 'admin' };
const msgs = [
  { _id: 'm1', subject: 'Neue Lektionen', body: 'Die B1-Lektionen sind online.', from: 'boss', createdAt: now, read: false },
  { _id: 'm2', subject: 'Willkommen', body: 'Viel Spaß!', from: 'boss', createdAt: now, read: true },
];

function loginAs(user, path = '/') {
  localStorage.clear();
  localStorage.setItem('deutsch_token', 'jwt');
  localStorage.setItem('deutsch_user', JSON.stringify(user));
  window.history.pushState({}, '', path);
}

beforeEach(() => {
  vi.clearAllMocks();
  api.getProgress.mockResolvedValue({ data: [] });
  api.getAILessons.mockResolvedValue({ data: [] });
  api.getMessages.mockResolvedValue({ data: { messages: msgs, unread: 1 } });
  api.markMessageRead.mockResolvedValue({ data: {} });
  api.markAllMessagesRead.mockResolvedValue({ data: {} });
});

describe('student messages', () => {
  test('unread count is shown and opening a message marks it read', async () => {
    loginAs(student);
    render(<App />);
    const [button] = await screen.findAllByLabelText('Messages, 1 unread');

    fireEvent.click(button);
    const panel = screen.getByRole('dialog', { name: 'Messages' });
    expect(within(panel).getByText('1 unread')).toBeInTheDocument();
    fireEvent.click(within(panel).getByText('Neue Lektionen'));
    expect(api.markMessageRead).toHaveBeenCalledWith('m1');
    expect(within(panel).getByText('You’re all caught up')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Messages')[0]).toBeInTheDocument(); // badge gone
  });

  test('mark all read', async () => {
    loginAs(student);
    render(<App />);
    fireEvent.click((await screen.findAllByLabelText('Messages, 1 unread'))[0]);
    fireEvent.click(screen.getByText('Mark all read'));
    expect(api.markAllMessagesRead).toHaveBeenCalled();
  });

  test('empty inbox', async () => {
    api.getMessages.mockResolvedValue({ data: { messages: [], unread: 0 } });
    loginAs(student);
    render(<App />);
    await waitFor(() => expect(api.getMessages).toHaveBeenCalled());
    fireEvent.click(screen.getAllByLabelText('Messages')[0]);
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
  });
});

describe('admin broadcast', () => {
  beforeEach(() => {
    api.getMessages.mockResolvedValue({ data: { messages: [], unread: 0 } });
    api.adminGetUsers.mockResolvedValue({ data: [
      { ...admin, _id: 'a1' },
      { _id: 's1', username: 'anna', email: 'anna@example.com', role: 'user' },
      { _id: 's2', username: 'ben', email: 'ben@example.com', role: 'user', deactivated: true },
    ] });
    api.adminListUsers.mockResolvedValue({ data: { users: [], total: 0, pages: 1, counts: {} } });
    api.adminGetContacts.mockResolvedValue({ data: [] });
    api.adminGetBroadcasts.mockResolvedValue({ data: [] });
  });

  async function openBroadcast() {
    loginAs(admin, '/admin');
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: /Broadcast/ }));
    await screen.findByText('Sent messages');
  }

  test('sends to all active users in the app, after confirming', async () => {
    api.adminBroadcast.mockResolvedValue({ data: { id: 'b1', total: 2, inApp: 2, email: null } });
    await openBroadcast();
    expect(screen.getByText('2 users')).toBeInTheDocument(); // deactivated ben not counted

    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Neue Lektionen' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Jetzt online!' } });
    fireEvent.click(screen.getByText('Send to 2 users'));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Send to 2 users?');
    await act(async () => fireEvent.click(within(screen.getByRole('alertdialog')).getByText('Send')));

    expect(api.adminBroadcast).toHaveBeenCalledWith({ subject: 'Neue Lektionen', message: 'Jetzt online!', sendEmail: false, userIds: [] });
    expect(screen.getByText('Message delivered')).toBeInTheDocument();
    expect(api.adminGetBroadcasts).toHaveBeenCalledTimes(2); // history refreshed
  });

  test('when emails fail, the result says why instead of "Sent!"', async () => {
    api.adminBroadcast.mockResolvedValue({ data: { id: 'b1', total: 2, inApp: 2,
      email: { provider: 'gmail', sent: 0, failed: 2, reasons: ['Connection timeout'] } } });
    await openBroadcast();
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Hallo' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('Also send by email'));
    fireEvent.click(screen.getByText('Send to 2 users'));
    await act(async () => fireEvent.click(within(screen.getByRole('alertdialog')).getByText('Send')));

    expect(api.adminBroadcast).toHaveBeenCalledWith(expect.objectContaining({ sendEmail: true }));
    expect(screen.getByText(/0 sent · 2 failed/)).toBeInTheDocument();
    expect(screen.getByText('· Sent with Gmail')).toBeInTheDocument();
    expect(screen.getByText('• Connection timeout')).toBeInTheDocument();
    expect(screen.getByText(/Render’s free plan blocks mail ports/)).toBeInTheDocument();
  });

  test('selected recipients', async () => {
    api.adminBroadcast.mockResolvedValue({ data: { id: 'b1', total: 1, inApp: 1, email: null } });
    await openBroadcast();
    fireEvent.click(screen.getByRole('radio', { name: /Selected users/ }));
    expect(screen.queryByText('ben@example.com')).not.toBeInTheDocument(); // deactivated
    fireEvent.click(within(screen.getByText('anna@example.com').closest('label')).getByRole('checkbox'));
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Nur für dich' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Hallo Anna' } });
    fireEvent.click(screen.getByText('Send to 1 user'));
    await act(async () => fireEvent.click(within(screen.getByRole('alertdialog')).getByText('Send')));
    expect(api.adminBroadcast).toHaveBeenCalledWith(expect.objectContaining({ userIds: ['s1'] }));
  });
});
