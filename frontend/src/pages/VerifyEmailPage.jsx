import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, MailWarning } from 'lucide-react';
import { verifyEmail, resendVerification } from '../api';

// Opened from the link in the verification email. Works without being logged in:
// on success it stores the session and goes straight to the dashboard.
export default function VerifyEmailPage({ onVerified }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email = params.get('email') || '';
  const token = params.get('token') || '';
  const [state, setState] = useState('verifying'); // verifying | success | error
  const [error, setError] = useState({ code: '', message: '' });
  const [resend, setResend] = useState('');
  const started = useRef(false);

  useEffect(() => {
    // The link is single-use: make sure StrictMode's double effect doesn't spend it twice
    if (started.current) return;
    started.current = true;
    if (!email || !token) {
      setState('error');
      setError({ code: 'INVALID_LINK', message: 'This verification link is incomplete. Please use the link from your email.' });
      return;
    }
    verifyEmail({ email, token })
      .then(res => {
        localStorage.setItem('deutsch_token', res.data.token);
        localStorage.setItem('deutsch_user', JSON.stringify(res.data.user));
        setState('success');
        setTimeout(() => {
          navigate('/', { replace: true });
          onVerified?.(res.data.user);
        }, 1500);
      })
      .catch(e => {
        setState('error');
        setError({ code: e.response?.data?.code || '', message: e.response?.data?.error || 'Could not verify your email. Please try again.' });
      });
  }, [email, token, navigate, onVerified]);

  const handleResend = async () => {
    setResend('sending');
    try {
      await resendVerification({ email });
      setResend('sent');
    } catch (e) {
      setResend(e.response?.data?.error || 'Could not send the email. Please try again later.');
    }
  };

  const goToSignIn = () => navigate('/', { replace: true });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <img src={`${process.env.PUBLIC_URL}/logo.svg`} alt="" className="w-16 h-16 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Deutsch Lernen</h1>
        </div>

        <div className="card text-center space-y-4 py-8">
          {state === 'verifying' && (
            <>
              <Loader2 size={40} className="mx-auto text-yellow-500 animate-spin" />
              <p className="text-gray-700 dark:text-gray-300 font-medium">Verifying your email…</p>
            </>
          )}

          {state === 'success' && (
            <>
              <CheckCircle2 size={44} className="mx-auto text-green-500" />
              <div>
                <p className="text-gray-900 dark:text-white font-bold text-lg">Email verified!</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Taking you to your dashboard…</p>
              </div>
            </>
          )}

          {state === 'error' && (
            <>
              <MailWarning size={44} className="mx-auto text-red-500" />
              <p className="text-gray-700 dark:text-gray-300 text-sm">{error.message}</p>
              {email && error.code !== 'ALREADY_VERIFIED' && (
                resend === 'sent'
                  ? <p className="text-green-600 dark:text-green-400 text-sm">A new link is on its way to <strong>{email}</strong>.</p>
                  : <button className="btn-primary w-full" onClick={handleResend} disabled={resend === 'sending'}>
                      {resend === 'sending' ? 'Sending…' : 'Send me a new link'}
                    </button>
              )}
              {resend && resend !== 'sent' && resend !== 'sending' && <p className="text-red-500 text-sm">{resend}</p>}
              <button className="btn-secondary w-full" onClick={goToSignIn}>Go to sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
