import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASSWORD;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn('⚠️ EMAIL_USER or EMAIL_PASSWORD not set in environment. Invitation emails will fail.');
}

const transporterOptions = process.env.EMAIL_HOST && process.env.EMAIL_PORT ? {
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_PORT === '465', // true for 465
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  },
  pool: true,
  maxConnections: 1,
  maxMessages: 20,
  logger: true,
  debug: true
} : {
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  },
  pool: true,
  maxConnections: 1,
  maxMessages: 20,
  logger: true,
  debug: true
};

const transporter = nodemailer.createTransport(transporterOptions);

// Verify transporter
transporter.verify((err, success) => {
  if (err) {
    console.error('❌ SMTP transporter verify failed (invite):', err);
  } else {
    console.log('✅ SMTP transporter ready to send session invites');
  }
});

export const sendSessionInvite = async (recipientEmail, sessionName, sessionId, inviterName) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const sessionUrl = `${FRONTEND_URL}/session/${sessionId}`;


  const mailOptions = {
  from: `"MindQuest" <${EMAIL_USER}>`,
  to: recipientEmail,
  subject: `🎯 Invitation to join "${sessionName}" on MindQuest`,
  html: `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>MindQuest Invitation</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f6f7fb;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial">
    <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f6f7fb;padding:40px 0">
      <tr>
        <td align="center">
          <table role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.05);overflow:hidden;">
            
            <!-- Header -->
            <tr>
              <td align="center" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:30px;color:white;">
                <h1 style="margin:0;font-size:28px;font-weight:700;">MindQuest</h1>
                <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">Collaborate. Brainstorm. Create.</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:32px;">
                <h2 style="margin-top:0;font-size:22px;color:#222;">You're Invited! 🎉</h2>
                <p style="font-size:16px;line-height:1.5;color:#444;margin-bottom:18px;">
                  <b>${inviterName}</b> has invited you to join the brainstorming session
                  <b>"${sessionName}"</b> on <b>MindQuest</b>.
                </p>
                <p style="font-size:16px;color:#555;">Click the button below to join the session:</p>
                
                <p style="text-align:center;margin:30px 0;">
                  <a href="${sessionUrl}"
                    style="background-color:#667eea;color:#ffffff;text-decoration:none;
                    padding:14px 30px;border-radius:8px;font-weight:600;font-size:16px;
                    display:inline-block;transition:all 0.3s ease;">
                    🚀 Join Session
                  </a>
                </p>

                <p style="font-size:14px;color:#777;line-height:1.5;">
                  If you didn’t expect this invitation, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#fafafa;text-align:center;padding:16px;border-top:1px solid #eee;">
                <p style="margin:0;font-size:12px;color:#999;">
                  © ${new Date().getFullYear()} MindQuest — Empowering collaborative creativity.<br/>
                  This is an automated message; please do not reply.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `
};


  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📨 Invite sent to ${recipientEmail}. messageId=${info.messageId}`);
    return info;
  } catch (err) {
    console.error('💥 sendSessionInvite failed for', recipientEmail, err);
    throw err;
  }
};
