import React, { useState } from 'react';
import { SpeakText } from '../../components/UI';

export default function ReadingLesson({ lesson }) {
  const { texts } = lesson.content;
  const [showTranslation, setShowTranslation] = useState({});
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState({});

  return (
    <div className="space-y-6">
      {texts?.map((text, ti) => (
        <div key={ti} className="card space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <SpeakText text={text.title} className="text-yellow-600 dark:text-yellow-400 font-bold text-xl" />
              <div className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{text.titleEn}</div>
            </div>
            <button onClick={() => setShowTranslation(s => ({ ...s, [ti]: !s[ti] }))} className="btn-secondary text-xs">
              {showTranslation[ti] ? 'Hide' : 'Show'} Translation
            </button>
          </div>

          {/* German text */}
          <div className="panel p-4">
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-base">
              {text.text.split('. ').map((sentence, si) => (
                <SpeakText key={si}
                  text={sentence + (si < text.text.split('. ').length - 1 ? '.' : '')}
                  className="hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors cursor-pointer"
                  showIcon={false}
                />
              )).reduce((acc, el, i) => i === 0 ? [el] : [...acc, ' ', el], [])}
            </p>
          </div>

          {showTranslation[ti] && (
            <div className="tip-box">
              <p className="tip-text leading-relaxed">{text.translation}</p>
            </div>
          )}

          {/* Questions */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-3">❓ Comprehension Questions</h3>
            <div className="space-y-3">
              {text.questions?.map((q, qi) => (
                <div key={qi} className="panel p-3">
                  <SpeakText text={q.q} className="text-gray-800 dark:text-gray-200 font-medium" />
                  <div className="text-gray-500 dark:text-gray-500 text-xs mb-2">{q.qEn}</div>
                  <div className="flex gap-2">
                    <input className="input text-sm flex-1" placeholder="Your answer..."
                      value={answers[`${ti}-${qi}`] || ''}
                      onChange={e => setAnswers(a => ({ ...a, [`${ti}-${qi}`]: e.target.value }))} />
                    <button className="btn-secondary text-xs px-3"
                      onClick={() => setChecked(c => ({ ...c, [`${ti}-${qi}`]: true }))}>Check</button>
                  </div>
                  {checked[`${ti}-${qi}`] && (
                    <div className="mt-2 text-sm flex items-center gap-1">
                      <span className="text-gray-500 dark:text-gray-500">Answer:</span>
                      <SpeakText text={q.a} className="text-green-600 dark:text-green-400 font-semibold" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
