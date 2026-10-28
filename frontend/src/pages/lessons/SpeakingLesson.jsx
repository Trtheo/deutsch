import React, { useState } from 'react';
import { Volume2, Mic, Square } from 'lucide-react';
import { SpeakText } from '../../components/UI';
import { speak } from '../../speech';

export default function SpeakingLesson({ lesson }) {
  const { phrases } = lesson.content;
  const [recording, setRecording] = useState(null);
  const [practiced, setPracticed] = useState({});

  const handleRecord = (idx) => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported. Try Chrome.');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'de-DE';
    rec.onresult = (e) => { setPracticed(p => ({ ...p, [idx]: e.results[0][0].transcript })); setRecording(null); };
    rec.onerror = () => setRecording(null);
    rec.onend = () => setRecording(null);
    setRecording(idx);
    rec.start();
  };

  return (
    <div className="space-y-4">
      <div className="tip-box">
        <p className="tip-text">🎙 {lesson.content.descriptionEn}</p>
        <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">Click the speaker to hear the phrase, then the mic to practice speaking it.</p>
      </div>
      <div className="space-y-3">
        {phrases?.map((p, i) => (
          <div key={i} className="card">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1">
                <SpeakText text={p.de} className="text-yellow-600 dark:text-yellow-400 font-bold text-lg" />
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">{p.en}</div>
                <div className="text-gray-400 dark:text-gray-600 text-xs mt-1 italic">💡 {p.tip}</div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button className="btn-secondary text-sm px-3 flex items-center gap-1.5" onClick={() => speak(p.de, 'de-DE', 0.75)}>
                  <Volume2 size={15} strokeWidth={2.5} /> Listen
                </button>
                <button
                  className={`text-sm px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5
                    ${recording === i ? 'bg-red-500 text-white animate-pulse' : 'btn-secondary'}`}
                  onClick={() => handleRecord(i)}
                >
                  {recording === i ? <><Square size={14} strokeWidth={2.5} /> Stop</> : <><Mic size={14} strokeWidth={2.5} /> Speak</>}
                </button>
              </div>
            </div>
            {practiced[i] && (
              <div className="mt-3 panel p-2.5 text-sm flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-500">You said:</span>
                <span className="text-green-600 dark:text-green-400 font-medium">{practiced[i]}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
