import React, { useState } from 'react';
import { SpeakText } from '../../components/UI';
import { speak } from '../../speech';
import { Volume2, Heart, Search, X } from 'lucide-react';

const TABS = ['Flashcards', 'Word List', 'Phrase Book'];

export default function VocabularyLesson({ lesson }) {
  const { words, phraseBook = [] } = lesson.content;
  const [tab, setTab] = useState(0);

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all
              ${tab === i
                ? 'bg-white dark:bg-gray-900 text-yellow-600 dark:text-yellow-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && <Flashcards words={words} />}
      {tab === 1 && <WordList words={words} />}
      {tab === 2 && <PhraseBook phraseBook={phraseBook} />}
    </div>
  );
}

/* ── Flashcards ── */
function Flashcards({ words }) {
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const word = words[cardIdx];

  return (
    <div className="card text-center space-y-4">
      <div className="text-gray-500 dark:text-gray-400 text-sm">
        Card {cardIdx + 1} / {words.length} — tap to flip
      </div>
      <div
        className="cursor-pointer mx-auto max-w-sm min-h-40 rounded-2xl flex flex-col items-center justify-center p-6
          border-2 border-yellow-300 dark:border-yellow-400/30
          bg-yellow-50 dark:bg-yellow-400/5
          hover:bg-yellow-100 dark:hover:bg-yellow-400/10
          transition-all duration-200 select-none"
        onClick={() => setFlipped(f => !f)}
      >
        {!flipped ? (
          <>
            <SpeakText text={word.de} className="text-4xl font-bold text-yellow-600 dark:text-yellow-400" showIcon={false} />
            <div className="text-gray-500 dark:text-gray-500 text-sm mt-3">🇩🇪 German → 🇬🇧 English</div>
            <div className="text-gray-400 dark:text-gray-600 text-xs mt-2">Tap to reveal</div>
          </>
        ) : (
          <>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{word.en}</div>
            <SpeakText text={word.example} className="text-gray-500 dark:text-gray-400 text-sm mt-3 italic" showIcon={true} />
            <div className="text-gray-400 dark:text-gray-500 text-xs mt-1">{word.exampleEn}</div>
          </>
        )}
      </div>
      <div className="flex gap-3 justify-center">
        <button className="btn-secondary" onClick={() => { setCardIdx(i => Math.max(0, i - 1)); setFlipped(false); }}>← Prev</button>
        <button className="btn-primary" onClick={() => { setCardIdx(i => Math.min(words.length - 1, i + 1)); setFlipped(false); }}>Next →</button>
      </div>
    </div>
  );
}

/* ── Word List ── */
function WordList({ words }) {
  return (
    <div className="card">
      <h2 className="text-gray-900 dark:text-white font-bold mb-4">
        📋 Word List — <span className="text-gray-500 dark:text-gray-400 font-normal text-sm">Click German words to hear them</span>
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="th-base">🇩🇪 German</th>
              <th className="th-base">🇬🇧 English</th>
              <th className="th-base hidden md:table-cell">Example</th>
            </tr>
          </thead>
          <tbody>
            {words.map((w, i) => (
              <tr key={i} className="tr-base">
                <td className="py-3">
                  <SpeakText text={w.de} className="text-yellow-600 dark:text-yellow-400 font-semibold" />
                </td>
                <td className="py-3 text-gray-700 dark:text-gray-300">{w.en}</td>
                <td className="py-3 hidden md:table-cell">
                  <SpeakText text={w.example} className="text-gray-600 dark:text-gray-400 text-xs" />
                  <div className="text-gray-400 dark:text-gray-600 text-xs">{w.exampleEn}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Phrase Book ── */
function PhraseBook({ phraseBook }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('phraseFavorites') || '[]'); }
    catch { return []; }
  });

  const toggleFav = (key) => {
    setFavorites(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      localStorage.setItem('phraseFavorites', JSON.stringify(next));
      return next;
    });
  };

  const categories = ['All', 'Favorites', ...phraseBook.map(c => c.category)];

  const filtered = phraseBook
    .map(cat => ({
      ...cat,
      phrases: cat.phrases.filter(p => {
        const key = `${cat.category}|${p.de}`;
        const matchSearch = !search || p.de.toLowerCase().includes(search.toLowerCase()) || p.en.toLowerCase().includes(search.toLowerCase());
        const matchCat = activeCategory === 'All' || activeCategory === cat.category;
        const matchFav = activeCategory !== 'Favorites' || favorites.includes(key);
        return matchSearch && matchCat && matchFav;
      })
    }))
    .filter(cat => cat.phrases.length > 0);

  if (phraseBook.length === 0) {
    return (
      <div className="card text-center py-10 text-gray-500 dark:text-gray-400">
        Phrase book not available. Restart the backend to reseed the data.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9 pr-9"
          placeholder="Search phrases in German or English..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 flex-nowrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
              ${activeCategory === cat
                ? 'bg-yellow-400 text-gray-900'
                : cat === 'Favorites'
                  ? 'bg-pink-100 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-500/20'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            {cat === 'Favorites' ? `❤️ Favorites (${favorites.length})` : cat}
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="card text-center py-8 text-gray-500 dark:text-gray-400">
          No phrases found{search ? ` for "${search}"` : ''}.
        </div>
      ) : (
        filtered.map(cat => (
          <div key={cat.category} className="card space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{cat.emoji}</span>
              <div>
                <div className="text-gray-900 dark:text-white font-bold">{cat.category}</div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">{cat.categoryDe}</div>
              </div>
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-600">{cat.phrases.length} phrases</span>
            </div>
            <div className="space-y-2">
              {cat.phrases.map((p, i) => {
                const key = `${cat.category}|${p.de}`;
                const isFav = favorites.includes(key);
                return (
                  <div key={i} className="panel p-3 flex items-start gap-3 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-yellow-600 dark:text-yellow-400 font-semibold">{p.de}</span>
                        {p.note && (
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-full">{p.note}</span>
                        )}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">{p.en}</div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => speak(p.de, 'de-DE', 0.8)}
                        className="w-8 h-8 rounded-full bg-yellow-400 text-gray-900 flex items-center justify-center
                          opacity-80 hover:opacity-100 hover:scale-110 transition-all"
                      >
                        <Volume2 size={14} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => toggleFav(key)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
                          ${isFav
                            ? 'bg-pink-100 dark:bg-pink-500/20 text-pink-500'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-pink-500'}`}
                      >
                        <Heart size={14} strokeWidth={2.5} fill={isFav ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
