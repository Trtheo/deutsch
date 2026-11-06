// API tests: run with `npm test`. Uses an in-memory MongoDB, so no real database is touched.
const { test, before, after, beforeEach, describe } = require('node:test');
const assert = require('node:assert/strict');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');

process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test'; // turns rate limits off for the test run
process.env.MONGODB_URI = 'mongodb://placeholder'; // replaced by the in-memory server below
process.env.APP_URL = 'https://app.example.com';
delete process.env.OPENAI_API_KEY;                 // force template fallbacks, never call OpenAI

let mongod, app, User, Lesson, Exam, Progress;

// Capture outgoing emails instead of sending them
const mailer = require('../mailer');
const sentMail = [];
mailer.isConfigured = () => true;
mailer.provider = () => 'test';
mailer.sendMail = async msg => { sentMail.push(msg); };
const lastMailTo = email => [...sentMail].reverse().find(m => m.to === email);
const verifyParams = mail => {
  const m = mail.text.match(/verify-email\?token=([a-f0-9]+)&email=(\S+)/);
  return { token: m[1], email: decodeURIComponent(m[2]) };
};

before(async () => {
  mongod = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } }); // first start can be slow (antivirus scans)
  require('dotenv').config = () => ({});           // keep the developer's .env out of tests
  app = require('../server');
  ({ User, Lesson, Exam, Progress } = require('../models'));
  await mongoose.connect(mongod.getUri());
});

after(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  sentMail.length = 0;
  await Promise.all(Object.values(mongoose.connection.collections).map(c => c.deleteMany({})));
});

// Registers and verifies through the emailed link, like a real user. Returns { token, user }.
async function registerUser(overrides = {}) {
  const body = { username: 'anna', email: 'anna@example.com', password: 'secret123', ...overrides };
  const res = await request(app).post('/api/auth/register').send(body);
  assert.equal(res.status, 201, JSON.stringify(res.body));
  const verified = await request(app).post('/api/auth/verify-email').send(verifyParams(lastMailTo(body.email)));
  assert.equal(verified.status, 200, JSON.stringify(verified.body));
  return verified.body;
}

async function makeAdmin(user) {
  await User.updateOne({ _id: user.user.id }, { role: 'admin' });
  const res = await request(app).post('/api/auth/login').send({ email: user.user.email, password: 'secret123' });
  return res.body.token;
}

const auth = token => ({ Authorization: `Bearer ${token}` });

describe('health', () => {
  test('GET /api/health reports database state', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.db, 'connected');
  });
});

describe('auth', () => {
  test('verifying returns a session and never the password', async () => {
    const { token, user } = await registerUser();
    assert.ok(token);
    assert.equal(user.username, 'anna');
    assert.equal(user.password, undefined);
  });

  test('register rejects short passwords and duplicates', async () => {
    let res = await request(app).post('/api/auth/register').send({ username: 'a', email: 'a@x.com', password: '123' });
    assert.equal(res.status, 400);
    await registerUser();
    res = await request(app).post('/api/auth/register').send({ username: 'other', email: 'anna@example.com', password: 'secret123' });
    assert.equal(res.status, 409);
  });

  test('login works with any email casing and rejects a wrong password', async () => {
    await registerUser();
    let res = await request(app).post('/api/auth/login').send({ email: ' Anna@Example.COM ', password: 'secret123' });
    assert.equal(res.status, 200);
    res = await request(app).post('/api/auth/login').send({ email: 'anna@example.com', password: 'wrong-pass' });
    assert.equal(res.status, 401);
  });

  test('forgot-password gives the same answer for unknown emails and sends nothing', async () => {
    await registerUser();
    sentMail.length = 0;
    const unknown = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@example.com' });
    const known = await request(app).post('/api/auth/forgot-password').send({ email: 'anna@example.com' });
    assert.equal(unknown.status, 200);
    assert.deepEqual(unknown.body, known.body);
    assert.equal(sentMail.length, 1);
    assert.equal(sentMail[0].to, 'anna@example.com');
  });

  test('reset link: token stored only as a hash, works once, and signs out old sessions', async () => {
    const { token: oldSession } = await registerUser();
    sentMail.length = 0;
    await request(app).post('/api/auth/forgot-password').send({ email: 'anna@example.com' });
    const link = sentMail[0].text.match(/reset-password\?token=([a-f0-9]+)&email=(\S+)/);
    const stored = await User.findOne({ email: 'anna@example.com' });
    assert.notEqual(stored.resetToken, link[1], 'only a hash is stored');

    const body = { email: 'anna@example.com', token: link[1], newPassword: 'brand-new-pass' };
    assert.equal((await request(app).post('/api/auth/reset-password').send(body)).status, 200);
    assert.equal((await request(app).post('/api/auth/reset-password').send(body)).status, 400, 'link works once');
    assert.equal((await request(app).get('/api/auth/me').set(auth(oldSession))).status, 401, 'old session signed out');
    assert.equal((await request(app).post('/api/auth/login').send({ email: 'anna@example.com', password: 'brand-new-pass' })).status, 200);
  });

  test('new passwords need at least 8 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'x1', email: 'x1@example.com', password: 'short12' });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /at least 8/);
  });

  test('changing the password keeps this device signed in and signs out the others', async () => {
    const first = await registerUser();
    const second = (await request(app).post('/api/auth/login').send({ email: 'anna@example.com', password: 'secret123' })).body.token;
    await new Promise(r => setTimeout(r, 1100)); // tokens are timed in whole seconds
    const res = await request(app).put('/api/auth/password').set(auth(first.token)).send({ currentPassword: 'secret123', newPassword: 'another-pass-1' });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal((await request(app).get('/api/auth/me').set(auth(res.body.token))).status, 200);
    assert.equal((await request(app).get('/api/auth/me').set(auth(second))).status, 401);
  });

  test('a tampered token is rejected', async () => {
    const res = await request(app).get('/api/auth/me').set(auth('not-a-real-token'));
    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'Invalid token');
  });
});

