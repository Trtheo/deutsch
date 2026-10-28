// ── Notification helpers ───────────────────────────────────

const STORAGE_KEY = 'deutsch_notif';

export function getNotifSettings() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
  catch { return null; }
}

export function saveNotifSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function isSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export async function requestPermission() {
  if (!isSupported()) return 'unsupported';
  const result = await Notification.requestPermission();
  return result; // 'granted' | 'denied' | 'default'
}

// Show an immediate notification via the SW (works when tab is in background)
export async function showNotification(title, body, icon = '/logo192.png') {
  if (!isSupported() || Notification.permission !== 'granted') return;
  const reg = await navigator.serviceWorker.ready;
  reg.showNotification(title, { body, icon, badge: '/logo192.png', tag: 'deutsch-reminder', renotify: true });
}

// Schedule a daily reminder — stores target time, fires a SW notification
// Called on every app load; if today's reminder time has passed and not yet fired, fires immediately
export async function scheduleDailyReminder(hourMinute) {
  if (!isSupported() || Notification.permission !== 'granted') return;

  const settings = getNotifSettings() || {};
  settings.reminderTime = hourMinute; // e.g. "08:00"
  settings.enabled = true;
  saveNotifSettings(settings);

  _scheduleNext(hourMinute);
}

export function cancelDailyReminder() {
  const settings = getNotifSettings() || {};
  settings.enabled = false;
  saveNotifSettings(settings);
  if (window._notifTimer) {
    clearTimeout(window._notifTimer);
    window._notifTimer = null;
  }
}

// Called on app load — re-arms the timer if notifications are enabled
export function initNotifications() {
  if (!isSupported() || Notification.permission !== 'granted') return;
  const settings = getNotifSettings();
  if (!settings?.enabled || !settings?.reminderTime) return;
  _scheduleNext(settings.reminderTime);
}

function _scheduleNext(hourMinute) {
  if (window._notifTimer) clearTimeout(window._notifTimer);

  const [h, m] = hourMinute.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);

  // If time already passed today, schedule for tomorrow
  if (target <= now) target.setDate(target.getDate() + 1);

  const ms = target - now;
  window._notifTimer = setTimeout(async () => {
    await showNotification(
      '🇩🇪 Zeit zum Lernen!',
      'Your daily German lesson is waiting. Keep your streak alive!'
    );
    // Re-schedule for next day
    _scheduleNext(hourMinute);
  }, ms);
}
