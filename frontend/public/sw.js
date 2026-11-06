const CACHE = 'deutsch-lernen-v4'; // bump to clear old caches for returning users
const API_CACHE = 'deutsch-api-v2'; // v2: only lesson content (v1 also held personal data)

// App shell files to pre-cache on install
const SHELL = [
  '/',
  '/index.html',
  '/offline.html',
];

// ── Install: cache the app shell ──────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ─────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k !== API_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch strategy ────────────────────────────────────────
// Pages: network first, so a new deploy reaches users right away (cache only when offline).
// /assets/ build files: cache first (their names change with every build).
// Other files: cached copy at once, refreshed in the background.
// API: only lesson content is cached, for offline reading; personal data never is.
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  if (url.pathname.startsWith('/api/')) {
    if (!url.pathname.startsWith('/api/lessons')) return; // let the browser handle it, uncached
    e.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) { const clone = res.clone(); caches.open(API_CACHE).then(c => c.put(request, clone)); }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) { const clone = res.clone(); caches.open(CACHE).then(c => c.put('/index.html', clone)); }
          return res;
        })
        .catch(() => caches.match('/index.html').then(cached => cached || caches.match('/offline.html')))
    );
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(res => {
        if (res.ok) { const clone = res.clone(); caches.open(CACHE).then(c => c.put(request, clone)); }
        return res;
      }))
    );
    return;
  }

  e.respondWith(
    caches.match(request).then(cached => {
      const fresh = fetch(request).then(res => {
        if (res.ok) { const clone = res.clone(); caches.open(CACHE).then(c => c.put(request, clone)); }
        return res;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});

// ── Push notifications ───────────────────────────────────
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || '🇩🇪 Zeit zum Lernen!', {
      body: data.body || 'Your daily German lesson is waiting. Keep your streak alive!',
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: 'deutsch-reminder',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin) && 'focus' in c);
      if (existing) return existing.focus();
      return clients.openWindow('/');
    })
  );
});

// ── Background sync: flush queued progress updates ────────
self.addEventListener('sync', e => {
  if (e.tag === 'sync-progress') {
    e.waitUntil(flushProgressQueue());
  }
});

async function flushProgressQueue() {
  const db = await openDB();
  const queue = await getAllQueued(db);
  for (const item of queue) {
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data),
      });
      await deleteQueued(db, item.id);
    } catch {
      // Will retry on next sync
    }
  }
}

// ── Minimal IndexedDB helpers for the sync queue ──────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('deutsch-sync', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function getAllQueued(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readonly');
    const req = tx.objectStore('queue').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function deleteQueued(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readwrite');
    const req = tx.objectStore('queue').delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