describe('email verification', () => {
  const anna = { username: 'anna', email: 'anna@example.com', password: 'secret123', firstName: 'Anna' };

  test('register sends a verification email instead of logging in', async () => {
    const res = await request(app).post('/api/auth/register').send(anna);
    assert.equal(res.status, 201);
    assert.equal(res.body.verificationRequired, true);
    assert.equal(res.body.emailSent, true);
    assert.equal(res.body.token, undefined);
    const mail = lastMailTo(anna.email);
    assert.match(mail.subject, /Confirm your email/);
    assert.match(mail.html, /https:\/\/app\.example\.com\/verify-email\?token=[a-f0-9]{64}&amp;email=|https:\/\/app\.example\.com\/verify-email\?token=[a-f0-9]{64}&email=/);
    assert.match(mail.html, /Willkommen, Anna!/);
    const stored = await User.findOne({ email: anna.email });
    assert.equal(stored.emailVerified, false);
    assert.notEqual(stored.verifyTokenHash, verifyParams(mail).token, 'only a hash of the token is stored');
  });

  test('login is refused until the email is verified', async () => {
    await request(app).post('/api/auth/register').send(anna);
    const res = await request(app).post('/api/auth/login').send({ email: anna.email, password: anna.password });
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'EMAIL_NOT_VERIFIED');
  });

  test('the link verifies, signs the user in and sends a welcome email', async () => {
    await request(app).post('/api/auth/register').send(anna);
    const res = await request(app).post('/api/auth/verify-email').send(verifyParams(lastMailTo(anna.email)));
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, anna.email);
    const me = await request(app).get('/api/auth/me').set(auth(res.body.token));
    assert.equal(me.status, 200);
    assert.equal(me.body.verifyTokenHash, undefined);
    await new Promise(r => setImmediate(r)); // welcome email is sent without blocking the response
    assert.match(lastMailTo(anna.email).subject, /account is ready/);
    const login = await request(app).post('/api/auth/login').send({ email: anna.email, password: anna.password });
    assert.equal(login.status, 200);
  });

  test('a link works only once', async () => {
    await request(app).post('/api/auth/register').send(anna);
    const params = verifyParams(lastMailTo(anna.email));
    assert.equal((await request(app).post('/api/auth/verify-email').send(params)).status, 200);
    const again = await request(app).post('/api/auth/verify-email').send(params);
    assert.equal(again.status, 400);
    assert.equal(again.body.code, 'ALREADY_VERIFIED');
  });

  test('wrong and expired tokens are rejected', async () => {
    await request(app).post('/api/auth/register').send(anna);
    const params = verifyParams(lastMailTo(anna.email));
    let res = await request(app).post('/api/auth/verify-email').send({ ...params, token: 'f'.repeat(64) });
    assert.equal(res.body.code, 'INVALID_LINK');
    await User.updateOne({ email: anna.email }, { verifyTokenExpiry: new Date(Date.now() - 1000) });
    res = await request(app).post('/api/auth/verify-email').send(params);
    assert.equal(res.body.code, 'LINK_EXPIRED');
  });

  test('after a resend, the earlier email link still works (and then both are used up)', async () => {
    await request(app).post('/api/auth/register').send(anna);
    const oldParams = verifyParams(lastMailTo(anna.email));
    const res = await request(app).post('/api/auth/resend-verification').send({ email: anna.email });
    assert.equal(res.status, 200);
    const newParams = verifyParams(lastMailTo(anna.email));
    assert.notEqual(newParams.token, oldParams.token);
    assert.equal((await request(app).post('/api/auth/verify-email').send(oldParams)).status, 200);
    assert.equal((await request(app).post('/api/auth/verify-email').send(newParams)).body.code, 'ALREADY_VERIFIED');
  });

  test('only the last few links are kept', async () => {
    await request(app).post('/api/auth/register').send(anna);
    const first = verifyParams(lastMailTo(anna.email));
    for (let i = 0; i < 3; i++) await request(app).post('/api/auth/resend-verification').send({ email: anna.email });
    assert.equal((await request(app).post('/api/auth/verify-email').send(first)).body.code, 'INVALID_LINK');
    const stored = await User.findOne({ email: anna.email });
    assert.equal(stored.verifyTokenOldHashes.length, 2);
  });

  test('resend gives the same answer for unknown emails', async () => {
    const res = await request(app).post('/api/auth/resend-verification').send({ email: 'nobody@example.com' });
    assert.equal(res.status, 200);
    assert.equal(sentMail.length, 0);
  });

  test('accounts created before verification existed can still log in', async () => {
    const bcrypt = require('bcryptjs');
    await User.collection.insertOne({ username: 'legacy', email: 'legacy@example.com', password: await bcrypt.hash('secret123', 10), role: 'user' });
    const res = await request(app).post('/api/auth/login').send({ email: 'legacy@example.com', password: 'secret123' });
    assert.equal(res.status, 200);
  });

  test('without email configured, new accounts are verified straight away', async () => {
    mailer.isConfigured = () => false;
    try {
      const res = await request(app).post('/api/auth/register').send(anna);
      assert.equal(res.status, 201);
      assert.ok(res.body.token);
      assert.equal(sentMail.length, 0);
    } finally {
      mailer.isConfigured = () => true;
    }
  });

  test('user input in the email is escaped', async () => {
    await request(app).post('/api/auth/register').send({ ...anna, firstName: '<b>x</b>' });
    assert.doesNotMatch(lastMailTo(anna.email).html, /<b>x<\/b>/);
  });
});

