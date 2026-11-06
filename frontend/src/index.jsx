import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

import { initNotifications } from './notifications';
import { startInstallListener } from './install';

// Before rendering: the browser's install event can fire very early
startInstallListener();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);

// Register service worker
if ('serviceWorker' in navigator) {
  // When a new version of the app takes over, reload once so the user sees it.
  // Skipped on the very first visit (there was no previous version).
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// Re-arm daily reminder timer if previously enabled
initNotifications();
