import { render, screen } from '@testing-library/react';
import App from '../App';

test('logged-out visitors see the login screen', () => {
  localStorage.clear();
  render(<App />);
  expect(screen.getAllByPlaceholderText('you@example.com').length).toBeGreaterThan(0);
});
