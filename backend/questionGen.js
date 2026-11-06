// Exam questions generated from the lesson content itself (no AI). Every question is built from
// hand-checked lesson data, so it is correct by construction: vocabulary, example sentences,
// dialogues, nouns with articles and verb tables. Built once at start-up and kept in memory,
// so picking random questions is instant.
const PARTS = ['filling', 'writing', 'speaking', 'reading', 'listening'];

const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const norm = s => String(s || '').trim().toLowerCase();
const NOUN = /^(der|die|das) ([A-ZÄÖÜ][a-zäöüß]+(?:-[A-ZÄÖÜa-zäöüß]+)?)$/;
const PRONOUNS = { ich: 'ich', du: 'du', er: 'er/sie/es', wir: 'wir', ihr: 'ihr', sie: 'sie/Sie' };
const GENDER = { der: 'masculine', die: 'feminine', das: 'neuter' };

// Ending rules that help learners guess a noun's gender (only shown when the rule fits)
const GENDER_HINTS = [
  [/(ung|heit|keit|schaft|ion|tät|ik|ei|ie)$/, 'die', 'Nouns ending in -ung, -heit, -keit, -schaft, -ion, -tät, -ik or -ei are almost always feminine (die).'],
  [/(chen|lein|ment|um)$/, 'das', 'Nouns ending in -chen, -lein, -ment or -um are usually neuter (das).'],
  [/(ling|ismus|or)$/, 'der', 'Nouns ending in -ling, -ismus or -or are usually masculine (der).'],
];

// ── Collect each lesson's material in one shape ──────────
function lessonMaterial(lesson) {
  const c = lesson.content || {};
  const vocab = [];
  const sentences = [];
  const add = (de, en) => { if (de && en && de.length < 220) sentences.push({ de: de.trim(), en: en.trim() }); };

  for (const s of c.sections || []) {
    for (const it of s.items || []) {
      if (it.de && it.en) vocab.push({ de: it.de.trim(), en: it.en.trim(), note: it.note || '', example: it.example, exampleEn: it.exampleEn });
      add(it.example, it.exampleEn);
    }
  }
  for (const w of c.words || []) {
    if (w.de && w.en) vocab.push({ de: w.de.trim(), en: w.en.trim(), note: '', example: w.example, exampleEn: w.exampleEn });
    add(w.example, w.exampleEn);
  }
  for (const group of c.phraseBook || []) for (const p of group.phrases || []) add(p.de, p.en);
  for (const p of c.phrases || []) add(p.de, p.en);
  for (const line of c.dialogue?.lines || []) add(line.de, line.en);
  for (const g of c.grammar || []) for (const ex of g.examples || []) add(ex.de, ex.en);
  for (const ex of c.examples || []) add(ex.de, ex.en?.replace(/\s*\([^)]*\)\s*$/, ''));
  for (const t of c.tenses || []) add(t.example, t.exampleEn);
  // Numbers lesson: { num, de, en }; alphabet: { example: 'Apfel (apple)' }
  for (const n of c.numbers || []) if (n.de && n.en) vocab.push({ de: String(n.de).trim(), en: String(n.en).trim(), note: String(n.num ?? '') });
  for (const l of c.letters || []) {
    const m = /^(.+?)\s*\(([^)]+)\)$/.exec(l.example || '');
    if (m) vocab.push({ de: m[1].trim(), en: m[2].trim(), note: '' });
  }

  // the same sentence can appear in several places
  const seen = new Set();
  const unique = sentences.filter(s => !seen.has(norm(s.de)) && seen.add(norm(s.de)));
  return {
    slug: lesson.slug, title: lesson.title, level: lesson.level,
    vocab, sentences: unique,
    verbs: (c.verbs || []).filter(v => v.infinitive && v.conjugation),
  };
}

