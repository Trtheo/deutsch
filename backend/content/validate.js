// Checks content files against SCHEMA.md. Usage: node content/validate.js [file.js ...]
// Without arguments validates everything in index.js. Exit code 1 on any problem.
const path = require('path');

const LEVELS = ['A1', 'A2', 'B1', 'B2'];
const CATEGORIES = ['topic', 'verbs', 'certificate'];
const GROUPS = ['Everyday life', 'Health', 'Travel & transport', 'Home & housing', 'Work & official matters', 'Society', 'Verbs', 'Grammar', 'Certificate prep'];
const MIN = {
  topic:       { filling: 6, reading: 4, listening: 4, writing: 3, speaking: 3 },
  verbs:       { filling: 6, reading: 4, listening: 4, writing: 3, speaking: 3 },
  certificate: { filling: 12, reading: 8, listening: 8, writing: 4, speaking: 4 },
};
const CHOICE_PARTS = { filling: ['question', 'questionEn'], reading: ['text', 'textEn', 'question', 'questionEn'], listening: ['script', 'scriptEn', 'question', 'questionEn'] };
const OPEN_PARTS = { writing: ['question', 'questionEn', 'answer', 'answerEn', 'tip'], speaking: ['question', 'questionEn', 'answer', 'answerEn', 'pronunciation', 'tip'] };

let icons = null;
try { icons = require(path.join(__dirname, '../../frontend/node_modules/lucide-react')); } catch { /* frontend not installed */ }

const str = v => typeof v === 'string' && v.trim().length > 0;

function validateLesson(l, errors) {
  const where = l?.slug || '(missing slug)';
  const err = msg => errors.push(`${where}: ${msg}`);
  if (!str(l.slug) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(l.slug)) err('slug must be kebab-case');
  for (const k of ['title', 'titleDe']) if (!str(l[k])) err(`missing ${k}`);
  if (!LEVELS.includes(l.level)) err(`bad level ${l.level}`);
  if (!CATEGORIES.includes(l.category)) err(`bad category ${l.category}`);
  if (!str(l.meta?.sub)) err('missing meta.sub');
  if (!GROUPS.includes(l.meta?.group)) err(`meta.group must be one of: ${GROUPS.join(', ')}`);
  if (!str(l.meta?.icon)) err('missing meta.icon');
  else if (icons && !icons[l.meta.icon]) err(`unknown lucide icon ${l.meta.icon}`);

  const c = l.content || {};
  for (const k of ['description', 'descriptionEn']) if (!str(c[k])) err(`missing content.${k}`);
  if (l.category === 'verbs') {
    if (!Array.isArray(c.verbs) || c.verbs.length < 6) err('verbs lesson needs at least 6 verbs');
    (c.verbs || []).forEach((v, i) => {
      if (!str(v.infinitive) || !str(v.en)) err(`verbs[${i}] needs infinitive and en`);
      for (const p of ['ich', 'du', 'er', 'wir', 'ihr', 'sie']) if (!str(v.conjugation?.[p])) err(`verbs[${i}] (${v.infinitive}) missing conjugation.${p}`);
    });
  } else {
    if (!Array.isArray(c.sections) || c.sections.length < 3) err('needs at least 3 sections');
    if (!Array.isArray(c.keyPoints) || c.keyPoints.length < 3) err('needs at least 3 keyPoints');
    if (!c.dialogue?.lines || c.dialogue.lines.length < 6) err('needs a dialogue with at least 6 lines');
  }
  (c.sections || []).forEach((s, i) => {
    if (!str(s.heading) || !str(s.headingEn)) err(`sections[${i}] needs heading and headingEn`);
    if (!Array.isArray(s.items) || s.items.length < 4) err(`sections[${i}] needs at least 4 items`);
    (s.items || []).forEach((it, j) => { if (!str(it.de) || !str(it.en)) err(`sections[${i}].items[${j}] needs de and en`); });
  });
  (c.grammar || []).forEach((g, i) => {
    if (!str(g.title) || !str(g.titleEn) || !str(g.explanation)) err(`grammar[${i}] needs title, titleEn, explanation`);
    if (!Array.isArray(g.examples) || !g.examples.length) err(`grammar[${i}] needs examples`);
  });
  (c.dialogue?.lines || []).forEach((ln, i) => {
    if (!['A', 'B'].includes(ln.speaker) || !str(ln.de) || !str(ln.en)) err(`dialogue.lines[${i}] needs speaker A/B, de, en`);
  });

  const exam = c.exam;
  if (!exam) return err('missing content.exam');
  const min = MIN[l.category] || MIN.topic;
  for (const [part, need] of Object.entries(min)) {
    const qs = exam[part];
    if (!Array.isArray(qs) || qs.length < need) { err(`exam.${part} needs at least ${need} questions (has ${qs?.length || 0})`); continue; }
    qs.forEach((q, i) => {
      const at = `exam.${part}[${i}]`;
      if (CHOICE_PARTS[part]) {
        for (const k of [...CHOICE_PARTS[part], 'answer', 'explanation', 'explanationEn']) if (!str(q[k])) err(`${at} missing ${k}`);
        if (!Array.isArray(q.options) || q.options.length !== 4) err(`${at} needs exactly 4 options`);
        else {
          const norm = q.options.map(o => String(o).toLowerCase().trim());
          if (new Set(norm).size !== 4) err(`${at} has duplicate options`);
          if (norm.filter(o => o === String(q.answer).toLowerCase().trim()).length !== 1) err(`${at} answer "${q.answer}" is not exactly one of the options`);
        }
      } else {
        for (const k of OPEN_PARTS[part]) if (!str(q[k])) err(`${at} missing ${k}`);
      }
    });
  }
}

function validate(lessons) {
  const errors = [];
  const seen = new Set();
  for (const l of lessons) {
    if (seen.has(l.slug)) errors.push(`${l.slug}: duplicate slug`);
    seen.add(l.slug);
    validateLesson(l, errors);
  }
  return errors;
}

module.exports = { validate };

if (require.main === module) {
  const files = process.argv.slice(2);
  const lessons = files.length ? files.flatMap(f => require(path.resolve(f))) : require('./index');
  const errors = validate(lessons);
  const qCount = lessons.reduce((n, l) => n + Object.values(l.content?.exam || {}).reduce((a, p) => a + (p?.length || 0), 0), 0);
  if (errors.length) {
    console.error(errors.map(e => '✖ ' + e).join('\n'));
    console.error(`\n${errors.length} problem(s) in ${lessons.length} lesson(s)`);
    process.exit(1);
  }
  console.log(`✔ ${lessons.length} lesson(s) valid, ${qCount} exam questions${icons ? '' : ' (icon names not checked: frontend not installed)'}`);
}
