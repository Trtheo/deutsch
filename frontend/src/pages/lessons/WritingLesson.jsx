import React, { useState } from 'react';
import { SpeakText } from '../../components/UI';

export default function WritingLesson({ lesson }) {
  const { exercises } = lesson.content;
  const [texts, setTexts] = useState({});
  const [showExample, setShowExample] = useState({});

  return (
    <div className="space-y-4">
      <div className="tip-box">
        <p className="tip-text">✍️ {lesson.content.descriptionEn}</p>
      </div>
      {exercises?.map((ex, i) => (
        <div key={i} className="card space-y-3">
          <div>
            <SpeakText text={ex.prompt} className="text-yellow-600 dark:text-yellow-400 font-bold" />
            <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">{ex.promptEn}</div>
          </div>
          <textarea
            className="input min-h-28 resize-y text-sm"
            placeholder="Write your answer in German here..."
            value={texts[i] || ''}
            onChange={e => setTexts(t => ({ ...t, [i]: e.target.value }))}
          />
          <div className="flex gap-2">
            <button className="btn-secondary text-xs" onClick={() => setShowExample(s => ({ ...s, [i]: !s[i] }))}>
              {showExample[i] ? 'Hide' : 'Show'} Example
            </button>
            {texts[i] && <button className="btn-primary text-xs">✓ Save</button>}
          </div>
          {showExample[i] && (
            <div className="bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/20 rounded-xl p-3">
              <div className="text-gray-500 dark:text-gray-500 text-xs mb-1">Example answer:</div>
              <SpeakText text={ex.example} className="text-green-700 dark:text-green-400 text-sm" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
