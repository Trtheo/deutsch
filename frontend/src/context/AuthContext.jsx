import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { register as apiRegister, login as apiLogin, updateProfile, updatePassword, forgotPassword, checkUsername } from '../api';

const AuthContext = createContext();
const TOKEN_KEY = 'deutsch_token';
const USER_KEY  = 'deutsch_user';

// ── Auth screens ───────────────────────────────────────────
function generateUsername(firstName, lastName) {
  const f = firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const l = lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!f && !l) return '';
  const base = f && l ? `${f}.${l}` : f || l;
  return base + Math.floor(10 + Math.random() * 90);
}

function AuthScreen({ onDone }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ firstName: '', lastName: '', username: '', email: '', password: '', level: 'A1' });
  const [usernameCustomized, setUsernameCustomized] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null);
  const debounceRef = useRef(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const switchMode = (m) => { setMode(m); setError(''); setSuccess(''); setUsernameCustomized(false); setUsernameStatus(null); };

  // Debounced username availability check
  const checkAvailability = (username) => {
    setUsernameStatus('checking');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!username || username.length < 3) return setUsernameStatus(null);
      try {
        const res = await checkUsername(username);
        setUsernameStatus(res.data.available ? 'available' : 'taken');
      } catch { setUsernameStatus(null); }
    }, 500);
  };

  const handleNameChange = (k, v) => {
    setForm(f => {
      const updated = { ...f, [k]: v };
      if (!usernameCustomized) {
        updated.username = generateUsername(
          k === 'firstName' ? v : f.firstName,
          k === 'lastName'  ? v : f.lastName
        );
        checkAvailability(updated.username);
      }
      return updated;
    });
  };

  const handleUsernameChange = (v) => {
    setUsernameCustomized(true);
    set('username', v);
    checkAvailability(v);
  };

  const regenerateUsername = () => {
    setUsernameCustomized(false);
    const newUsername = generateUsername(form.firstName, form.lastName);
    set('username', newUsername);
    checkAvailability(newUsername);
  };

  const handleSubmit = async () => {
    setError(''); setSuccess('');

    if (mode === 'forgot') {
      if (!form.email) return setError('Email is required.');
      setLoading(true);
      try {
        await forgotPassword({ email: form.email });
        setSuccess('Reset link sent! Check your inbox.');
      } catch (e) { setError(e.response?.data?.error || 'Something went wrong.'); }
      finally { setLoading(false); }
      return;
    }

    if (!form.email || !form.password) return setError('Email and password are required.');
    if (mode === 'register' && !form.username) return setError('Username is required.');
    if (mode === 'register' && usernameStatus === 'taken') return setError('That username is already taken. Please choose another.');
    if (mode === 'register' && usernameStatus === 'checking') return setError('Please wait while we check username availability.');
    if (mode === 'register' && form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      const fn = mode === 'register' ? apiRegister : apiLogin;
      const res = await fn(form);
      localStorage.setItem(TOKEN_KEY, res.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
      setSuccess(mode === 'register' ? 'Account created! Welcome 🎉' : 'Welcome back! Signing you in...');
      setTimeout(() => onDone(res.data.user), 800);
    } catch (e) {
      setError(e.response?.data?.error || 'Something went wrong. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Dark mode toggle */}
        <div className="flex justify-end">
          <button onClick={() => setDark(d => !d)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div className="text-center">
          <img src={`${process.env.PUBLIC_URL}/logo.svg`} alt="" className="w-20 h-20 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deutsch Lernen</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Learn German from A1 to B2</p>
        </div>

        {/* Tab toggle — only for login/register */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => switchMode(m)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize
                  ${mode === m ? 'bg-white dark:bg-gray-900 text-yellow-600 dark:text-yellow-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>
        )}

        <div className="card space-y-4">

          {/* Forgot password — email step */}
          {mode === 'forgot' && (
            <>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Enter your registered email and we'll send you a reset link.</p>
              <div>
                <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Email</label>
                <input className="input" type="email" placeholder="you@example.com" value={form.email}
                  onChange={e => set('email', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              </div>
            </>
          )}

          {/* Register fields */}
          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">First Name</label>
                  <input className="input" placeholder="John" value={form.firstName}
                    onChange={e => handleNameChange('firstName', e.target.value)} />
                </div>
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Last Name</label>
                  <input className="input" placeholder="Doe" value={form.lastName}
                    onChange={e => handleNameChange('lastName', e.target.value)} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">Username</label>
                  <div className="flex items-center gap-2">
                    {usernameCustomized && (
                      <span className="text-xs text-yellow-600 dark:text-yellow-400">custom</span>
                    )}
                    {(form.firstName || form.lastName) && (
                      <button type="button" onClick={regenerateUsername}
                        className="text-xs text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors">
                        ↺ regenerate
                      </button>
                    )}
                  </div>
                </div>
                <input className="input" placeholder="e.g. john.doe42" value={form.username}
                  onChange={e => handleUsernameChange(e.target.value)} />
                <p className="text-xs mt-1">
                  {usernameStatus === 'checking' && <span className="text-gray-400">Checking availability...</span>}
                  {usernameStatus === 'available' && <span className="text-green-500">✓ Username available</span>}
                  {usernameStatus === 'taken' && <span className="text-red-500">✕ Username already taken</span>}
                  {!usernameStatus && !usernameCustomized && form.username && <span className="text-gray-400 dark:text-gray-500">Auto-generated — edit to customize</span>}
                </p>
              </div>
            </>
          )}

          {/* Email + Password — login & register */}
          {(mode === 'login' || mode === 'register') && (
            <>
              <div>
                <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Email</label>
                <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Password</label>
                <div className="relative">
                  <input className="input pr-10" type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password}
                    onChange={e => set('password', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {mode === 'login' && (
                  <button type="button" onClick={() => switchMode('forgot')}
                    className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline mt-1.5 block text-right">
                    Forgot password?
                  </button>
                )}
              </div>
            </>
          )}

          {/* Starting level — register only */}
          {mode === 'register' && (
            <div>
              <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Starting Level</label>
              <div className="grid grid-cols-4 gap-2">
                {['A1', 'A2', 'B1', 'B2'].map(l => (
                  <button key={l} onClick={() => set('level', l)}
                    className={`py-2 rounded-xl text-sm font-bold transition-all
                      ${form.level === l ? 'bg-yellow-400 text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-3 py-2.5">
              <span className="text-red-500 text-base">✕</span>
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl px-3 py-2.5">
              <span className="text-green-500 text-base">✓</span>
              <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>
            </div>
          )}

          <button className="btn-primary w-full py-3 text-base" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Please wait...' :
              mode === 'login' ? 'Sign In' :
              mode === 'register' ? 'Create Account' :
              'Send Reset Link'}
          </button>

          {(mode === 'forgot' || mode === 'reset') && (
            <button type="button" onClick={() => switchMode('login')}
              className="w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              ← Back to Sign In
            </button>
          )}
        </div>

        <p className="text-center text-gray-400 dark:text-gray-600 text-xs">
          Your progress is saved to your account
        </p>
      </div>
    </div>
  );
}

// ── Provider ───────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
    catch { return null; }
  });

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const saveProfile = useCallback(async (data) => {
    const res = await updateProfile(data);
    const updated = { ...user, ...res.data };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    setUser(updated);
    return updated;
  }, [user]);

  const savePassword = useCallback(async (data) => {
    await updatePassword(data);
  }, []);

  if (!user) return <AuthScreen onDone={setUser} />;

  return (
    <AuthContext.Provider value={{ user, logout, saveProfile, savePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
