import React, { useState, useEffect, useCallback } from 'react';
import { getLessons } from '../api';
import { SpeakText } from '../components/UI';
import { RotateCcw, ThumbsUp, ThumbsDown, Shuffle, ChevronDown } from 'lucide-react';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCards(lessons) {
  const cards = [];
  for (const l of lessons) {
    const words = l.content?.words || [];
    for (const w of words) {
      if (w.de && w.en) cards.push({ de: w.de, en: w.en, example: w.example, exampleEn: w.exampleEn, lesson: l.title });
    }
  }
  return cards;
}

export default function FlashcardsPage() {
  const [allLessons, setAllLessons] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState('all');
  const [deck, setDeck] = useState([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    getLessons().then(r => setAllLessons(r.data)).catch(() => {});
  }, []);

  const startDeck = useCallback((slug) => {
    const source = slug === 'all' ? allLessons : allLessons.filter(l => l.slug === slug);
    const cards = shuffle(buildCards(source));
    setDeck(cards);
    setIdx(0);
    setFlipped(false);
    setKnown(0);
    setUnknown(0);
    setDone(false);
  }, [allLessons]);

  useEffect(() => {
    if (allLessons.length > 0) startDeck(selectedSlug);
  }, [allLessons]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = (correct) => {
    if (correct) setKnown(k => k + 1);
    else setUnknown(u => u + 1);
    const next = idx + 1;
    if (next >= deck.length) {
      setDone(true);
    } else {
      setIdx(next);
      setFlipped(false);
    }
  };

  const restart = () => startDeck(selectedSlug);

  const card = deck[idx];
  const total = deck.length;
  const pct = total > 0 ? Math.round(((known + unknown) / total) * 100) : 0;

  const lessonsWithWords = allLessons.filter(l => (l.content?.words?.length || 0) > 0);

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Flashcards</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Drill vocabulary — tap card to flip, mark Known or Unknown</p>
      </div>

      {/* Lesson picker */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <select
            className="input pr-8 appearance-none"
            value={selectedSlug}
            onChange={e => { setSelectedSlug(e.target.value); startDeck(e.target.value); }}
          >
            <option value="all">All Lessons ({buildCards(allLessons).length} cards)</option>
            {lessonsWithWords.map(l => (
              <option key={l.slug} value={l.slug}>{l.title} ({l.content.words.length} cards)</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <button
          onClick={restart}
          className="btn-secondary flex items-center gap-1.5 text-sm flex-shrink-0"
          title="Shuffle & restart"
        >
          <Shuffle size={14} /> Shuffle
        </button>
      </div>

      {total === 0 ? (
        <div className="card text-center py-12 text-gray-500 dark:text-gray-400">
          No vocabulary cards available for this lesson yet.
        </div>
      ) : done ? (
        /* ── Summary ── */
        <div className="card text-center space-y-4 py-8">
          <div className="text-5xl">🎉</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">Deck Complete!</div>
          <div className="flex justify-center gap-6 text-sm">
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-bold text-green-500">{known}</span>
              <span className="text-gray-500 dark:text-gray-400">Known ✓</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-bold text-red-500">{unknown}</span>
              <span className="text-gray-500 dark:text-gray-400">Unknown ✗</span>
            </div>
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            {Math.round((known / total) * 100)}% accuracy
          </div>
          <button className="btn-primary flex items-center gap-2 mx-auto" onClick={restart}>
            <RotateCcw size={14} /> Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Card {idx + 1} of {total}</span>
              <span className="flex gap-3">
                <span className="text-green-500 font-semibold">✓ {known}</span>
                <span className="text-red-500 font-semibold">✗ {unknown}</span>
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5">
              <div className="bg-yellow-400 h-1.5 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Card */}
          <div
            className={`cursor-pointer min-h-52 rounded-2xl flex flex-col items-center justify-center p-8 text-center
              border-2 transition-all duration-200 select-none
              ${flipped
                ? 'border-green-300 dark:border-green-500/40 bg-green-50 dark:bg-green-500/5'
                : 'border-yellow-300 dark:border-yellow-400/30 bg-yellow-50 dark:bg-yellow-400/5 hover:bg-yellow-100 dark:hover:bg-yellow-400/10'
              }`}
            onClick={() => !flipped && setFlipped(true)}
          >
            {!flipped ? (
              <>
                <SpeakText text={card.de} className="text-4xl font-bold text-yellow-600 dark:text-yellow-400" showIcon={false} />
                {card.lesson && (
                  <div className="text-gray-400 dark:text-gray-600 text-xs mt-3">{card.lesson}</div>
                )}
                <div className="text-gray-400 dark:text-gray-600 text-xs mt-2">Tap to reveal</div>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{card.en}</div>
                <SpeakText text={card.de} className="text-yellow-600 dark:text-yellow-400 font-semibold" showIcon={true} />
                {card.example && (
                  <div className="mt-3 space-y-0.5">
                    <SpeakText text={card.example} className="text-gray-500 dark:text-gray-400 text-sm italic" showIcon={false} />
                    {card.exampleEn && <div className="text-gray-400 dark:text-gray-600 text-xs">{card.exampleEn}</div>}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Know / Don't Know buttons — only show after flip */}
          {flipped ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleAnswer(false)}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm
                  bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400
                  border border-red-200 dark:border-red-500/20
                  hover:bg-red-200 dark:hover:bg-red-500/20 active:scale-95 transition-all"
              >
                <ThumbsDown size={16} /> Don't Know
              </button>
              <button
                onClick={() => handleAnswer(true)}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm
                  bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400
                  border border-green-200 dark:border-green-500/20
                  hover:bg-green-200 dark:hover:bg-green-500/20 active:scale-95 transition-all"
              >
                <ThumbsUp size={16} /> Know It
              </button>
            </div>
          ) : (
            <p className="text-center text-gray-400 dark:text-gray-600 text-sm">Tap the card to reveal the answer</p>
          )}
        </>
      )}
    </div>
  );
}
