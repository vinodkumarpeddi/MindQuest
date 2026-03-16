import express from 'express';
import crypto from 'crypto';
import OTP from '../models/OTP.js';
import User from '../models/User.js';
import { sendOTPEmail } from '../services/emailService.js';

const router = express.Router();
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const TTL_MS = 10 * 60 * 1000; // 10 minutes
const THROTTLE_MS = 60 * 1000;  // 60 seconds

router.post('/send-otp', async (req, res) => {
  try {
    const emailRaw = req.body?.email;
    if (!emailRaw) return res.status(400).json({ error: 'Email is required' });

    const email = emailRaw.toLowerCase().trim();

    // throttle: do not allow another OTP within THROTTLE_MS
    const recentOTP = await OTP.findOne({
      email,
      createdAt: { $gt: new Date(Date.now() - THROTTLE_MS) }
    });

    if (recentOTP) {
      return res.status(429).json({ error: 'Please wait before requesting a new OTP', retryAfter: THROTTLE_MS / 1000 });
    }

    const otp = generateOTP();
    const otpDoc = await OTP.create({ email, otp });

    console.log(`📌 Created OTP record for ${email} (id=${otpDoc._id}) - attempting to send email...`);

    try {
      const info = await sendOTPEmail(email, otp);
      console.log(`✅ send-otp: email send success for ${email}. messageId=${info?.messageId}`);
      return res.status(200).json({ message: 'OTP sent successfully', email });
    } catch (sendErr) {
      console.error('send-otp: sending email failed — deleting OTP record and returning error', sendErr);
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(500).json({ error: 'Failed to send OTP email' });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

router.post('/resend-otp', async (req, res) => {
  try {
    const emailRaw = req.body?.email;
    if (!emailRaw) return res.status(400).json({ error: 'Email is required' });

    const email = emailRaw.toLowerCase().trim();

    const recentOTP = await OTP.findOne({
      email,
      createdAt: { $gt: new Date(Date.now() - THROTTLE_MS) }
    });

    if (recentOTP) {
      return res.status(429).json({ error: 'Please wait 60 seconds before requesting a new OTP', retryAfter: THROTTLE_MS / 1000 });
    }

    const otp = generateOTP();
    const otpDoc = await OTP.create({ email, otp });

    console.log(`📌 Resend OTP created for ${email} (id=${otpDoc._id}) - attempting to send email...`);
    try {
      const info = await sendOTPEmail(email, otp);
      console.log(`✅ resend-otp: email sent for ${email}. messageId=${info?.messageId}`);
      return res.status(200).json({ message: 'OTP resent successfully', email });
    } catch (sendErr) {
      console.error('resend-otp: sending email failed — deleting OTP record', sendErr);
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(500).json({ error: 'Failed to resend OTP email' });
    }
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

// verify-otp + register in one atomic step
router.post('/verify-and-register', async (req, res) => {
  try {
    const { email: emailRaw, otp, username, password } = req.body;
    console.log('🔍 verify-and-register request:', { email: emailRaw, otp, otpType: typeof otp, username });
    if (!emailRaw || !otp) return res.status(400).json({ error: 'Email and OTP are required' });
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

    const email = emailRaw.toLowerCase().trim();
    const otpStr = String(otp).trim();

    // Verify OTP
    const otpRecord = await OTP.findOne({ email, otp: otpStr }).sort({ createdAt: -1 });
    if (!otpRecord) {
      const allOtps = await OTP.find({ email });
      console.log('❌ OTP mismatch. Received:', JSON.stringify(otpStr), 'DB has:', allOtps.map(o => ({ otp: o.otp, created: o.createdAt })));
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const age = Date.now() - otpRecord.createdAt.getTime();
    if (age > TTL_MS) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // Check if username is taken by a different email
    const usernameConflict = await User.findOne({ username, email: { $ne: email } });
    if (usernameConflict) {
      console.log(`❌ Username "${username}" already taken by ${usernameConflict.email}`);
      return res.status(400).json({ error: `Username "${username}" is already taken. Please choose a different one.` });
    }

    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
    const jwt = (await import('jsonwebtoken')).default;

    // If user with this email already exists, update their credentials
    let user = await User.findOne({ email });
    if (user) {
      user.username = username;
      user.password = password;
      user.isEmailVerified = true;
      user.avatar = avatar;
      await user.save();
      console.log(`🔄 Updated existing user ${email}`);
    } else {
      // Create new user
      user = new User({ username, email, password, avatar, isEmailVerified: true });
      await user.save();
      console.log(`✅ Created new user ${email}`);
    }

    // Only consume OTPs after successful registration
    await OTP.deleteMany({ email });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Verify and register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Keep verify-otp for other uses
router.post('/verify-otp', async (req, res) => {
  try {
    const emailRaw = req.body?.email;
    const otp = req.body?.otp;
    if (!emailRaw || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    const email = emailRaw.toLowerCase().trim();

    const otpRecord = await OTP.findOne({ email, otp }).sort({ createdAt: -1 });
    if (!otpRecord) return res.status(400).json({ error: 'Invalid or expired OTP' });

    const age = Date.now() - otpRecord.createdAt.getTime();
    if (age > TTL_MS) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // Don't delete OTPs here — let verify-and-register handle cleanup
    const user = await User.findOneAndUpdate(
      { email },
      { $set: { isEmailVerified: true } },
      { new: true }
    );

    if (user) {
      return res.status(200).json({ message: 'OTP verified successfully', verified: true, user: {
        id: user._id, email: user.email, username: user.username, isEmailVerified: user.isEmailVerified
      }});
    }

    return res.status(200).json({ message: 'OTP verified successfully', verified: true });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

export default router;
