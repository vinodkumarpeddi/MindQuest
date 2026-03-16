import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

// DO NOT call dotenv here if you already call it in index.js.
// But keep a fallback for local dev if needed.
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASSWORD;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn('⚠️ EMAIL_USER or EMAIL_PASSWORD not set in environment. OTP emails will fail.');
}

// Use Gmail or host/port if provided
const transporterOptions = process.env.EMAIL_HOST && process.env.EMAIL_PORT ? {
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
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

// Verify transporter at startup
transporter.verify((err, success) => {
  if (err) {
    console.error('❌ SMTP transporter verify failed:', err);
  } else {
    console.log('✅ SMTP transporter ready to send emails');
  }
});

/**
 * sendOTPEmail
 * - returns the nodemailer info object when successful
 * - throws if sendMail fails
 */
export const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"MindQuest" <${EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - MindQuest',
    html: `
      <!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; max-width:600px;margin:0 auto;padding:20px">
        <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:10px;padding:28px;text-align:center;color:white">
          <h1 style="margin:0">MindQuest</h1>
        </div>
        <div style="background:#fff;border-radius:8px;padding:24px;margin-top:18px">
          <h2 style="margin-top:0">Verify your email</h2>
          <p>Enter the following 6-digit code in the app to verify your email address:</p>
          <div style="font-size:28px;letter-spacing:6px;font-weight:700;background:#f7f7f7;padding:16px;border-radius:8px;display:inline-block">${otp}</div>
          <p style="color:#666;margin-top:18px">This code will expire in 10 minutes.</p>
        </div>
        <p style="font-size:12px;color:#999;text-align:center;margin-top:12px">This is an automated message — do not reply.</p>
      </div>
      </body></html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${email}. messageId=${info.messageId}`, info);
    return info;
  } catch (err) {
    console.error('💥 transporter.sendMail failed for', email, err);
    throw err;
  }
};