// What kind of text an answer is, so wrong options look like the right one (a word next to
// words, a noun next to nouns, a sentence next to sentences) and can't be guessed by their shape
function kind(s) {
  const t = String(s).trim();
  if (NOUN.test(t) || /^the [a-z]/i.test(t)) return 'noun';
  const words = t.split(/\s+/).length;
  if (/[.!?]$/.test(t) || words >= 5) return 'sentence';
  return words === 1 ? 'word' : 'phrase';
}
const wordsOf = s => new Set(norm(s).replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(w => w.length > 2));
// Cached: the same candidates are looked at many times while the pools are built
const memo = fn => { const cache = new Map(); return s => { if (!cache.has(s)) cache.set(s, fn(s)); return cache.get(s); }; };
const kindOf = memo(kind);
const wordSetOf = memo(wordsOf);
function sampleOf(list, k) {
  if (list.length <= k) return shuffle(list);
  const picked = new Set();
  while (picked.size < k) picked.add(Math.floor(Math.random() * list.length));
  return [...picked].map(i => list[i]);
}

// Distinct wrong answers, preferring the same kind as the answer. With `similar`, sentences that
// share words with the answer come first (a real listening test, not just picking the odd one out).
function distractors(answer, candidates, n, sameMeaningAs = [], { similar = false, local = [] } = {}) {
  const avoid = new Set([norm(answer), ...sameMeaningAs.map(norm)]);
  const k = kindOf(answer);
  // A random sample instead of the whole level pool (thousands of items): fast and still varied
  // The lesson's own words come first (same topic, so a real choice), then the level's
  let ordered = [...shuffle(local), ...sampleOf(candidates, similar ? 600 : 120)];
  if (similar) {
    const target = wordSetOf(answer);
    const overlap = c => { let x = 0; for (const w of wordSetOf(c)) if (target.has(w)) x++; return x; };
    ordered = ordered.map(c => [c, overlap(c)]).sort((a, b) => b[1] - a[1]).map(([c]) => c);
  }
  ordered = [...ordered.filter(c => kindOf(c) === k), ...ordered.filter(c => kindOf(c) !== k)];
  const out = [];
  for (const c of ordered) {
    const key = norm(c);
    if (!c || avoid.has(key)) continue;
    avoid.add(key);
    out.push(c);
    if (out.length === n) break;
  }
  return out;
}

const choice = (base, answer, wrong) => (wrong.length >= 2 ? { ...base, answer, options: shuffle([answer, ...wrong]) } : null);

