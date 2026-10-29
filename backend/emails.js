// HTML + plain-text email templates. Inline styles and tables only: email clients ignore <style> and modern CSS.
const BRAND = { yellow: '#facc15', dark: '#111827', text: '#374151', muted: '#6b7280', border: '#e5e7eb', bg: '#f3f4f6' };

const appUrl = () => (process.env.APP_URL || '').replace(/\/+$/, '');

const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function layout({ preheader, heading, body, button, footer }) {
  const logo = appUrl() ? `<img src="${appUrl()}/logo192.png" width="56" height="56" alt="Deutsch Lernen" style="display:block;margin:0 auto 12px;border:0">` : '';
  const cta = button ? `
          <tr><td align="center" style="padding:8px 0 24px">
            <a href="${button.href}" style="display:inline-block;padding:14px 32px;background:${BRAND.yellow};color:${BRAND.dark};font-weight:700;font-size:16px;border-radius:10px;text-decoration:none">${escapeHtml(button.label)}</a>
          </td></tr>
          <tr><td style="font-size:12px;color:${BRAND.muted};padding-bottom:8px">If the button doesn’t work, copy this link into your browser:<br>
            <a href="${button.href}" style="color:${BRAND.dark};word-break:break-all">${button.href}</a>
          </td></tr>` : '';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <span style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid ${BRAND.border};border-radius:16px">
        <tr><td style="background:${BRAND.dark};border-radius:16px 16px 0 0;padding:28px 32px;text-align:center">
          ${logo}
          <div style="color:#ffffff;font-size:20px;font-weight:700">Deutsch Lernen</div>
          <div style="color:${BRAND.yellow};font-size:13px;margin-top:2px">Learn German from A1 to B1</div>
        </td></tr>
        <tr><td style="padding:32px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="font-size:22px;font-weight:700;color:${BRAND.dark};padding-bottom:16px">${escapeHtml(heading)}</td></tr>
            <tr><td style="font-size:15px;line-height:1.6;color:${BRAND.text};padding-bottom:16px">${body}</td></tr>
            ${cta}
          </table>
        </td></tr>
        <tr><td style="border-top:1px solid ${BRAND.border};padding:20px 32px;font-size:12px;line-height:1.5;color:${BRAND.muted};text-align:center">
          ${footer}<br>© Deutsch Lernen
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function verifyEmail({ name, link, hours }) {
  const who = escapeHtml(name);
  return {
    subject: 'Confirm your email for Deutsch Lernen',
    html: layout({
      preheader: 'One click to activate your account.',
      heading: `Willkommen, ${who}! 👋`,
      body: `Thanks for creating your Deutsch Lernen account. Please confirm your email address to activate it. You’ll be signed in automatically and taken straight to your dashboard.`,
      button: { href: link, label: 'Verify my email' },
      footer: `This link expires in ${hours} hours and can be used once. If you didn’t create an account, you can ignore this email.`,
    }),
    text: `Willkommen, ${name}!\n\nPlease confirm your email address to activate your Deutsch Lernen account:\n${link}\n\nThis link expires in ${hours} hours and can be used once. If you didn't create an account, you can ignore this email.`,
  };
}

function welcome({ name }) {
  const who = escapeHtml(name);
  const url = appUrl();
  return {
    subject: 'Your Deutsch Lernen account is ready 🎉',
    html: layout({
      preheader: 'Your email is verified. Viel Erfolg!',
      heading: `Your account is verified, ${who}!`,
      body: `Your email address is confirmed and your account is active. Here’s how to get the most out of it:
        <ul style="padding-left:20px;margin:12px 0 0">
          <li style="margin-bottom:6px"><strong>Follow your level:</strong> lessons are grouped from A1 to B1.</li>
          <li style="margin-bottom:6px"><strong>Take the exams:</strong> every lesson has its own practice exam.</li>
          <li style="margin-bottom:6px"><strong>Prepare for your certificate:</strong> try the A1, A2, DTZ and B1 practice tests.</li>
          <li><strong>Keep your streak:</strong> a little German every day adds up.</li>
        </ul>`,
      button: url ? { href: url, label: 'Start learning' } : null,
      footer: 'You’re receiving this because you just verified your Deutsch Lernen account.',
    }),
    text: `Your account is verified, ${name}!\n\nYour email address is confirmed and your account is active.${url ? `\n\nStart learning: ${url}` : ''}\n\nViel Erfolg!`,
  };
}

function resetPassword({ name, link, minutes }) {
  const who = escapeHtml(name);
  return {
    subject: 'Reset your Deutsch Lernen password',
    html: layout({
      preheader: 'Reset your password.',
      heading: 'Reset your password',
      body: `Hi ${who}, we received a request to reset your password. Click the button below to choose a new one.`,
      button: { href: link, label: 'Reset password' },
      footer: `This link expires in ${minutes} minutes. If you didn’t ask to reset your password, you can ignore this email.`,
    }),
    text: `Hi ${name},\n\nReset your Deutsch Lernen password here:\n${link}\n\nThis link expires in ${minutes} minutes. If you didn't ask for this, ignore this email.`,
  };
}

module.exports = { verifyEmail, welcome, resetPassword, appUrl, escapeHtml };
