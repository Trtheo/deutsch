import React from 'react';
import { SpeakText } from '../../components/UI';

export default function GrammarLesson({ lesson }) {
  const { rules, examples } = lesson.content;
  return (
    <div className="space-y-4">
      <div className="tip-box">
        <p className="tip-text">💡 <strong>English tip:</strong> {lesson.content.descriptionEn}</p>
      </div>

      {rules?.map((rule, ri) => (
        <div key={ri} className="card">
          <h2 className="text-gray-900 dark:text-white font-bold mb-0.5">{rule.title}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{rule.titleEn}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="th-base text-left">Case</th>
                  <th className="th-base text-center text-blue-600 dark:text-blue-400">Masculine</th>
                  <th className="th-base text-center text-pink-600 dark:text-pink-400">Feminine</th>
                  <th className="th-base text-center text-green-600 dark:text-green-400">Neuter</th>
                  <th className="th-base text-center text-yellow-600 dark:text-yellow-400">Plural</th>
                </tr>
              </thead>
              <tbody>
                {rule.rows.map((row, i) => (
                  <tr key={i} className="tr-base">
                    <td className="py-2.5 text-gray-600 dark:text-gray-400 font-medium">{row.case}</td>
                    <td className="py-2.5 text-center"><SpeakText text={row.masc} className="text-blue-600 dark:text-blue-300 font-bold" /></td>
                    <td className="py-2.5 text-center"><SpeakText text={row.fem} className="text-pink-600 dark:text-pink-300 font-bold" /></td>
                    <td className="py-2.5 text-center"><SpeakText text={row.neut} className="text-green-600 dark:text-green-300 font-bold" /></td>
                    <td className="py-2.5 text-center"><SpeakText text={row.plural} className="text-yellow-600 dark:text-yellow-300 font-bold" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="card">
        <h2 className="text-gray-900 dark:text-white font-bold mb-3">📝 Examples — Click to hear!</h2>
        <div className="space-y-2">
          {examples?.map((ex, i) => (
            <div key={i} className="panel p-3">
              <SpeakText text={ex.de} className="text-yellow-600 dark:text-yellow-400 font-semibold" />
              <div className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">{ex.en}</div>
              <span className="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full mt-1.5 inline-block">{ex.note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
