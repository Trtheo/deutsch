// Friendly, explainable correction for written and spoken German (no AI).
// compareText() lines up the learner's words with the expected sentence and reports what was
// right, what was missing, extra or misspelled, and gives tips on how to fix it.

// Comparable form of a word: lower case, umlauts written out (ä→ae…), so "Mädchen", "maedchen"
// and "mädchen" all match; the differences are then explained as tips.
const fold = w => w.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
const tokens = s => String(s || '').replace(/[^\p{L}\p{N}\s'-]/gu, ' ').split(/\s+/).map(w => w.replace(/^[-']+|[-']+$/g, '')).filter(Boolean);

function levenshtein(a, b) {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}
const closeEnough = (given, expected) => levenshtein(fold(given), fold(expected)) <= Math.max(1, Math.floor(expected.length / 4));

// Longest common subsequence of folded words: the words that are right and in the right order
function align(g, e) {
  const G = g.map(fold), E = e.map(fold);
  const L = Array.from({ length: g.length + 1 }, () => new Array(e.length + 1).fill(0));
  for (let i = g.length - 1; i >= 0; i--) {
    for (let j = e.length - 1; j >= 0; j--) {
      L[i][j] = G[i] === E[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    }
  }
  const pairs = [];
  let i = 0, j = 0;
  while (i < g.length && j < e.length) {
    if (G[i] === E[j]) { pairs.push([i, j]); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) i++;
    else j++;
  }
  return pairs;
}

/**
 * mode 'text' (writing) checks capital letters and umlauts; mode 'speech' ignores them,
 * because speech recognition decides capitalisation itself.
 * Returns { status: correct|close|wrong|skipped, score 0..1, diff: [...], tips: [...] }
 */
function compareText(givenText, expectedText, { mode = 'text' } = {}) {
  const given = tokens(givenText);
  const expected = tokens(expectedText);
  if (!given.length) return { status: 'skipped', score: 0, diff: expected.map(w => ({ type: 'missing', word: w })), tips: [] };

  const pairs = align(given, expected);
  const diff = [];
  const counts = { ok: 0, case: 0, umlaut: 0, spelling: 0, missing: 0, extra: 0 };
  const caseWords = [], umlautWords = [], spellingWords = [], missingWords = [], extraWords = [];

  // Walk the gaps between matched words; inside a gap, pair up near-misses as spelling mistakes
  let gi = 0, ei = 0;
  const flushGap = (gEnd, eEnd) => {
    const gGap = given.slice(gi, gEnd);
    const eGap = expected.slice(ei, eEnd);
    const usedG = new Set();
    for (const ew of eGap) {
      const k = gGap.findIndex((gw, idx) => !usedG.has(idx) && closeEnough(gw, ew));
      if (k >= 0) {
        usedG.add(k);
        diff.push({ type: 'spelling', word: ew, given: gGap[k] });
        counts.spelling++; spellingWords.push([gGap[k], ew]);
      } else {
        diff.push({ type: 'missing', word: ew });
        counts.missing++; missingWords.push(ew);
      }
    }
    gGap.forEach((gw, idx) => {
      if (!usedG.has(idx)) { diff.push({ type: 'extra', word: gw }); counts.extra++; extraWords.push(gw); }
    });
  };
  for (const [g, e] of pairs) {
    flushGap(g, e);
    const gw = given[g], ew = expected[e];
    if (mode === 'text' && gw !== ew) {
      if (gw.toLowerCase() === ew.toLowerCase()) {
        diff.push({ type: 'case', word: ew, given: gw }); counts.case++; caseWords.push([gw, ew, e]);
      } else {
        diff.push({ type: 'umlaut', word: ew, given: gw }); counts.umlaut++; umlautWords.push([gw, ew]);
      }
    } else {
      diff.push({ type: 'ok', word: ew }); counts.ok++;
    }
    gi = g + 1; ei = e + 1;
  }
  flushGap(given.length, expected.length);

  // Missing + extra words that are the same set → only the order is wrong
  const orderOnly = counts.missing > 0 && counts.missing === counts.extra &&
    [...missingWords].map(fold).sort().join(' ') === [...extraWords].map(fold).sort().join(' ');

  const score = Math.max(0, (counts.ok + counts.case * 0.95 + counts.umlaut * 0.95 + counts.spelling * 0.6 + (orderOnly ? counts.missing * 0.7 : 0)
    - (orderOnly ? 0 : counts.extra * 0.25)) / expected.length);

  const tips = [];
  if (orderOnly) tips.push('All the words are right, but the word order isn’t. In a German main clause the verb is the second element; in a clause with weil, dass or wenn it goes to the end.');
  else {
    if (counts.missing) tips.push(`Missing: ${missingWords.map(w => `“${w}”`).join(', ')}.`);
    if (counts.extra) tips.push(`Not needed here: ${extraWords.map(w => `“${w}”`).join(', ')}.`);
  }
  if (counts.spelling) tips.push(`Spelling: ${spellingWords.map(([g, e]) => `“${g}” → “${e}”`).join(', ')}.`);
  const nounCase = caseWords.filter(([, ew, idx]) => idx > 0 && /^[A-ZÄÖÜ]/.test(ew));
  const firstCase = caseWords.filter(([, , idx]) => idx === 0);
  const otherCase = caseWords.filter(([, ew, idx]) => idx > 0 && !/^[A-ZÄÖÜ]/.test(ew));
  if (nounCase.length) tips.push(`Capital letters: in German every noun starts with a capital letter — ${nounCase.map(([, e]) => `“${e}”`).join(', ')}.`);
  if (firstCase.length) tips.push('Start the sentence with a capital letter.');
  if (otherCase.length) tips.push(`Only nouns and the first word are written with a capital letter: ${otherCase.map(([, e]) => `“${e}”`).join(', ')}.`);
  if (counts.umlaut) tips.push(`Umlauts: write ${umlautWords.map(([g, e]) => `“${e}” (not “${g}”)`).join(', ')}. On a phone, hold a, o, u or s to get ä, ö, ü, ß.`);

  const onlyMinor = !counts.missing && !counts.extra && !counts.spelling;
  const status = onlyMinor ? 'correct' : score >= 0.6 ? 'close' : 'wrong';
  // A long list of missing words isn't helpful when the answer is very different
  if (status === 'wrong' && counts.missing > 3) {
    tips.splice(0, tips.length, 'This is quite different from the expected sentence. Read and listen to the correct version below, then try writing it again — you’ll see it again in a later exam.');
  }
  return { status, score: Math.round(score * 100) / 100, diff, tips };
}

module.exports = { compareText, tokens, fold };
