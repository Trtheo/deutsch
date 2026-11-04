// Sends email. Providers, best first:
//   BREVO_API_KEY            → Brevo HTTP API (free: 300 emails/day). Works on hosts that block
//                              email ports, such as Render's free plan. Sender: EMAIL_FROM or EMAIL_USER
//                              (must be a verified sender in Brevo).
//   EMAIL_USER + EMAIL_PASS  → Gmail SMTP (needs outgoing ports 465/587 open).
// Methods are called as mailer.sendMail(...) so tests can replace them.
const nodemailer = require('nodemailer');

const TIMEOUT_MS = 15000;
const senderEmail = () => process.env.EMAIL_FROM || process.env.EMAIL_USER;

async function sendWithBrevo({ to, subject, html, text, replyTo }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: 'Deutsch Lernen', email: senderEmail() },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      ...(text ? { textContent: text } : {}),
      ...(replyTo ? { replyTo: { email: replyTo } } : {}),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Brevo ${res.status}: ${body.message || res.statusText}`);
  }
  return res.json();
}

const mailer = {
  provider() {
    if (process.env.BREVO_API_KEY && senderEmail()) return 'brevo';
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) return 'gmail';
    return null;
  },

  isConfigured() {
    return mailer.provider() !== null;
  },

  _transport: null,
  async sendMail({ to, subject, html, text, replyTo }) {
    const provider = mailer.provider();
    if (!provider) throw new Error('Email is not configured (set BREVO_API_KEY, or EMAIL_USER and EMAIL_PASS)');
    if (provider === 'brevo') return sendWithBrevo({ to, subject, html, text, replyTo });
    mailer._transport ||= nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      // Fail fast when the host blocks email ports, instead of hanging for minutes
      connectionTimeout: TIMEOUT_MS,
      greetingTimeout: TIMEOUT_MS,
      socketTimeout: TIMEOUT_MS,
    });
    return mailer._transport.sendMail({ from: `"Deutsch Lernen" <${process.env.EMAIL_USER}>`, to, replyTo, subject, html, text });
  },
};

module.exports = mailer;