describe('deactivating users', () => {
  async function setup() {
    const admin = await registerUser({ username: 'boss', email: 'boss@example.com' });
    const adminToken = await makeAdmin(admin);
    const anna = await registerUser();
    return { adminToken, admin, anna };
  }
  const setStatus = (token, id, active) => request(app).patch(`/api/admin/users/${id}/status`).set(auth(token)).send({ active });

  test('a deactivated user cannot log in and their open session stops working at once', async () => {
    const { adminToken, anna } = await setup();
    const res = await setStatus(adminToken, anna.user.id, false);
    assert.equal(res.status, 200);
    assert.equal(res.body.deactivated, true);
    assert.ok(res.body.deactivatedAt);

    const login = await request(app).post('/api/auth/login').send({ email: 'anna@example.com', password: 'secret123' });
    assert.equal(login.status, 403);
    assert.equal(login.body.code, 'ACCOUNT_DEACTIVATED');

    const me = await request(app).get('/api/auth/me').set(auth(anna.token));
    assert.equal(me.status, 403);
    assert.equal(me.body.code, 'ACCOUNT_DEACTIVATED');
  });

  test('reactivating restores access', async () => {
    const { adminToken, anna } = await setup();
    await setStatus(adminToken, anna.user.id, false);
    const res = await setStatus(adminToken, anna.user.id, true);
    assert.equal(res.body.deactivated, false);
    assert.equal((await request(app).get('/api/auth/me').set(auth(anna.token))).status, 200);
    assert.equal((await request(app).post('/api/auth/login').send({ email: 'anna@example.com', password: 'secret123' })).status, 200);
  });

  test('admins cannot deactivate themselves, and normal users cannot deactivate anyone', async () => {
    const { adminToken, admin, anna } = await setup();
    assert.equal((await setStatus(adminToken, admin.user.id, false)).status, 400);
    assert.equal((await setStatus(anna.token, admin.user.id, false)).status, 403);
    assert.equal((await setStatus(adminToken, anna.user.id, 'no')).status, 400);
  });

  test('the admin user list shows the status', async () => {
    const { adminToken, anna } = await setup();
    await setStatus(adminToken, anna.user.id, false);
    const res = await request(app).get('/api/admin/users').set(auth(adminToken));
    const row = res.body.find(u => u.username === 'anna');
    assert.equal(row.deactivated, true);
    assert.equal(row.password, undefined);
  });

  test('a deleted user’s token stops working, and role changes apply immediately', async () => {
    const { adminToken, anna } = await setup();
    await request(app).put(`/api/admin/users/${anna.user.id}/role`).set(auth(adminToken)).send({ role: 'admin' });
    assert.equal((await request(app).get('/api/admin/users').set(auth(anna.token))).status, 200, 'promotion applies without logging in again');
    await request(app).delete(`/api/admin/users/${anna.user.id}`).set(auth(adminToken));
    const res = await request(app).get('/api/auth/me').set(auth(anna.token));
    assert.equal(res.status, 401);
  });
});