// ── Generators ───────────────────────────────────────────
function generateForLesson(m, levelPool) {
  const out = { filling: [], writing: [], speaking: [], reading: [], listening: [] };
  const push = (part, q) => q && out[part].push({ ...q, generated: true, lessonSlug: m.slug, level: m.level });
  const lessonEn = m.vocab.map(v => v.en);
  const lessonDe = m.vocab.map(v => v.de);
  const clean = list => list.filter(x => !x.includes(' / '));
  const poolEn = clean([...lessonEn, ...levelPool.vocab.map(v => v.en)]);
  const poolDe = clean([...lessonDe, ...levelPool.vocab.map(v => v.de)]);
  // German words that share an English meaning would make two options correct
  const sameEn = en => m.vocab.filter(v => norm(v.en) === norm(en)).map(v => v.de);
  const sameDe = de => m.vocab.filter(v => norm(v.de) === norm(de)).map(v => v.en);

  for (const v of m.vocab) {
    // 'open / closed' style pairs make confusing options
    if (v.de.includes(' / ') || v.en.includes(' / ')) continue;
    const where = ` (Lesson: ${m.title})`;
    // Meaning, German → English
    push('filling', choice({
      type: 'fill', question: `Was bedeutet „${v.de}“?`, questionEn: `What does “${v.de}” mean?`,
      explanation: `„${v.de}“ = ${v.en}`, explanationEn: `“${v.de}” means “${v.en}”.${v.example ? ` Example: ${v.example}` : ''}${where}`,
    }, v.en, distractors(v.en, poolEn, 3, sameDe(v.de), { local: clean(lessonEn) })));
    // Meaning, English → German
    push('filling', choice({
      type: 'fill', question: `Wie sagt man „${v.en}“ auf Deutsch?`, questionEn: `How do you say “${v.en}” in German?`,
      explanation: `${v.en} = ${v.de}`, explanationEn: `“${v.en}” in German is “${v.de}”.${v.example ? ` Example: ${v.example}` : ''}${where}`,
    }, v.de, distractors(v.de, poolDe, 3, sameEn(v.en), { local: clean(lessonDe) })));

    const noun = v.de.match(NOUN);
    if (noun) {
      const [, article, word] = noun;
      const hint = GENDER_HINTS.find(([re, g]) => re.test(word) && g === article);
      const plural = (v.note.match(/pl\.\s*([^;,)]+)/) || [])[1];
      // Article
      push('filling', {
        type: 'fill', question: `Welcher Artikel? ___ ${word}`, questionEn: `Which article goes with “${word}” (${v.en})?`,
        answer: article, options: ['der', 'die', 'das'],
        explanation: `${article} ${word}${plural ? `, Plural: ${plural.trim()}` : ''}`,
        explanationEn: `“${word}” is ${GENDER[article]}: ${article} ${word}.${plural ? ` Plural: ${plural.trim()}.` : ''}${hint ? ` Tip: ${hint[2]}` : ' Learn every noun together with its article.'}`,
      });
      // Word with article, written
      push('writing', {
        type: 'write', check: 'similar',
        question: `Schreiben Sie das deutsche Wort mit Artikel: ${v.en}`, questionEn: `Write the German word, with its article, for “${v.en}”.`,
        answer: v.de, answerEn: v.en, tip: 'Nouns always need der, die or das, and start with a capital letter.',
      });
      // The noun inside its example sentence
      if (v.example && new RegExp(`(^|[^\\p{L}])${word}([^\\p{L}]|$)`, 'u').test(v.example)) {
        const otherNouns = m.vocab.map(x => (x.de.match(NOUN) || [])[2]).filter(Boolean);
        push('filling', choice({
          type: 'fill', question: v.example.replace(new RegExp(`(^|[^\\p{L}])${word}(?=[^\\p{L}]|$)`, 'u'), '$1___'),
          questionEn: `Complete the sentence: ${v.exampleEn}`,
          explanation: v.example, explanationEn: `${v.example} — ${v.exampleEn}`,
        }, word, distractors(word, otherNouns, 3)));
      }
    }
  }

  // Verb forms
  for (const verb of m.verbs) {
    const forms = Object.values(verb.conjugation);
    for (const [key, form] of Object.entries(verb.conjugation)) {
      if (!PRONOUNS[key] || !form) continue;
      const others = [...forms, verb.infinitive].filter(f => norm(f) !== norm(form));
      push('filling', choice({
        type: 'fill', question: `${PRONOUNS[key]} ___ (${verb.infinitive})`, questionEn: `Which form of “${verb.infinitive}” (${verb.en}) goes with “${PRONOUNS[key]}”?`,
        explanation: `${PRONOUNS[key]} ${form}`,
        explanationEn: `${verb.infinitive} with “${PRONOUNS[key]}” is “${form}”. Full table: ${Object.entries(verb.conjugation).map(([k, f]) => `${PRONOUNS[k] || k} ${f}`).join(', ')}.`,
      }, form, distractors(form, others, 3)));
    }
  }

  // Sentences: reading, listening, writing, speaking
  const lessonSentencesEn = m.sentences.map(s => s.en);
  const lessonSentencesDe = m.sentences.map(s => s.de);
  const poolSentencesEn = clean([...lessonSentencesEn, ...levelPool.sentences.map(s => s.en)]);
  const poolSentencesDe = clean([...lessonSentencesDe, ...levelPool.sentences.map(s => s.de)]);
  for (const s of m.sentences) {
    push('reading', choice({
      type: 'read', text: s.de, textEn: s.en,
      question: 'Was bedeutet dieser Satz?', questionEn: 'What does this sentence mean?',
      explanation: s.de, explanationEn: `It means: “${s.en}”`,
    }, s.en, distractors(s.en, poolSentencesEn, 3, [], { local: clean(lessonSentencesEn) })));
    push('listening', choice({
      type: 'listen', script: s.de, scriptEn: s.en,
      question: 'Welchen Satz haben Sie gehört?', questionEn: 'Which sentence did you hear?',
      explanation: s.de, explanationEn: `You heard: “${s.de}” (${s.en})`,
    }, s.de, distractors(s.de, poolSentencesDe, 3, [], { similar: true })));
    push('listening', choice({
      type: 'listen', script: s.de, scriptEn: s.en,
      question: 'Was bedeutet der Satz, den Sie gehört haben?', questionEn: 'What does the sentence you heard mean?',
      explanation: s.de, explanationEn: `You heard “${s.de}”, which means “${s.en}”.`,
    }, s.en, distractors(s.en, poolSentencesEn, 3, [], { local: clean(lessonSentencesEn) })));
    push('writing', {
      type: 'write', check: 'similar',
      question: 'Übersetzen Sie ins Deutsche:', questionEn: s.en,
      answer: s.de, answerEn: s.en, tip: 'Think about the verb position: in a main clause the verb is the second element.',
    });
    push('speaking', {
      type: 'speak', check: 'speech',
      question: 'Sprechen Sie diesen Satz:', questionEn: `Say this sentence aloud. It means: “${s.en}”`,
      answer: s.de, answerEn: s.en, pronunciation: s.de, tip: 'Listen first, then speak clearly at a natural pace.',
    });
    // Say it in German from the English (the German stays hidden until the exam is submitted)
    if (s.de.split(/\s+/).length <= 10) {
      push('speaking', {
        type: 'speak', check: 'speech', hideAnswer: true,
        question: 'Sagen Sie auf Deutsch:', questionEn: `Say in German: “${s.en}”`,
        answer: s.de, answerEn: s.en, pronunciation: s.de, tip: 'Build the sentence in your head first: who does what? Then say it aloud.',
      });
    }
  }
  return out;
}

