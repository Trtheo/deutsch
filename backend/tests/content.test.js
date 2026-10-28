// Checks the hand-written lesson content and the exam bank builder.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const lessons = require('../content');
const { validate } = require('../content/validate');
const { buildExamFromBank, hasExamBank } = require('../examBank');
const { renderCatalog, OUT } = require('../scripts/build-catalog');

test('all content lessons follow SCHEMA.md', () => {
  assert.deepEqual(validate(lessons), []);
});

test('content slugs do not clash with the original seed lessons', () => {
  const seedSource = fs.readFileSync(require.resolve('../seed'), 'utf8');
  const seedSlugs = [...seedSource.matchAll(/^\s{4}slug: '([^']+)'/gm)].map(m => m[1]);
  const clashes = lessons.filter(l => seedSlugs.includes(l.slug)).map(l => l.slug);
  assert.deepEqual(clashes, []);
});

test('frontend lessonCatalog.js is up to date (run `npm run catalog` if this fails)', () => {
  assert.equal(fs.readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n'), renderCatalog(lessons));
});

test('exams built from a bank have the right size and valid answers', () => {
  for (const lesson of lessons) {
    assert.ok(hasExamBank(lesson), `${lesson.slug} has no exam bank`);
    const { parts } = buildExamFromBank(lesson, 10);
    for (const part of ['filling', 'writing', 'speaking', 'reading', 'listening']) {
      assert.equal(parts[part].length, 2, `${lesson.slug} ${part}`);
    }
    for (const q of [...parts.filling, ...parts.reading, ...parts.listening]) {
      assert.ok(q.options.includes(q.answer), `${lesson.slug}: "${q.answer}" missing from shuffled options`);
    }
  }
});

test('the remainder of the question count goes to filling', () => {
  const { parts } = buildExamFromBank(lessons[0], 12); // 2 per part + 2 extra
  assert.equal(parts.filling.length, 4);
  assert.equal(parts.reading.length, 2);
});

test('every original seed lesson has a hand-written exam bank', (t) => {
  let coreExams;
  try { coreExams = require('../content/core-exams'); } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') throw err;
    return t.skip('content/core-exams.js not written yet');
  }
  const seedSource = fs.readFileSync(require.resolve('../seed'), 'utf8');
  const seedSlugs = [...seedSource.matchAll(/^\s{4}slug: '([^']+)'/gm)].map(m => m[1]);
  assert.equal(seedSlugs.length, 17);
  assert.deepEqual(seedSlugs.filter(s => !coreExams[s]), []);
  const asLessons = seedSlugs.map(slug => ({
    slug, title: 'x', titleDe: 'x', level: 'A1', category: 'verbs',
    meta: { sub: 'x', icon: 'Zap', group: 'Verbs' },
    content: { description: 'x', descriptionEn: 'x', exam: coreExams[slug],
      verbs: Array(6).fill({ infinitive: 'x', en: 'x', conjugation: { ich: 'x', du: 'x', er: 'x', wir: 'x', ihr: 'x', sie: 'x' } }) },
  }));
  assert.deepEqual(validate(asLessons), []);
});
