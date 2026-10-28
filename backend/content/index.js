// All built-in lessons with hand-written content and exam banks. Format: see SCHEMA.md
const FILES = ['./a1-topics', './a2-topics', './b1-topics', './verbs-grammar', './certificates'];

// A file that doesn't exist yet (content still being written) is skipped with a warning,
// so the server keeps running. Syntax errors and other problems still fail loudly.
// The tests check that every lesson is present, so a missing file can't go unnoticed.
function load(file) {
  try {
    return require(file);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND' && err.message.includes(`'${file}'`)) {
      console.warn(`⚠️  Lesson content ${file}.js not found, skipping`);
      return [];
    }
    throw err;
  }
}

module.exports = FILES.flatMap(load);