describe('admin users table', () => {
  async function seedUsers() {
    const admin = await registerUser({ username: 'boss', email: 'boss@example.com' });
    const adminToken = await makeAdmin(admin);
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('secret123', 4);
    const people = Array.from({ length: 12 }, (_, i) => ({
      username: `student${String(i).padStart(2, '0')}`, email: `student${i}@school.de`, password: hash,
      firstName: i === 3 ? 'Zoë' : 'Max', level: i < 4 ? 'B1' : 'A1', deactivated: i % 5 === 0,
      createdAt: new Date(2026, 0, i + 1),
    }));
    await User.insertMany(people);
    return { adminToken };
  }
  const list = (token, query) => request(app).get('/api/admin/users').query(query).set(auth(token));

  test('paginates with totals and counts', async () => {
    const { adminToken } = await seedUsers();
    const res = await list(adminToken, { page: 1, limit: 5 });
    assert.equal(res.status, 200);
    assert.equal(res.body.users.length, 5);
    assert.equal(res.body.total, 13);
    assert.equal(res.body.pages, 3);
    assert.deepEqual(res.body.counts, { all: 13, active: 10, deactivated: 3, admins: 1, unverified: 0 });
    const last = await list(adminToken, { page: 3, limit: 5 });
    assert.equal(last.body.users.length, 3);
    assert.equal(last.body.users[0].password, undefined);
  });

  test('searches by name, username and email, safely', async () => {
    const { adminToken } = await seedUsers();
    assert.equal((await list(adminToken, { page: 1, q: 'zoë' })).body.total, 1);
    assert.equal((await list(adminToken, { page: 1, q: 'school.de' })).body.total, 12);
    assert.equal((await list(adminToken, { page: 1, q: 'student0' })).body.total, 10);
    assert.equal((await list(adminToken, { page: 1, q: '.*(' })).status, 200); // regex characters are escaped
  });

  test('filters by role, status and level, and sorts', async () => {
    const { adminToken } = await seedUsers();
    assert.equal((await list(adminToken, { page: 1, role: 'admin' })).body.total, 1);
    assert.equal((await list(adminToken, { page: 1, status: 'deactivated' })).body.total, 3);
    assert.equal((await list(adminToken, { page: 1, status: 'active', level: 'B1' })).body.total, 3);
    const byName = await list(adminToken, { page: 1, limit: 3, sort: 'name' });
    assert.equal(byName.body.limit, 5, 'page size is at least 5');
    assert.deepEqual(byName.body.users.slice(0, 3).map(u => u.username), ['boss', 'student00', 'student01']);
    const oldest = await list(adminToken, { page: 1, limit: 1, sort: 'oldest' });
    assert.equal(oldest.body.users[0].username, 'student00');
  });

  test('without page it still returns the plain list (broadcast recipients)', async () => {
    const { adminToken } = await seedUsers();
    const res = await request(app).get('/api/admin/users').set(auth(adminToken));
    assert.ok(Array.isArray(res.body));
    assert.equal(res.body.length, 13);
  });

  test('user details include learning statistics', async () => {
    const admin = await registerUser({ username: 'boss', email: 'boss@example.com' });
    const adminToken = await makeAdmin(admin);
    const anna = await registerUser();
    await request(app).post('/api/progress').set(auth(anna.token)).send({ lessonSlug: 'alphabet', status: 'completed', xp: 50, examScore: { score: 8, total: 10 } });
    await request(app).post('/api/progress').set(auth(anna.token)).send({ lessonSlug: 'numbers', status: 'in_progress', xp: 10, examScore: { score: 6, total: 10 } });

    const res = await request(app).get(`/api/admin/users/${anna.user.id}`).set(auth(adminToken));
    assert.equal(res.status, 200);
    assert.equal(res.body.username, 'anna');
    assert.equal(res.body.password, undefined);
    assert.equal(res.body.verifyTokenHash, undefined);
    assert.deepEqual({ ...res.body.stats, lastActivity: undefined }, {
      xp: 60, lessonsCompleted: 1, lessonsInProgress: 1, examsTaken: 2, averageScore: 70, bestScore: 80, comments: 0, lastActivity: undefined,
    });
    assert.ok(res.body.stats.lastActivity);

    assert.equal((await request(app).get('/api/admin/users/not-an-id').set(auth(adminToken))).status, 404);
    assert.equal((await request(app).get(`/api/admin/users/${anna.user.id}`).set(auth(anna.token))).status, 403);
  });
});

