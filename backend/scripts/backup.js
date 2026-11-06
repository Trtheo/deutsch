// Makes an encrypted backup of the database.
//   npm run backup                      → backups/deutsch-backup-<date>.dlbk
//   node scripts/backup.js <folder>     → into another folder
// Needs MONGODB_URI and BACKUP_PASSPHRASE (from .env or the environment).
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { createBackup } = require('../backup');

(async () => {
  const { MONGODB_URI, BACKUP_PASSPHRASE } = process.env;
  if (!MONGODB_URI || !BACKUP_PASSPHRASE) {
    console.error('Set MONGODB_URI and BACKUP_PASSPHRASE (at least 12 characters) first.');
    process.exit(1);
  }
  const outDir = path.resolve(process.argv[2] || 'backups');
  fs.mkdirSync(outDir, { recursive: true });
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  const { buffer, summary } = await createBackup(mongoose.connection.db, BACKUP_PASSPHRASE);
  const file = path.join(outDir, `deutsch-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.dlbk`);
  fs.writeFileSync(file, buffer);
  console.log(`✔ Backup written: ${file} (${(buffer.length / 1024).toFixed(1)} KB)`);
  for (const [name, n] of Object.entries(summary)) console.log(`  ${name}: ${n}`);
  await mongoose.disconnect();
})().catch(err => { console.error('Backup failed:', err.message); process.exit(1); });
