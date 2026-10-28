// Fallback generators — topic-aware content maps

const TOPIC_DATA = {
  default: {
    vocab: [
      { de: 'das Wort', en: 'the word', example: 'Das ist ein wichtiges Wort.', exampleEn: 'That is an important word.' },
      { de: 'der Satz', en: 'the sentence', example: 'Schreibe einen Satz.', exampleEn: 'Write a sentence.' },
      { de: 'die Übung', en: 'the exercise', example: 'Mach die Übung.', exampleEn: 'Do the exercise.' },
      { de: 'lernen', en: 'to learn', example: 'Ich lerne Deutsch.', exampleEn: 'I am learning German.' },
    ],
    expressions: [
      { de: 'Wie sagt man…?', en: 'How do you say…?', example: 'Wie sagt man hello auf Deutsch?', exampleEn: 'How do you say hello in German?' },
      { de: 'Ich verstehe nicht.', en: 'I do not understand.', example: 'Entschuldigung, ich verstehe nicht.', exampleEn: 'Excuse me, I do not understand.' },
      { de: 'Können Sie das wiederholen?', en: 'Can you repeat that?', example: 'Bitte, können Sie das wiederholen?', exampleEn: 'Please, can you repeat that?' },
      { de: 'Was bedeutet das?', en: 'What does that mean?', example: 'Was bedeutet dieses Wort?', exampleEn: 'What does this word mean?' },
    ],
    dialogue: [
      { speaker: 'A', de: 'Guten Tag! Wie geht es Ihnen?', en: 'Good day! How are you?' },
      { speaker: 'B', de: 'Danke, gut. Und Ihnen?', en: 'Thank you, fine. And you?' },
      { speaker: 'A', de: 'Auch gut, danke.', en: 'Also fine, thank you.' },
      { speaker: 'B', de: 'Was lernen Sie heute?', en: 'What are you learning today?' },
      { speaker: 'A', de: 'Ich lerne Deutsch.', en: 'I am learning German.' },
      { speaker: 'B', de: 'Ja, Deutsch macht Spaß!', en: 'Yes, German is fun!' },
    ],
  },
  days: {
    vocab: [
      { de: 'Montag', en: 'Monday', example: 'Am Montag gehe ich zur Arbeit.', exampleEn: 'On Monday I go to work.' },
      { de: 'Dienstag', en: 'Tuesday', example: 'Dienstag ist mein Lieblingstag.', exampleEn: 'Tuesday is my favourite day.' },
      { de: 'Mittwoch', en: 'Wednesday', example: 'Am Mittwoch haben wir Deutsch.', exampleEn: 'On Wednesday we have German.' },
      { de: 'Donnerstag', en: 'Thursday', example: 'Donnerstag kommt nach Mittwoch.', exampleEn: 'Thursday comes after Wednesday.' },
      { de: 'Freitag', en: 'Friday', example: 'Am Freitag ist das Wochenende nah.', exampleEn: 'On Friday the weekend is near.' },
      { de: 'Samstag', en: 'Saturday', example: 'Am Samstag schlafe ich lange.', exampleEn: 'On Saturday I sleep in.' },
      { de: 'Sonntag', en: 'Sunday', example: 'Sonntag ist ein Ruhetag.', exampleEn: 'Sunday is a day of rest.' },
      { de: 'das Wochenende', en: 'the weekend', example: 'Am Wochenende bin ich frei.', exampleEn: 'At the weekend I am free.' },
    ],
    expressions: [
      { de: 'Welcher Tag ist heute?', en: 'What day is today?', example: 'Welcher Tag ist heute? — Heute ist Montag.', exampleEn: 'What day is today? — Today is Monday.' },
      { de: 'Heute ist…', en: 'Today is…', example: 'Heute ist Freitag.', exampleEn: 'Today is Friday.' },
      { de: 'Morgen ist…', en: 'Tomorrow is…', example: 'Morgen ist Samstag.', exampleEn: 'Tomorrow is Saturday.' },
      { de: 'Gestern war…', en: 'Yesterday was…', example: 'Gestern war Donnerstag.', exampleEn: 'Yesterday was Thursday.' },
    ],
    dialogue: [
      { speaker: 'A', de: 'Welcher Tag ist heute?', en: 'What day is today?' },
      { speaker: 'B', de: 'Heute ist Mittwoch.', en: 'Today is Wednesday.' },
      { speaker: 'A', de: 'Und morgen?', en: 'And tomorrow?' },
      { speaker: 'B', de: 'Morgen ist Donnerstag.', en: 'Tomorrow is Thursday.' },
      { speaker: 'A', de: 'Wann ist das Wochenende?', en: 'When is the weekend?' },
      { speaker: 'B', de: 'Am Samstag und Sonntag!', en: 'On Saturday and Sunday!' },
    ],
  },
  months: {
    vocab: [
      { de: 'Januar', en: 'January', example: 'Im Januar ist es kalt.', exampleEn: 'In January it is cold.' },
      { de: 'Februar', en: 'February', example: 'Im Februar gibt es Schnee.', exampleEn: 'In February there is snow.' },
      { de: 'März', en: 'March', example: 'Im März beginnt der Frühling.', exampleEn: 'In March spring begins.' },
      { de: 'April', en: 'April', example: 'Im April regnet es oft.', exampleEn: 'In April it often rains.' },
      { de: 'Mai', en: 'May', example: 'Im Mai blühen die Blumen.', exampleEn: 'In May the flowers bloom.' },
      { de: 'Juni', en: 'June', example: 'Im Juni ist es warm.', exampleEn: 'In June it is warm.' },
      { de: 'Juli', en: 'July', example: 'Im Juli fahren wir in Urlaub.', exampleEn: 'In July we go on holiday.' },
      { de: 'August', en: 'August', example: 'Im August ist es sehr heiß.', exampleEn: 'In August it is very hot.' },
      { de: 'September', en: 'September', example: 'Im September beginnt die Schule.', exampleEn: 'In September school starts.' },
      { de: 'Oktober', en: 'October', example: 'Im Oktober fallen die Blätter.', exampleEn: 'In October the leaves fall.' },
      { de: 'November', en: 'November', example: 'Im November ist es neblig.', exampleEn: 'In November it is foggy.' },
      { de: 'Dezember', en: 'December', example: 'Im Dezember feiern wir Weihnachten.', exampleEn: 'In December we celebrate Christmas.' },
    ],
    expressions: [
      { de: 'Welcher Monat ist es?', en: 'What month is it?', example: 'Welcher Monat ist es? — Es ist März.', exampleEn: 'What month is it? — It is March.' },
      { de: 'Im Monat…', en: 'In the month of…', example: 'Im Monat Juli ist es heiß.', exampleEn: 'In the month of July it is hot.' },
      { de: 'Wann hast du Geburtstag?', en: 'When is your birthday?', example: 'Ich habe im Mai Geburtstag.', exampleEn: 'My birthday is in May.' },
      { de: 'Das ist mein Lieblingsmonat.', en: 'That is my favourite month.', example: 'Juni ist mein Lieblingsmonat.', exampleEn: 'June is my favourite month.' },
    ],
    dialogue: [
      { speaker: 'A', de: 'Welcher Monat ist dein Lieblingsmonat?', en: 'What is your favourite month?' },
      { speaker: 'B', de: 'Mein Lieblingsmonat ist Juli.', en: 'My favourite month is July.' },
      { speaker: 'A', de: 'Warum magst du Juli?', en: 'Why do you like July?' },
      { speaker: 'B', de: 'Im Juli ist es warm und wir haben Ferien.', en: 'In July it is warm and we have holidays.' },
      { speaker: 'A', de: 'Wann hast du Geburtstag?', en: 'When is your birthday?' },
      { speaker: 'B', de: 'Ich habe im März Geburtstag.', en: 'My birthday is in March.' },
    ],
  },
  colors: {
    vocab: [
      { de: 'rot', en: 'red', example: 'Das Auto ist rot.', exampleEn: 'The car is red.' },
      { de: 'blau', en: 'blue', example: 'Der Himmel ist blau.', exampleEn: 'The sky is blue.' },
      { de: 'grün', en: 'green', example: 'Das Gras ist grün.', exampleEn: 'The grass is green.' },
      { de: 'gelb', en: 'yellow', example: 'Die Sonne ist gelb.', exampleEn: 'The sun is yellow.' },
      { de: 'schwarz', en: 'black', example: 'Die Nacht ist schwarz.', exampleEn: 'The night is black.' },
      { de: 'weiß', en: 'white', example: 'Der Schnee ist weiß.', exampleEn: 'The snow is white.' },
      { de: 'orange', en: 'orange', example: 'Die Orange ist orange.', exampleEn: 'The orange is orange.' },
      { de: 'lila', en: 'purple', example: 'Die Blume ist lila.', exampleEn: 'The flower is purple.' },
    ],
    expressions: [
      { de: 'Welche Farbe hat…?', en: 'What colour is…?', example: 'Welche Farbe hat das Auto? — Es ist rot.', exampleEn: 'What colour is the car? — It is red.' },
      { de: 'Meine Lieblingsfarbe ist…', en: 'My favourite colour is…', example: 'Meine Lieblingsfarbe ist blau.', exampleEn: 'My favourite colour is blue.' },
      { de: 'Das ist…', en: 'That is…', example: 'Das ist ein grüner Baum.', exampleEn: 'That is a green tree.' },
      { de: 'hell / dunkel', en: 'light / dark', example: 'Hellblau ist eine schöne Farbe.', exampleEn: 'Light blue is a beautiful colour.' },
    ],
    dialogue: [
      { speaker: 'A', de: 'Welche Farbe magst du am liebsten?', en: 'What colour do you like most?' },
      { speaker: 'B', de: 'Ich mag Blau am liebsten.', en: 'I like blue the most.' },
      { speaker: 'A', de: 'Warum magst du Blau?', en: 'Why do you like blue?' },
      { speaker: 'B', de: 'Weil der Himmel und das Meer blau sind.', en: 'Because the sky and the sea are blue.' },
      { speaker: 'A', de: 'Meine Lieblingsfarbe ist Grün.', en: 'My favourite colour is green.' },
      { speaker: 'B', de: 'Grün ist auch sehr schön!', en: 'Green is also very beautiful!' },
    ],
  },
  food: {
    vocab: [
      { de: 'das Brot', en: 'the bread', example: 'Ich esse Brot zum Frühstück.', exampleEn: 'I eat bread for breakfast.' },
      { de: 'die Milch', en: 'the milk', example: 'Ich trinke Milch.', exampleEn: 'I drink milk.' },
      { de: 'das Fleisch', en: 'the meat', example: 'Er isst kein Fleisch.', exampleEn: 'He does not eat meat.' },
      { de: 'das Gemüse', en: 'the vegetables', example: 'Gemüse ist gesund.', exampleEn: 'Vegetables are healthy.' },
      { de: 'das Obst', en: 'the fruit', example: 'Ich esse gern Obst.', exampleEn: 'I like eating fruit.' },
      { de: 'der Käse', en: 'the cheese', example: 'Deutschland ist bekannt für Käse.', exampleEn: 'Germany is known for cheese.' },
      { de: 'das Wasser', en: 'the water', example: 'Ich trinke viel Wasser.', exampleEn: 'I drink a lot of water.' },
      { de: 'der Kuchen', en: 'the cake', example: 'Der Kuchen schmeckt gut.', exampleEn: 'The cake tastes good.' },
    ],
    expressions: [
      { de: 'Ich esse gern…', en: 'I like eating…', example: 'Ich esse gern Brot mit Käse.', exampleEn: 'I like eating bread with cheese.' },
      { de: 'Was möchten Sie essen?', en: 'What would you like to eat?', example: 'Was möchten Sie essen? — Ich möchte Suppe.', exampleEn: 'What would you like to eat? — I would like soup.' },
      { de: 'Das schmeckt lecker!', en: 'That tastes delicious!', example: 'Der Kuchen schmeckt lecker!', exampleEn: 'The cake tastes delicious!' },
      { de: 'Ich bin vegetarisch.', en: 'I am vegetarian.', example: 'Ich bin vegetarisch und esse kein Fleisch.', exampleEn: 'I am vegetarian and do not eat meat.' },
    ],
    dialogue: [
      { speaker: 'A', de: 'Was isst du zum Frühstück?', en: 'What do you eat for breakfast?' },
      { speaker: 'B', de: 'Ich esse Brot mit Butter und trinke Kaffee.', en: 'I eat bread with butter and drink coffee.' },
      { speaker: 'A', de: 'Magst du Obst?', en: 'Do you like fruit?' },
      { speaker: 'B', de: 'Ja, ich esse gern Äpfel und Bananen.', en: 'Yes, I like eating apples and bananas.' },
      { speaker: 'A', de: 'Was ist dein Lieblingsessen?', en: 'What is your favourite food?' },
      { speaker: 'B', de: 'Mein Lieblingsessen ist Schnitzel mit Kartoffeln!', en: 'My favourite food is schnitzel with potatoes!' },
    ],
  },
  family: {
    vocab: [
      { de: 'die Mutter', en: 'the mother', example: 'Meine Mutter heißt Anna.', exampleEn: 'My mother is called Anna.' },
      { de: 'der Vater', en: 'the father', example: 'Mein Vater arbeitet viel.', exampleEn: 'My father works a lot.' },
      { de: 'die Schwester', en: 'the sister', example: 'Ich habe eine Schwester.', exampleEn: 'I have a sister.' },
      { de: 'der Bruder', en: 'the brother', example: 'Mein Bruder ist jünger.', exampleEn: 'My brother is younger.' },
      { de: 'die Großmutter', en: 'the grandmother', example: 'Meine Großmutter kocht gut.', exampleEn: 'My grandmother cooks well.' },
      { de: 'der Großvater', en: 'the grandfather', example: 'Mein Großvater ist 75 Jahre alt.', exampleEn: 'My grandfather is 75 years old.' },
      { de: 'die Familie', en: 'the family', example: 'Meine Familie ist groß.', exampleEn: 'My family is big.' },
      { de: 'das Kind', en: 'the child', example: 'Das Kind spielt im Garten.', exampleEn: 'The child plays in the garden.' },
    ],
    expressions: [
      { de: 'Hast du Geschwister?', en: 'Do you have siblings?', example: 'Hast du Geschwister? — Ja, ich habe einen Bruder.', exampleEn: 'Do you have siblings? — Yes, I have a brother.' },
      { de: 'Wie groß ist deine Familie?', en: 'How big is your family?', example: 'Meine Familie hat fünf Personen.', exampleEn: 'My family has five people.' },
      { de: 'Ich komme aus…', en: 'I come from…', example: 'Ich komme aus einer kleinen Familie.', exampleEn: 'I come from a small family.' },
      { de: 'Wir sind eng zusammen.', en: 'We are close.', example: 'Meine Familie ist sehr eng zusammen.', exampleEn: 'My family is very close.' },
    ],
    dialogue: [
      { speaker: 'A', de: 'Hast du Geschwister?', en: 'Do you have siblings?' },
      { speaker: 'B', de: 'Ja, ich habe eine Schwester und einen Bruder.', en: 'Yes, I have a sister and a brother.' },
      { speaker: 'A', de: 'Wie alt sind sie?', en: 'How old are they?' },
      { speaker: 'B', de: 'Meine Schwester ist 20 und mein Bruder ist 15.', en: 'My sister is 20 and my brother is 15.' },
      { speaker: 'A', de: 'Wohnst du mit deiner Familie zusammen?', en: 'Do you live with your family?' },
      { speaker: 'B', de: 'Ja, wir wohnen alle zusammen in Berlin.', en: 'Yes, we all live together in Berlin.' },
    ],
  },
  numbers: {
    vocab: [
      { de: 'eins', en: 'one', example: 'Ich habe einen Bruder.', exampleEn: 'I have one brother.' },
      { de: 'zwei', en: 'two', example: 'Ich habe zwei Katzen.', exampleEn: 'I have two cats.' },
      { de: 'drei', en: 'three', example: 'Es gibt drei Zimmer.', exampleEn: 'There are three rooms.' },
      { de: 'zehn', en: 'ten', example: 'Ich bin zehn Jahre alt.', exampleEn: 'I am ten years old.' },
      { de: 'zwanzig', en: 'twenty', example: 'Er ist zwanzig Jahre alt.', exampleEn: 'He is twenty years old.' },
      { de: 'hundert', en: 'one hundred', example: 'Das kostet hundert Euro.', exampleEn: 'That costs one hundred euros.' },
      { de: 'tausend', en: 'one thousand', example: 'Die Stadt hat tausend Einwohner.', exampleEn: 'The city has one thousand inhabitants.' },
      { de: 'die Zahl', en: 'the number', example: 'Was ist deine Lieblingszahl?', exampleEn: 'What is your favourite number?' },
    ],
    expressions: [
      { de: 'Wie viel kostet das?', en: 'How much does that cost?', example: 'Wie viel kostet das Buch? — Fünf Euro.', exampleEn: 'How much does the book cost? — Five euros.' },
      { de: 'Wie alt bist du?', en: 'How old are you?', example: 'Ich bin zwanzig Jahre alt.', exampleEn: 'I am twenty years old.' },
      { de: 'Wie viele…?', en: 'How many…?', example: 'Wie viele Personen sind das?', exampleEn: 'How many people is that?' },
      { de: 'ungefähr', en: 'approximately', example: 'Das kostet ungefähr zehn Euro.', exampleEn: 'That costs approximately ten euros.' },
    ],
    dialogue: [
      { speaker: 'A', de: 'Wie alt bist du?', en: 'How old are you?' },
      { speaker: 'B', de: 'Ich bin zweiundzwanzig Jahre alt.', en: 'I am twenty-two years old.' },
      { speaker: 'A', de: 'Wie viele Geschwister hast du?', en: 'How many siblings do you have?' },
      { speaker: 'B', de: 'Ich habe drei Geschwister.', en: 'I have three siblings.' },
      { speaker: 'A', de: 'Wie viel kostet die Fahrkarte?', en: 'How much does the ticket cost?' },
      { speaker: 'B', de: 'Sie kostet fünfzehn Euro.', en: 'It costs fifteen euros.' },
    ],
  },
};