describe('deleting a user', () => {
  test('removes their progress, comments, exams and message traces too', async () => {
    const admin = await registerUser({ username: 'boss', email: 'boss@example.com' });
    const adminToken = await makeAdmin(admin);
    const anna = await registerUser();
    const { meta, ...shopping } = require('../content')[0];
    await Lesson.create(shopping);
    await request(app).post('/api/progress').set(auth(anna.token)).send({ lessonSlug: 'a1-shopping', status: 'completed', xp: 50 });
    await request(app).post(`/api/lessons/a1-shopping/comments`).set(auth(anna.token)).send({ text: 'Super!' });
    await request(app).post('/api/exams/generate').set(auth(anna.token)).send({ lessonSlug: 'a1-shopping' });
    await request(app).post('/api/admin/broadcast').set(auth(adminToken)).send({ subject: 'Hi', message: 'x', userIds: [anna.user.id] });
    await request(app).post('/api/messages/read-all').set(auth(anna.token));

    const res = await request(app).delete(`/api/admin/users/${anna.user.id}`).set(auth(adminToken));
    assert.equal(res.status, 200);
    const { Comment, Message } = require('../models');
    assert.equal(await Progress.countDocuments({ userId: anna.user.id }), 0);
    assert.equal(await Comment.countDocuments({ userId: anna.user.id }), 0);
    assert.equal(await Exam.countDocuments({ createdBy: anna.user.id }), 0);
    const msg = await Message.findOne();
    assert.ok(!msg.readBy.includes(anna.user.id) && !msg.recipients.includes(anna.user.id));
    assert.equal((await request(app).delete(`/api/admin/users/${anna.user.id}`).set(auth(adminToken))).status, 404);
  });
});

describe('admins verifying accounts by hand', () => {
  async function setup() {
    const admin = await registerUser({ username: 'boss', email: 'boss@example.com' });
    const adminToken = await makeAdmin(admin);
    // Two users who registered but never got (or never clicked) their verification email
    for (const name of ['anna', 'ben']) {
      await request(app).post('/api/auth/register').send({ username: name, email: `${name}@example.com`, password: 'secret123' });
    }
    const anna = await User.findOne({ username: 'anna' });
    sentMail.length = 0;
    return { adminToken, anna };
  }
  const login = name => request(app).post('/api/auth/login').send({ email: `${name}@example.com`, password: 'secret123' });

  test('an admin verifies one account: the user can log in and gets a welcome email', async () => {
    const { adminToken, anna } = await setup();
    assert.equal((await login('anna')).body.code, 'EMAIL_NOT_VERIFIED');

    const res = await request(app).patch(`/api/admin/users/${anna._id}/verify`).set(auth(adminToken));
    assert.equal(res.status, 200);
    assert.equal(res.body.emailVerified, true);
    assert.equal(res.body.verifyTokenHash, undefined);

    assert.equal((await login('anna')).status, 200);
    assert.equal((await login('ben')).status, 403, 'others are untouched');
    await new Promise(r => setImmediate(r));
    assert.match(sentMail.find(m => m.to === 'anna@example.com').subject, /account is ready/);

    const again = await request(app).patch(`/api/admin/users/${anna._id}/verify`).set(auth(adminToken));
    assert.equal(again.status, 400);
  });

  test('"verify all pending" verifies everyone still waiting', async () => {
    const { adminToken } = await setup();
    const res = await request(app).post('/api/admin/users/verify-pending').set(auth(adminToken));
    assert.equal(res.body.verified, 2);
    assert.deepEqual(res.body.usernames.sort(), ['anna', 'ben']);
    assert.equal((await login('anna')).status, 200);
    assert.equal((await login('ben')).status, 200);
    const list = await request(app).get('/api/admin/users').query({ page: 1 }).set(auth(adminToken));
    assert.equal(list.body.counts.unverified, 0);
    assert.equal((await request(app).post('/api/admin/users/verify-pending').set(auth(adminToken))).body.verified, 0);
  });

  test('the old verification link stops working after an admin verifies', async () => {
    const { adminToken, anna } = await setup();
    const reg = await request(app).post('/api/auth/resend-verification').send({ email: 'anna@example.com' });
    assert.equal(reg.status, 200);
    const params = verifyParams(lastMailTo('anna@example.com'));
    await request(app).patch(`/api/admin/users/${anna._id}/verify`).set(auth(adminToken));
    const res = await request(app).post('/api/auth/verify-email').send(params);
    assert.equal(res.body.code, 'ALREADY_VERIFIED');
  });

  test('only admins can verify accounts', async () => {
    const { anna } = await setup();
    const student = await registerUser({ username: 'cara', email: 'cara@example.com' });
    assert.equal((await request(app).patch(`/api/admin/users/${anna._id}/verify`).set(auth(student.token))).status, 403);
    assert.equal((await request(app).post('/api/admin/users/verify-pending').set(auth(student.token))).status, 403);
    assert.equal((await request(app).post('/api/admin/users/verify-pending')).status, 401);
  });
});

