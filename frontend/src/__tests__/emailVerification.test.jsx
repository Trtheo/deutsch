import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import * as api from '../api';
import { AuthProvider } from '../context/AuthContext';
import VerifyEmailPage from '../pages/VerifyEmailPage';
import { ToastProvider } from '../components/Toast';

vi.mock('../api');

beforeEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
  api.checkUsername.mockResolvedValue({ data: { available: true } });
});

const renderAt = (url) => render(
  <ToastProvider><MemoryRouter initialEntries={[url]}>
    <AuthProvider>
      <Routes><Route path="*" element={<div>DASHBOARD</div>} /></Routes>
    </AuthProvider>
  </MemoryRouter></ToastProvider>
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
  fireEvent.change(screen.getByPlaceholderText('At least 8 characters'), { target: { value: 'secret123' } });
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
  fireEvent.change(screen.getByPlaceholderText('Your password'), { target: { value: 'secret123' } });
  fireEvent.click(screen.getByText('Sign In', { selector: 'button.btn-primary' }));

  expect(await screen.findByText(/Please verify your email first/)).toBeInTheDocument();
  fireEvent.click(screen.getByText('Resend verification email'));
  expect(await screen.findByText(/A new verification link is on its way/)).toBeInTheDocument();
});

test('an admin opening a user’s link verifies it but stays signed in as themselves', async () => {
  const admin = { id: 'a1', username: 'boss', email: 'boss@example.com', role: 'admin' };
  localStorage.setItem('deutsch_token', 'admin-jwt');
  localStorage.setItem('deutsch_user', JSON.stringify(admin));
  api.verifyEmail.mockResolvedValue({ data: { token: 'anna-jwt', user: { id: '2', username: 'anna', email: 'anna@example.com' } } });
  render(
    <ToastProvider><MemoryRouter initialEntries={['/verify-email?token=abc&email=anna%40example.com']}>
      <AuthProvider><VerifyEmailPage /></AuthProvider>
    </MemoryRouter></ToastProvider>
  );
  expect(await screen.findByText('Account verified')).toBeInTheDocument();
  expect(screen.getByText(/You are still signed in as boss/)).toBeInTheDocument();
  expect(localStorage.getItem('deutsch_token')).toBe('admin-jwt');
});

test('an already verified account gets a friendly message instead of an error', async () => {
  api.verifyEmail.mockRejectedValue({ response: { data: { code: 'ALREADY_VERIFIED', error: 'This email is already verified. Please sign in.' } } });
  render(<MemoryRouter initialEntries={['/verify-email?token=abc&email=anna%40example.com']}><VerifyEmailPage /></MemoryRouter>);
  expect(await screen.findByText('Already verified')).toBeInTheDocument();
  expect(screen.getByText('Go to sign in')).toBeInTheDocument();
});

test('sign-up offers only levels that have lessons and needs 8-character passwords', async () => {
  renderAt('/');
  fireEvent.click(screen.getByText('Create Account', { selector: 'button.flex-1' }));
  expect(screen.getByRole('button', { name: 'B1' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'B2' })).not.toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText('e.g. john.doe42'), { target: { value: 'anna' } });
  fireEvent.change(screen.getAllByPlaceholderText('you@example.com')[0], { target: { value: 'anna@example.com' } });
  fireEvent.change(screen.getByPlaceholderText('At least 8 characters'), { target: { value: 'short12' } });
  await screen.findByText(/Username available/);
  fireEvent.click(screen.getByText('Create Account', { selector: 'button.btn-primary' }));
  expect(await screen.findByText('Password must be at least 8 characters.')).toBeInTheDocument();
  expect(api.register).not.toHaveBeenCalled();
});
