// Backup → restore round trip on an in-memory database.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { createBackup, readBackup, restoreBackup } = require('../backup');

const PASS = 'correct horse battery staple';
let mongod, db;

before(async () => {
  mongod = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
  await mongoose.connect(mongod.getUri());
  db = mongoose.connection.db;
});
after(async () => { await mongoose.disconnect(); await mongod?.stop(); });

test('a backup restores exactly, including ObjectIds and dates', async () => {
  const id = new mongoose.Types.ObjectId();
  const created = new Date('2026-11-01T10:00:00Z');
  await db.collection('users').insertOne({ _id: id, username: 'anna', createdAt: created, xp: 42 });
  await db.collection('progress').insertMany([{ userId: String(id), xp: 10 }, { userId: String(id), xp: 20 }]);

  const { buffer, summary } = await createBackup(db, PASS);
  assert.equal(summary.users, 1);
  assert.equal(summary.progress, 2);
  assert.ok(!buffer.toString('latin1').includes('anna'), 'contents are encrypted');

  await db.collection('users').deleteMany({});
  await db.collection('progress').deleteMany({});
  const { restored } = await restoreBackup(db, buffer, PASS);
  assert.deepEqual(restored, { users: 1, progress: 2 });

  const user = await db.collection('users').findOne({ _id: id });
  assert.ok(user._id instanceof mongoose.Types.ObjectId);
  assert.ok(user.createdAt instanceof Date);
  assert.equal(user.createdAt.toISOString(), created.toISOString());
});

test('restoring without --drop keeps newer data and only adds what is missing', async () => {
  await db.collection('notes').deleteMany({});
  await db.collection('notes').insertOne({ _id: 'a', text: 'old' });
  const { buffer } = await createBackup(db, PASS);
  await db.collection('notes').updateOne({ _id: 'a' }, { $set: { text: 'edited later' } });
  await db.collection('notes').insertOne({ _id: 'b', text: 'new' });

  await restoreBackup(db, buffer, PASS);
  assert.equal((await db.collection('notes').findOne({ _id: 'a' })).text, 'edited later');
  assert.equal(await db.collection('notes').countDocuments(), 2);

  await restoreBackup(db, buffer, PASS, { drop: true });
  assert.equal((await db.collection('notes').findOne({ _id: 'a' })).text, 'old');
  assert.equal(await db.collection('notes').countDocuments(), 1);
});

test('a wrong passphrase or another file is rejected', async () => {
  const { buffer } = await createBackup(db, PASS);
  assert.throws(() => readBackup(buffer, 'wrong passphrase!!'), /Wrong passphrase/);
  assert.throws(() => readBackup(Buffer.from('hello world, not a backup'), PASS), /Not a Deutsch Lernen backup/);
  await assert.rejects(createBackup(db, 'short'), /at least 12 characters/);
});
