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

module.exports = { hasExamBank, buildExamFromBank };
