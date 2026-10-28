import React from 'react';
import { SpeakText } from '../../components/UI';

export default function AlphabetLesson({ lesson }) {
  const { letters } = lesson.content;
  return (
    <div className="space-y-4">
      <div className="tip-box">
        <p className="tip-text">💡 <strong>Tip:</strong> Click any letter card to hear its German pronunciation!</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {letters.map((l, i) => (
          <div key={i} className="card hover:border-yellow-400 dark:hover:border-yellow-400/50 hover:shadow-md transition-all text-center cursor-pointer group p-4">
            <SpeakText text={l.letter.split(' ')[0]} className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 block mb-1" showIcon={false} />
            <div className="text-gray-500 dark:text-gray-400 text-xs font-mono">{l.ipa}</div>
            <div className="text-gray-400 dark:text-gray-500 text-xs mt-1">[{l.sound}]</div>
            <div className="text-gray-400 dark:text-gray-600 text-xs mt-1 truncate">{l.example}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-gray-900 dark:text-white font-bold mb-3">🔡 Special German Characters</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {letters.filter(l => ['Ä', 'Ö', 'Ü', 'ß'].includes(l.letter.split(' ')[0])).map((l, i) => (
            <div key={i} className="bg-yellow-50 dark:bg-yellow-400/5 border border-yellow-200 dark:border-yellow-400/20 rounded-xl p-4 text-center">
              <SpeakText text={l.letter.split(' ')[0]} className="text-4xl font-bold text-yellow-600 dark:text-yellow-400" showIcon={false} />
              <div className="text-gray-600 dark:text-gray-300 text-sm mt-2 font-medium">{l.sound}</div>
              <div className="text-gray-500 dark:text-gray-500 text-xs mt-1">{l.example}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
