// Builds exams (no AI) and grades them with friendly, explained feedback.
// Questions come from the hand-written banks (content.exam) and from questionGen.js, which turns
// the lessons' own vocabulary, sentences, nouns and verb tables into thousands of questions.
const { compareText, tokens } = require('./grading');

const PARTS = ['filling', 'writing', 'speaking', 'reading', 'listening'];
const TYPES = { filling: 'fill', writing: 'write', speaking: 'speak', reading: 'read', listening: 'listen' };
const LEVEL_EXAM = /^level-(A1|A2|B1|B2)$/; // "all lessons of a level" practice exams

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// k random items without shuffling the whole (possibly large) list
function sample(list, k) {
  if (list.length <= k) return shuffle(list);
  const picked = new Set();
  while (picked.size < k) picked.add(Math.floor(Math.random() * list.length));
  return [...picked].map(i => list[i]);
}

function hasExamBank(lesson) {
  const bank = lesson?.content?.exam;
  return !!bank && PARTS.some(p => Array.isArray(bank[p]) && bank[p].length > 0);
}

const perPartCounts = (questionCount) => {
  const perPart = Math.max(2, Math.floor(questionCount / 5));
  const extra = Math.max(0, questionCount - perPart * 5);
  return Object.fromEntries(PARTS.map(p => [p, p === 'filling' ? perPart + extra : perPart]));
};

const prepare = (q, part) => ({ ...q, type: TYPES[part], options: Array.isArray(q.options) && q.options.length ? shuffle(q.options) : [] });

// Mixes hand-written questions (about half, when there are any) with generated ones
function buildExam({ bank = {}, generated = {} }, questionCount = 10) {
  const counts = perPartCounts(questionCount);
  const parts = {};
  for (const part of PARTS) {
    const want = counts[part];
    const hand = bank[part] || [];
    const gen = generated[part] || [];
    const fromHand = gen.length ? Math.min(hand.length, Math.ceil(want / 2)) : Math.min(hand.length, want);
    const chosen = [...sample(hand, fromHand), ...sample(gen, want - fromHand)];
    if (chosen.length < want) chosen.push(...sample(hand.filter(q => !chosen.includes(q)), want - chosen.length));
    parts[part] = shuffle(chosen).map(q => prepare(q, part));
  }
  return { parts };
}

// Kept for lessons stored in the database only (no generated pool): the bank alone
function buildExamFromBank(lesson, questionCount = 10) {
  return buildExam({ bank: lesson.content.exam }, questionCount);
}

// For lessons saved by users earlier (no bank, no pool): questions from the lesson's own words
function buildExamFromContent(lesson, questionCount = 10) {
  const { buildPools } = require('./questionGen');
  const { lessons } = buildPools([lesson]);
  const generated = lessons[lesson.slug];
  if (!generated || PARTS.every(p => generated[p].length === 0)) return null;
  return buildExam({ generated }, questionCount);
}

// ── Before submission ─────────────────────────────────────
// Answers, explanations and translations that would give the answer away stay on the server.
// Speaking tasks keep their sentence: saying it aloud is the exercise.
const HIDDEN = {
  filling: ['answer', 'explanation', 'explanationEn'],
  reading: ['answer', 'explanation', 'explanationEn', 'textEn'],
  listening: ['answer', 'explanation', 'explanationEn', 'scriptEn'],
  writing: ['answer', 'answerEn', 'tip'],
  speaking: [],
};

function examForStudent(exam) {
  const e = typeof exam.toObject === 'function' ? exam.toObject() : exam;
  if (e.result) return e; // graded: everything is part of the review
  const parts = {};
  for (const part of PARTS) {
    parts[part] = (e.parts?.[part] || []).map(q => {
      const copy = { ...q };
      for (const field of HIDDEN[part]) delete copy[field];
      if (copy.hideAnswer) { delete copy.answer; delete copy.pronunciation; } // "Say in German" tasks
      return copy;
    });
  }
  return { ...e, parts };
}

