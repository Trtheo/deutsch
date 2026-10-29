import React, { useState } from 'react';
import { ArrowLeftRight, Copy, Check, Volume2, Trash2, Loader2, Languages } from 'lucide-react';
import { translateText } from '../api';
import { speak } from '../speech';

const MAX_CHARS = 2000;
const HISTORY_KEY = 'translator_history';
const LANG = {
  en: { label: 'English', flag: '🇬🇧', voice: 'en-GB', placeholder: 'Type in English… e.g. "I would like to book an appointment."' },
  de: { label: 'German',  flag: '🇩🇪', voice: 'de-DE', placeholder: 'Auf Deutsch schreiben… z. B. „Wo ist der Bahnhof?“' },
};

const loadHistory = () => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
};

export default function TranslatorPage() {
  const [from, setFrom] = useState('en');
  const to = from === 'en' ? 'de' : 'en';
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState(loadHistory);

  const saveHistory = (list) => {
    setHistory(list);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); } catch {}
  };

  const handleTranslate = async () => {
    const input = text.trim();
    if (!input || loading) return;
    setLoading(true); setError(''); setCopied(false);
    try {
      const res = await translateText({ text: input, from, to });
      setResult(res.data.translation);
      const entry = { from, to, text: input, translation: res.data.translation };
      saveHistory([entry, ...history.filter(h => !(h.text === input && h.from === from))].slice(0, 10));
    } catch (e) {
      setError(e.response?.data?.error || 'Translation failed. Please try again.');
    } finally { setLoading(false); }
  };

  const swap = () => {
    setFrom(to);
    if (result) { setText(result); setResult(text); }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  const restore = (h) => { setFrom(h.from); setText(h.text); setResult(h.translation); setError(''); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Languages size={26} className="text-yellow-500" /> Translator
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Write in English and get German instantly, or the other way round. Listen to it and practise saying it.
        </p>
      </div>

      <div className="card space-y-4">
        {/* Direction */}
        <div className="flex items-center justify-center gap-3">
          <span className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 font-semibold text-gray-800 dark:text-gray-200 min-w-[120px] text-center">
            {LANG[from].flag} {LANG[from].label}
          </span>
          <button onClick={swap} title="Swap languages" aria-label="Swap languages"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-yellow-400 text-gray-900 hover:rotate-180 transition-transform duration-300">
            <ArrowLeftRight size={18} />
          </button>
          <span className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 font-semibold text-gray-800 dark:text-gray-200 min-w-[120px] text-center">
            {LANG[to].flag} {LANG[to].label}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Input */}
          <div className="flex flex-col">
            <textarea
              className="input min-h-[180px] resize-y text-base"
              placeholder={LANG[from].placeholder}
              value={text}
              maxLength={MAX_CHARS}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleTranslate(); }}
              aria-label={`Text in ${LANG[from].label}`}
            />
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              <span>{text.length}/{MAX_CHARS} · Ctrl+Enter to translate</span>
              <div className="flex gap-2">
                {text && <button onClick={() => speak(text, LANG[from].voice)} className="hover:text-yellow-500" title="Listen"><Volume2 size={16} /></button>}
                {text && <button onClick={() => { setText(''); setResult(''); setError(''); }} className="hover:text-red-500" title="Clear"><Trash2 size={16} /></button>}
              </div>
            </div>
          </div>

          {/* Output */}
          <div className="flex flex-col">
            <div className={`panel min-h-[180px] p-4 text-base whitespace-pre-wrap ${result ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`} aria-live="polite">
              {loading ? <span className="flex items-center gap-2 text-gray-400"><Loader2 size={16} className="animate-spin" /> Translating…</span>
                : result || 'Translation appears here'}
            </div>
            {result && !loading && (
              <div className="flex items-center justify-end gap-3 mt-2 text-sm">
                <button onClick={() => speak(result, LANG[to].voice)} className="btn-secondary text-xs flex items-center gap-1.5">
                  <Volume2 size={14} /> Listen
                </button>
                <button onClick={copy} className="btn-secondary text-xs flex items-center gap-1.5">
                  {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
          onClick={handleTranslate} disabled={loading || !text.trim()}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Languages size={18} />}
          Translate to {LANG[to].label}
        </button>
      </div>

      {/* Recent */}
      {history.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 dark:text-white">Recent translations</h2>
            <button onClick={() => saveHistory([])} className="text-xs text-gray-400 hover:text-red-500">Clear</button>
          </div>
          <div className="space-y-2">
            {history.map((h, i) => (
              <button key={i} onClick={() => restore(h)}
                className="w-full text-left panel px-4 py-3 hover:border-yellow-400 transition-colors">
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{LANG[h.from].flag} {h.text}</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{LANG[h.to].flag} {h.translation}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
