import express from 'express';
import Idea from '../models/Idea.js';
import Session from '../models/Session.js';
import { authMiddleware } from '../middleware/auth.js';
import { callAIService } from '../services/aiService.js';

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { sessionId, content, position, color } = req.body;

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const idea = new Idea({
      sessionId: session._id,
      content,
      author: req.userId,
      position: position || { x: Math.random() * 800 + 100, y: Math.random() * 600 + 100 },
      color: color || '#fef08a'
    });

    console.log('🔍 Checking for duplicates and generating embedding...');
    const existingIdeas = await Idea.find({ sessionId: session._id, isDuplicate: false });

    if (existingIdeas.length > 0) {
      try {
        const aiResponse = await callAIService('/check-duplicate', {
          newIdea: content,
          existingIdeas: existingIdeas.map(i => ({ id: i._id, content: i.content, embedding: i.embedding }))
        });

        if (aiResponse.isDuplicate) {
          idea.isDuplicate = true;
          idea.duplicateOf = aiResponse.duplicateOf;
          idea.similarity = aiResponse.similarity;
          console.log(`⚠️  Duplicate detected (${(aiResponse.similarity * 100).toFixed(1)}% similar)`);
        }

        if (aiResponse.embedding) {
          idea.embedding = aiResponse.embedding;
        }

        if (aiResponse.sentiment) {
          idea.sentiment = aiResponse.sentiment;
        }

        if (aiResponse.tags) {
          idea.tags = aiResponse.tags;
        }
      } catch (aiError) {
        console.error('AI service error (continuing):', aiError.message);
      }
    }

    await idea.save();
    await idea.populate('author', 'username email avatar');

    session.metadata.totalIdeas += 1;
    session.metadata.lastActivity = new Date();
    await session.save();

    console.log(`💡 New idea added: "${content.substring(0, 50)}..."`);

    if (session.settings.autoCluster && session.metadata.totalIdeas >= session.settings.clusterThreshold) {
      console.log('🤖 Auto-clustering threshold reached, triggering clustering...');
      callAIService('/cluster', { sessionId: session._id.toString() }).catch(err => {
        console.error('Auto-clustering error:', err.message);
      });
    }

    res.status(201).json({ idea });
  } catch (error) {
    console.error('Create idea error:', error);
    res.status(500).json({ error: 'Failed to create idea' });
  }
});

router.get('/session/:sessionId', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const ideas = await Idea.find({ sessionId: session._id })
      .populate('author', 'username email avatar')
      .populate('clusterId', 'label color')
      .sort({ createdAt: -1 });

    res.json({ ideas });
  } catch (error) {
    console.error('Fetch ideas error:', error);
    res.status(500).json({ error: 'Failed to fetch ideas' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { content, position, color } = req.body;
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    if (content) idea.content = content;
    if (position) idea.position = position;
    if (color) idea.color = color;
    idea.updatedAt = new Date();

    await idea.save();
    await idea.populate('author', 'username email avatar');

    res.json({ idea });
  } catch (error) {
    console.error('Update idea error:', error);
    res.status(500).json({ error: 'Failed to update idea' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    await Idea.deleteOne({ _id: req.params.id });
    res.json({ message: 'Idea deleted' });
  } catch (error) {
    console.error('Delete idea error:', error);
    res.status(500).json({ error: 'Failed to delete idea' });
  }
});

router.post('/:id/vote', authMiddleware, async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    const existingVote = idea.votes.find(v => v.user.toString() === req.userId);
    if (existingVote) {
      idea.votes = idea.votes.filter(v => v.user.toString() !== req.userId);
    } else {
      idea.votes.push({ user: req.userId, timestamp: new Date() });
    }

    await idea.save();
    await idea.populate('author', 'username email avatar');

    res.json({ idea });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

router.post('/:id/react', authMiddleware, async (req, res) => {
  try {
    const { emoji } = req.body;
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    const existingReaction = idea.reactions.find(
      r => r.user.toString() === req.userId && r.emoji === emoji
    );

    if (existingReaction) {
      idea.reactions = idea.reactions.filter(
        r => !(r.user.toString() === req.userId && r.emoji === emoji)
      );
    } else {
      idea.reactions.push({ user: req.userId, emoji, timestamp: new Date() });
    }

    await idea.save();
    await idea.populate('author', 'username email avatar');

    res.json({ idea });
  } catch (error) {
    console.error('React error:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

export default router;