// ── Grading with feedback ─────────────────────────────────
const XP_PER_POINT = 5;
const POINTS = { correct: 1, done: 1, close: 0.5, wrong: 0, skipped: 0 };
const SPOKEN = '[spoken]'; // "I said it aloud" when the browser can't listen

function gradeQuestion(part, q, given) {
  const expected = String(q.answer || '');
  // Multiple choice
  if (Array.isArray(q.options) && q.options.length) {
    if (!given) return { status: 'skipped', tips: [`The answer is “${expected}”.`] };
    const ok = given.trim().toLowerCase() === expected.trim().toLowerCase();
    const why = q.explanationEn || q.explanation;
    return ok
      ? { status: 'correct', tips: why ? [why] : [] }
      : { status: 'wrong', tips: [`You chose “${given}”, but the answer is “${expected}”.`, ...(why ? [why] : [])] };
  }
  // Translation / exact sentence (generated writing)
  if (q.check === 'similar') {
    const r = compareText(given, expected, { mode: 'text' });
    return r.status === 'correct' && !r.tips.length ? { ...r, tips: ['Perfect — exactly right.'] } : r;
  }
  // Read-aloud (generated speaking): the browser's speech recognition is compared with the sentence
  if (q.check === 'speech') {
    if (given === SPOKEN) return { status: 'done', tips: ['Marked as spoken. Open the exam in Chrome or Edge to get feedback on your pronunciation.'] };
    const r = compareText(given, expected, { mode: 'speech' });
    if (r.status === 'correct') return { ...r, tips: ['Well pronounced — every word was understood.'] };
    if (r.status === 'skipped') return r;
    return { ...r, tips: ['Some words weren’t understood. Listen to the sentence again and repeat it slowly — the words marked below are the ones to practise.', ...r.tips.filter(t => t.startsWith('Missing') || t.startsWith('Spelling'))] };
  }
  // Free writing or speaking (hand-written tasks): can't be marked word by word
  if (!given) return { status: 'skipped', tips: ['Have a look at the model answer below.'] };
  if (given === SPOKEN) return { status: 'done', tips: ['Compare what you said with the model answer below.'] };
  const words = tokens(given).length;
  const modelWords = tokens(expected).length;
  if (words < 3) return { status: 'close', tips: ['Try to write at least a full sentence — subject, verb and the rest.'] };
  const tips = ['Compare your answer with the model below: did you cover every point of the task?'];
  if (part === 'writing') {
    tips.push('Check: verb in second position, nouns with capital letters, and a greeting and closing if it’s a message.');
    if (modelWords && words < modelWords / 2) tips.push(`Your text has ${words} words; the model has ${modelWords}. Try adding a little more detail.`);
  }
  return { status: 'done', tips };
}

// answers: { 'filling-0': 'Äpfel', 'writing-1': '…', 'speaking-0': '[spoken]' }
function gradeExam(exam, answers = {}) {
  let points = 0, total = 0;
  const kept = {};
  const items = {};
  const parts = {};
  for (const part of PARTS) {
    parts[part] = { points: 0, total: 0 };
    (exam.parts?.[part] || []).forEach((q, i) => {
      const key = `${part}-${i}`;
      const given = typeof answers[key] === 'string' ? answers[key].slice(0, 2000).trim() : '';
      if (given) kept[key] = given;
      const fb = gradeQuestion(part, q, given);
      const p = POINTS[fb.status] ?? 0;
      items[key] = { ...fb, points: p, given, expected: q.answer };
      points += p; total++;
      parts[part].points += p; parts[part].total++;
    });
  }
  const pct = total ? Math.round((points / total) * 100) : 0;
  return { correct: points, total, pct, xp: Math.round(points * XP_PER_POINT), answers: kept, items, parts };
}

module.exports = {
  PARTS, LEVEL_EXAM, hasExamBank, buildExam, buildExamFromBank, buildExamFromContent,
  examForStudent, gradeExam, gradeQuestion, SPOKEN,
};