function getTopicKey(topic) {
  const t = (topic || '').toLowerCase();
  if (t.includes('day') || t.includes('week') || t.includes('woche') || (t.includes('tag') && !t.includes('month'))) return 'days';
  if (t.includes('month') || t.includes('monat')) return 'months';
  if (t.includes('color') || t.includes('colour') || t.includes('farb')) return 'colors';
  if (t.includes('food') || t.includes('eat') || t.includes('essen') || t.includes('lebensmittel')) return 'food';
  if (t.includes('famil')) return 'family';
  if (t.includes('number') || t.includes('zahl') || t.includes('nummer')) return 'numbers';
  return 'default';
}

function buildFallbackLesson(topic, level, category) {
  const t = topic.trim();
  const key = getTopicKey(t);
  const data = TOPIC_DATA[key] || TOPIC_DATA.default;

  return {
    title: `${t} (${level})`,
    titleDe: `${t} auf Deutsch`,
    description: `Eine ${level}-Lektion über: ${t}.`,
    descriptionEn: `A ${level} lesson about: ${t}.`,
    sections: [
      {
        heading: 'Schlüsselvokabular',
        headingEn: 'Key Vocabulary',
        items: data.vocab,
      },
      {
        heading: 'Nützliche Ausdrücke',
        headingEn: 'Useful Expressions',
        items: data.expressions,
      },
      {
        heading: 'Grammatikhinweise',
        headingEn: 'Grammar Notes',
        items: TOPIC_DATA.default.vocab,
      },
    ],
    keyPoints: [
      'Click any German word to hear its pronunciation.',
      'All nouns in German have a gender: der (masc), die (fem), das (neut).',
      'Use the Exams page to test yourself on this lesson.',
    ],
    dialogue: {
      title: 'Ein Gespräch auf Deutsch',
      titleEn: 'A Conversation in German',
      lines: data.dialogue,
    },
  };
}

