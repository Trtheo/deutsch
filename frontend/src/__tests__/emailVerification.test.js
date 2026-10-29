import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import * as api from '../api';
import { AuthProvider } from '../context/AuthContext';
import VerifyEmailPage from '../pages/VerifyEmailPage';

jest.mock('../api');

beforeEach(() => {
  localStorage.clear();
  jest.resetAllMocks();
  api.checkUsername.mockResolvedValue({ data: { available: true } });
});

const renderAt = (url) => render(
  <MemoryRouter initialEntries={[url]}>
    <AuthProvider>
      <Routes><Route path="*" element={<div>DASHBOARD</div>} /></Routes>
    </AuthProvider>
  </MemoryRouter>
);

test('the email link verifies, stores the session and opens the dashboard without logging in', async () => {
  api.verifyEmail.mockResolvedValue({ data: { token: 'jwt-123', user: { id: '1', username: 'anna', email: 'anna@example.com' } } });
  renderAt('/verify-email?token=abc&email=anna%40example.com');

  expect(screen.getByText(/Verifying your email/)).toBeInTheDocument();
  expect(await screen.findByText('Email verified!')).toBeInTheDocument();
  expect(api.verifyEmail).toHaveBeenCalledTimes(1);
  expect(api.verifyEmail).toHaveBeenCalledWith({ email: 'anna@example.com', token: 'abc' });
  expect(localStorage.getItem('deutsch_token')).toBe('jwt-123');
  expect(await screen.findByText('DASHBOARD', {}, { timeout: 3000 })).toBeInTheDocument();
});

test('an expired link offers a new one', async () => {
  api.verifyEmail.mockRejectedValue({ response: { data: { code: 'LINK_EXPIRED', error: 'This verification link has expired. Request a new one.' } } });
  api.resendVerification.mockResolvedValue({ data: {} });
  render(<MemoryRouter initialEntries={['/verify-email?token=abc&email=anna%40example.com']}><VerifyEmailPage /></MemoryRouter>);

  expect(await screen.findByText(/has expired/)).toBeInTheDocument();
  fireEvent.click(screen.getByText('Send me a new link'));
  expect(await screen.findByText(/A new link is on its way/)).toBeInTheDocument();
  expect(api.resendVerification).toHaveBeenCalledWith({ email: 'anna@example.com' });
});

test('after registering, the user is asked to check their inbox instead of being logged in', async () => {
  api.register.mockResolvedValue({ data: { verificationRequired: true, emailSent: true, email: 'anna@example.com' } });
  renderAt('/');

  fireEvent.click(screen.getByText('Create Account', { selector: 'button.flex-1' }));
  fireEvent.change(screen.getByPlaceholderText('e.g. john.doe42'), { target: { value: 'anna' } });
  fireEvent.change(screen.getAllByPlaceholderText('you@example.com')[0], { target: { value: 'anna@example.com' } });
  fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'secret123' } });
  await waitFor(() => expect(api.checkUsername).toHaveBeenCalled());
  await screen.findByText(/Username available/);
  fireEvent.click(screen.getByText('Create Account', { selector: 'button.btn-primary' }));

  expect(await screen.findByText('Check your inbox')).toBeInTheDocument();
  expect(screen.getByText('anna@example.com')).toBeInTheDocument();
  expect(localStorage.getItem('deutsch_token')).toBeNull();
});

test('logging in before verifying offers to resend the email', async () => {
  api.login.mockRejectedValue({ response: { data: { code: 'EMAIL_NOT_VERIFIED', email: 'anna@example.com', error: 'Please verify your email first. Check your inbox for the link.' } } });
  api.resendVerification.mockResolvedValue({ data: {} });
  renderAt('/');

  fireEvent.change(screen.getAllByPlaceholderText('you@example.com')[0], { target: { value: 'anna@example.com' } });
  fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'secret123' } });
  fireEvent.click(screen.getByText('Sign In', { selector: 'button.btn-primary' }));

  expect(await screen.findByText(/Please verify your email first/)).toBeInTheDocument();
  fireEvent.click(screen.getByText('Resend verification email'));
  expect(await screen.findByText(/A new verification link is on its way/)).toBeInTheDocument();
});
