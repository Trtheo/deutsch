import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { SpeakText } from '../../components/UI';
import { speak } from '../../speech';

export default function ListeningLesson({ lesson }) {
  const { exercises } = lesson.content;
  const [showScript, setShowScript] = useState({});
  const [showTranslation, setShowTranslation] = useState({});

  return (
    <div className="space-y-4">
      <div className="tip-box">
        <p className="tip-text">🎧 {lesson.content.descriptionEn}</p>
        <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">Click "Play" to hear the dialogue, then answer the questions.</p>
      </div>
      {exercises?.map((ex, i) => (
        <div key={i} className="card space-y-3">
          <div>
            <SpeakText text={ex.title} className="text-yellow-600 dark:text-yellow-400 font-bold text-lg" />
            <div className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{ex.titleEn}</div>
          </div>

          <button className="btn-primary flex items-center gap-2" onClick={() => speak(ex.script, 'de-DE', 0.8)}>
            <Volume2 size={16} strokeWidth={2.5} /> Play Dialogue
          </button>

          <div className="flex gap-2">
            <button className="btn-secondary text-xs" onClick={() => setShowScript(s => ({ ...s, [i]: !s[i] }))}>
              {showScript[i] ? 'Hide' : 'Show'} Script
            </button>
            <button className="btn-secondary text-xs" onClick={() => setShowTranslation(s => ({ ...s, [i]: !s[i] }))}>
              {showTranslation[i] ? 'Hide' : 'Show'} Translation
            </button>
          </div>

          {showScript[i] && (
            <div className="panel p-4 space-y-1">
              {ex.script.split('\n').map((line, li) => (
                <div key={li}>
                  <SpeakText text={line} className="text-gray-800 dark:text-gray-200 text-sm" />
                </div>
              ))}
            </div>
          )}

          {showTranslation[i] && (
            <div className="tip-box space-y-1">
              {ex.translation.split('\n').map((line, li) => (
                <div key={li} className="tip-text text-sm">{line}</div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
