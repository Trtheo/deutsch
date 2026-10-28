const { Lesson } = require('./models');
const contentLessons = require('./content');
let coreExams = {};
try { coreExams = require('./content/core-exams'); } catch (err) {
  if (err.code !== 'MODULE_NOT_FOUND') throw err;
  console.warn('⚠️  content/core-exams.js not found, original lessons have no exam bank yet');
}

// Attach hand-written exam banks to the original lessons below
const withExam = l => (coreExams[l.slug] ? { ...l, content: { ...l.content, exam: coreExams[l.slug] } } : l);

const lessons = [
  {
    slug: 'alphabet',
    title: 'Alphabet',
    titleDe: 'Das Alphabet',
    level: 'A1',
    category: 'alphabet',
    content: {
      description: 'German uses 26 letters + 4 special characters: Ä, Ö, Ü, ß',
      descriptionEn: 'German uses the same 26 letters as English, plus special umlauts',
      letters: [
        { letter: 'A a', sound: 'ah', example: 'Apfel (apple)', ipa: '/aː/' },
        { letter: 'B b', sound: 'beh', example: 'Buch (book)', ipa: '/beː/' },
        { letter: 'C c', sound: 'tseh', example: 'Computer', ipa: '/tseː/' },
        { letter: 'D d', sound: 'deh', example: 'Deutsch (German)', ipa: '/deː/' },
        { letter: 'E e', sound: 'eh', example: 'Essen (food)', ipa: '/eː/' },
        { letter: 'F f', sound: 'eff', example: 'Freund (friend)', ipa: '/ɛf/' },
        { letter: 'G g', sound: 'geh', example: 'Guten (good)', ipa: '/geː/' },
        { letter: 'H h', sound: 'hah', example: 'Haus (house)', ipa: '/haː/' },
        { letter: 'I i', sound: 'ee', example: 'Ich (I)', ipa: '/iː/' },
        { letter: 'J j', sound: 'yot', example: 'Jahr (year)', ipa: '/jɔt/' },
        { letter: 'K k', sound: 'kah', example: 'Kind (child)', ipa: '/kaː/' },
        { letter: 'L l', sound: 'ell', example: 'Liebe (love)', ipa: '/ɛl/' },
        { letter: 'M m', sound: 'emm', example: 'Mutter (mother)', ipa: '/ɛm/' },
        { letter: 'N n', sound: 'enn', example: 'Nein (no)', ipa: '/ɛn/' },
        { letter: 'O o', sound: 'oh', example: 'Ort (place)', ipa: '/oː/' },
        { letter: 'P p', sound: 'peh', example: 'Papa (dad)', ipa: '/peː/' },
        { letter: 'Q q', sound: 'koo', example: 'Quelle (source)', ipa: '/kuː/' },
        { letter: 'R r', sound: 'err', example: 'Rot (red)', ipa: '/ɛʁ/' },
        { letter: 'S s', sound: 'ess', example: 'Sonne (sun)', ipa: '/ɛs/' },
        { letter: 'T t', sound: 'teh', example: 'Tisch (table)', ipa: '/teː/' },
        { letter: 'U u', sound: 'oo', example: 'Uhr (clock)', ipa: '/uː/' },
        { letter: 'V v', sound: 'fow', example: 'Vater (father)', ipa: '/faʊ/' },
        { letter: 'W w', sound: 'veh', example: 'Wasser (water)', ipa: '/veː/' },
        { letter: 'X x', sound: 'iks', example: 'Xylophon', ipa: '/ɪks/' },
        { letter: 'Y y', sound: 'üpsilon', example: 'Yoga', ipa: '/ˈʏpsilɔn/' },
        { letter: 'Z z', sound: 'tset', example: 'Zeit (time)', ipa: '/tsɛt/' },
        { letter: 'Ä ä', sound: 'eh (umlaut)', example: 'Äpfel (apples)', ipa: '/ɛː/' },
        { letter: 'Ö ö', sound: 'oe (umlaut)', example: 'Öl (oil)', ipa: '/øː/' },
        { letter: 'Ü ü', sound: 'ue (umlaut)', example: 'Über (over)', ipa: '/yː/' },
        { letter: 'ß', sound: 'ess-tset', example: 'Straße (street)', ipa: '/ɛsˈtsɛt/' },
      ]
    }
  },
  {
    slug: 'vocabulary-basics',
    title: 'Basic Vocabulary',
    titleDe: 'Grundwortschatz',
    level: 'A1',
    category: 'vocabulary',
    content: {
      description: 'Essential German words for beginners',
      descriptionEn: 'Learn the most important German words you need every day',
      phraseBook: [
        {
          category: 'Greetings', categoryDe: 'Begrüßungen', emoji: '👋',
          phrases: [
            { de: 'Hallo!', en: 'Hello!', note: 'informal' },
            { de: 'Guten Morgen!', en: 'Good morning!', note: 'until ~10am' },
            { de: 'Guten Tag!', en: 'Good day!', note: 'formal daytime' },
            { de: 'Guten Abend!', en: 'Good evening!', note: 'after ~6pm' },
            { de: 'Gute Nacht!', en: 'Good night!', note: 'before sleeping' },
            { de: 'Wie geht es Ihnen?', en: 'How are you? (formal)', note: 'formal' },
            { de: 'Wie geht es dir?', en: 'How are you? (informal)', note: 'informal' },
            { de: 'Mir geht es gut, danke!', en: 'I am fine, thank you!', note: '' },
            { de: 'Auf Wiedersehen!', en: 'Goodbye! (formal)', note: 'formal' },
            { de: 'Tschüss!', en: 'Bye! (informal)', note: 'informal' },
            { de: 'Bis bald!', en: 'See you soon!', note: '' },
            { de: 'Bis morgen!', en: 'See you tomorrow!', note: '' },
          ]
        },
        {
          category: 'Introductions', categoryDe: 'Vorstellungen', emoji: '🙋',
          phrases: [
            { de: 'Wie heißen Sie?', en: 'What is your name? (formal)', note: 'formal' },
            { de: 'Wie heißt du?', en: 'What is your name? (informal)', note: 'informal' },
            { de: 'Ich heiße...', en: 'My name is...', note: '' },
            { de: 'Ich bin...', en: 'I am...', note: '' },
            { de: 'Woher kommen Sie?', en: 'Where are you from? (formal)', note: 'formal' },
            { de: 'Woher kommst du?', en: 'Where are you from? (informal)', note: 'informal' },
            { de: 'Ich komme aus...', en: 'I come from...', note: 'e.g. England, Nigeria' },
            { de: 'Wie alt sind Sie?', en: 'How old are you? (formal)', note: 'formal' },
            { de: 'Ich bin ... Jahre alt.', en: 'I am ... years old.', note: '' },
            { de: 'Freut mich!', en: 'Nice to meet you!', note: '' },
            { de: 'Schön, Sie kennenzulernen!', en: 'Pleased to meet you!', note: 'formal' },
          ]
        },
        {
          category: 'Travel', categoryDe: 'Reisen', emoji: '✈️',
          phrases: [
            { de: 'Wo ist der Bahnhof?', en: 'Where is the train station?', note: '' },
            { de: 'Wo ist die U-Bahn?', en: 'Where is the subway?', note: '' },
            { de: 'Wie komme ich zum Flughafen?', en: 'How do I get to the airport?', note: '' },
            { de: 'Eine Fahrkarte nach Berlin, bitte.', en: 'One ticket to Berlin, please.', note: '' },
            { de: 'Wann fährt der nächste Zug?', en: 'When does the next train leave?', note: '' },
            { de: 'Wo ist die Haltestelle?', en: 'Where is the bus stop?', note: '' },
            { de: 'Ich möchte ein Taxi.', en: 'I would like a taxi.', note: '' },
            { de: 'Ich habe mich verlaufen.', en: 'I am lost.', note: '' },
            { de: 'Können Sie mir helfen?', en: 'Can you help me?', note: '' },
            { de: 'Bitte fahren Sie langsamer.', en: 'Please drive slower.', note: '' },
            { de: 'Halten Sie hier an, bitte.', en: 'Stop here, please.', note: '' },
          ]
        },
        {
          category: 'Food & Drink', categoryDe: 'Essen & Trinken', emoji: '🍽️',
          phrases: [
            { de: 'Ich hätte gerne die Speisekarte.', en: 'I would like the menu.', note: '' },
            { de: 'Was empfehlen Sie?', en: 'What do you recommend?', note: '' },
            { de: 'Ich möchte bestellen.', en: 'I would like to order.', note: '' },
            { de: 'Einmal das Schnitzel, bitte.', en: 'One schnitzel, please.', note: '' },
            { de: 'Ich bin Vegetarier/Vegetarierin.', en: 'I am vegetarian.', note: 'm/f' },
            { de: 'Ich bin allergisch gegen...', en: 'I am allergic to...', note: '' },
            { de: 'Das schmeckt sehr gut!', en: 'This tastes very good!', note: '' },
            { de: 'Die Rechnung, bitte.', en: 'The bill, please.', note: '' },
            { de: 'Getrennt oder zusammen?', en: 'Separate or together?', note: 'paying' },
            { de: 'Stimmt so.', en: 'Keep the change.', note: 'tipping' },
            { de: 'Ein Glas Wasser, bitte.', en: 'A glass of water, please.', note: '' },
          ]
        },
        {
          category: 'Shopping', categoryDe: 'Einkaufen', emoji: '🛍️',
          phrases: [
            { de: 'Was kostet das?', en: 'How much does this cost?', note: '' },
            { de: 'Das ist zu teuer.', en: 'That is too expensive.', note: '' },
            { de: 'Haben Sie das in einer anderen Größe?', en: 'Do you have this in another size?', note: '' },
            { de: 'Kann ich das anprobieren?', en: 'Can I try this on?', note: '' },
            { de: 'Ich nehme es.', en: 'I will take it.', note: '' },
            { de: 'Ich schaue mich nur um.', en: 'I am just looking.', note: '' },
            { de: 'Haben Sie etwas Günstigeres?', en: 'Do you have something cheaper?', note: '' },
            { de: 'Wo ist die Kasse?', en: 'Where is the checkout?', note: '' },
            { de: 'Kann ich mit Karte zahlen?', en: 'Can I pay by card?', note: '' },
          ]
        },
        {
          category: 'Health', categoryDe: 'Gesundheit', emoji: '🏥',
          phrases: [
            { de: 'Ich brauche einen Arzt.', en: 'I need a doctor.', note: '' },
            { de: 'Rufen Sie einen Krankenwagen!', en: 'Call an ambulance!', note: 'emergency' },
            { de: 'Ich fühle mich nicht gut.', en: 'I do not feel well.', note: '' },
            { de: 'Mir ist schlecht.', en: 'I feel sick / nauseous.', note: '' },
            { de: 'Ich habe Schmerzen.', en: 'I am in pain.', note: '' },
            { de: 'Ich habe Kopfschmerzen.', en: 'I have a headache.', note: '' },
            { de: 'Ich habe Fieber.', en: 'I have a fever.', note: '' },
            { de: 'Wo ist die nächste Apotheke?', en: 'Where is the nearest pharmacy?', note: '' },
            { de: 'Ich bin gegen ... allergisch.', en: 'I am allergic to...', note: '' },
          ]
        },
        {
          category: 'Numbers & Time', categoryDe: 'Zahlen & Zeit', emoji: '🕐',
          phrases: [
            { de: 'Wie spät ist es?', en: 'What time is it?', note: '' },
            { de: 'Es ist drei Uhr.', en: 'It is three o clock.', note: '' },
            { de: 'Es ist halb vier.', en: 'It is half past three.', note: 'lit. half four' },
            { de: 'Heute', en: 'Today', note: '' },
            { de: 'Morgen', en: 'Tomorrow', note: '' },
            { de: 'Gestern', en: 'Yesterday', note: '' },
            { de: 'Jetzt', en: 'Now', note: '' },
            { de: 'Später', en: 'Later', note: '' },
            { de: 'In einer Stunde', en: 'In one hour', note: '' },
          ]
        },
        {
          category: 'Emergencies', categoryDe: 'Notfälle', emoji: '🚨',
          phrases: [
            { de: 'Hilfe!', en: 'Help!', note: 'emergency' },
            { de: 'Rufen Sie die Polizei!', en: 'Call the police!', note: 'emergency' },
            { de: 'Feuer!', en: 'Fire!', note: 'emergency' },
            { de: 'Ich wurde bestohlen.', en: 'I have been robbed.', note: '' },
            { de: 'Ich habe meinen Pass verloren.', en: 'I have lost my passport.', note: '' },
            { de: 'Wo ist die nächste Polizeiwache?', en: 'Where is the nearest police station?', note: '' },
            { de: 'Ich brauche Hilfe.', en: 'I need help.', note: '' },
            { de: 'Bitte rufen Sie einen Arzt.', en: 'Please call a doctor.', note: '' },
          ]
        },
      ],
      words: [
        { de: 'Hallo', en: 'Hello', example: 'Hallo! Wie geht es dir?', exampleEn: 'Hello! How are you?' },
        { de: 'Danke', en: 'Thank you', example: 'Danke schön!', exampleEn: 'Thank you very much!' },
        { de: 'Bitte', en: 'Please / You\'re welcome', example: 'Bitte sehr!', exampleEn: 'You\'re very welcome!' },
        { de: 'Ja', en: 'Yes', example: 'Ja, natürlich!', exampleEn: 'Yes, of course!' },
        { de: 'Nein', en: 'No', example: 'Nein, danke.', exampleEn: 'No, thank you.' },
        { de: 'Entschuldigung', en: 'Excuse me / Sorry', example: 'Entschuldigung, wo ist der Bahnhof?', exampleEn: 'Excuse me, where is the train station?' },
        { de: 'Guten Morgen', en: 'Good morning', example: 'Guten Morgen! Wie schläfst du?', exampleEn: 'Good morning! How did you sleep?' },
        { de: 'Guten Tag', en: 'Good day', example: 'Guten Tag, Herr Müller.', exampleEn: 'Good day, Mr. Müller.' },
        { de: 'Guten Abend', en: 'Good evening', example: 'Guten Abend! Wie war dein Tag?', exampleEn: 'Good evening! How was your day?' },
        { de: 'Auf Wiedersehen', en: 'Goodbye', example: 'Auf Wiedersehen! Bis morgen.', exampleEn: 'Goodbye! See you tomorrow.' },
        { de: 'Tschüss', en: 'Bye (informal)', example: 'Tschüss! Bis später.', exampleEn: 'Bye! See you later.' },
        { de: 'Wie heißt du?', en: 'What is your name?', example: 'Wie heißt du? Ich heiße Anna.', exampleEn: 'What is your name? My name is Anna.' },
        { de: 'Ich heiße...', en: 'My name is...', example: 'Ich heiße Thomas.', exampleEn: 'My name is Thomas.' },
        { de: 'Wie geht es dir?', en: 'How are you?', example: 'Wie geht es dir? Gut, danke!', exampleEn: 'How are you? Good, thanks!' },
        { de: 'Mir geht es gut', en: 'I am fine', example: 'Mir geht es gut, und dir?', exampleEn: 'I am fine, and you?' },
        { de: 'Wasser', en: 'Water', example: 'Ich möchte Wasser, bitte.', exampleEn: 'I would like water, please.' },
        { de: 'Essen', en: 'Food / To eat', example: 'Das Essen ist lecker!', exampleEn: 'The food is delicious!' },
        { de: 'Haus', en: 'House', example: 'Das ist mein Haus.', exampleEn: 'That is my house.' },
        { de: 'Auto', en: 'Car', example: 'Mein Auto ist rot.', exampleEn: 'My car is red.' },
        { de: 'Familie', en: 'Family', example: 'Meine Familie ist groß.', exampleEn: 'My family is big.' },
      ]
    }
  },
  {
    slug: 'numbers',
    title: 'Numbers',
    titleDe: 'Die Zahlen',
    level: 'A1',
    category: 'numbers',
    content: {
      description: 'German numbers from 0 to 1000',
      descriptionEn: 'Learn to count in German - essential for daily life',
      numbers: [
        { num: 0, de: 'null', en: 'zero' },
        { num: 1, de: 'eins', en: 'one' },
        { num: 2, de: 'zwei', en: 'two' },
        { num: 3, de: 'drei', en: 'three' },
        { num: 4, de: 'vier', en: 'four' },
        { num: 5, de: 'fünf', en: 'five' },
        { num: 6, de: 'sechs', en: 'six' },
        { num: 7, de: 'sieben', en: 'seven' },
        { num: 8, de: 'acht', en: 'eight' },
        { num: 9, de: 'neun', en: 'nine' },
        { num: 10, de: 'zehn', en: 'ten' },
        { num: 11, de: 'elf', en: 'eleven' },
        { num: 12, de: 'zwölf', en: 'twelve' },
        { num: 13, de: 'dreizehn', en: 'thirteen' },
        { num: 20, de: 'zwanzig', en: 'twenty' },
        { num: 21, de: 'einundzwanzig', en: 'twenty-one' },
        { num: 30, de: 'dreißig', en: 'thirty' },
        { num: 40, de: 'vierzig', en: 'forty' },
        { num: 50, de: 'fünfzig', en: 'fifty' },
        { num: 100, de: 'hundert', en: 'one hundred' },
        { num: 1000, de: 'tausend', en: 'one thousand' },
      ]
    }
  },
  {
    slug: 'grammar-articles',
    title: 'Articles & Gender',
    titleDe: 'Artikel und Genus',
    level: 'A1',
    category: 'grammar',
    content: {
      description: 'German has three genders: masculine (der), feminine (die), neuter (das)',
      descriptionEn: 'Unlike English, every German noun has a gender. You must learn the article with each word!',
      rules: [
        { title: 'Definite Articles (The)', titleEn: 'Definite Articles - like "the" in English', rows: [
          { case: 'Nominative', masc: 'der', fem: 'die', neut: 'das', plural: 'die' },
          { case: 'Accusative', masc: 'den', fem: 'die', neut: 'das', plural: 'die' },
          { case: 'Dative', masc: 'dem', fem: 'der', neut: 'dem', plural: 'den' },
          { case: 'Genitive', masc: 'des', fem: 'der', neut: 'des', plural: 'der' },
        ]},
        { title: 'Indefinite Articles (A/An)', titleEn: 'Indefinite Articles - like "a/an" in English', rows: [
          { case: 'Nominative', masc: 'ein', fem: 'eine', neut: 'ein', plural: '-' },
          { case: 'Accusative', masc: 'einen', fem: 'eine', neut: 'ein', plural: '-' },
          { case: 'Dative', masc: 'einem', fem: 'einer', neut: 'einem', plural: '-' },
          { case: 'Genitive', masc: 'eines', fem: 'einer', neut: 'eines', plural: '-' },
        ]}
      ],
      examples: [
        { de: 'der Mann', en: 'the man (masculine)', note: 'masculine' },
        { de: 'die Frau', en: 'the woman (feminine)', note: 'feminine' },
        { de: 'das Kind', en: 'the child (neuter)', note: 'neuter' },
        { de: 'Ich sehe den Mann.', en: 'I see the man. (accusative)', note: 'accusative case' },
      ]
    }
  },
  {
    slug: 'verbs-present',
    title: 'Common Verbs',
    titleDe: 'Häufige Verben',
    level: 'A1',
    category: 'verbs',
    content: {
      description: 'Essential German verbs and their conjugation',
      descriptionEn: 'German verbs change their endings based on the subject - learn the patterns!',
      verbs: [
        { infinitive: 'sein', en: 'to be', conjugation: { ich: 'bin', du: 'bist', er: 'ist', wir: 'sind', ihr: 'seid', sie: 'sind' } },
        { infinitive: 'haben', en: 'to have', conjugation: { ich: 'habe', du: 'hast', er: 'hat', wir: 'haben', ihr: 'habt', sie: 'haben' } },
        { infinitive: 'gehen', en: 'to go', conjugation: { ich: 'gehe', du: 'gehst', er: 'geht', wir: 'gehen', ihr: 'geht', sie: 'gehen' } },
        { infinitive: 'kommen', en: 'to come', conjugation: { ich: 'komme', du: 'kommst', er: 'kommt', wir: 'kommen', ihr: 'kommt', sie: 'kommen' } },
        { infinitive: 'machen', en: 'to do/make', conjugation: { ich: 'mache', du: 'machst', er: 'macht', wir: 'machen', ihr: 'macht', sie: 'machen' } },
        { infinitive: 'sprechen', en: 'to speak', conjugation: { ich: 'spreche', du: 'sprichst', er: 'spricht', wir: 'sprechen', ihr: 'sprecht', sie: 'sprechen' } },
        { infinitive: 'essen', en: 'to eat', conjugation: { ich: 'esse', du: 'isst', er: 'isst', wir: 'essen', ihr: 'esst', sie: 'essen' } },
        { infinitive: 'trinken', en: 'to drink', conjugation: { ich: 'trinke', du: 'trinkst', er: 'trinkt', wir: 'trinken', ihr: 'trinkt', sie: 'trinken' } },
      ]
    }
  },
  {
    slug: 'tenses',
    title: 'German Tenses',
    titleDe: 'Deutsche Zeitformen',
    level: 'A2',
    category: 'tenses',
    content: {
      description: 'Present, Past (Perfekt/Präteritum), and Future tenses',
      descriptionEn: 'German has several past tenses - Perfekt is used in speech, Präteritum in writing',
      tenses: [
        { name: 'Präsens (Present)', nameEn: 'Present Tense - happening now', example: 'Ich lerne Deutsch.', exampleEn: 'I am learning German.', usage: 'Current actions and general truths' },
        { name: 'Perfekt (Present Perfect)', nameEn: 'Perfect Tense - used in spoken German for past events', example: 'Ich habe Deutsch gelernt.', exampleEn: 'I have learned / I learned German.', usage: 'Spoken past tense - most common in conversation' },
        { name: 'Präteritum (Simple Past)', nameEn: 'Simple Past - used in written German', example: 'Ich lernte Deutsch.', exampleEn: 'I learned German.', usage: 'Written past tense - books, newspapers' },
        { name: 'Futur I (Future)', nameEn: 'Future Tense - will happen', example: 'Ich werde Deutsch lernen.', exampleEn: 'I will learn German.', usage: 'Future plans and predictions' },
        { name: 'Plusquamperfekt (Past Perfect)', nameEn: 'Past Perfect - happened before another past event', example: 'Ich hatte Deutsch gelernt.', exampleEn: 'I had learned German.', usage: 'Events before another past event' },
      ]
    }
  },
  {
    slug: 'reading-a1',
    title: 'Reading: Daily Life',
    titleDe: 'Lesen: Alltag',
    level: 'A1',
    category: 'reading',
    content: {
      description: 'Short German texts about daily life',
      descriptionEn: 'Practice reading German texts - start with simple sentences about everyday topics',
      texts: [
        {
          title: 'Meine Familie',
          titleEn: 'My Family',
          text: 'Ich heiße Anna. Ich bin 25 Jahre alt. Ich komme aus Deutschland. Meine Familie ist klein. Ich habe einen Bruder und eine Schwester. Mein Bruder heißt Max und ist 22 Jahre alt. Meine Schwester heißt Lisa und ist 28 Jahre alt. Wir wohnen in Berlin.',
          translation: 'My name is Anna. I am 25 years old. I come from Germany. My family is small. I have a brother and a sister. My brother\'s name is Max and he is 22 years old. My sister\'s name is Lisa and she is 28 years old. We live in Berlin.',
          questions: [
            { q: 'Wie heißt die Person?', qEn: 'What is the person\'s name?', a: 'Anna' },
            { q: 'Wie alt ist Anna?', qEn: 'How old is Anna?', a: '25 Jahre alt' },
            { q: 'Wo wohnen sie?', qEn: 'Where do they live?', a: 'In Berlin' },
          ]
        },
        {
          title: 'Im Café',
          titleEn: 'At the Café',
          text: 'Es ist Montag. Maria geht ins Café. Sie bestellt einen Kaffee und ein Stück Kuchen. Der Kaffee kostet zwei Euro. Der Kuchen kostet drei Euro. Maria bezahlt fünf Euro. Sie liest eine Zeitung und trinkt ihren Kaffee. Das Café ist sehr gemütlich.',
          translation: 'It is Monday. Maria goes to the café. She orders a coffee and a piece of cake. The coffee costs two euros. The cake costs three euros. Maria pays five euros. She reads a newspaper and drinks her coffee. The café is very cozy.',
          questions: [
            { q: 'Was bestellt Maria?', qEn: 'What does Maria order?', a: 'Einen Kaffee und ein Stück Kuchen' },
            { q: 'Wie viel kostet alles?', qEn: 'How much does everything cost?', a: 'Fünf Euro' },
          ]
        }
      ]
    }
  },
  {
    slug: 'writing-a1',
    title: 'Writing Practice',
    titleDe: 'Schreibübungen',
    level: 'A1',
    category: 'writing',
    content: {
      description: 'Practice writing German sentences and short texts',
      descriptionEn: 'Writing practice helps you remember grammar rules and vocabulary',
      exercises: [
        { type: 'sentence', prompt: 'Introduce yourself in German', promptEn: 'Write 3-5 sentences about yourself (name, age, where you are from)', example: 'Ich heiße [Name]. Ich bin [Alter] Jahre alt. Ich komme aus [Land]. Ich lerne Deutsch.' },
        { type: 'email', prompt: 'Schreibe eine kurze E-Mail', promptEn: 'Write a short email to a German friend about your weekend', example: 'Liebe/r [Name], wie geht es dir? Am Wochenende habe ich...' },
        { type: 'description', prompt: 'Beschreibe dein Zimmer', promptEn: 'Describe your room using German vocabulary', example: 'Mein Zimmer ist groß/klein. Es gibt ein Bett, einen Tisch und...' },
      ]
    }
  },
  {
    slug: 'listening-a1',
    title: 'Listening Practice',
    titleDe: 'Hörübungen',
    level: 'A1',
    category: 'listening',
    content: {
      description: 'Train your ear to understand spoken German',
      descriptionEn: 'Listening is key to understanding real German - practice with these exercises',
      exercises: [
        { title: 'Greetings Dialogue', titleEn: 'A simple greeting conversation', script: 'A: Guten Morgen! Wie heißen Sie?\nB: Guten Morgen! Ich heiße Klaus Müller. Und Sie?\nA: Ich bin Maria Schmidt. Woher kommen Sie?\nB: Ich komme aus München. Und Sie?\nA: Ich komme aus Berlin. Schön, Sie kennenzulernen!\nB: Sehr erfreut!', translation: 'A: Good morning! What is your name?\nB: Good morning! My name is Klaus Müller. And you?\nA: I am Maria Schmidt. Where are you from?\nB: I am from Munich. And you?\nA: I am from Berlin. Nice to meet you!\nB: Very pleased to meet you!' },
        { title: 'At the Restaurant', titleEn: 'Ordering food at a German restaurant', script: 'Kellner: Guten Abend! Was möchten Sie bestellen?\nGast: Ich hätte gerne die Suppe und das Schnitzel, bitte.\nKellner: Und was möchten Sie trinken?\nGast: Ein Glas Wasser, bitte.\nKellner: Sehr gerne. Kommt sofort!', translation: 'Waiter: Good evening! What would you like to order?\nGuest: I would like the soup and the schnitzel, please.\nWaiter: And what would you like to drink?\nGuest: A glass of water, please.\nWaiter: Of course. Coming right up!' }
      ]
    }
  },
  {
    slug: 'speaking-a1',
    title: 'Speaking Practice',
    titleDe: 'Sprechübungen',
    level: 'A1',
    category: 'speaking',
    content: {
      description: 'Practice German pronunciation and speaking',
      descriptionEn: 'Speaking practice - listen to the German and try to repeat it correctly',
      phrases: [
        { de: 'Ich spreche ein bisschen Deutsch.', en: 'I speak a little German.', tip: 'Stress: ICH SPRE-che ein BIS-schen DEUTSCH' },
        { de: 'Können Sie das bitte wiederholen?', en: 'Can you please repeat that?', tip: 'Very useful when you don\'t understand something' },
        { de: 'Ich verstehe nicht.', en: 'I don\'t understand.', tip: 'Don\'t be afraid to say this!' },
        { de: 'Sprechen Sie Englisch?', en: 'Do you speak English?', tip: 'Useful in emergencies' },
        { de: 'Wie sagt man ... auf Deutsch?', en: 'How do you say ... in German?', tip: 'Great for expanding vocabulary' },
        { de: 'Wo ist die Toilette?', en: 'Where is the bathroom?', tip: 'Essential phrase for travelers!' },
        { de: 'Was kostet das?', en: 'How much does that cost?', tip: 'Shopping vocabulary' },
        { de: 'Ich hätte gerne...', en: 'I would like...', tip: 'Polite way to order or request something' },
      ]
    }
  },
  {
    slug: 'grammar-a2',
    title: 'Adjectives & Comparatives',
    titleDe: 'Adjektive und Komparativ',
    level: 'A2',
    category: 'grammar',
    content: {
      description: 'Adjektivendungen und Komparativ/Superlativ',
      descriptionEn: 'Learn how adjective endings change with gender/case, and how to compare things in German',
      rules: [
        {
          title: 'Adjektivendungen nach bestimmtem Artikel',
          titleEn: 'Adjective endings after definite article (der/die/das)',
          rows: [
            { case: 'Nominative', masc: '-e', fem: '-e', neut: '-e', plural: '-en' },
            { case: 'Accusative', masc: '-en', fem: '-e', neut: '-e', plural: '-en' },
            { case: 'Dative', masc: '-en', fem: '-en', neut: '-en', plural: '-en' },
            { case: 'Genitive', masc: '-en', fem: '-en', neut: '-en', plural: '-en' },
          ]
        },
        {
          title: 'Komparativ und Superlativ',
          titleEn: 'Comparative and Superlative',
          rows: [
            { case: 'Positive', masc: 'schnell', fem: 'groß', neut: 'alt', plural: 'gut' },
            { case: 'Comparative', masc: 'schneller', fem: 'größer', neut: 'älter', plural: 'besser' },
            { case: 'Superlative', masc: 'am schnellsten', fem: 'am größten', neut: 'am ältesten', plural: 'am besten' },
          ]
        }
      ],
      examples: [
        { de: 'Der alte Mann geht langsam.', en: 'The old man walks slowly.', note: 'nom. masc → -e' },
        { de: 'Ich sehe den alten Mann.', en: 'I see the old man.', note: 'acc. masc → -en' },
        { de: 'Berlin ist größer als München.', en: 'Berlin is bigger than Munich.', note: 'comparative + als' },
        { de: 'Das ist das beste Restaurant.', en: 'That is the best restaurant.', note: 'superlative' },
        { de: 'Sie ist älter als ihr Bruder.', en: 'She is older than her brother.', note: 'umlaut in comparative' },
        { de: 'Er fährt am schnellsten.', en: 'He drives the fastest.', note: 'superlative with am' },
      ]
    }
  },
  {
    slug: 'vocabulary-a2',
    title: 'Daily Life Vocabulary',
    titleDe: 'Alltagswortschatz',
    level: 'A2',
    category: 'vocabulary',
    content: {
      description: 'Wortschatz für den Alltag: Zuhause, Arbeit, Freizeit',
      descriptionEn: 'Essential A2 vocabulary for home, work and free time',
      words: [
        { de: 'die Wohnung', en: 'apartment', example: 'Meine Wohnung ist im dritten Stock.', exampleEn: 'My apartment is on the third floor.' },
        { de: 'die Küche', en: 'kitchen', example: 'Ich koche in der Küche.', exampleEn: 'I cook in the kitchen.' },
        { de: 'das Schlafzimmer', en: 'bedroom', example: 'Das Schlafzimmer ist ruhig.', exampleEn: 'The bedroom is quiet.' },
        { de: 'der Beruf', en: 'profession', example: 'Was ist dein Beruf?', exampleEn: 'What is your profession?' },
        { de: 'die Arbeit', en: 'work', example: 'Ich gehe zur Arbeit um acht Uhr.', exampleEn: 'I go to work at eight.' },
        { de: 'der Kollege', en: 'colleague', example: 'Mein Kollege heißt Stefan.', exampleEn: 'My colleague is called Stefan.' },
        { de: 'die Freizeit', en: 'free time', example: 'In meiner Freizeit lese ich gern.', exampleEn: 'In my free time I like to read.' },
        { de: 'das Hobby', en: 'hobby', example: 'Mein Hobby ist Fußball.', exampleEn: 'My hobby is football.' },
        { de: 'der Supermarkt', en: 'supermarket', example: 'Ich kaufe im Supermarkt ein.', exampleEn: 'I shop at the supermarket.' },
        { de: 'die Straße', en: 'street', example: 'Die Straße ist sehr breit.', exampleEn: 'The street is very wide.' },
        { de: 'der Termin', en: 'appointment', example: 'Ich habe einen Termin beim Arzt.', exampleEn: 'I have a doctor appointment.' },
        { de: 'die Nachricht', en: 'message', example: 'Ich habe eine Nachricht bekommen.', exampleEn: 'I received a message.' },
        { de: 'bezahlen', en: 'to pay', example: 'Kann ich mit Karte bezahlen?', exampleEn: 'Can I pay by card?' },
        { de: 'bestellen', en: 'to order', example: 'Ich möchte bestellen, bitte.', exampleEn: 'I would like to order, please.' },
        { de: 'vergessen', en: 'to forget', example: 'Ich habe meinen Schlüssel vergessen.', exampleEn: 'I forgot my key.' },
        { de: 'erklären', en: 'to explain', example: 'Können Sie das erklären?', exampleEn: 'Can you explain that?' },
        { de: 'brauchen', en: 'to need', example: 'Ich brauche Hilfe.', exampleEn: 'I need help.' },
        { de: 'wohnen', en: 'to live', example: 'Ich wohne in Hamburg.', exampleEn: 'I live in Hamburg.' },
        { de: 'arbeiten', en: 'to work', example: 'Sie arbeitet als Ärztin.', exampleEn: 'She works as a doctor.' },
        { de: 'schlafen', en: 'to sleep', example: 'Ich schlafe acht Stunden.', exampleEn: 'I sleep eight hours.' },
      ],
      phraseBook: [
        {
          category: 'At Work', categoryDe: 'Bei der Arbeit', emoji: '💼',
          phrases: [
            { de: 'Ich arbeite als...', en: 'I work as a...', note: '' },
            { de: 'Mein Chef ist sehr nett.', en: 'My boss is very nice.', note: '' },
            { de: 'Ich habe eine Besprechung.', en: 'I have a meeting.', note: '' },
            { de: 'Können Sie mir helfen?', en: 'Can you help me?', note: 'formal' },
            { de: 'Das Projekt ist fertig.', en: 'The project is finished.', note: '' },
          ]
        },
        {
          category: 'At Home', categoryDe: 'Zuhause', emoji: '🏠',
          phrases: [
            { de: 'Ich räume die Wohnung auf.', en: 'I am tidying the apartment.', note: '' },
            { de: 'Das Essen ist fertig.', en: 'The food is ready.', note: '' },
            { de: 'Kannst du den Tisch decken?', en: 'Can you set the table?', note: '' },
            { de: 'Ich mache die Wäsche.', en: 'I am doing the laundry.', note: '' },
          ]
        },
        {
          category: 'Free Time', categoryDe: 'Freizeit', emoji: '🎉',
          phrases: [
            { de: 'Was machst du am Wochenende?', en: 'What are you doing at the weekend?', note: '' },
            { de: 'Ich gehe ins Kino.', en: 'I am going to the cinema.', note: '' },
            { de: 'Hast du Lust auf einen Spaziergang?', en: 'Do you feel like a walk?', note: '' },
            { de: 'Ich treffe mich mit Freunden.', en: 'I am meeting up with friends.', note: '' },
          ]
        }
      ]
    }
  },
  {
    slug: 'reading-a2',
    title: 'Reading: Emails & Signs',
    titleDe: 'Lesen: E-Mails und Schilder',
    level: 'A2',
    category: 'reading',
    content: {
      description: 'E-Mails, Schilder und kurze Texte lesen',
      descriptionEn: 'Practice reading everyday German texts — emails, notices and short articles',
      texts: [
        {
          title: 'Eine E-Mail von der Arbeit',
          titleEn: 'An Email from Work',
          text: 'Betreff: Besprechung am Montag. Liebe Kolleginnen und Kollegen, ich möchte Sie an unsere Besprechung am Montag, den 15. März um 10 Uhr erinnern. Wir treffen uns im Konferenzraum 3. Bitte bringen Sie Ihre Berichte mit. Bei Fragen können Sie mich jederzeit kontaktieren. Mit freundlichen Grüßen, Herr Bauer.',
          translation: 'Subject: Meeting on Monday. Dear colleagues, I would like to remind you of our meeting on Monday the 15th of March at 10 o clock. We will meet in conference room 3. Please bring your reports. If you have any questions you can contact me at any time. Kind regards, Mr Bauer.',
          questions: [
            { q: 'Wann ist die Besprechung?', qEn: 'When is the meeting?', a: 'Am Montag um 10 Uhr' },
            { q: 'Wo findet die Besprechung statt?', qEn: 'Where does the meeting take place?', a: 'Im Konferenzraum 3' },
            { q: 'Was sollen die Kollegen mitbringen?', qEn: 'What should colleagues bring?', a: 'Ihre Berichte' },
          ]
        },
        {
          title: 'Wohnungsanzeige',
          titleEn: 'Apartment Advertisement',
          text: 'Zu vermieten: Schöne 2-Zimmer-Wohnung in München-Schwabing. 65 Quadratmeter, 3. Etage, Aufzug vorhanden. Moderne Küche, Badezimmer mit Badewanne. Kaltmiete: 900 Euro pro Monat. Nebenkosten: 150 Euro. Haustiere auf Anfrage. Verfügbar ab 1. April. Kontakt: Frau Weber, Tel. 089-123456.',
          translation: 'For rent: Beautiful 2-room apartment in Munich-Schwabing. 65 square metres, 3rd floor, lift available. Modern kitchen, bathroom with bathtub. Base rent: 900 euros per month. Additional costs: 150 euros. Pets on request. Available from 1st April. Contact: Mrs Weber, Tel. 089-123456.',
          questions: [
            { q: 'Wie groß ist die Wohnung?', qEn: 'How big is the apartment?', a: '65 Quadratmeter' },
            { q: 'Wie viel kostet die Kaltmiete?', qEn: 'How much is the base rent?', a: '900 Euro pro Monat' },
            { q: 'Ab wann ist die Wohnung verfügbar?', qEn: 'From when is the apartment available?', a: 'Ab 1. April' },
          ]
        },
        {
          title: 'Stadtführer: Hamburg',
          titleEn: 'City Guide: Hamburg',
          text: 'Hamburg ist die zweitgrößte Stadt Deutschlands. Die Stadt liegt im Norden und hat etwa 1,8 Millionen Einwohner. Hamburg ist bekannt für seinen großen Hafen, die Speicherstadt und die Reeperbahn. Das Wetter in Hamburg ist oft bewölkt und regnerisch. Die Einwohner nennen sich stolz Hamburger. Die Stadt hat viele Museen, Parks und Restaurants.',
          translation: 'Hamburg is the second largest city in Germany. The city is located in the north and has about 1.8 million inhabitants. Hamburg is known for its large port, the Speicherstadt and the Reeperbahn. The weather in Hamburg is often cloudy and rainy. The inhabitants proudly call themselves Hamburgers. The city has many museums, parks and restaurants.',
          questions: [
            { q: 'Wie viele Einwohner hat Hamburg?', qEn: 'How many inhabitants does Hamburg have?', a: 'Etwa 1,8 Millionen' },
            { q: 'Wofür ist Hamburg bekannt?', qEn: 'What is Hamburg known for?', a: 'Für seinen Hafen, die Speicherstadt und die Reeperbahn' },
          ]
        }
      ]
    }
  },
  {
    slug: 'writing-a2',
    title: 'Writing: Letters & Emails',
    titleDe: 'Schreiben: Briefe und E-Mails',
    level: 'A2',
    category: 'writing',
    content: {
      description: 'Formelle und informelle Briefe und E-Mails schreiben',
      descriptionEn: 'Learn to write formal and informal letters and emails in German',
      exercises: [
        {
          type: 'email',
          prompt: 'Schreibe eine informelle E-Mail',
          promptEn: 'Write an informal email to a German friend inviting them to your birthday party — include date, time and place',
          example: 'Liebe Anna, ich hoffe, es geht dir gut! Ich möchte dich zu meiner Geburtstagsparty einladen. Die Party findet am Samstag, den 20. März um 19 Uhr bei mir zuhause statt. Adresse: Hauptstraße 5, Berlin. Ich freue mich auf dich! Viele Grüße, Thomas'
        },
        {
          type: 'letter',
          prompt: 'Schreibe einen formellen Brief',
          promptEn: 'Write a formal letter to a landlord reporting a broken heating system — be polite and specific',
          example: 'Sehr geehrte Frau Müller, ich schreibe Ihnen bezüglich eines Problems in meiner Wohnung. Seit drei Tagen funktioniert die Heizung nicht. Es ist sehr kalt in der Wohnung. Ich bitte Sie, das Problem so schnell wie möglich zu beheben. Mit freundlichen Grüßen, Max Mustermann'
        },
        {
          type: 'description',
          prompt: 'Beschreibe deinen Tagesablauf',
          promptEn: 'Describe your typical daily routine in German — use time expressions like morgens, mittags, abends',
          example: 'Ich stehe um 7 Uhr auf. Morgens frühstücke ich und trinke Kaffee. Um 8 Uhr fahre ich zur Arbeit. Mittags esse ich in der Kantine. Abends koche ich und sehe fern. Um 23 Uhr gehe ich schlafen.'
        },
        {
          type: 'message',
          prompt: 'Schreibe eine Entschuldigung',
          promptEn: 'Write a short message apologising for missing an appointment and suggest a new time',
          example: 'Lieber Herr Schmidt, es tut mir sehr leid, dass ich den Termin am Dienstag nicht wahrnehmen konnte. Ich war leider krank. Können wir einen neuen Termin vereinbaren? Ich bin nächste Woche Montag oder Mittwoch verfügbar. Mit freundlichen Grüßen, Lisa Braun'
        }
      ]
    }
  },
  {
    slug: 'listening-a2',
    title: 'Listening: Phone & Directions',
    titleDe: 'Hören: Telefon und Wegbeschreibung',
    level: 'A2',
    category: 'listening',
    content: {
      description: 'Telefongespräche und Wegbeschreibungen verstehen',
      descriptionEn: 'Practice understanding phone calls and directions — common real-life situations',
      exercises: [
        {
          title: 'Telefongespräch: Arzttermin',
          titleEn: 'Phone call: Doctor appointment',
          script: 'Rezeption: Praxis Dr. Müller, guten Tag!\nPatient: Guten Tag, ich möchte gerne einen Termin vereinbaren.\nRezeption: Natürlich. Wann passt es Ihnen?\nPatient: Am Donnerstag wäre gut, wenn möglich am Vormittag.\nRezeption: Donnerstag um 10 Uhr 30 hätten wir noch etwas frei.\nPatient: Das ist perfekt, danke.\nRezeption: Auf welchen Namen bitte?\nPatient: Mein Name ist Klaus Fischer.\nRezeption: Gut, Herr Fischer. Bis Donnerstag!',
          translation: 'Reception: Practice Dr. Müller, good day!\nPatient: Good day, I would like to make an appointment.\nReception: Of course. When suits you?\nPatient: Thursday would be good, if possible in the morning.\nReception: Thursday at 10:30 we still have something free.\nPatient: That is perfect, thank you.\nReception: What name please?\nPatient: My name is Klaus Fischer.\nReception: Good, Mr Fischer. See you Thursday!'
        },
        {
          title: 'Wegbeschreibung: Zum Bahnhof',
          titleEn: 'Directions: To the train station',
          script: 'Tourist: Entschuldigung, wie komme ich zum Hauptbahnhof?\nPassant: Gehen Sie hier geradeaus bis zur Ampel. Dann biegen Sie links ab.\nTourist: Links an der Ampel, okay.\nPassant: Genau. Dann gehen Sie etwa 200 Meter geradeaus. Der Bahnhof ist auf der rechten Seite, neben dem Hotel.\nTourist: Wie lange dauert das zu Fuß?\nPassant: Ungefähr zehn Minuten.\nTourist: Vielen Dank!\nPassant: Gern geschehen!',
          translation: 'Tourist: Excuse me, how do I get to the main train station?\nPasser-by: Go straight ahead here to the traffic lights. Then turn left.\nTourist: Left at the traffic lights, okay.\nPasser-by: Exactly. Then go about 200 metres straight ahead. The station is on the right side, next to the hotel.\nTourist: How long does that take on foot?\nPasser-by: About ten minutes.\nTourist: Many thanks!\nPasser-by: You are welcome!'
        },
        {
          title: 'Im Supermarkt',
          titleEn: 'At the supermarket',
          script: 'Kunde: Entschuldigung, wo finde ich die Milch?\nVerkäufer: Die Milch ist im Kühlregal, Gang drei, auf der linken Seite.\nKunde: Und haben Sie auch Vollkornbrot?\nVerkäufer: Ja, das Brot finden Sie in Gang eins, direkt am Eingang.\nKunde: Danke. Und wo ist die Kasse?\nVerkäufer: Die Kassen sind hinten rechts. Sie können auch die Selbstbedienungskasse benutzen.\nKunde: Super, danke schön!\nVerkäufer: Gerne, einen schönen Tag noch!',
          translation: 'Customer: Excuse me, where do I find the milk?\nSeller: The milk is in the refrigerated section, aisle three, on the left side.\nCustomer: And do you also have wholegrain bread?\nSeller: Yes, the bread is in aisle one, right at the entrance.\nCustomer: Thanks. And where is the checkout?\nSeller: The checkouts are at the back right. You can also use the self-service checkout.\nCustomer: Great, thank you!\nSeller: You are welcome, have a nice day!'
        }
      ]
    }
  },
  {
    slug: 'verbs-a2',
    title: 'Modal Verbs',
    titleDe: 'Modalverben',
    level: 'A2',
    category: 'verbs',
    content: {
      description: 'Modalverben: können, müssen, wollen, dürfen, sollen, mögen',
      descriptionEn: 'Modal verbs change the meaning of the main verb — can, must, want, may, should, like',
      verbs: [
        { infinitive: 'können', en: 'can / to be able to', conjugation: { ich: 'kann', du: 'kannst', er: 'kann', wir: 'können', ihr: 'könnt', sie: 'können' } },
        { infinitive: 'müssen', en: 'must / to have to', conjugation: { ich: 'muss', du: 'musst', er: 'muss', wir: 'müssen', ihr: 'müsst', sie: 'müssen' } },
        { infinitive: 'wollen', en: 'to want to', conjugation: { ich: 'will', du: 'willst', er: 'will', wir: 'wollen', ihr: 'wollt', sie: 'wollen' } },
        { infinitive: 'dürfen', en: 'may / to be allowed to', conjugation: { ich: 'darf', du: 'darfst', er: 'darf', wir: 'dürfen', ihr: 'dürft', sie: 'dürfen' } },
        { infinitive: 'sollen', en: 'should / to be supposed to', conjugation: { ich: 'soll', du: 'sollst', er: 'soll', wir: 'sollen', ihr: 'sollt', sie: 'sollen' } },
        { infinitive: 'mögen', en: 'to like', conjugation: { ich: 'mag', du: 'magst', er: 'mag', wir: 'mögen', ihr: 'mögt', sie: 'mögen' } },
        { infinitive: 'möchten', en: 'would like to', conjugation: { ich: 'möchte', du: 'möchtest', er: 'möchte', wir: 'möchten', ihr: 'möchtet', sie: 'möchten' } },
      ]
    }
  },
  {
    slug: 'speaking-a2',
    title: 'Speaking: Opinions & Discussions',
    titleDe: 'Sprechen: Meinungen und Diskussionen',
    level: 'A2',
    category: 'speaking',
    content: {
      description: 'Meinungen ausdrücken und diskutieren',
      descriptionEn: 'Learn to express opinions, agree and disagree in German conversations',
      phrases: [
        { de: 'Ich finde, dass...', en: 'I think that...', tip: 'Use with a full sentence: Ich finde, dass Berlin toll ist.' },
        { de: 'Meiner Meinung nach...', en: 'In my opinion...', tip: 'Formal way to give your view' },
        { de: 'Ich bin der Meinung, dass...', en: 'I am of the opinion that...', tip: 'Slightly more formal than Ich finde' },
        { de: 'Das stimmt.', en: 'That is correct / I agree.', tip: 'Simple agreement' },
        { de: 'Da bin ich anderer Meinung.', en: 'I disagree / I have a different opinion.', tip: 'Polite way to disagree' },
        { de: 'Das sehe ich anders.', en: 'I see that differently.', tip: 'Softer way to disagree' },
        { de: 'Einerseits... andererseits...', en: 'On one hand... on the other hand...', tip: 'Great for balanced arguments' },
        { de: 'Was denkst du darüber?', en: 'What do you think about that?', tip: 'Ask for someone else opinion' },
        { de: 'Ich bin nicht sicher, aber...', en: 'I am not sure, but...', tip: 'Hedge your opinion politely' },
        { de: 'Das ist eine gute Idee!', en: 'That is a good idea!', tip: 'Show enthusiasm and agreement' },
      ]
    }
  },
];

async function seedDatabase() {
  try {
    // meta (card subtitle/icon/group) is only used to build the frontend catalog
    for (const { meta, ...lesson } of [...lessons.map(withExam), ...contentLessons]) {
      await Lesson.findOneAndUpdate({ slug: lesson.slug }, lesson, { upsert: true, returnDocument: 'after' });
    }
    console.log('✅ Database seeded successfully');
  } catch (err) {
    console.error('Seed error:', err);
  }
}

module.exports = { seedDatabase };
