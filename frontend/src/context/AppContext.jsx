import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getProgress, updateProgress } from '../api';

const AppContext = createContext();

export function calcStreak(progressList) {
  const days = new Set(
    progressList
      .filter(p => p.lastActivity)
      .map(p => new Date(p.lastActivity).toDateString())
  );
  if (days.size === 0) return 0;

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // If neither today nor yesterday has activity, streak is broken
  if (!days.has(today.toDateString()) && !days.has(yesterday.toDateString())) return 0;

  // Count consecutive days backwards from today
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days.has(d.toDateString())) {
      streak++;
    } else if (i === 0) {
      // today has no activity yet — start counting from yesterday
      continue;
    } else {
      break;
    }
  }
  return streak;
}

export function calcTodayXP(progressList) {
  // Sum XP earned today by checking examScores dated today
  // plus 10 XP per lesson first-visited today and 50 XP per lesson completed today
  const today = new Date().toDateString();
  return progressList
    .filter(p => p.lastActivity && new Date(p.lastActivity).toDateString() === today)
    .reduce((sum, p) => {
      // count exam XP earned today
      const examXP = (p.examScores || [])
        .filter(s => s.date && new Date(s.date).toDateString() === today)
        .reduce((a, s) => a + (s.score || 0) * 5, 0);
      return sum + examXP;
    }, 0);
}

// ── IndexedDB offline queue ────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('deutsch-sync', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function enqueueProgress(data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readwrite');
    tx.objectStore('queue').add({ data, ts: Date.now() });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function flushQueue() {
  const db = await openDB();
  const all = await new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readonly');
    const req = tx.objectStore('queue').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  for (const item of all) {
    try {
      await updateProgress(item.data);
      await new Promise((resolve, reject) => {
        const tx = db.transaction('queue', 'readwrite');
        tx.objectStore('queue').delete(item.id);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      break; // still offline, stop trying
    }
  }
}

export function AppProvider({ children }) {
  const [progress, setProgress] = useState([]);
  const [totalXP, setTotalXP] = useState(0);
  const [todayXP, setTodayXP] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dailyGoal, setDailyGoalState] = useState(() =>
    Number(localStorage.getItem('dailyGoal')) || 50
  );
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  const setDailyGoal = (val) => {
    localStorage.setItem('dailyGoal', val);
    setDailyGoalState(val);
  };

  // Track online/offline
  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      // Flush queued progress updates
      flushQueue().then(() => {
        getProgress().then(r => {
          setProgress(r.data);
          setTotalXP(r.data.reduce((sum, p) => sum + (p.xp || 0), 0));
          setTodayXP(calcTodayXP(r.data));
          setStreak(calcStreak(r.data));
        }).catch(() => {});
      }).catch(() => {});
      // Trigger background sync if supported
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(sw => sw.sync.register('sync-progress')).catch(() => {});
      }
    };
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    getProgress().then(r => {
      setProgress(r.data);
      setTotalXP(r.data.reduce((sum, p) => sum + (p.xp || 0), 0));
      setTodayXP(calcTodayXP(r.data));
      setStreak(calcStreak(r.data));
    }).catch(() => {});
  }, []);

  const applyLocal = useCallback((lessonSlug, status, xp) => {
    const now = new Date().toISOString();
    setProgress(prev => {
      const idx = prev.findIndex(p => p.lessonSlug === lessonSlug);
      const existing = prev[idx] || { lessonSlug, xp: 0 };
      // don't add XP locally if already completed — backend handles dedup
      const addXP = existing.status === 'completed' && status === 'completed' ? 0 : xp;
      const updated = { ...existing, status: status || existing.status, xp: (existing.xp || 0) + addXP, lastActivity: now };
      const next = idx >= 0 ? prev.map((p, i) => i === idx ? updated : p) : [...prev, updated];
      setTotalXP(next.reduce((sum, p) => sum + (p.xp || 0), 0));
      setTodayXP(calcTodayXP(next));
      setStreak(calcStreak(next));
      return next;
    });
  }, []);

  const markProgress = useCallback(async (lessonSlug, status, xp = 0, examScore = null) => {
    // Always update UI immediately
    applyLocal(lessonSlug, status, xp);

    if (!navigator.onLine) {
      await enqueueProgress({ lessonSlug, status, xp, examScore }).catch(() => {});
      return;
    }

    try {
      const res = await updateProgress({ lessonSlug, status, xp, examScore });
      setProgress(prev => {
        const idx = prev.findIndex(p => p.lessonSlug === lessonSlug);
        const next = idx >= 0 ? prev.map((p, i) => i === idx ? res.data : p) : [...prev, res.data];
        setTotalXP(next.reduce((sum, p) => sum + (p.xp || 0), 0));
        setTodayXP(calcTodayXP(next));
        setStreak(calcStreak(next));
        return next;
      });
    } catch {
      await enqueueProgress({ lessonSlug, status, xp, examScore }).catch(() => {});
    }
  }, [applyLocal]);

  const getLessonStatus = (slug) => progress.find(p => p.lessonSlug === slug)?.status || 'not_started';

  return (
    <AppContext.Provider value={{ progress, totalXP, todayXP, streak, isOnline, dailyGoal, setDailyGoal, markProgress, getLessonStatus, darkMode, setDarkMode }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
