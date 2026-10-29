import { render, screen, fireEvent } from '@testing-library/react';
import * as api from '../api';
import App from '../App';

jest.mock('../api');

const user = { id: '1', username: 'anna', firstName: 'Anna', lastName: 'Schmidt', email: 'anna@example.com', level: 'A2', avatar: '🦊', role: 'user' };

beforeEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
  localStorage.setItem('deutsch_token', 'jwt');
  localStorage.setItem('deutsch_user', JSON.stringify(user));
  window.history.pushState({}, '', '/');
  api.getProgress.mockResolvedValue({ data: [] });
  api.getAILessons.mockResolvedValue({ data: [] });
  api.getMe.mockResolvedValue({ data: { ...user, createdAt: '2026-10-01T10:00:00Z' } });
});

test('clicking the user card in the sidebar opens profile management', async () => {
  render(<App />);
  const card = screen.getAllByLabelText('Open my profile')[0];
  expect(card).toHaveTextContent('Anna Schmidt');
  expect(card).toHaveTextContent('@anna');
  expect(card).toHaveTextContent('A2');

  fireEvent.click(card);
  expect(await screen.findByText('Account information')).toBeInTheDocument();
  expect(screen.getByText('anna@example.com')).toBeInTheDocument();
  expect(await screen.findByText(/2026/)).toBeInTheDocument(); // member since
});
