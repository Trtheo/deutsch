import React, { useEffect, useState } from 'react';
import { getMe } from '../api';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

import { Star, Flame, CheckCircle2, LogOut, Save, KeyRound, AlertCircle, CheckCircle, Eye, EyeOff, User } from 'lucide-react';
import LESSONS from '../lessons';

const AVATARS = ['🧑','👩','👨','🧑‍💻','👩‍💻','👨‍💻','🧑‍🎓','👩‍🎓','👨‍🎓','🦊','🐼','🦁','🐸','🤖','👾','🎓','⭐'];

function Msg({ msg }) {
  if (!msg) return null;
  return (
    <div className={`flex items-center gap-2 text-sm rounded-xl px-3 py-2 ${
      msg.type === 'ok'
        ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
        : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
    }`}>
      {msg.type === 'ok' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
      {msg.text}
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout, saveProfile, savePassword } = useAuth();
  const { totalXP, streak, getLessonStatus } = useApp();

  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName,  setLastName]  = useState(user.lastName  || '');
  const [username,  setUsername]  = useState(user.username);
  const [level,     setLevel]     = useState(user.level);
  const [avatar,    setAvatar]    = useState(user.avatar || '🧑');
  const [bio,       setBio]       = useState(user.bio || '');
  const [profileMsg,     setProfileMsg]     = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [curPw,     setCurPw]     = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [showCur,   setShowCur]   = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [pwMsg,     setPwMsg]     = useState(null);
  const [pwLoading, setPwLoading] = useState(false);

  const completed = LESSONS.filter(l => getLessonStatus(l.slug) === 'completed').length;

  // The saved session has no sign-up date, so fetch it
  const [memberSince, setMemberSince] = useState('');
  useEffect(() => {
    getMe().then(r => r.data?.createdAt && setMemberSince(new Date(r.data.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }))).catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    if (!username.trim()) return setProfileMsg({ type: 'err', text: 'Username cannot be empty.' });
    setProfileLoading(true); setProfileMsg(null);
    try {
      await saveProfile({ firstName: firstName.trim(), lastName: lastName.trim(), username: username.trim(), level, avatar, bio });
      setProfileMsg({ type: 'ok', text: 'Profile updated successfully!' });
    } catch (e) {
      setProfileMsg({ type: 'err', text: e.response?.data?.error || 'Failed to save profile.' });
    } finally { setProfileLoading(false); }
  };

  const handleChangePassword = async () => {
    if (!curPw || !newPw) return setPwMsg({ type: 'err', text: 'Both fields are required.' });
    if (newPw.length < 6) return setPwMsg({ type: 'err', text: 'New password must be at least 6 characters.' });
    setPwLoading(true); setPwMsg(null);
    try {
      await savePassword({ currentPassword: curPw, newPassword: newPw });
      setPwMsg({ type: 'ok', text: 'Password changed successfully!' });
      setCurPw(''); setNewPw('');
    } catch (e) {
      setPwMsg({ type: 'err', text: e.response?.data?.error || 'Failed to change password.' });
    } finally { setPwLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Stats card */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-600 to-emerald-500 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 ring-2 ring-white/40 flex items-center justify-center text-4xl flex-shrink-0">{avatar}</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg truncate">
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : user.username}
            </div>
            <div className="text-white/80 text-sm truncate">@{user.username}</div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs font-bold bg-white/25 rounded-full px-2 py-0.5">{user.level || 'A1'}</span>
              <span className="text-xs font-semibold bg-white/15 rounded-full px-2 py-0.5">{user.role === 'admin' ? 'Admin' : 'Student'}</span>
            </div>
            {bio && <div className="text-white/80 text-xs italic mt-1.5 line-clamp-2">{bio}</div>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { Icon: Star,         val: totalXP,   label: 'Total XP'  },
            { Icon: Flame,        val: streak,    label: 'Streak'    },
            { Icon: CheckCircle2, val: completed, label: 'Completed' },
          ].map(s => (
            <div key={s.label} className="text-center rounded-xl bg-white/15 py-2">
              <div className="text-xl font-bold flex items-center justify-center gap-1"><s.Icon size={15} /> {s.val}</div>
              <div className="text-white/80 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/80 mb-1">
            <span>Level Progress</span>
            <span className="font-medium text-white">{totalXP} / 1000 XP</span>
          </div>
          <div className="h-2 rounded-full bg-white/25 overflow-hidden">
            <div className="h-full bg-yellow-300 rounded-full transition-all" style={{ width: `${Math.min(100, (totalXP / 1000) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Account information */}
      <div className="card space-y-3">
        <h2 className="text-gray-900 dark:text-white font-bold flex items-center gap-2"><User size={17} /> Account information</h2>
        <dl className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
          {[
            ['Email', user.email],
            ['Username', `@${user.username}`],
            ['Role', user.role === 'admin' ? 'Administrator' : 'Student'],
            ['Current level', user.level || 'A1'],
            ['Member since', memberSince || '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2">
              <dt className="text-gray-500 dark:text-gray-400">{k}</dt>
              <dd className="text-gray-900 dark:text-white font-medium truncate">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Edit profile */}
      <div className="card space-y-4">
        <h2 className="text-gray-900 dark:text-white font-bold flex items-center gap-2"><User size={16} /> Edit Profile</h2>

        {/* Avatar */}
        <div>
          <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-2">Avatar</label>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map(a => (
              <button key={a} onClick={() => setAvatar(a)}
                className={`text-2xl w-10 h-10 rounded-xl transition-all
                  ${avatar === a ? 'bg-yellow-400 scale-110 shadow-md' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">First Name</label>
            <input className="input" placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Last Name</label>
            <input className="input" placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Username</label>
          <input className="input" value={username} onChange={e => setUsername(e.target.value)} />
        </div>

        <div>
          <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Bio</label>
          <input className="input" placeholder="e.g. Learning German for travel..." value={bio} onChange={e => setBio(e.target.value)} maxLength={80} />
          <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/80</p>
        </div>

        <div>
          <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-2">Level</label>
          <div className="grid grid-cols-4 gap-2">
            {['A1','A2','B1','B2'].map(l => (
              <button key={l} onClick={() => setLevel(l)}
                className={`py-2 rounded-xl text-sm font-bold transition-all
                  ${level === l ? 'bg-yellow-400 text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <Msg msg={profileMsg} />
        <button className="btn-primary flex items-center gap-2" onClick={handleSaveProfile} disabled={profileLoading}>
          <Save size={15} /> {profileLoading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Change password */}
      <div className="card space-y-4">
        <h2 className="text-gray-900 dark:text-white font-bold flex items-center gap-2"><KeyRound size={16} /> Change Password</h2>
        <div>
          <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Current Password</label>
          <div className="relative">
            <input className="input pr-10" type={showCur ? 'text' : 'password'} value={curPw}
              onChange={e => setCurPw(e.target.value)} placeholder="Enter current password" />
            <button type="button" onClick={() => setShowCur(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              {showCur ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">New Password</label>
          <div className="relative">
            <input className="input pr-10" type={showNew ? 'text' : 'password'} value={newPw}
              onChange={e => setNewPw(e.target.value)} placeholder="Min. 6 characters"
              onKeyDown={e => e.key === 'Enter' && handleChangePassword()} />
            <button type="button" onClick={() => setShowNew(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <Msg msg={pwMsg} />
        <button className="btn-secondary flex items-center gap-2" onClick={handleChangePassword} disabled={pwLoading}>
          <KeyRound size={15} /> {pwLoading ? 'Updating...' : 'Change Password'}
        </button>
      </div>

      {/* Sign out */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-900 dark:text-white font-semibold text-sm">Sign Out</div>
            <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">You will need to sign in again</div>
          </div>
          <button onClick={logout}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl
              bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400
              hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
