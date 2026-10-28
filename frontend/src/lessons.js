import { Type, BookOpen, Hash, FileText, Zap, Clock, BookMarked, PenLine, Headphones, Mic } from 'lucide-react';
import LESSON_CATALOG from './lessonCatalog';

// The original core lessons; each level starts with these
const CORE_LESSONS = [
  { slug: 'alphabet',          Icon: Type,       title: 'Alphabet',   titleDe: 'Das Alphabet',        sub: '30 letters + umlauts',          level: 'A1', maxXP: 60, group: 'Foundations' },
  { slug: 'vocabulary-basics', Icon: BookOpen,   title: 'Vocabulary', titleDe: 'Grundwortschatz',      sub: '20 essential words',            level: 'A1', maxXP: 60, group: 'Foundations' },
  { slug: 'numbers',           Icon: Hash,       title: 'Numbers',    titleDe: 'Die Zahlen',           sub: '0 to 1000',                     level: 'A1', maxXP: 60, group: 'Foundations' },
  { slug: 'grammar-articles',  Icon: FileText,   title: 'Grammar',    titleDe: 'Grammatik',            sub: 'Articles & Cases',              level: 'A1', maxXP: 60, group: 'Foundations' },
  { slug: 'verbs-present',     Icon: Zap,        title: 'Verbs',      titleDe: 'Verben',               sub: 'Common verbs & conjugation',    level: 'A1', maxXP: 60, group: 'Foundations' },
  { slug: 'reading-a1',        Icon: BookMarked, title: 'Reading',    titleDe: 'Lesen',                sub: 'Short texts & comprehension',   level: 'A1', maxXP: 60, group: 'Foundations' },
  { slug: 'writing-a1',        Icon: PenLine,    title: 'Writing',    titleDe: 'Schreiben',            sub: 'Practice writing',              level: 'A1', maxXP: 60, group: 'Foundations' },
  { slug: 'listening-a1',      Icon: Headphones, title: 'Listening',  titleDe: 'Hören',                sub: 'Audio dialogues',               level: 'A1', maxXP: 60, group: 'Foundations' },
  { slug: 'speaking-a1',       Icon: Mic,        title: 'Speaking',   titleDe: 'Sprechen',             sub: 'Pronunciation practice',        level: 'A1', maxXP: 60, group: 'Foundations' },
  { slug: 'tenses',            Icon: Clock,      title: 'Tenses',     titleDe: 'Zeitformen',           sub: 'Past, Present, Future',         level: 'A2', maxXP: 60, group: 'Foundations' },
  { slug: 'grammar-a2',        Icon: FileText,   title: 'Adjectives', titleDe: 'Adjektive',            sub: 'Endings & comparatives',        level: 'A2', maxXP: 60, group: 'Foundations' },
  { slug: 'vocabulary-a2',     Icon: BookOpen,   title: 'Daily Life',  titleDe: 'Alltagswortschatz',   sub: 'Home, work & free time',        level: 'A2', maxXP: 60, group: 'Foundations' },
  { slug: 'verbs-a2',          Icon: Zap,        title: 'Modal Verbs', titleDe: 'Modalverben',         sub: 'können, müssen, wollen...',     level: 'A2', maxXP: 60, group: 'Foundations' },
  { slug: 'reading-a2',        Icon: BookMarked, title: 'Reading',     titleDe: 'Lesen',               sub: 'Emails & advertisements',       level: 'A2', maxXP: 60, group: 'Foundations' },
  { slug: 'writing-a2',        Icon: PenLine,    title: 'Writing',     titleDe: 'Schreiben',           sub: 'Letters & emails',              level: 'A2', maxXP: 60, group: 'Foundations' },
  { slug: 'listening-a2',      Icon: Headphones, title: 'Listening',   titleDe: 'Hören',               sub: 'Phone calls & directions',      level: 'A2', maxXP: 60, group: 'Foundations' },
  { slug: 'speaking-a2',       Icon: Mic,        title: 'Speaking',    titleDe: 'Sprechen',            sub: 'Opinions & discussions',        level: 'A2', maxXP: 60, group: 'Foundations' },
];

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2'];
const rank = l => LEVEL_ORDER.indexOf(l.level) * 2 + (l.category === 'certificate' ? 1 : 0);

// One learning path: by level, core lessons first, certificate practice last in each level
const LESSONS = [...CORE_LESSONS, ...LESSON_CATALOG]
  .map((l, i) => ({ maxXP: 60, ...l, order: i }))
  .sort((a, b) => rank(a) - rank(b) || a.order - b.order);

export const LESSON_GROUPS = ['Foundations', ...new Set(LESSON_CATALOG.map(l => l.group))];

export default LESSONS;
