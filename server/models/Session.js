import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  settings: {
    maxParticipants: {
      type: Number,
      default: 50
    },
    allowVoting: {
      type: Boolean,
      default: true
    },
    autoCluster: {
      type: Boolean,
      default: true
    },
    clusterThreshold: {
      type: Number,
      default: 10
    }
  },
  metadata: {
    totalIdeas: {
      type: Number,
      default: 0
    },
    totalVotes: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

sessionSchema.index({ sessionId: 1 });
sessionSchema.index({ owner: 1 });

export default mongoose.model('Session', sessionSchema);
