// Restores an encrypted backup into the database in MONGODB_URI.
//   node scripts/restore.js <file.dlbk>                 → shows what's inside, changes nothing
//   node scripts/restore.js <file.dlbk> --yes           → adds documents that are missing
//   node scripts/restore.js <file.dlbk> --yes --drop    → replaces everything with the backup
// Needs MONGODB_URI and BACKUP_PASSPHRASE.
require('dotenv').config({ quiet: true });
const fs = require('fs');
const mongoose = require('mongoose');
const { readBackup, restoreBackup } = require('../backup');

(async () => {
  const [file, ...flags] = process.argv.slice(2);
  const { MONGODB_URI, BACKUP_PASSPHRASE } = process.env;
  if (!file || !BACKUP_PASSPHRASE) {
    console.error('Usage: node scripts/restore.js <file.dlbk> [--yes] [--drop]   (needs BACKUP_PASSPHRASE)');
    process.exit(1);
  }
  const buffer = fs.readFileSync(file);
  const data = readBackup(buffer, BACKUP_PASSPHRASE);
  console.log(`Backup from ${data.createdAt} (database "${data.database}"):`);
  for (const [name, docs] of Object.entries(data.collections)) console.log(`  ${name}: ${docs.length}`);

  if (!flags.includes('--yes')) {
    console.log('\nNothing changed. Add --yes to restore (and --drop to replace the current data completely).');
    return;
  }
  if (!MONGODB_URI) { console.error('Set MONGODB_URI to restore.'); process.exit(1); }
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  const { restored } = await restoreBackup(mongoose.connection.db, buffer, BACKUP_PASSPHRASE, { drop: flags.includes('--drop') });
  console.log('\n✔ Restored (documents added):');
  for (const [name, n] of Object.entries(restored)) console.log(`  ${name}: ${n}`);
  await mongoose.disconnect();
})().catch(err => { console.error('Restore failed:', err.message); process.exit(1); });
