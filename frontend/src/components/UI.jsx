import React, { useState } from 'react';
import { Volume2, Mic } from 'lucide-react';
import { speak } from '../speech';

// Clickable text that speaks German when clicked
export function SpeakText({ text, className = '', lang = 'de-DE', showIcon = true }) {
  const [playing, setPlaying] = useState(false);

  const handleSpeak = (e) => {
    e.stopPropagation();
    speak(text, lang);
    setPlaying(true);
    setTimeout(() => setPlaying(false), 1500);
  };

  return (
    <span
      onClick={handleSpeak}
      className={`speak-btn group ${className}`}
      title="Click to hear pronunciation"
    >
      {text}
      {showIcon && (
        <span className={`speak-icon-btn ${playing ? 'playing' : ''}`}>
          <Volume2 size={16} strokeWidth={2.5} />
        </span>
      )}
    </span>
  );
}

// Badge for CEFR levels
export function LevelBadge({ level }) {
  const styles = {
    A1: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/30',
    A2: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30',
    B1: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-500/30',
    B2: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30',
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles[level] || styles.A1}`}>
      {level}
    </span>
  );
}

// Status badge
export function StatusBadge({ status }) {
  const map = {
    completed: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400',
    in_progress: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    not_started: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
  };
  const labels = { completed: '✓ Done', in_progress: '▶ In Progress', not_started: 'Start' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || map.not_started}`}>
      {labels[status] || 'Start'}
    </span>
  );
}

// Progress bar
export function ProgressBar({ value, max = 100, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const barColor = color || 'bg-yellow-400';
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
      <div
        className={`${barColor} h-2 rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// Inline delete confirmation — replaces window.confirm on mobile
export function ConfirmDelete({ message = 'Delete this?', onConfirm, onCancel }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-3 py-2">
      <span className="text-red-600 dark:text-red-400 text-xs font-medium flex-1">{message}</span>
      <button
        onClick={onConfirm}
        className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 active:scale-95 transition-all">
        Delete
      </button>
      <button
        onClick={onCancel}
        className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all">
        Cancel
      </button>
    </div>
  );
}

// Mic button for speech recognition
export function MicButton({ onResult, disabled }) {
  const [listening, setListening] = useState(false);
  const recRef = React.useRef(null);

  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!SR) return null;

  const toggle = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.lang = 'de-DE';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => onResult(e.results[0]?.[0]?.transcript || '');
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      title={listening ? 'Stop recording' : 'Speak in German'}
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
        listening
          ? 'bg-red-500 text-white animate-pulse'
          : 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-500/30'
      }`}
    >
      <Mic size={13} />
      {listening ? 'Listening...' : 'Speak'}
    </button>
  );
}
