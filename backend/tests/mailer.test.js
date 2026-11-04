// Mailer provider selection and the Brevo HTTP API. The network is stubbed.
const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const mailer = require('../mailer');

const realFetch = global.fetch;
const saved = {};
const KEYS = ['BREVO_API_KEY', 'EMAIL_FROM', 'EMAIL_USER', 'EMAIL_PASS'];

beforeEach(() => { for (const k of KEYS) { saved[k] = process.env[k]; delete process.env[k]; } });
afterEach(() => {
  global.fetch = realFetch;
  for (const k of KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
});

test('no email settings → not configured, with a clear error', async () => {
  assert.equal(mailer.provider(), null);
  assert.equal(mailer.isConfigured(), false);
  await assert.rejects(mailer.sendMail({ to: 'a@b.de', subject: 'x', html: 'x' }), /not configured/);
});

test('Gmail settings → gmail; a Brevo key takes priority', () => {
  process.env.EMAIL_USER = 'me@gmail.com';
  process.env.EMAIL_PASS = 'app-password';
  assert.equal(mailer.provider(), 'gmail');
  process.env.BREVO_API_KEY = 'xkeysib-123';
  assert.equal(mailer.provider(), 'brevo');
});

test('Brevo sends through its HTTP API with the configured sender', async () => {
  process.env.BREVO_API_KEY = 'xkeysib-123';
  process.env.EMAIL_FROM = 'school@example.com';
  let call;
  global.fetch = async (url, opts) => { call = { url, opts }; return { ok: true, json: async () => ({ messageId: '1' }) }; };
  await mailer.sendMail({ to: 'anna@example.com', subject: 'Hallo', html: '<p>Hi</p>', text: 'Hi' });
  assert.equal(call.url, 'https://api.brevo.com/v3/smtp/email');
  assert.equal(call.opts.headers['api-key'], 'xkeysib-123');
  const body = JSON.parse(call.opts.body);
  assert.deepEqual(body.sender, { name: 'Deutsch Lernen', email: 'school@example.com' });
  assert.deepEqual(body.to, [{ email: 'anna@example.com' }]);
  assert.equal(body.subject, 'Hallo');
});

test('Brevo errors carry the reason', async () => {
  process.env.BREVO_API_KEY = 'bad';
  process.env.EMAIL_USER = 'me@gmail.com';
  global.fetch = async () => ({ ok: false, status: 401, statusText: 'Unauthorized', json: async () => ({ message: 'Key not found' }) });
  await assert.rejects(mailer.sendMail({ to: 'a@b.de', subject: 'x', html: 'x' }), /Brevo 401: Key not found/);
});
