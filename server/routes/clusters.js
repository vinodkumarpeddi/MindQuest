import express from 'express';
import Cluster from '../models/Cluster.js';
import Idea from '../models/Idea.js';
import Session from '../models/Session.js';
import { authMiddleware } from '../middleware/auth.js';
import { callAIService } from '../services/aiService.js';

const router = express.Router();

router.post('/trigger', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log(`🤖 Triggering AI clustering for session: ${session.name}`);

    const ideas = await Idea.find({ sessionId: session._id, isDuplicate: false });

    if (ideas.length < 3) {
      return res.status(400).json({ error: 'Need at least 3 ideas to cluster' });
    }

    const aiResponse = await callAIService('/cluster', {
      sessionId: session._id.toString(),
      ideas: ideas.map(i => ({
        id: i._id.toString(),
        content: i.content,
        embedding: i.embedding
      }))
    });

    await Cluster.deleteMany({ sessionId: session._id });

    const clusters = await Promise.all(aiResponse.clusters.map(async cluster => {
      const newCluster = new Cluster({
        sessionId: session._id,
        label: cluster.label,
        description: cluster.description,
        ideas: cluster.ideas,
        color: cluster.color,
        centroid: cluster.centroid,
        algorithm: cluster.algorithm,
        confidence: cluster.confidence,
        keywords: cluster.keywords
      });
      await newCluster.save();

      await Idea.updateMany(
        { _id: { $in: cluster.ideas } },
        { clusterId: newCluster._id, color: cluster.color }
      );

      return newCluster;
    }));

    console.log(`✅ Created ${clusters.length} clusters`);
    res.json({ clusters });
  } catch (error) {
    console.error('Clustering error:', error);
    res.status(500).json({ error: 'Failed to cluster ideas' });
  }
});

router.get('/session/:sessionId', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const clusters = await Cluster.find({ sessionId: session._id })
      .populate({
        path: 'ideas',
        populate: { path: 'author', select: 'username email avatar' }
      });

    res.json({ clusters });
  } catch (error) {
    console.error('Fetch clusters error:', error);
    res.status(500).json({ error: 'Failed to fetch clusters' });
  }
});

router.post('/summarize', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log(`📝 Generating comprehensive project abstract...`);

    const ideas = await Idea.find({ sessionId: session._id })
      .populate('author', 'username')
      .sort({ 'votes': -1 });
    const clusters = await Cluster.find({ sessionId: session._id });

    // Send ALL ideas for comprehensive analysis
    const allIdeas = ideas.map(i => ({
      content: i.content,
      votes: i.votes.length,
      author: i.author?.username || 'Anonymous',
      sentiment: i.sentiment?.label || 'neutral',
      tags: i.tags || [],
      priority: i.priority || null
    }));

    // Top ideas by votes
    const topIdeas = [...allIdeas].sort((a, b) => b.votes - a.votes).slice(0, 10);

    const aiResponse = await callAIService('/summarize', {
      sessionName: session.name,
      sessionDescription: session.description || '',
      totalParticipants: session.participants?.length || 0,
      ideas: allIdeas,
      topIdeas,
      clusters: clusters.map(c => ({
        label: c.label,
        description: c.description,
        ideaCount: c.ideas.length,
        keywords: c.keywords?.map(k => k.word) || []
      }))
    });

    console.log(`✅ Project abstract generated`);
    res.json({
      summary: aiResponse.summary,
      insights: aiResponse.insights,
      topIdeas: topIdeas.slice(0, 5),
      recommendations: aiResponse.recommendations || []
    });
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

router.post('/generate-ideas', authMiddleware, async (req, res) => {
  try {
    const { sessionId, prompt } = req.body;

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log(`💭 Generating new ideas using Gemini AI...`);

    const existingIdeas = await Idea.find({ sessionId: session._id })
      .limit(20)
      .sort({ createdAt: -1 });

    const aiResponse = await callAIService('/generate-ideas', {
      sessionName: session.name,
      prompt: prompt || session.description,
      existingIdeas: existingIdeas.map(i => i.content)
    });

    console.log(`✅ Generated ${aiResponse.ideas.length} new ideas`);
    res.json({ ideas: aiResponse.ideas });
  } catch (error) {
    console.error('Generate ideas error:', error);
    res.status(500).json({ error: 'Failed to generate ideas' });
  }
});

// AI Chat endpoint
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { sessionId, message, history } = req.body;

    const session = await Session.findOne({ sessionId });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const ideas = await Idea.find({ sessionId: session._id }).populate('author', 'username').limit(50);
    const clusters = await Cluster.find({ sessionId: session._id });

    const context = `You are an AI assistant for a brainstorming session called "${session.name}".
${session.description ? `Session description: ${session.description}` : ''}

Current ideas in the session (${ideas.length} total):
${ideas.map(i => `- "${i.content}" by ${i.author?.username} (${i.votes?.length || 0} votes)`).join('\n')}

${clusters.length > 0 ? `\nClusters:\n${clusters.map(c => `- ${c.label}: ${c.ideas.length} ideas`).join('\n')}` : ''}

Help the user analyze ideas, suggest improvements, find patterns, or answer questions about the session. Be concise and helpful.`;

    const aiResponse = await callAIService('/chat', {
      context,
      message,
      history: history || []
    });

    res.json({ reply: aiResponse.reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

export default router;
