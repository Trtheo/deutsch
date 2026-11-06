import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as api from '../api';
import { AuthProvider } from '../context/AuthContext';
import { DialogProvider } from '../components/Dialog';
import { ToastProvider } from '../components/Toast';
import LessonResources from '../components/LessonResources';

vi.mock('../api');

const anna = { id: 'u1', username: 'anna', email: 'anna@example.com', role: 'user' };
const items = [
  { _id: 'r1', title: 'DW: Deutsch lernen', url: 'https://www.dw.com/de/deutsch-lernen/s-2055', shared: true, createdBy: { id: 'a1', username: 'boss' } },
  { _id: 'r2', title: 'My vocabulary list', url: '', fileName: 'words.txt', hasText: true, shared: false, createdBy: { id: 'u1', username: 'anna' } },
];

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.setItem('deutsch_token', 'jwt');
  localStorage.setItem('deutsch_user', JSON.stringify(anna));
  api.getLessonResources.mockResolvedValue({ data: items });
  api.getResource.mockResolvedValue({ data: { ...items[1], text: 'das Brot — bread\ndie Milch — milk' } });
  api.deleteResource.mockResolvedValue({ data: {} });
});

const renderIt = () => render(
  <MemoryRouter><ToastProvider><DialogProvider><AuthProvider><LessonResources slug="a1-shopping" /></AuthProvider></DialogProvider></ToastProvider></MemoryRouter>
);

test('lists shared links and your private files, and opens text in a reader', async () => {
  renderIt();
  const link = await screen.findByText('DW: Deutsch lernen');
  expect(link.closest('a')).toHaveAttribute('href', 'https://www.dw.com/de/deutsch-lernen/s-2055');
  expect(link.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
  expect(screen.getByText(/Only you/)).toBeInTheDocument();

  fireEvent.click(screen.getByText('My vocabulary list'));
  const reader = await screen.findByRole('dialog', { name: 'My vocabulary list' });
  expect(await within(reader).findByText(/das Brot — bread/)).toBeInTheDocument();
  expect(api.getResource).toHaveBeenCalledWith('r2');
});

test('you can delete only your own resources', async () => {
  renderIt();
  await screen.findByText('DW: Deutsch lernen');
  expect(screen.queryByLabelText('Delete DW: Deutsch lernen')).not.toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Delete My vocabulary list'));
  await act(async () => fireEvent.click(within(screen.getByRole('alertdialog')).getByText('Delete')));
  expect(api.deleteResource).toHaveBeenCalledWith('r2');
  expect(screen.queryByText('My vocabulary list')).not.toBeInTheDocument();
});
