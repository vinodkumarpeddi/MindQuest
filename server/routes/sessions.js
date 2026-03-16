import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Session from '../models/Session.js';
import Idea from '../models/Idea.js';
import Cluster from '../models/Cluster.js';
import { authMiddleware } from '../middleware/auth.js';
import nodemailer from 'nodemailer';
import { sendSessionInvite } from '../services/SendSession.js';
const router = express.Router();


router.post('/:sessionId/invite', authMiddleware, async (req, res) => {
  try {
    const { emails } = req.body;
    const { sessionId } = req.params;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'Email list is required' });
    }

    const session = await Session.findOne({ sessionId }).populate('owner', 'username email');
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (session.owner._id.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the session owner can send invites.' });
    }

    console.log(`📧 Sending invites for session "${session.name}" (${sessionId})`);

    const results = await Promise.allSettled(
      emails.map(email =>
        sendSessionInvite(email, session.name, sessionId, session.owner.username)
      )
    );

    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.warn('⚠️ Some invites failed:', failed.map(f => f.reason.message));
      return res.status(207).json({
        message: 'Some invites failed to send.',
        failed: failed.map(f => f.reason.message)
      });
    }

    console.log('✅ All invites sent successfully!');
    res.json({ message: 'Invitations sent successfully!' });
  } catch (error) {
    console.error('❌ Invite route error:', error);
    res.status(500).json({ error: 'Failed to send invitations' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, isPublic, settings } = req.body;
    const sessionId = uuidv4().substring(0, 8);

    const session = new Session({
      name,
      description,
      sessionId,
      owner: req.userId,
      isPublic,
      settings,
      participants: [{
        user: req.userId,
        joinedAt: new Date()
      }]
    });

    await session.save();
    await session.populate('owner', 'username email avatar');

    console.log(`✨ New session created: ${name} (${sessionId})`);
    res.status(201).json({ session });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [
        { isPublic: true },
        { owner: req.userId },
        { 'participants.user': req.userId }
      ],
      status: 'active'
    })
    .populate('owner', 'username email avatar')
    .sort({ 'metadata.lastActivity': -1 })
    .limit(50);

    res.json({ sessions });
  } catch (error) {
    console.error('Fetch sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.get('/:sessionId', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId })
      .populate('owner', 'username email avatar')
      .populate('participants.user', 'username email avatar');

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ session });
  } catch (error) {
    console.error('Fetch session error:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

router.post('/:sessionId/join', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const alreadyJoined = session.participants.some(
      p => p.user.toString() === req.userId
    );

    if (!alreadyJoined) {
      session.participants.push({
        user: req.userId,
        joinedAt: new Date()
      });
      await session.save();
    }

    await session.populate('owner', 'username email avatar');
    await session.populate('participants.user', 'username email avatar');

    console.log(`👤 User joined session: ${session.name}`);
    res.json({ session });
  } catch (error) {
    console.error('Join session error:', error);
    res.status(500).json({ error: 'Failed to join session' });
  }
});

router.post('/:sessionId/complete', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only owner can complete session' });
    }

    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();

    console.log(`✅ Session completed: ${session.name}`);
    res.json({ session });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

router.get('/:sessionId/export', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId })
      .populate('owner', 'username email avatar');
    const ideas = await Idea.find({ sessionId: session._id })
      .populate('author', 'username email avatar')
      .sort({ createdAt: -1 });
    const clusters = await Cluster.find({ sessionId: session._id });

    res.json({
      session,
      ideas,
      clusters,
      exportedAt: new Date()
    });
  } catch (error) {
    console.error('Export session error:', error);
    res.status(500).json({ error: 'Failed to export session' });
  }
});

export default router;