describe('broadcasts and in-app messages', () => {
  async function setup() {
    const admin = await registerUser({ username: 'boss', email: 'boss@example.com' });
    const adminToken = await makeAdmin(admin);
    const anna = await registerUser();
    const ben = await registerUser({ username: 'ben', email: 'ben@example.com' });
    sentMail.length = 0;
    return { adminToken, anna, ben };
  }
  const broadcast = (token, body) => request(app).post('/api/admin/broadcast').set(auth(token)).send(body);
  const inbox = token => request(app).get('/api/messages').set(auth(token));

  test('a broadcast reaches every user in the app, without email by default', async () => {
    const { adminToken, anna } = await setup();
    const res = await broadcast(adminToken, { subject: 'Neue Lektionen', message: 'Viel Spaß beim Lernen!' });
    assert.equal(res.status, 200);
    assert.equal(res.body.inApp, 3);
    assert.equal(res.body.email, null);
    assert.equal(sentMail.length, 0);

    const box = await inbox(anna.token);
    assert.equal(box.body.unread, 1);
    assert.equal(box.body.messages[0].subject, 'Neue Lektionen');
    assert.equal(box.body.messages[0].from, 'boss');
  });

  test('with sendEmail it also emails, and reports what was sent', async () => {
    const { adminToken } = await setup();
    const res = await broadcast(adminToken, { subject: 'Hallo', message: 'Test', sendEmail: true });
    assert.equal(res.body.email.sent, 3);
    assert.equal(res.body.email.failed, 0);
    assert.equal(sentMail.length, 3);
    assert.match(sentMail[0].html, /Test/);
  });

  test('failed emails come back with the reason, and the message is still delivered in the app', async () => {
    const { adminToken, anna } = await setup();
    const realSend = mailer.sendMail;
    mailer.sendMail = async () => { throw new Error('Connection timeout'); };
    try {
      const res = await broadcast(adminToken, { subject: 'Hallo', message: 'Test', sendEmail: true });
      assert.equal(res.status, 200);
      assert.equal(res.body.email.sent, 0);
      assert.equal(res.body.email.failed, 3);
      assert.deepEqual(res.body.email.reasons, ['Connection timeout']);
    } finally { mailer.sendMail = realSend; }
    assert.equal((await inbox(anna.token)).body.unread, 1);
  });

  test('without email set up, the reason says so', async () => {
    const { adminToken } = await setup();
    mailer.isConfigured = () => false;
    const realProvider = mailer.provider;
    mailer.provider = () => null;
    try {
      const res = await broadcast(adminToken, { subject: 'Hallo', message: 'Test', sendEmail: true });
      assert.equal(res.body.email.failed, 3);
      assert.match(res.body.email.reasons[0], /not set up/);
    } finally { mailer.isConfigured = () => true; mailer.provider = realProvider; }
  });

  test('selected recipients only; deactivated users are skipped', async () => {
    const { adminToken, anna, ben } = await setup();
    await request(app).patch(`/api/admin/users/${ben.user.id}/status`).set(auth(adminToken)).send({ active: false });
    const res = await broadcast(adminToken, { subject: 'Nur für dich', message: 'Hallo Anna', userIds: [anna.user.id, ben.user.id] });
    assert.equal(res.body.inApp, 1);
    assert.equal((await inbox(anna.token)).body.unread, 1);
    await request(app).patch(`/api/admin/users/${ben.user.id}/status`).set(auth(adminToken)).send({ active: true });
    assert.equal((await inbox(ben.token)).body.messages.length, 0);
  });

  test('messages can be marked read one by one or all at once', async () => {
    const { adminToken, anna, ben } = await setup();
    await broadcast(adminToken, { subject: 'Eins', message: '1' });
    await broadcast(adminToken, { subject: 'Zwei', message: '2' });
    const [first] = (await inbox(anna.token)).body.messages;
    assert.equal((await request(app).post(`/api/messages/${first._id}/read`).set(auth(anna.token))).status, 200);
    assert.equal((await inbox(anna.token)).body.unread, 1);
    await request(app).post('/api/messages/read-all').set(auth(anna.token));
    assert.equal((await inbox(anna.token)).body.unread, 0);
    assert.equal((await inbox(ben.token)).body.unread, 2, 'read state is per user');
  });

  test('users who join later do not get older "everyone" broadcasts', async () => {
    const { adminToken } = await setup();
    await broadcast(adminToken, { subject: 'Alt', message: 'old news' });
    const cara = await registerUser({ username: 'cara', email: 'cara@example.com' });
    assert.equal((await inbox(cara.token)).body.messages.length, 0);
  });

  test('history for admins, validation, and only admins can broadcast', async () => {
    const { adminToken, anna } = await setup();
    await broadcast(adminToken, { subject: 'Eins', message: '1' });
    await request(app).post('/api/messages/read-all').set(auth(anna.token));
    const history = await request(app).get('/api/admin/broadcasts').set(auth(adminToken));
    assert.equal(history.body.length, 1);
    assert.equal(history.body[0].readCount, 1);
    assert.equal(history.body[0].recipientCount, 3);
    assert.equal(history.body[0].readBy, undefined);

    assert.equal((await broadcast(adminToken, { subject: '', message: 'x' })).status, 400);
    assert.equal((await broadcast(adminToken, { subject: 'x', message: 'y'.repeat(5001) })).status, 400);
    assert.equal((await broadcast(anna.token, { subject: 'x', message: 'y' })).status, 403);
    assert.equal((await request(app).get('/api/messages')).status, 401);
  });
});

