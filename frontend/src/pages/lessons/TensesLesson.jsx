import React from 'react';
import { SpeakText } from '../../components/UI';

export default function TensesLesson({ lesson }) {
  const { tenses } = lesson.content;
  return (
    <div className="space-y-4">
      <div className="tip-box">
        <p className="tip-text">💡 {lesson.content.descriptionEn}</p>
      </div>
      {tenses?.map((t, i) => (
        <div key={i} className="card">
          <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
            <div>
              <SpeakText text={t.name} className="text-yellow-600 dark:text-yellow-400 font-bold text-lg" />
              <div className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">{t.nameEn}</div>
            </div>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-full">
              {t.usage}
            </span>
          </div>
          <div className="panel p-4">
            <SpeakText text={t.example} className="text-gray-900 dark:text-white font-semibold text-lg" />
            <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t.exampleEn}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
