// Builds exams from a lesson's hand-written question bank (content.exam), so no AI is needed.
const PARTS = ['filling', 'writing', 'speaking', 'reading', 'listening'];
const TYPES = { filling: 'fill', writing: 'write', speaking: 'speak', reading: 'read', listening: 'listen' };

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hasExamBank(lesson) {
  const bank = lesson?.content?.exam;
  return !!bank && PARTS.some(p => Array.isArray(bank[p]) && bank[p].length > 0);
}

// Same split as the AI exams: an equal share per part, the remainder goes to filling.
// If a part has fewer questions than its share, the exam is simply shorter.
function buildExamFromBank(lesson, questionCount = 10) {
  const bank = lesson.content.exam;
  const perPart = Math.max(2, Math.floor(questionCount / 5));
  const extra = Math.max(0, questionCount - perPart * 5);
  const parts = {};
  for (const part of PARTS) {
    const want = part === 'filling' ? perPart + extra : perPart;
    parts[part] = shuffle(bank[part] || []).slice(0, want).map(q => ({
      ...q,
      type: TYPES[part],
      options: Array.isArray(q.options) && q.options.length ? shuffle(q.options) : [],
    }));
  }
  return { parts };
}

// For lessons without a bank (e.g. ones saved before all content was hand-written):
// builds questions from the lesson's own vocabulary items. Returns null if there aren't enough.
function buildExamFromContent(lesson, questionCount = 10) {
  const items = (lesson?.content?.sections || [])
    .flatMap(s => s.items || [])
    .filter(i => i?.de && i?.en);
  const unique = [...new Map(items.map(i => [i.en.toLowerCase(), i])).values()];
  if (unique.length < 4) return null;
  const withExample = unique.filter(i => i.example && i.exampleEn);

  const perPart = Math.max(2, Math.floor(questionCount / 5));
  const extra = Math.max(0, questionCount - perPart * 5);
  // 3 wrong answers from other items, plus the right one, shuffled
  const choices = (item, key) => shuffle([item[key], ...shuffle(unique.filter(o => o !== item && o[key]).map(o => o[key])).slice(0, 3)]);

  const filling = shuffle(unique).slice(0, perPart + extra).map(i => ({
    type: 'fill',
    question: `Was bedeutet „${i.de}“?`, questionEn: `What does “${i.de}” mean?`,
    answer: i.en, options: choices(i, 'en'),
    explanation: `„${i.de}“ = ${i.en}`, explanationEn: `“${i.de}” means “${i.en}”.`,
  }));
  const reading = shuffle(withExample).slice(0, perPart).map(i => ({
    type: 'read',
    text: i.example, textEn: i.exampleEn,
    question: `Was bedeutet „${i.de}“ in diesem Satz?`, questionEn: `What does “${i.de}” mean in this sentence?`,
    answer: i.en, options: choices(i, 'en'),
    explanation: `„${i.de}“ = ${i.en}`, explanationEn: `“${i.de}” means “${i.en}”.`,
  }));
  // Options are other example translations, so this needs at least 4 example sentences
  const listening = (withExample.length >= 4 ? shuffle(withExample) : []).slice(0, perPart).map(i => ({
    type: 'listen',
    script: i.example, scriptEn: i.exampleEn,
    question: 'Was haben Sie gehört?', questionEn: 'What did you hear?',
    answer: i.exampleEn, options: choices(i, 'exampleEn'),
    explanation: i.example, explanationEn: i.exampleEn,
  }));
  const writing = shuffle(unique).slice(0, perPart).map(i => ({
    type: 'write',
    question: `Schreiben Sie einen Satz mit „${i.de}“.`, questionEn: `Write a sentence using “${i.de}” (${i.en}).`,
    answer: i.example || i.de, answerEn: i.exampleEn || i.en,
    tip: 'Use a complete sentence with a subject and a verb.', options: [],
  }));
  const speaking = shuffle(withExample.length ? withExample : unique).slice(0, perPart).map(i => ({
    type: 'speak',
    question: `Sprechen Sie: „${i.example || i.de}“`, questionEn: `Say: “${i.example || i.de}”`,
    answer: i.example || i.de, answerEn: i.exampleEn || i.en, pronunciation: i.example || i.de,
    tip: 'Speak clearly and at a natural pace.', options: [],
  }));
  return { parts: { filling, writing, speaking, reading, listening } };
}

module.exports = { hasExamBank, buildExamFromBank, buildExamFromContent };