// ── Pools: by lesson and by level ────────────────────────
function buildPools(allLessons) {
  const materials = allLessons.map(lessonMaterial);
  const byLevel = {};
  for (const m of materials) {
    byLevel[m.level] ||= { vocab: [], sentences: [] };
    byLevel[m.level].vocab.push(...m.vocab);
    byLevel[m.level].sentences.push(...m.sentences);
  }
  const empty = () => ({ filling: [], writing: [], speaking: [], reading: [], listening: [] });
  const lessons = {};       // generated, by lesson
  const levels = {};        // generated, by level
  const banks = {};         // hand-written, by lesson
  const levelBanks = {};    // hand-written, by level
  const titles = {};
  allLessons.forEach((lesson, i) => {
    const m = materials[i];
    titles[m.slug] = m.title;
    const qs = generateForLesson(m, byLevel[m.level] || { vocab: [], sentences: [] });
    lessons[m.slug] = qs;
    levels[m.level] ||= empty();
    levelBanks[m.level] ||= empty();
    const bank = lesson.content?.exam || empty();
    banks[m.slug] = bank;
    for (const p of PARTS) {
      levels[m.level][p].push(...qs[p]);
      levelBanks[m.level][p].push(...(bank[p] || []).map(q => ({ ...q, lessonSlug: m.slug })));
    }
  });
  // Skill lessons (reading, listening…) and short lessons have few words of their own:
  // their exams also draw from the other lessons of the same level, so they are never repetitive
  const MIN_OWN = 40;
  for (const [slug, qs] of Object.entries(lessons)) {
    const level = materials.find(m => m.slug === slug).level;
    for (const p of PARTS) {
      if (qs[p].length < MIN_OWN) qs[p] = [...qs[p], ...levels[level][p].filter(q => q.lessonSlug !== slug)];
    }
  }
  return { lessons, levels, banks, levelBanks, titles };
}

let pools = null;
// Built once (about 2 seconds), then every exam is picked from memory
function getPools() {
  if (!pools) {
    const content = require('./content');
    const { lessons: originals } = require('./seed');
    const coreExams = require('./content/core-exams');
    const withBanks = originals.map(l => (coreExams[l.slug] ? { ...l, content: { ...l.content, exam: coreExams[l.slug] } } : l));
    pools = buildPools([...withBanks, ...content]);
  }
  return pools;
}

function poolSizes() {
  const sizes = Object.fromEntries(PARTS.map(p => [p, 0]));
  for (const qs of Object.values(getPools().lessons)) for (const p of PARTS) sizes[p] += qs[p].length;
  return sizes;
}

module.exports = { PARTS, getPools, poolSizes, buildPools, shuffle };