function buildFallbackExam(lesson, level, questionCount) {
  const title = lesson?.title || 'German';
  const key = getTopicKey(lesson?.content?.topic || title);
  const data = TOPIC_DATA[key] || TOPIC_DATA.default;
  const vocab = data.vocab;
  const perPart = Math.max(2, Math.floor(questionCount / 5));

  const filling = Array.from({ length: perPart + (questionCount - perPart * 5) }, (_, i) => {
    const item = vocab[i % vocab.length];
    return {
      type: 'fill',
      question: `Was bedeutet auf Englisch: "${item.de}"?`,
      questionEn: `What is the English translation of: "${item.de}"?`,
      answer: item.en,
      options: [item.en, vocab[(i+1)%vocab.length].en, vocab[(i+2)%vocab.length].en, vocab[(i+3)%vocab.length].en],
      explanation: `"${item.de}" bedeutet "${item.en}".`,
      explanationEn: `"${item.de}" means "${item.en}".`,
    };
  });

  const writing = Array.from({ length: perPart }, (_, i) => {
    const item = vocab[i % vocab.length];
    return {
      type: 'write',
      question: `Schreibe einen Satz mit: "${item.de}"`,
      questionEn: `Write a sentence using: "${item.de}" (${item.en})`,
      answer: item.example,
      answerEn: item.exampleEn,
      tip: 'Use the word in a complete sentence with a subject and verb.',
      options: [],
    };
  });

  const speaking = Array.from({ length: perPart }, (_, i) => {
    const line = data.dialogue[i % data.dialogue.length];
    return {
      type: 'speak',
      question: `Sprich diesen Satz aus: "${line.de}"`,
      questionEn: `Pronounce this sentence: "${line.de}"`,
      answer: line.de,
      answerEn: line.en,
      pronunciation: line.de,
      tip: 'Speak clearly and at a natural pace.',
      options: [],
    };
  });

  const reading = Array.from({ length: perPart }, (_, i) => {
    const item = vocab[i % vocab.length];
    return {
      type: 'read',
      text: item.example,
      textEn: item.exampleEn,
      question: `Was bedeutet: "${item.de}"?`,
      questionEn: `What does "${item.de}" mean?`,
      answer: item.en,
      options: [item.en, vocab[(i+1)%vocab.length].en, vocab[(i+2)%vocab.length].en, vocab[(i+3)%vocab.length].en],
      explanation: `"${item.de}" = "${item.en}".`,
      explanationEn: `"${item.de}" = "${item.en}".`,
    };
  });

  const listening = Array.from({ length: perPart }, (_, i) => {
    const line = data.dialogue[i % data.dialogue.length];
    return {
      type: 'listen',
      script: line.de,
      scriptEn: line.en,
      question: 'Was sagt die Person?',
      questionEn: 'What does the person say?',
      answer: line.de,
      options: [
        line.de,
        data.dialogue[(i+1)%data.dialogue.length].de,
        data.dialogue[(i+2)%data.dialogue.length].de,
        data.dialogue[(i+3)%data.dialogue.length].de,
      ],
      explanation: `Der Satz lautet: "${line.de}".`,
      explanationEn: `The sentence is: "${line.en}".`,
    };
  });

  return { parts: { filling, writing, speaking, reading, listening } };
}

module.exports = { buildFallbackLesson, buildFallbackExam };
