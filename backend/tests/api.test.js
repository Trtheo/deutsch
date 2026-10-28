// API tests: run with `npm test`. Uses an in-memory MongoDB, so no real database is touched.
const { test, before, after, beforeEach, describe } = require('node:test');
const assert = require('node:assert/strict');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');

process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://placeholder'; // replaced by the in-memory server below
delete process.env.OPENAI_API_KEY;                 // force template fallbacks, never call OpenAI

let mongod, app, User, Lesson, Exam, Progress;

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
  await Promise.all(Object.values(mongoose.connection.collections).map(c => c.deleteMany({})));
});

async function registerUser(overrides = {}) {
  const body = { username: 'anna', email: 'anna@example.com', password: 'secret123', ...overrides };
  const res = await request(app).post('/api/auth/register').send(body);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return res.body;
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
  test('register returns a token and never the password', async () => {
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

  test('forgot-password returns 404 for unknown emails', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@example.com' });
    assert.equal(res.status, 404);
  });

  test('a tampered token is rejected', async () => {
    const res = await request(app).get('/api/auth/me').set(auth('not-a-real-token'));
    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'Invalid token');
  });
});

describe('protected routes require login', () => {
  const routes = [
    ['post', '/api/lessons/generate'],
    ['delete', '/api/lessons/some-slug'],
    ['post', '/api/lessons/some-slug/resources'],
    ['post', '/api/exams/generate'],
    ['delete', '/api/exams/000000000000000000000000'],
    ['get', '/api/progress'],
    ['post', '/api/progress'],
    ['get', '/api/admin/users'],
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

describe('lessons and exams', () => {
  test('generating a lesson without OpenAI uses the fallback and records the creator', async () => {
    const { token, user } = await registerUser();
    const res = await request(app).post('/api/lessons/generate').set(auth(token)).send({ topic: 'Food', level: 'A1' });
    assert.equal(res.status, 200);
    assert.equal(res.body.fallback, true);
    assert.equal(res.body.createdBy, user.id);
  });

  test('only the creator or an admin can delete a lesson', async () => {
    const owner = await registerUser();
    const other = await registerUser({ username: 'ben', email: 'ben@example.com' });
    const { body: lesson } = await request(app).post('/api/lessons/generate').set(auth(owner.token)).send({ topic: 'Travel' });

    let res = await request(app).delete(`/api/lessons/${lesson.slug}`).set(auth(other.token));
    assert.equal(res.status, 403);

    res = await request(app).delete(`/api/lessons/${lesson.slug}`).set(auth(owner.token));
    assert.equal(res.status, 200);
    assert.equal(await Lesson.countDocuments({ slug: lesson.slug }), 0);
  });

  test('admins can delete any exam, other users cannot', async () => {
    const owner = await registerUser();
    const other = await registerUser({ username: 'ben', email: 'ben@example.com' });
    const adminToken = await makeAdmin(other);
    const stranger = await registerUser({ username: 'cara', email: 'cara@example.com' });
    const { body: lesson } = await request(app).post('/api/lessons/generate').set(auth(owner.token)).send({ topic: 'Home' });
    const { body: exam } = await request(app).post('/api/exams/generate').set(auth(owner.token)).send({ lessonSlug: lesson.slug });
    assert.ok(exam._id, JSON.stringify(exam));

    let res = await request(app).delete(`/api/exams/${exam._id}`).set(auth(stranger.token));
    assert.equal(res.status, 403);
    res = await request(app).delete(`/api/exams/${exam._id}`).set(auth(adminToken));
    assert.equal(res.status, 200);
    assert.equal(await Exam.countDocuments(), 0);
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
