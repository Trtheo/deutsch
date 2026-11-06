// Question pools (no AI) and the friendly correction engine
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { getPools, PARTS } = require('../questionGen');
const { compareText } = require('../grading');
const { gradeExam, examForStudent, buildExam } = require('../examBank');

describe('question pools', () => {
  const pools = getPools();

  test('every level has at least 1000 questions in every part', () => {
    for (const level of ['A1', 'A2', 'B1']) {
      for (const part of PARTS) {
        const n = pools.levels[level][part].length + pools.levelBanks[level][part].length;
        assert.ok(n >= 1000, `${level} ${part}: ${n}`);
      }
    }
  });

  test('multiple-choice questions are well formed: one right answer among distinct options', () => {
    for (const level of Object.keys(pools.levels)) {
      for (const part of PARTS) {
        for (const q of pools.levels[level][part]) {
          if (!q.options) continue;
          assert.ok(q.options.includes(q.answer), q.question);
          assert.equal(new Set(q.options.map(o => o.toLowerCase())).size, q.options.length, `${q.question} ${q.options}`);
        }
      }
    }
  });

  test('every lesson can fill a 50-question exam', () => {
    for (const [slug, qs] of Object.entries(pools.lessons)) {
      const exam = buildExam({ bank: pools.banks[slug], generated: qs }, 50);
      assert.equal(Object.values(exam.parts).flat().length, 50, slug);
    }
  });
});

describe('correction', () => {
  const expected = 'Ich kaufe ein Brot.';

  test('exactly right', () => {
    assert.equal(compareText('Ich kaufe ein Brot.', expected).status, 'correct');
  });

  test('capital letters are explained but still correct', () => {
    const r = compareText('ich kaufe ein brot', expected);
    assert.equal(r.status, 'correct');
    assert.ok(r.tips.some(t => t.includes('noun')));
  });

  test('a spelling mistake is close, with the fix', () => {
    const r = compareText('Ich kaufe ein Brod', expected);
    assert.equal(r.status, 'close');
    assert.ok(r.tips.some(t => t.includes('“Brod” → “Brot”')));
  });

  test('wrong word order is explained', () => {
    const r = compareText('Ich ein Brot kaufe', expected);
    assert.ok(r.tips.some(t => t.includes('word order')));
  });

  test('umlauts written as ae/oe/ue count, with a tip', () => {
    const r = compareText('Ich moechte Broetchen', 'Ich möchte Brötchen');
    assert.equal(r.status, 'correct');
    assert.ok(r.tips.some(t => t.includes('Umlauts')));
  });

  test('speech ignores capitalisation', () => {
    const r = compareText('ich kaufe ein brot', expected, { mode: 'speech' });
    assert.equal(r.status, 'correct');
    assert.equal(r.tips.length, 0);
  });

  test('a very different answer is wrong, with one friendly tip', () => {
    const r = compareText('Hallo', 'Am Wochenende fahre ich mit meiner Familie ans Meer.');
    assert.equal(r.status, 'wrong');
    assert.equal(r.tips.length, 1);
  });
});

describe('grading', () => {
  const exam = {
    parts: {
      filling: [{ question: 'Was bedeutet „Brot“?', options: ['bread', 'milk', 'cheese'], answer: 'bread', explanationEn: 'Brot = bread' }],
      writing: [{ question: 'Übersetzen Sie ins Deutsche:', check: 'similar', answer: 'Ich kaufe ein Brot.' }],
      speaking: [
        { question: 'Sprechen Sie diesen Satz:', check: 'speech', answer: 'Ich kaufe ein Brot.' },
        { question: 'Sagen Sie auf Deutsch:', check: 'speech', hideAnswer: true, answer: 'Guten Morgen.', pronunciation: 'Guten Morgen.' },
      ],
      reading: [],
      listening: [],
    },
  };

  test('each answer gets a status, points and tips; close answers get half a point', () => {
    const r = gradeExam(exam, { 'filling-0': 'milk', 'writing-0': 'Ich kaufe ein Brod', 'speaking-0': '[spoken]' });
    assert.equal(r.items['filling-0'].status, 'wrong');
    assert.ok(r.items['filling-0'].tips.includes('Brot = bread'));
    assert.equal(r.items['writing-0'].status, 'close');
    assert.equal(r.items['writing-0'].points, 0.5);
    assert.equal(r.items['speaking-0'].status, 'done');
    assert.equal(r.items['speaking-1'].status, 'skipped');
    assert.equal(r.correct, 1.5);
    assert.equal(r.total, 4);
    assert.deepEqual(r.parts.writing, { points: 0.5, total: 1 });
  });

  test('"say in German" tasks hide the German until submitted', () => {
    const shown = examForStudent(exam);
    assert.equal(shown.parts.speaking[1].answer, undefined);
    assert.equal(shown.parts.speaking[1].pronunciation, undefined);
    assert.equal(shown.parts.speaking[0].answer, 'Ich kaufe ein Brot.', 'read-aloud keeps its sentence');
  });
});
