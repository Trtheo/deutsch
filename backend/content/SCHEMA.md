# Lesson content format

Every built-in lesson lives in a file in this folder. `index.js` combines the files, and `seed.js` loads them into MongoDB when the server starts. Each lesson carries its own **exam bank**, so exams for built-in lessons never need AI.

After you add or rename a lesson, run `npm run catalog` in `backend/` to regenerate `frontend/src/lessonCatalog.js`. A test fails if you forget.

## Lesson object

```js
{
  slug: 'a1-shopping',            // unique, kebab-case, prefixed with the level
  title: 'Shopping',              // English
  titleDe: 'Einkaufen',           // German
  level: 'A1',                    // A1 | A2 | B1 | B2
  category: 'topic',              // topic | verbs | certificate
  meta: { sub: 'Supermarket, prices, paying', icon: 'ShoppingCart', group: 'Everyday life' },
  content: { ... },               // see below
}
```

- `meta.sub` is a short subtitle (2 to 6 words) on the lesson card.
- `meta.icon` is a lucide-react icon name. The catalog build checks that it exists.
- `meta.group` groups lessons on the home page. Use one of: `Everyday life`, `Health`, `Travel & transport`, `Home & housing`, `Work & official matters`, `Society`, `Verbs`, `Grammar`, `Certificate prep`.

## `content` for `category: 'topic'` and `'certificate'`

```js
content: {
  description: 'German one-line description',
  descriptionEn: 'English one-line description',
  keyPoints: ['3–6 short English tips the learner must remember'],
  sections: [                      // 3–5 sections, 6–10 items each
    { heading: 'German heading', headingEn: 'English heading',
      items: [{ de: 'die Kasse', en: 'checkout', example: 'German sentence.', exampleEn: 'English sentence.', note: 'optional: plural / irregular / formal' }] },
  ],
  grammar: [                       // 1–3 grammar boxes tied to the topic
    { title: 'German title', titleEn: 'English title', explanation: 'English explanation, 1–3 sentences.',
      examples: [{ de: '...', en: '...' }] },
  ],
  dialogue: { title: 'German', titleEn: 'English',
    lines: [{ speaker: 'A', de: '...', en: '...' }] },   // 8–14 lines, speakers 'A' and 'B'
  exam: { ...exam bank, see below },
}
```

Write nouns with their article (`der/die/das`) and add the plural in `note` where it's useful.

## `content` for `category: 'verbs'`

```js
content: {
  description, descriptionEn,
  verbs: [{ infinitive: 'fahren', en: 'to drive / travel',
            conjugation: { ich: 'fahre', du: 'fährst', er: 'fährt', wir: 'fahren', ihr: 'fahrt', sie: 'fahren' } }],  // 10–16 verbs
  keyPoints, grammar, sections, dialogue,   // optional, same shape as above; all are rendered under the verb table
  exam: { ... },
}
```

## Exam bank: `content.exam`

The server picks random questions from each part and shuffles the answer options. Write **more** questions than one exam uses. A topic lesson needs at least 6 filling, 4 reading, 4 listening, 3 writing and 3 speaking questions. A certificate lesson needs at least 12, 8, 8, 4 and 4.

```js
exam: {
  filling:   [{ question: 'Ich möchte ein Kilo ___ kaufen.', questionEn: '...', answer: 'Äpfel',
                options: ['Äpfel', 'Apfel', 'Äpfeln', 'Apfels'], explanation: 'German', explanationEn: 'English' }],
  reading:   [{ text: 'Short German text (2–6 sentences).', textEn: '...', question: '...', questionEn: '...',
                answer: '...', options: ['4 options, answer included'], explanation: '...', explanationEn: '...' }],
  listening: [{ script: 'German dialogue/announcement, lines separated by \n', scriptEn: '...', question, questionEn,
                answer, options, explanation, explanationEn }],
  writing:   [{ question: 'German task', questionEn: 'English task', answer: 'German model answer', answerEn: '...', tip: 'English tip' }],
  speaking:  [{ question: 'German task', questionEn: '...', answer: 'German model answer', answerEn: '...', pronunciation: 'German sentence to practise', tip: '...' }],
}
```

Rules:
- `answer` must match exactly one of `options`, character for character. The exam is scored by exact match, ignoring case.
- Each question has exactly 4 options, all different, all plausible. Distractors should test a real learner mistake, such as a wrong article, case ending, verb form or word.
- The German must be correct, natural and at the lesson's level. The English must be a faithful translation.
