import { render, screen, fireEvent, within } from '@testing-library/react';
import * as api from '../api';
import App from '../App';

vi.mock('../api');

const user = { id: '1', username: 'anna', firstName: 'Anna', lastName: 'Schmidt', email: 'anna@example.com', level: 'A2', avatar: '🦊', role: 'user' };
const today = new Date().toISOString();

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  localStorage.setItem('deutsch_token', 'jwt');
  localStorage.setItem('deutsch_user', JSON.stringify(user));
  window.history.pushState({}, '', '/');
  api.getProgress.mockResolvedValue({ data: [
    { lessonSlug: 'alphabet', status: 'completed', xp: 60, lastActivity: today, examScores: [{ score: 9, total: 10 }] },
    { lessonSlug: 'numbers', status: 'in_progress', xp: 10, lastActivity: today, examScores: [{ score: 7, total: 10 }] },
  ] });
  api.getAILessons.mockResolvedValue({ data: [] });
  api.getMessages.mockResolvedValue({ data: { messages: [], unread: 0 } });
  api.adminGetBroadcasts?.mockResolvedValue?.({ data: [] });
  api.getMe.mockResolvedValue({ data: { ...user, emailVerified: true, createdAt: '2026-10-01T10:00:00Z' } });
});

test('the sidebar user card opens a profile popup with info and learning stats', async () => {
  render(<App />);
  const card = screen.getAllByLabelText('Open my profile')[0];
  expect(card).toHaveTextContent('Anna Schmidt');
  expect(card).toHaveTextContent('@anna');

  fireEvent.click(card);
  const popup = screen.getByRole('dialog', { name: 'User details: anna' });
  expect(within(popup).getByText('@anna · you')).toBeInTheDocument();
  expect(await within(popup).findByText('70')).toBeInTheDocument();         // total XP
  expect(within(popup).getByText('80% / 90%')).toBeInTheDocument();         // avg / best exam score
  expect(within(popup).getByText('anna@example.com')).toBeInTheDocument();
  expect(await within(popup).findByText(/2026/)).toBeInTheDocument();        // member since (format follows the user's locale)
  expect(within(popup).getByText('Verified')).toBeInTheDocument();
});

test('"Edit profile" closes the popup and opens profile management', async () => {
  render(<App />);
  fireEvent.click(screen.getAllByLabelText('Open my profile')[0]);
  fireEvent.click(screen.getByText('Edit profile'));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(await screen.findByText('Account information')).toBeInTheDocument();
});

test('Escape closes the popup', () => {
  render(<App />);
  fireEvent.click(screen.getAllByLabelText('Open my profile')[0]);
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
