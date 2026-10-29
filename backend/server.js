require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { OpenAI } = require('openai');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Lesson, Exam, Progress, User, Contact, Comment } = require('./models');
const { seedDatabase } = require('./seed');
const { buildFallbackLesson, buildFallbackExam } = require('./fallback');
const { hasExamBank, buildExamFromBank } = require('./examBank');

const app = express();
// Behind a reverse proxy (e.g. nginx in Docker) set TRUST_PROXY=1 so rate limiting sees real client IPs
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// ── Rate limiting ─────────────────────────────────────────
// General API: 200 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// AI endpoints: 20 requests per 15 minutes (expensive OpenAI calls)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI generation limit reached. Please wait a few minutes before generating again.' },
});

app.use('/api/', apiLimiter);
app.use('/api/lessons/generate', aiLimiter);
app.use('/api/exams/generate', aiLimiter);

// Resource uploads: plain-text files only (read as UTF-8), max 1 MB
const ALLOWED_UPLOAD_EXT = /\.(txt|md)$/i;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_UPLOAD_EXT.test(file.originalname)) return cb(null, true);
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only .txt and .md files are allowed'));
  },
});
for (const key of ['MONGODB_URI', 'JWT_SECRET']) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable ${key}. See backend/.env.example`);
    process.exit(1);
  }
}

// OpenAI is optional: without a key, generation uses the template fallbacks
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
if (!openai) console.warn('⚠️  OPENAI_API_KEY not set — lessons and exams will use template fallbacks');

const JWT_SECRET = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ── Auth routes ───────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName = '', lastName = '', username, email, password, level = 'A1' } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'username, email and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(409).json({ error: exists.email === email ? 'Email already registered' : 'Username already taken' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ firstName, lastName, username, email, password: hash, level });
    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, username: user.username, email: user.email, level: user.level, avatar: user.avatar, bio: user.bio, role: user.role } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, username: user.username, email: user.email, level: user.level, avatar: user.avatar, bio: user.bio, role: user.role } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Forgot / Reset password ───────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'No account found with that email address.' });
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    await user.save();
    const appUrl = (process.env.APP_URL || '').replace(/\/+$/, ''); // tolerate a trailing slash
    const resetLink = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    await transporter.sendMail({
      from: `"Deutsch Lernen" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset your Deutsch Lernen password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
          <h2 style="color:#111827">Reset your password</h2>
          <p style="color:#6b7280">Hi ${user.firstName || user.username},</p>
          <p style="color:#6b7280">Click the button below to reset your password. This link expires in <strong>30 minutes</strong>.</p>
          <a href="${resetLink}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#facc15;color:#111827;font-weight:700;border-radius:10px;text-decoration:none">Reset Password</a>
          <p style="color:#9ca3af;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
        </div>`,
    });
    console.log(`📧 Reset link sent to ${email}`);
    res.json({ message: 'Password reset link sent to your email.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) return res.status(400).json({ error: 'All fields are required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const user = await User.findOne({ email, resetToken: token, resetTokenExpiry: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();
    res.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, username, level, avatar, bio } = req.body;
    const update = {};
    if (firstName !== undefined) update.firstName = firstName;
    if (lastName  !== undefined) update.lastName  = lastName;
    if (username) {
      const taken = await User.findOne({ username, _id: { $ne: req.user.id } });
      if (taken) return res.status(409).json({ error: 'Username already taken' });
      update.username = username;
    }
    if (level) update.level = level;
    if (avatar) update.avatar = avatar;
    if (bio !== undefined) update.bio = bio;
    const user = await User.findByIdAndUpdate(req.user.id, update, { returnDocument: 'after' }).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/auth/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
    const user = await User.findById(req.user.id);
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

// Admins can change anything; other users only what they created
function canModify(req, doc) {
  return req.user?.role === 'admin' || (doc?.createdBy && doc.createdBy === req.user?.id);
}

// ── Check username availability ──────────────────────────
app.get('/api/auth/check-username', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Username is required' });
    const exists = await User.findOne({ username: username.trim() });
    res.json({ available: !exists });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Contact / Feedback ───────────────────────────────────
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, type, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Name, email and message are required' });
    // Save to DB
    await Contact.create({ name, email, type: type || 'General', message });
    // Send email
    await transporter.sendMail({
      from: `"Deutsch Lernen" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `[${type || 'General'}] Message from ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
          <h2 style="color:#111827;margin-bottom:4px">${type || 'Message'}</h2>
          <p style="color:#6b7280;margin:0 0 20px">From: <strong>${name}</strong> &lt;${email}&gt;</p>
          <div style="background:#f9fafb;border-radius:8px;padding:16px;color:#374151;white-space:pre-wrap">${message}</div>
        </div>`,
    });
    res.json({ message: 'Message sent successfully!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Admin contact inbox ───────────────────────────────────
app.get('/api/admin/contacts', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/admin/contacts/:id/read', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, { read: true }, { returnDocument: 'after' });
    res.json(contact);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/contacts/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Admin broadcast ───────────────────────────────────────
app.post('/api/admin/broadcast', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { subject, message, userIds } = req.body;
    if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required' });
    // userIds = [] means all users
    const filter = userIds?.length ? { _id: { $in: userIds } } : {};
    const users = await User.find(filter).select('email firstName username');
    if (!users.length) return res.status(400).json({ error: 'No recipients found' });
    const results = await Promise.allSettled(users.map(u =>
      transporter.sendMail({
        from: `"Deutsch Lernen" <${process.env.EMAIL_USER}>`,
        to: u.email,
        subject,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
            <h2 style="color:#111827;margin-bottom:4px">${subject}</h2>
            <p style="color:#6b7280">Hi ${u.firstName || u.username},</p>
            <div style="color:#374151;white-space:pre-wrap;margin:16px 0">${message}</div>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
            <p style="color:#9ca3af;font-size:12px">You received this because you are registered on Deutsch Lernen.</p>
          </div>`,
      })
    ));
    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    res.json({ sent, failed, total: users.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Admin routes ──────────────────────────────────────────
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/users/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot change your own role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { returnDocument: 'after' }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Comments ─────────────────────────────────────────────
app.get('/api/lessons/:slug/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ lessonSlug: req.params.slug }).sort({ createdAt: -1 }).limit(100);
    res.json(comments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/lessons/:slug/comments', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Comment text is required' });
    if (text.length > 500) return res.status(400).json({ error: 'Comment too long (max 500 chars)' });
    const user = await User.findById(req.user.id).select('username avatar');
    const comment = await Comment.create({
      lessonSlug: req.params.slug,
      userId: req.user.id,
      username: user.username,
      avatar: user.avatar || '🧑',
      text: text.trim()
    });
    res.json(comment);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/lessons/:slug/comments/:id', authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.userId !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not allowed' });
    await comment.deleteOne();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Admin analytics ───────────────────────────────────────
app.get('/api/admin/analytics', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [totalUsers, totalLessons, totalExams, totalComments, totalContacts,
           newUsersThisWeek, progressDocs, recentComments] = await Promise.all([
      User.countDocuments(),
      Lesson.countDocuments(),
      Exam.countDocuments(),
      Comment.countDocuments(),
      Contact.countDocuments(),
      User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
      Progress.find().select('xp status userId'),
      Comment.find().sort({ createdAt: -1 }).limit(5).select('username avatar text lessonSlug createdAt')
    ]);
    const completedLessons = progressDocs.filter(p => p.status === 'completed').length;
    const totalXP = progressDocs.reduce((s, p) => s + (p.xp || 0), 0);
    // signups per day last 7 days
    const signupsByDay = await User.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    // top lessons by completion
    const topLessons = await Progress.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$lessonSlug', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    res.json({ totalUsers, totalLessons, totalExams, totalComments, totalContacts,
               newUsersThisWeek, completedLessons, totalXP, signupsByDay, topLessons, recentComments });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Lessons ───────────────────────────────────────────────
app.get('/api/lessons', async (req, res) => {
  try {
    const { level, category } = req.query;
    const filter = {};
    if (level) filter.level = level;
    if (category) filter.category = category;
    const lessons = await Lesson.find(filter).select('-content').sort({ aiGenerated: 1, level: 1, createdAt: 1 });
    res.json(lessons);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/lessons/ai', async (req, res) => {
  try {
    const lessons = await Lesson.find({ aiGenerated: true }).select('-content').sort({ createdAt: -1 });
    res.json(lessons);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/lessons/:slug', async (req, res) => {
  try {
    // The exam bank holds the answers, so it stays on the server
    const lesson = await Lesson.findOne({ slug: req.params.slug }).select('-content.exam');
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json(lesson);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/lessons/:slug', authMiddleware, async (req, res) => {
  try {
    const lesson = await Lesson.findOne({ slug: req.params.slug, aiGenerated: true });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    if (!canModify(req, lesson)) return res.status(403).json({ error: 'You can only delete lessons you created' });
    await lesson.deleteOne();
    await Exam.deleteMany({ lessonSlug: req.params.slug });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/lessons/generate', authMiddleware, async (req, res) => {
  const { topic, level = 'A1', category = 'vocabulary' } = req.body;
  if (!topic) return res.status(400).json({ error: 'topic is required' });
  const slug = `ai-${topic.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;
  const prompt = `You are a professional German language teacher creating a complete ${level} CEFR lesson.
Topic: "${topic}", Category: ${category}
Generate a rich, detailed lesson with bilingual content (German + English).
Return ONLY valid JSON:
{"title":"English title","titleDe":"German title","description":"Short German description","descriptionEn":"Short English description","sections":[{"heading":"German heading","headingEn":"English heading","items":[{"de":"German","en":"English","example":"German example","exampleEn":"English example","note":"optional note"}]}],"keyPoints":["point1","point2","point3"],"dialogue":{"title":"German title","titleEn":"English title","lines":[{"speaker":"A","de":"German","en":"English"}]}}
Make it comprehensive with at least 3 sections, 4+ items per section, 3+ key points, and a 6+ line dialogue.`;
  try {
    if (!openai) throw new Error('OPENAI_API_KEY not set');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: 'You are a professional German language teacher. Always respond with valid JSON only.' }, { role: 'user', content: prompt }],
      response_format: { type: 'json_object' }, temperature: 0.7,
    });
    const data = JSON.parse(completion.choices[0].message.content);
    const lesson = await Lesson.create({ slug, title: data.title, titleDe: data.titleDe, level, category, aiGenerated: true, createdBy: req.user.id, content: { description: data.description, descriptionEn: data.descriptionEn, sections: data.sections || [], keyPoints: data.keyPoints || [], dialogue: data.dialogue || null, aiGenerated: true, topic } });
    res.json(lesson);
  } catch (err) {
    console.warn('⚠️  OpenAI unavailable, using fallback lesson:', err.message);
    try {
      const data = buildFallbackLesson(topic, level, category);
      const lesson = await Lesson.create({ slug, title: data.title, titleDe: data.titleDe, level, category, aiGenerated: true, createdBy: req.user.id, content: { description: data.description, descriptionEn: data.descriptionEn, sections: data.sections, keyPoints: data.keyPoints, dialogue: data.dialogue, aiGenerated: true, topic, fallback: true } });
      res.json({ ...lesson.toObject(), fallback: true });
    } catch (fbErr) { res.status(500).json({ error: 'Failed to generate lesson: ' + fbErr.message }); }
  }
});

app.post('/api/lessons/:slug/resources', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { title, url } = req.body;
    if (url && !/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'URL must start with http:// or https://' });
    const lesson = await Lesson.findOne({ slug: req.params.slug });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    let resourceText = '';
    if (req.file) resourceText = req.file.buffer.toString('utf-8');
    else if (url) resourceText = `Resource URL: ${url}`;
    lesson.resources = lesson.resources || [];
    lesson.resources.push({ title: title || 'Resource', url: url || '', fileType: req.file?.mimetype || 'url' });
    await lesson.save();
    res.json({ success: true, extractedText: resourceText.slice(0, 500) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Exams ─────────────────────────────────────────────────
app.post('/api/exams/generate', authMiddleware, async (req, res) => {
  const { lessonSlug, level = 'A1' } = req.body;
  const questionCount = Math.min(50, Math.max(5, Number(req.body.questionCount) || 10));
  try {
    const lesson = await Lesson.findOne({ slug: lessonSlug });

    // Built-in lessons have a hand-written question bank: use it, no AI involved
    if (hasExamBank(lesson)) {
      const { parts } = buildExamFromBank(lesson, questionCount);
      const exam = await Exam.create({ lessonSlug, lessonTitle: lesson.title, level: lesson.level, questionCount, parts, createdBy: req.user.id, aiGenerated: false });
      return res.json({ ...exam.toObject(), fromBank: true });
    }

    const lessonContext = lesson ? JSON.stringify(lesson.content).slice(0, 3000) : '';
    const perPart = Math.max(2, Math.floor(questionCount / 5));
    const extra = questionCount - perPart * 5;
    const prompt = `You are a certified German language examiner creating a ${level} CEFR exam.
Lesson: "${lesson?.title || lessonSlug}" (${level} level). Lesson content: ${lessonContext}
Create exam with: filling: ${perPart + extra}q, writing: ${perPart}q, speaking: ${perPart}q, reading: ${perPart}q, listening: ${perPart}q.
Return ONLY valid JSON: {"parts":{"filling":[{"type":"fill","question":"","questionEn":"","answer":"","options":["","","",""],"explanation":"","explanationEn":""}],"writing":[{"type":"write","question":"","questionEn":"","answer":"","answerEn":"","tip":"","options":[]}],"speaking":[{"type":"speak","question":"","questionEn":"","answer":"","answerEn":"","pronunciation":"","tip":"","options":[]}],"reading":[{"type":"read","text":"","textEn":"","question":"","questionEn":"","answer":"","options":["","","",""],"explanation":"","explanationEn":""}],"listening":[{"type":"listen","script":"","scriptEn":"","question":"","questionEn":"","answer":"","options":["","","",""],"explanation":"","explanationEn":""}]}}`;
    if (!openai) throw new Error('OPENAI_API_KEY not set');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: 'You are a certified German language examiner. Always respond with valid JSON only.' }, { role: 'user', content: prompt }],
      response_format: { type: 'json_object' }, temperature: 0.8,
    });
    const examData = JSON.parse(completion.choices[0].message.content);
    ['filling', 'writing', 'speaking', 'reading', 'listening'].forEach(p => {
      if (!Array.isArray(examData.parts?.[p])) { examData.parts = examData.parts || {}; examData.parts[p] = []; }
    });
    const exam = await Exam.create({ lessonSlug, lessonTitle: lesson?.title || lessonSlug, level, questionCount, parts: examData.parts, createdBy: req.user.id, aiGenerated: true });
    res.json(exam);
  } catch (err) {
    console.warn('⚠️  OpenAI unavailable, using fallback exam:', err.message);
    try {
      const lesson = await Lesson.findOne({ slug: lessonSlug });
      const examData = buildFallbackExam(lesson, level, questionCount);
      const exam = await Exam.create({ lessonSlug, lessonTitle: lesson?.title || lessonSlug, level, questionCount, parts: examData.parts, createdBy: req.user.id, aiGenerated: false });
      res.json({ ...exam.toObject(), fallback: true });
    } catch (fbErr) { res.status(500).json({ error: 'Exam generation failed: ' + fbErr.message }); }
  }
});

app.get('/api/exams', async (req, res) => {
  try {
    const { lessonSlug } = req.query;
    const filter = lessonSlug ? { lessonSlug } : {};
    const exams = await Exam.find(filter).select('-parts').sort({ createdAt: -1 }).limit(50);
    res.json(exams);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/exams/:id', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    res.json(exam);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/exams/:id', authMiddleware, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    if (!canModify(req, exam)) return res.status(403).json({ error: 'You can only delete exams you created' });
    await exam.deleteOne();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Progress ──────────────────────────────────────────────
app.get('/api/progress', authMiddleware, async (req, res) => {
  try {
    const progress = await Progress.find({ userId: req.user.id });
    res.json(progress);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/progress', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonSlug, status, xp, examScore } = req.body;
    if (!lessonSlug) return res.status(400).json({ error: 'lessonSlug is required' });
    const update = { $set: { userId, lessonSlug, lastActivity: new Date() } };
    if (status) update.$set.status = status;
    if (xp) {
      const existing = await Progress.findOne({ userId, lessonSlug });
      if (!existing || existing.status !== 'completed' || status !== 'completed') {
        update.$inc = { xp };
      }
    }
    if (examScore) update.$push = { examScores: { ...examScore, date: new Date() } };
    const prog = await Progress.findOneAndUpdate({ userId, lessonSlug }, update, { upsert: true, returnDocument: 'after' });
    if (examScore?.examId) {
      await Exam.findByIdAndUpdate(examScore.examId, { lastScore: examScore.pct }).catch(() => {});
    }
    res.json(prog);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Turn upload errors (too large, wrong type) into JSON 400s instead of HTML 500s
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 1 MB)' : (err.field || err.message);
    return res.status(400).json({ error: message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  mongoose.connection.on('error', err => console.error('❌ MongoDB error:', err.message));
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
  await seedDatabase();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

// Start only when run directly (`node server.js`); tests import the app instead
if (require.main === module) start();

module.exports = app;
