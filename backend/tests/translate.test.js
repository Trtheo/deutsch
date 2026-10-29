// Translator: the external service is stubbed, tests never call it.
const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { translate, TranslateError, _cache, _chunk } = require('../translate');

const realFetch = global.fetch;
let calls;

beforeEach(() => {
  calls = [];
  _cache.clear();
  delete process.env.DEEPL_API_KEY;
  global.fetch = async (url) => {
    calls.push(String(url));
    const q = decodeURIComponent(new URL(url).searchParams.get('q'));
    return { ok: true, json: async () => ({ responseStatus: 200, responseData: { translatedText: `DE(${q})` } }) };
  };
});
afterEach(() => { global.fetch = realFetch; });

test('translates English to German with the free provider', async () => {
  const r = await translate({ text: 'Good morning', from: 'en', to: 'de' });
  assert.equal(r.translation, 'DE(Good morning)');
  assert.equal(r.provider, 'mymemory');
  assert.match(calls[0], /langpair=en\|de/);
});

test('works in the other direction too', async () => {
  await translate({ text: 'Guten Morgen', from: 'de', to: 'en' });
  assert.match(calls[0], /langpair=de\|en/);
});

test('repeated text comes from the cache', async () => {
  await translate({ text: 'Thank you' });
  const again = await translate({ text: 'Thank you' });
  assert.equal(again.provider, 'cache');
  assert.equal(calls.length, 1);
});

test('long text is split into pieces the free service accepts', async () => {
  const text = Array.from({ length: 30 }, (_, i) => `This is sentence number ${i}.`).join(' ');
  const chunks = _chunk(text);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every(c => Buffer.byteLength(c) <= 450));
  assert.equal(chunks.join(''), text);
  await translate({ text });
  assert.equal(calls.length, chunks.length);
});

test('rejects empty, too long and unsupported requests', async () => {
  await assert.rejects(translate({ text: '  ' }), TranslateError);
  await assert.rejects(translate({ text: 'x'.repeat(2001) }), /too long/);
  await assert.rejects(translate({ text: 'hi', from: 'en', to: 'fr' }), TranslateError);
});

test('a quota warning from the free service becomes a friendly error', async () => {
  global.fetch = async () => ({ ok: true, json: async () => ({ responseStatus: 429, responseData: { translatedText: 'MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS' } }) });
  await assert.rejects(translate({ text: 'Hello' }), /daily limit/);
});

test('uses DeepL when a key is configured', async () => {
  process.env.DEEPL_API_KEY = 'abc:fx';
  global.fetch = async (url, opts) => {
    calls.push(String(url));
    assert.equal(opts.headers.Authorization, 'DeepL-Auth-Key abc:fx');
    return { ok: true, json: async () => ({ translations: [{ text: 'Guten Morgen' }] }) };
  };
  const r = await translate({ text: 'Good morning' });
  assert.equal(r.translation, 'Guten Morgen');
  assert.equal(r.provider, 'deepl');
  assert.match(calls[0], /api-free\.deepl\.com/);
});

test('falls back to the free service when DeepL fails', async () => {
  process.env.DEEPL_API_KEY = 'revoked:fx';
  global.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).includes('deepl')) return { ok: false, status: 403, json: async () => ({}) };
    return { ok: true, json: async () => ({ responseStatus: 200, responseData: { translatedText: 'Hallo' } }) };
  };
  const r = await translate({ text: 'Hello' });
  assert.equal(r.translation, 'Hallo');
  assert.equal(r.provider, 'mymemory');
  assert.equal(calls.length, 2);
});

test('falls back to the free service when OpenAI fails', async () => {
  process.env.OPENAI_API_KEY = 'sk-revoked';
  const failingClient = { chat: { completions: { create: async () => { throw new Error('401 Incorrect API key'); } } } };
  try {
    const r = await translate({ text: 'Good night', openaiClient: failingClient });
    assert.equal(r.translation, 'DE(Good night)');
    assert.equal(r.provider, 'mymemory');
  } finally { delete process.env.OPENAI_API_KEY; }
});

test('uses OpenAI when it works', async () => {
  process.env.OPENAI_API_KEY = 'sk-ok';
  const client = { chat: { completions: { create: async () => ({ choices: [{ message: { content: 'Gute Nacht' } }] }) } } };
  try {
    const r = await translate({ text: 'Good night', openaiClient: client });
    assert.deepEqual(r, { translation: 'Gute Nacht', provider: 'openai' });
    assert.equal(calls.length, 0);
  } finally { delete process.env.OPENAI_API_KEY; }
});