describe('protected routes require login', () => {
  const routes = [
    ['delete', '/api/lessons/some-slug'],
    ['post', '/api/lessons/some-slug/resources'],
    ['post', '/api/exams/generate'],
    ['delete', '/api/exams/000000000000000000000000'],
    ['get', '/api/progress'],
    ['post', '/api/progress'],
    ['get', '/api/admin/users'],
    ['post', '/api/translate'],
  ];
  for (const [method, path] of routes) {
    test(`${method.toUpperCase()} ${path} → 401`, async () => {
      const res = await request(app)[method](path);
      assert.equal(res.status, 401);
    });
  }

  test('admin routes reject normal users with 403', async () => {
    const { token } = await registerUser();
    const res = await request(app).get('/api/admin/users').set(auth(token));
    assert.equal(res.status, 403);
  });
});

// A lesson saved by a user (from before all content was hand-written): no exam bank, only vocabulary
async function savedLesson(ownerId, slug = 'saved-travel') {
  return Lesson.create({
    slug, title: 'Travel', titleDe: 'Reisen', level: 'A1', category: 'vocabulary', aiGenerated: true, createdBy: ownerId,
    content: { sections: [{ heading: 'Wörter', headingEn: 'Words', items: [
      { de: 'der Zug', en: 'train', example: 'Der Zug fährt um acht.', exampleEn: 'The train leaves at eight.' },
      { de: 'der Bahnhof', en: 'station', example: 'Wo ist der Bahnhof?', exampleEn: 'Where is the station?' },
      { de: 'die Fahrkarte', en: 'ticket', example: 'Ich kaufe eine Fahrkarte.', exampleEn: 'I buy a ticket.' },
      { de: 'das Gleis', en: 'platform', example: 'Der Zug kommt auf Gleis 3.', exampleEn: 'The train arrives on platform 3.' },
      { de: 'die Verspätung', en: 'delay', example: 'Der Zug hat Verspätung.', exampleEn: 'The train is delayed.' },
    ] }] },
  });
}

describe('lessons and exams (no AI)', () => {
  test('AI lesson generation no longer exists', async () => {
    const { token } = await registerUser();
    const res = await request(app).post('/api/lessons/generate').set(auth(token)).send({ topic: 'Food' });
    assert.equal(res.status, 404);
  });

  test('saved lessons without a bank get an exam built from their own words', async () => {
    const { token, user } = await registerUser();
    await savedLesson(user.id);
    const res = await request(app).post('/api/exams/generate').set(auth(token)).send({ lessonSlug: 'saved-travel', questionCount: 10 });
    assert.equal(res.status, 200);
    assert.equal(res.body.fromBank, false);
    assert.equal(res.body.aiGenerated, false);
    const words = ['train', 'station', 'ticket', 'platform', 'delay'];
    for (const q of res.body.parts.filling) {
      assert.ok(words.includes(q.answer), q.answer);
      assert.equal(q.options.length, 4);
      assert.ok(q.options.includes(q.answer));
    }
    for (const q of res.body.parts.listening) assert.ok(q.options.includes(q.answer));
  });

  test('exams for unknown lessons are refused', async () => {
    const { token } = await registerUser();
    const res = await request(app).post('/api/exams/generate').set(auth(token)).send({ lessonSlug: 'does-not-exist' });
    assert.equal(res.status, 404);
  });

  test('only the creator or an admin can delete a saved lesson', async () => {
    const owner = await registerUser();
    const other = await registerUser({ username: 'ben', email: 'ben@example.com' });
    await savedLesson(owner.user.id);

    let res = await request(app).delete('/api/lessons/saved-travel').set(auth(other.token));
    assert.equal(res.status, 403);
    res = await request(app).delete('/api/lessons/saved-travel').set(auth(owner.token));
    assert.equal(res.status, 200);
    assert.equal(await Lesson.countDocuments({ slug: 'saved-travel' }), 0);
  });

  test('admins can delete any exam, other users cannot', async () => {
    const owner = await registerUser();
    const other = await registerUser({ username: 'ben', email: 'ben@example.com' });
    const adminToken = await makeAdmin(other);
    const stranger = await registerUser({ username: 'cara', email: 'cara@example.com' });
    await savedLesson(owner.user.id);
    const { body: exam } = await request(app).post('/api/exams/generate').set(auth(owner.token)).send({ lessonSlug: 'saved-travel' });
    assert.ok(exam._id, JSON.stringify(exam));

    let res = await request(app).delete(`/api/exams/${exam._id}`).set(auth(stranger.token));
    assert.equal(res.status, 403);
    res = await request(app).delete(`/api/exams/${exam._id}`).set(auth(adminToken));
    assert.equal(res.status, 200);
    assert.equal(await Exam.countDocuments(), 0);
  });

  test('topic search finds lessons by title and by vocabulary, without answers', async () => {
    const { meta, ...shopping } = require('../content')[0]; // a1-shopping
    await Lesson.create(shopping);
    let res = await request(app).get('/api/lessons/search?q=kasse');
    assert.equal(res.status, 200);
    assert.equal(res.body[0].slug, 'a1-shopping');
    assert.ok(res.body[0].matches.some(m => /Kasse/.test(m.de)));
    assert.equal(res.body[0].content, undefined);
    res = await request(app).get('/api/lessons/search?q=shopping');
    assert.equal(res.body[0].slug, 'a1-shopping');
    res = await request(app).get('/api/lessons/search?q=x');
    assert.deepEqual(res.body, []);
  });
});

