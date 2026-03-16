import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, isEmailVerified } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email and password are required' });
    }

    const emailNorm = email.toLowerCase().trim();
    const existingUser = await User.findOne({ $or: [{ email: emailNorm }, { username }] });

    // If user exists and this is an OTP-verified re-registration, update their password
    if (existingUser && isEmailVerified && existingUser.email === emailNorm) {
      existingUser.password = password;
      existingUser.username = username;
      existingUser.isEmailVerified = true;
      await existingUser.save();

      const token = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.status(200).json({
        token,
        user: {
          id: existingUser._id,
          username: existingUser.username,
          email: existingUser.email,
          avatar: existingUser.avatar,
          role: existingUser.role,
          isEmailVerified: existingUser.isEmailVerified
        }
      });
    }

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;

    const user = new User({
      username,
      email: emailNorm,
      password,
      avatar,
      isEmailVerified: !!isEmailVerified
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
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
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

export default router;
