// Sends email through Gmail when EMAIL_USER / EMAIL_PASS are set.
// Methods are called as mailer.sendMail(...) so tests can replace them.
const nodemailer = require('nodemailer');

const mailer = {
  isConfigured() {
    return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  },

  _transport: null,
  async sendMail({ to, subject, html, text, replyTo }) {
    if (!mailer.isConfigured()) throw new Error('Email is not configured (EMAIL_USER / EMAIL_PASS)');
    mailer._transport ||= nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    return mailer._transport.sendMail({ from: `"Deutsch Lernen" <${process.env.EMAIL_USER}>`, to, replyTo, subject, html, text });
  },
};

module.exports = mailer;
