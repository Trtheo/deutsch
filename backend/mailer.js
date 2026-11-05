// Sends email. Providers, best first:
//   BREVO_API_KEY = xkeysib-…  → Brevo HTTP API (free: 300 emails/day). Works on hosts that block
//                                email ports, such as Render's free plan.
//   Brevo SMTP key (xsmtpsib-…, in BREVO_SMTP_KEY or BREVO_API_KEY) + BREVO_SMTP_LOGIN
//                              → Brevo SMTP relay on port 2525 (often open where 25/465/587 are blocked)
//   EMAIL_USER + EMAIL_PASS    → Gmail SMTP (needs ports 465/587).
// Sender for Brevo: EMAIL_FROM or EMAIL_USER (must be a verified sender in Brevo).
// Methods are called as mailer.sendMail(...) so tests can replace them.
const nodemailer = require('nodemailer');

const TIMEOUT_MS = 15000;
const senderEmail = () => process.env.EMAIL_FROM || process.env.EMAIL_USER;
const isSmtpKey = k => typeof k === 'string' && k.startsWith('xsmtpsib-');
const brevoApiKey = () => (process.env.BREVO_API_KEY && !isSmtpKey(process.env.BREVO_API_KEY) ? process.env.BREVO_API_KEY : null);
const brevoSmtpKey = () => process.env.BREVO_SMTP_KEY || (isSmtpKey(process.env.BREVO_API_KEY) ? process.env.BREVO_API_KEY : null);

async function sendWithBrevoApi({ to, subject, html, text, replyTo }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': brevoApiKey(), 'Content-Type': 'application/json', Accept: 'application/json' },
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

// Fail fast when the host blocks a port, instead of hanging for minutes
const TIMEOUTS = { connectionTimeout: TIMEOUT_MS, greetingTimeout: TIMEOUT_MS, socketTimeout: TIMEOUT_MS };

const mailer = {
  provider() {
    if (brevoApiKey() && senderEmail()) return 'brevo';
    if (brevoSmtpKey() && senderEmail()) return 'brevo-smtp'; // a missing login is reported when sending
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) return 'gmail';
    return null;
  },

  isConfigured() {
    return mailer.provider() !== null;
  },

  _transports: {},
  transport(provider) {
    if (!mailer._transports[provider]) {
      mailer._transports[provider] = provider === 'brevo-smtp'
        ? nodemailer.createTransport({
            host: 'smtp-relay.brevo.com', port: Number(process.env.BREVO_SMTP_PORT) || 2525, secure: false,
            auth: { user: process.env.BREVO_SMTP_LOGIN, pass: brevoSmtpKey() }, ...TIMEOUTS,
          })
        : nodemailer.createTransport({
            service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }, ...TIMEOUTS,
          });
    }
    return mailer._transports[provider];
  },

  async sendMail({ to, subject, html, text, replyTo }) {
    const provider = mailer.provider();
    if (!provider) throw new Error('Email is not configured (set BREVO_API_KEY, or EMAIL_USER and EMAIL_PASS)');
    if (provider === 'brevo-smtp' && !process.env.BREVO_SMTP_LOGIN) {
      throw new Error('Brevo SMTP key found, but BREVO_SMTP_LOGIN is missing (Brevo → SMTP & API → SMTP → Login)');
    }
    if (provider === 'brevo') return sendWithBrevoApi({ to, subject, html, text, replyTo });
    const from = provider === 'brevo-smtp' ? `"Deutsch Lernen" <${senderEmail()}>` : `"Deutsch Lernen" <${process.env.EMAIL_USER}>`;
    return mailer.transport(provider).sendMail({ from, to, replyTo, subject, html, text });
  },
};

module.exports = mailer;
