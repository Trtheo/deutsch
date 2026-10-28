import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

import { initNotifications } from './notifications';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// Re-arm daily reminder timer if previously enabled
initNotifications();