describe('built-in exam banks', () => {
  const bankLesson = () => require('../content')[0];

  test('exams for lessons with a bank come from the bank, not AI', async () => {
    const { token } = await registerUser();
    const { meta, ...lesson } = bankLesson();
    await Lesson.create(lesson);
    const res = await request(app).post('/api/exams/generate').set(auth(token)).send({ lessonSlug: lesson.slug, questionCount: 10 });
    assert.equal(res.status, 200);
    assert.equal(res.body.fromBank, true);
    assert.equal(res.body.aiGenerated, false);
    const bankQuestions = lesson.content.exam.filling.map(q => q.question);
    assert.ok(res.body.parts.filling.every(q => bankQuestions.includes(q.question)));
  });

  test('lesson responses never include the answer bank', async () => {
    const { meta, ...lesson } = bankLesson();
    await Lesson.create(lesson);
    const res = await request(app).get(`/api/lessons/${lesson.slug}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.content.sections.length > 0);
    assert.equal(res.body.content.exam, undefined);
  });
});

describe('resource uploads', () => {
  async function setup() {
    const { token } = await registerUser();
    await Lesson.create({ slug: 'greetings', title: 'Greetings', level: 'A1', category: 'vocabulary' });
    return token;
  }

  test('accepts a small .txt file', async () => {
    const token = await setup();
    const res = await request(app).post('/api/lessons/greetings/resources').set(auth(token))
      .field('title', 'Notes').attach('file', Buffer.from('Hallo Welt'), 'notes.txt');
    assert.equal(res.status, 200);
    assert.equal(res.body.extractedText, 'Hallo Welt');
  });

  test('rejects other file types', async () => {
    const token = await setup();
    const res = await request(app).post('/api/lessons/greetings/resources').set(auth(token))
      .attach('file', Buffer.from('MZ'), 'virus.exe');
    assert.equal(res.status, 400);
    assert.match(res.body.error, /\.txt and \.md/);
  });

  test('rejects files over 1 MB', async () => {
    const token = await setup();
    const res = await request(app).post('/api/lessons/greetings/resources').set(auth(token))
      .attach('file', Buffer.alloc(1024 * 1024 + 1, 'a'), 'big.txt');
    assert.equal(res.status, 400);
    assert.match(res.body.error, /too large/);
  });

  test('rejects non-http links', async () => {
    const token = await setup();
    const res = await request(app).post('/api/lessons/greetings/resources').set(auth(token))
      .field('url', 'javascript:alert(1)');
    assert.equal(res.status, 400);
  });
});

describe('progress', () => {
  test('progress is stored per user', async () => {
    const anna = await registerUser();
    const ben = await registerUser({ username: 'ben', email: 'ben@example.com' });

    await request(app).post('/api/progress').set(auth(anna.token)).send({ lessonSlug: 'greetings', status: 'completed', xp: 50 });

    const mine = await request(app).get('/api/progress').set(auth(anna.token));
    const theirs = await request(app).get('/api/progress').set(auth(ben.token));
    assert.equal(mine.body.length, 1);
    assert.equal(mine.body[0].xp, 50);
    assert.equal(theirs.body.length, 0);
  });

  test('completing a lesson twice does not award XP twice', async () => {
    const { token } = await registerUser();
    const body = { lessonSlug: 'greetings', status: 'completed', xp: 50 };
    await request(app).post('/api/progress').set(auth(token)).send(body);
    await request(app).post('/api/progress').set(auth(token)).send(body);
    const doc = await Progress.findOne({ lessonSlug: 'greetings' });
    assert.equal(doc.xp, 50);
  });

  test('lessonSlug is required', async () => {
    const { token } = await registerUser();
    const res = await request(app).post('/api/progress').set(auth(token)).send({ status: 'completed' });
    assert.equal(res.status, 400);
  });
});
