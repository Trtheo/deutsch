const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  slug: { type: String, unique: true, required: true },
  title: String,
  titleDe: String,
  level: { type: String, enum: ['A1', 'A2', 'B1', 'B2'] },
  category: { type: String, enum: ['vocabulary', 'grammar', 'reading', 'writing', 'listening', 'speaking', 'alphabet', 'numbers', 'verbs', 'tenses', 'topic', 'certificate'] },
  content: mongoose.Schema.Types.Mixed,
  resources: [{ title: String, url: String, fileType: String }],
  aiGenerated: { type: Boolean, default: false },
  createdBy: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

const examSchema = new mongoose.Schema({
  lessonSlug: String,
  lessonTitle: String,
  level: { type: String, enum: ['A1', 'A2', 'B1', 'B2'] },
  questionCount: Number,
  parts: {
    filling:   [mongoose.Schema.Types.Mixed],
    writing:   [mongoose.Schema.Types.Mixed],
    speaking:  [mongoose.Schema.Types.Mixed],
    reading:   [mongoose.Schema.Types.Mixed],
    listening: [mongoose.Schema.Types.Mixed],
  },
  aiGenerated: { type: Boolean, default: false },
  createdBy: { type: String, default: null },
  lastScore: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now }
});

const progressSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  lessonSlug: String,
  status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
  xp: { type: Number, default: 0 },
  examScores: [{ examId: String, score: Number, total: Number, date: Date }],
  streak: { type: Number, default: 0 },
  lastActivity: Date
});

const contactSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  email:   { type: String, required: true },
  type:    { type: String, default: 'General' },
  message: { type: String, required: true },
  read:    { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  firstName:{ type: String, default: '' },
  lastName: { type: String, default: '' },
  username: { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  level:    { type: String, enum: ['A1', 'A2', 'B1', 'B2'], default: 'A1' },
  avatar:   { type: String, default: '🧑' },
  bio:      { type: String, default: '' },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  resetToken:      { type: String, default: null },
  resetTokenExpiry:{ type: Date, default: null },
  createdAt:{ type: Date, default: Date.now }
});

const commentSchema = new mongoose.Schema({
  lessonSlug: { type: String, required: true, index: true },
  userId:     { type: String, required: true },
  username:   { type: String, required: true },
  avatar:     { type: String, default: '🧑' },
  text:       { type: String, required: true, maxlength: 500 },
  createdAt:  { type: Date, default: Date.now }
});

module.exports = {
  Lesson:   mongoose.model('Lesson', lessonSchema),
  Exam:     mongoose.model('Exam', examSchema),
  Progress: mongoose.model('Progress', progressSchema),
  Contact:  mongoose.model('Contact', contactSchema),
  User:     mongoose.model('User', userSchema),
  Comment:  mongoose.model('Comment', commentSchema)
};
