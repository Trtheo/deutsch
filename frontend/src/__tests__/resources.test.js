import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as api from '../api';
import ResourcesPage from '../pages/ResourcesPage';

jest.mock('../api');
beforeEach(() => {
  jest.resetAllMocks();
  api.getAILessons.mockResolvedValue({ data: [] });
  api.getLessons.mockResolvedValue({ data: [] });
});

const renderPage = () => render(<MemoryRouter><ResourcesPage /></MemoryRouter>);

test('searching a topic lists matching lessons with their words', async () => {
  api.searchLessons.mockResolvedValue({ data: [
    { slug: 'a2-pharmacy', title: 'At the Pharmacy', titleDe: 'In der Apotheke', level: 'A2', category: 'topic', matches: [{ de: 'die Apotheke', en: 'pharmacy' }] },
  ] });
  renderPage();
  fireEvent.change(screen.getByLabelText('Search topic'), { target: { value: 'Apotheke' } });
  fireEvent.click(screen.getByText('Search'));

  expect(await screen.findByText('At the Pharmacy')).toBeInTheDocument();
  expect(screen.getByText('die Apotheke')).toBeInTheDocument();
  expect(screen.getByText('Study').closest('a')).toHaveAttribute('href', '/lesson/a2-pharmacy');
  expect(api.searchLessons).toHaveBeenCalledWith('Apotheke');
});

test('suggestion chips search directly, and empty results say so', async () => {
  api.searchLessons.mockResolvedValue({ data: [] });
  renderPage();
  fireEvent.click(screen.getByText('train'));
  expect(await screen.findByText(/No lessons found for/)).toBeInTheDocument();
});

test('there is no AI lesson generator any more', () => {
  renderPage();
  expect(screen.queryByText(/Generate/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/\bAI\b/)).not.toBeInTheDocument();
});
