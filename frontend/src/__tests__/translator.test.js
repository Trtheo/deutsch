import { render, screen, fireEvent } from '@testing-library/react';
import * as api from '../api';
import TranslatorPage from '../pages/TranslatorPage';

jest.mock('../api');
beforeEach(() => { localStorage.clear(); jest.resetAllMocks(); });

test('translates English to German and remembers it', async () => {
  api.translateText.mockResolvedValue({ data: { translation: 'Wo ist der Bahnhof?' } });
  render(<TranslatorPage />);
  fireEvent.change(screen.getByLabelText('Text in English'), { target: { value: 'Where is the train station?' } });
  fireEvent.click(screen.getByText('Translate to German'));

  expect(await screen.findByText('Wo ist der Bahnhof?', { selector: 'div.panel' })).toBeInTheDocument();
  expect(api.translateText).toHaveBeenCalledWith({ text: 'Where is the train station?', from: 'en', to: 'de' });
  expect(screen.getByText('Recent translations')).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('translator_history'))[0].translation).toBe('Wo ist der Bahnhof?');
});

test('swapping translates German to English', async () => {
  api.translateText.mockResolvedValue({ data: { translation: 'Good morning' } });
  render(<TranslatorPage />);
  fireEvent.click(screen.getByLabelText('Swap languages'));
  fireEvent.change(screen.getByLabelText('Text in German'), { target: { value: 'Guten Morgen' } });
  fireEvent.click(screen.getByText('Translate to English'));
  expect(await screen.findByText('Good morning', { selector: 'div.panel' })).toBeInTheDocument();
  expect(api.translateText).toHaveBeenCalledWith({ text: 'Guten Morgen', from: 'de', to: 'en' });
});

test('shows the server error message', async () => {
  api.translateText.mockRejectedValue({ response: { data: { error: 'Translation limit reached. Please wait a few minutes.' } } });
  render(<TranslatorPage />);
  fireEvent.change(screen.getByLabelText('Text in English'), { target: { value: 'Hello' } });
  fireEvent.click(screen.getByText('Translate to German'));
  expect(await screen.findByText(/Translation limit reached/)).toBeInTheDocument();
});
