import { Resend } from 'resend';

const resend = new Resend(process.env.FELOVY_SIGNUP_RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? 'Felovy <noreply@felovy.com>';

function buildHtml(subject: string, code: string): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#15803d;margin-bottom:8px">Felovy</h2>
      <p style="color:#6b7280;font-size:14px">For Every Life, Our Value Yields</p>
      <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0"/>
      <h3 style="color:#111827">${subject}</h3>
      <p style="color:#374151">Use the 6-digit code below to verify your identity. It expires in 10 minutes.</p>
      <div style="background:#ecfdf5;border:2px solid #bbf7d0;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
        <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#15803d">${code}</span>
      </div>
      <p style="color:#9ca3af;font-size:12px">If you didn't request this, please ignore this email.</p>
    </div>
  `;
}

export const sendOtpEmail = async (
  to: string,
  code: string,
  purpose: 'signup' | 'email_change'
): Promise<void> => {
  const subject =
    purpose === 'signup'
      ? 'Your Felovy verification code'
      : 'Your Felovy email change verification code';

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html: buildHtml(subject, code),
  });

  if (error) {
    console.error('[email.service] Resend error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
  console.log('[email.service] Sent email id:', data?.id);
};
