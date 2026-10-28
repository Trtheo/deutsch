import React from 'react';
import { SpeakText } from '../../components/UI';

export default function NumbersLesson({ lesson }) {
  const { numbers } = lesson.content;
  return (
    <div className="space-y-4">
      <div className="tip-box">
        <p className="tip-text">💡 Click any number card to hear how it's pronounced in German!</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {numbers.map((n, i) => (
          <div key={i} className="card hover:border-yellow-400 dark:hover:border-yellow-400/50 hover:shadow-md transition-all cursor-pointer text-center p-4">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{n.num}</div>
            <SpeakText text={n.de} className="text-yellow-600 dark:text-yellow-400 font-semibold text-lg" showIcon={false} />
            <div className="text-gray-500 dark:text-gray-500 text-sm mt-0.5">{n.en}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-gray-900 dark:text-white font-bold mb-3">📐 Number Patterns</h2>
        <div className="space-y-2 text-sm">
          {[
            { rule: '13–19: add -zehn', ruleEn: 'Teens: add -zehn (like -teen in English)', ex: 'drei + zehn = dreizehn (13)' },
            { rule: '20–90: add -zig', ruleEn: 'Tens: add -zig (like -ty in English)', ex: 'vier + zig = vierzig (40)' },
            { rule: '21–99: ones + und + tens', ruleEn: 'Compound: ones first, then tens', ex: 'ein + und + zwanzig = einundzwanzig (21)' },
          ].map((p, i) => (
            <div key={i} className="panel p-3">
              <SpeakText text={p.rule} className="text-yellow-600 dark:text-yellow-400 font-semibold" />
              <div className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">{p.ruleEn}</div>
              <div className="text-gray-400 dark:text-gray-500 text-xs mt-1 font-mono">{p.ex}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
