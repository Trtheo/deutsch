import React, { useState } from 'react';
import { SpeakText } from '../../components/UI';
import { speak } from '../../speech';

// Renders topic, certificate and AI lessons: key points, vocabulary sections, grammar boxes, dialogue.
// Verb lessons use it too, below their conjugation table.
export default function TopicLesson({ lesson }) {
  const { sections, keyPoints, grammar, dialogue } = lesson.content;
  const [showDialogueEn, setShowDialogueEn] = useState(false);

  return (
    <div className="space-y-5">

      {/* Key Points */}
      {keyPoints?.length > 0 && (
        <div className="card border-yellow-300 dark:border-yellow-400/20 bg-yellow-50 dark:bg-yellow-400/5">
          <h2 className="text-gray-900 dark:text-white font-bold mb-3">🎯 Key Points</h2>
          <ul className="space-y-1.5">
            {keyPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-yellow-500 mt-0.5 flex-shrink-0">✦</span>
                {pt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sections */}
      {sections?.map((sec, si) => (
        <div key={si} className="card">
          <div className="mb-4">
            <h2 className="text-gray-900 dark:text-white font-bold text-lg">
              <SpeakText text={sec.heading} className="text-yellow-600 dark:text-yellow-400" showIcon={false} />
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{sec.headingEn}</p>
          </div>

          <div className="space-y-3">
            {sec.items?.map((item, ii) => (
              <div key={ii} className="panel p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <SpeakText
                        text={item.de}
                        className="text-yellow-600 dark:text-yellow-400 font-bold text-lg"
                        showIcon={false}
                      />
                      <span className="text-gray-400 dark:text-gray-500 text-xs">🔊 click to hear</span>
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 font-medium mt-0.5">{item.en}</div>
                    {item.note && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                        {item.note}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => speak(item.de, 'de-DE', 0.8)}
                    className="btn-secondary text-xs px-3 flex-shrink-0"
                  >
                    🔊
                  </button>
                </div>

                {item.example && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <SpeakText
                      text={item.example}
                      className="text-gray-700 dark:text-gray-300 text-sm italic"
                    />
                    <div className="text-gray-500 dark:text-gray-500 text-xs mt-0.5">{item.exampleEn}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Grammar */}
      {grammar?.map((g, gi) => (
        <div key={gi} className="card border-blue-200 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5">
          <h2 className="text-gray-900 dark:text-white font-bold text-lg">📐 {g.title}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{g.titleEn}</p>
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">{g.explanation}</p>
          <div className="space-y-2">
            {g.examples?.map((ex, ei) => (
              <div key={ei} className="panel px-4 py-2.5">
                <SpeakText text={ex.de} className="text-gray-800 dark:text-gray-200 font-medium" />
                <div className="text-gray-500 text-xs mt-0.5">{ex.en}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Dialogue */}
      {dialogue && (
        <div className="card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="text-gray-900 dark:text-white font-bold text-lg">
                🎭 <SpeakText text={dialogue.title} className="text-yellow-600 dark:text-yellow-400" showIcon={false} />
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{dialogue.titleEn}</p>
            </div>
            <div className="flex gap-2">
              <button
                className="btn-primary text-xs"
                onClick={() => speak(dialogue.lines.map(l => `${l.speaker}: ${l.de}`).join('. '), 'de-DE', 0.8)}
              >
                🔊 Play All
              </button>
              <button
                className="btn-secondary text-xs"
                onClick={() => setShowDialogueEn(s => !s)}
              >
                {showDialogueEn ? 'Hide' : 'Show'} Translation
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {dialogue.lines?.map((line, li) => (
              <div key={li} className={`flex gap-3 items-start p-3 rounded-xl
                ${line.speaker === 'A'
                  ? 'bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10'
                  : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50'}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${line.speaker === 'A' ? 'bg-blue-500 text-white' : 'bg-gray-400 dark:bg-gray-600 text-white'}`}>
                  {line.speaker}
                </span>
                <div className="flex-1">
                  <SpeakText text={line.de} className="text-gray-800 dark:text-gray-200 font-medium" />
                  {showDialogueEn && (
                    <div className="text-gray-500 dark:text-gray-500 text-xs mt-0.5">{line.en}</div>
                  )}
                </div>
                <button onClick={() => speak(line.de, 'de-DE', 0.8)} className="text-gray-400 hover:text-yellow-500 transition-colors text-sm flex-shrink-0">
                  🔊
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
