// English ⇄ German translation with dedicated translation services only (no AI chat models):
//   DEEPL_API_KEY set → DeepL (best German quality; free plan: 500k characters/month)
//   always            → MyMemory (free, no key, lower daily limit), also the fallback if DeepL fails
const LANGS = { en: 'English', de: 'German' };
const MAX_CHARS = 2000;
const TIMEOUT_MS = 15000;

const cache = new Map(); // small in-memory cache: repeated phrases don't use up provider quota
const CACHE_SIZE = 500;

class TranslateError extends Error {}


async function deepl(text, from, to) {
  const key = process.env.DEEPL_API_KEY;
  const host = key.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com';
  const res = await fetch(`${host}/v2/translate`, {
    method: 'POST',
    headers: { Authorization: `DeepL-Auth-Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: [text], source_lang: from.toUpperCase(), target_lang: to === 'en' ? 'EN-GB' : 'DE' }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new TranslateError(`DeepL error ${res.status}`);
  const data = await res.json();
  return data.translations?.[0]?.text;
}

// MyMemory accepts about 500 bytes per request, so long text is sent sentence by sentence
function chunk(text, maxBytes = 450) {
  const sentences = text.match(/[^.!?\n]+[.!?]*\s*|\n+/g) || [text];
  const chunks = [];
  let current = '';
  for (const s of sentences) {
    if (Buffer.byteLength(current + s) > maxBytes && current) { chunks.push(current); current = ''; }
    current += s;
  }
  if (current) chunks.push(current);
  return chunks;
}

async function mymemory(text, from, to) {
  const parts = [];
  for (const piece of chunk(text)) {
    if (!piece.trim()) { parts.push(piece); continue; }
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(piece.trim())}&langpair=${from}|${to}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    const data = await res.json().catch(() => ({}));
    const out = data?.responseData?.translatedText;
    if (!res.ok || Number(data?.responseStatus) !== 200 || !out || /MYMEMORY WARNING/i.test(out)) {
      throw new TranslateError('The free translation service is busy or its daily limit is reached. Please try again later.');
    }
    parts.push(out + (/\s$/.test(piece) ? ' ' : ''));
  }
  return parts.join('').trim();
}

async function translate({ text, from = 'en', to = 'de' }) {
  text = String(text ?? '').trim();
  if (!text) throw new TranslateError('Please enter some text to translate.');
  if (text.length > MAX_CHARS) throw new TranslateError(`Text is too long (max ${MAX_CHARS} characters).`);
  if (!LANGS[from] || !LANGS[to] || from === to) throw new TranslateError('Translation works between English and German.');

  const key = `${from}|${to}|${text}`;
  if (cache.has(key)) return { translation: cache.get(key), provider: 'cache' };

  // DeepL first when configured; if it fails (bad key, quota, outage), the free service takes over
  const providers = [];
  if (process.env.DEEPL_API_KEY) providers.push(['deepl', () => deepl(text, from, to)]);
  providers.push(['mymemory', () => mymemory(text, from, to)]);

  let lastError;
  for (const [provider, run] of providers) {
    try {
      const translation = await run();
      if (!translation) throw new TranslateError('No translation was returned. Please try again.');
      if (cache.size >= CACHE_SIZE) cache.delete(cache.keys().next().value);
      cache.set(key, translation);
      return { translation, provider };
    } catch (err) {
      lastError = err;
      if (provider !== 'mymemory') console.warn(`Translation via ${provider} failed, trying the next service:`, err.message);
    }
  }
  throw lastError instanceof TranslateError ? lastError : new TranslateError('Translation is not available right now. Please try again later.');
}

module.exports = { translate, TranslateError, MAX_CHARS, _cache: cache, _chunk: chunk };
