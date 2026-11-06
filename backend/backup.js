// Encrypted database backups (free alternative to paid Atlas backups).
// A backup is every collection as Extended JSON, gzipped, then encrypted with AES-256-GCM using a key
// derived from a passphrase (scrypt). File layout: "DLBK1" | salt(16) | iv(12) | tag(16) | ciphertext.
// The passphrase is required to read or restore it, so backups are safe to store in a public repo's artifacts.
const crypto = require('crypto');
const zlib = require('zlib');
const mongoose = require('mongoose');

const MAGIC = Buffer.from('DLBK1');
const { EJSON } = mongoose.mongo.BSON;

function keyFrom(passphrase, salt) {
  if (!passphrase || passphrase.length < 12) throw new Error('BACKUP_PASSPHRASE must be at least 12 characters');
  return crypto.scryptSync(passphrase, salt, 32);
}

async function createBackup(db, passphrase) {
  const collections = {};
  for (const { name } of await db.listCollections({}, { nameOnly: true }).toArray()) {
    if (name.startsWith('system.')) continue;
    collections[name] = EJSON.stringify(await db.collection(name).find().toArray(), { relaxed: false });
  }
  const json = JSON.stringify({ version: 1, createdAt: new Date().toISOString(), database: db.databaseName, collections });
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyFrom(passphrase, salt), iv);
  const encrypted = Buffer.concat([cipher.update(zlib.gzipSync(json)), cipher.final()]);
  return {
    buffer: Buffer.concat([MAGIC, salt, iv, cipher.getAuthTag(), encrypted]),
    summary: Object.fromEntries(Object.entries(collections).map(([n, docs]) => [n, EJSON.parse(docs).length])),
  };
}

function readBackup(buffer, passphrase) {
  if (!buffer.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error('Not a Deutsch Lernen backup file');
  let o = MAGIC.length;
  const salt = buffer.subarray(o, o += 16);
  const iv = buffer.subarray(o, o += 12);
  const tag = buffer.subarray(o, o += 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyFrom(passphrase, salt), iv);
  decipher.setAuthTag(tag);
  let gz;
  try { gz = Buffer.concat([decipher.update(buffer.subarray(o)), decipher.final()]); }
  catch { throw new Error('Wrong passphrase, or the backup file is damaged'); }
  const data = JSON.parse(zlib.gunzipSync(gz).toString('utf8'));
  return { ...data, collections: Object.fromEntries(Object.entries(data.collections).map(([n, docs]) => [n, EJSON.parse(docs, { relaxed: false })])) };
}

// Restores into `db`. With drop: true, existing collections are emptied first (exact copy of the backup).
// Without it, existing documents are kept and only missing ones are added.
async function restoreBackup(db, buffer, passphrase, { drop = false } = {}) {
  const data = readBackup(buffer, passphrase);
  const restored = {};
  for (const [name, docs] of Object.entries(data.collections)) {
    const col = db.collection(name);
    if (drop) await col.deleteMany({});
    let count = 0;
    for (const doc of docs) {
      const r = await col.updateOne({ _id: doc._id }, { $setOnInsert: doc }, { upsert: true });
      count += r.upsertedCount;
    }
    restored[name] = count;
  }
  return { createdAt: data.createdAt, restored };
}

module.exports = { createBackup, readBackup, restoreBackup };
