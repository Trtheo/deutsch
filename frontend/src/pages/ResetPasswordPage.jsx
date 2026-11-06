import React, { useCallback, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { resetPassword } from '../api';
import { useToast } from '../components/Toast';
import { MIN_PASSWORD } from '../lessons';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email = params.get('email') || '';
  const token = params.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const toast = useToast();
  const setError = useCallback((msg) => { if (msg) toast.error(msg); }, [toast]);
  const setSuccess = useCallback((msg) => { if (msg) toast.success(msg); }, [toast]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    if (!newPassword || !confirm) return setError('Both fields are required.');
    if (newPassword.length < MIN_PASSWORD) return setError(`Password must be at least ${MIN_PASSWORD} characters.`);
    if (newPassword !== confirm) return setError('Passwords do not match.');
    if (!token || !email) return setError('Invalid reset link. Please request a new one.');
    setLoading(true);
    try {
      await resetPassword({ email, token, newPassword });
      setSuccess('Password reset successfully! Redirecting to sign in...');
      setTimeout(() => navigate('/'), 2000);
    } catch (e) {
      setError(e.response?.data?.error || 'Invalid or expired link. Please request a new one.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Set New Password</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{email}</p>
        </div>

        <div className="card space-y-4">
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">New Password</label>
            <div className="relative">
              <input className="input pr-10" type={showPw ? 'text' : 'password'} placeholder={`At least ${MIN_PASSWORD} characters`}
                value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Confirm Password</label>
            <input className="input" type="password" placeholder="Repeat password"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>


          <button className="btn-primary w-full py-3 text-base" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Please wait...' : 'Reset Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
