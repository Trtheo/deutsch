import React, { useState } from 'react';
import { SpeakText } from '../../components/UI';
import TopicLesson from './TopicLesson';

export default function VerbsLesson({ lesson }) {
  const { verbs } = lesson.content;
  const [selected, setSelected] = useState(0);
  const verb = verbs[selected];
  const pronouns = [
    { pro: 'ich', en: 'I' }, { pro: 'du', en: 'you (informal)' },
    { pro: 'er/sie/es', en: 'he/she/it' }, { pro: 'wir', en: 'we' },
    { pro: 'ihr', en: 'you (plural)' }, { pro: 'sie/Sie', en: 'they/you (formal)' }
  ];
  const conjKeys = ['ich', 'du', 'er', 'wir', 'ihr', 'sie'];

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-gray-900 dark:text-white font-bold mb-3">Select a Verb</h2>
        <div className="flex flex-wrap gap-2">
          {verbs.map((v, i) => (
            <button key={i} onClick={() => setSelected(i)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all
                ${selected === i
                  ? 'bg-yellow-400 text-gray-900 shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {v.infinitive} — {v.en}
            </button>
          ))}
        </div>
      </div>

      {verb && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <SpeakText text={verb.infinitive} className="text-3xl font-bold text-yellow-600 dark:text-yellow-400" showIcon={false} />
            <div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">{verb.en}</div>
              <div className="text-gray-400 dark:text-gray-600 text-xs">Click any form to hear it</div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {pronouns.map((p, i) => (
              <div key={i} className="panel p-3">
                <div className="text-gray-500 dark:text-gray-500 text-xs mb-1">{p.pro} <span className="text-gray-400 dark:text-gray-600">({p.en})</span></div>
                <SpeakText
                  text={`${p.pro === 'er/sie/es' ? 'er' : p.pro === 'sie/Sie' ? 'sie' : p.pro} ${verb.conjugation[conjKeys[i]]}`}
                  className="text-yellow-600 dark:text-yellow-400 font-bold text-lg"
                  showIcon={false}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-gray-900 dark:text-white font-bold mb-3">📋 All Verbs Overview</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="th-base">Infinitive</th>
                <th className="th-base">English</th>
                <th className="th-base">ich</th>
                <th className="th-base">du</th>
                <th className="th-base">er/sie</th>
              </tr>
            </thead>
            <tbody>
              {verbs.map((v, i) => (
                <tr key={i} className="tr-base">
                  <td className="py-2.5"><SpeakText text={v.infinitive} className="text-yellow-600 dark:text-yellow-400 font-semibold" /></td>
                  <td className="py-2.5 text-gray-600 dark:text-gray-400">{v.en}</td>
                  <td className="py-2.5"><SpeakText text={v.conjugation.ich} className="text-gray-700 dark:text-gray-300" /></td>
                  <td className="py-2.5"><SpeakText text={v.conjugation.du} className="text-gray-700 dark:text-gray-300" /></td>
                  <td className="py-2.5"><SpeakText text={v.conjugation.er} className="text-gray-700 dark:text-gray-300" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key points, grammar, examples and dialogue (newer verb lessons) */}
      <TopicLesson lesson={lesson} />
    </div>
  );
}
