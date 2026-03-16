import mongoose from 'mongoose';

const ideaSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  position: {
    x: {
      type: Number,
      default: 100
    },
    y: {
      type: Number,
      default: 100
    }
  },
  color: {
    type: String,
    default: '#fef08a'
  },
  votes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  clusterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cluster'
  },
  embedding: {
    type: [Number],
    default: []
  },
  sentiment: {
    label: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral'
    },
    score: {
      type: Number,
      default: 0
    }
  },
  isDuplicate: {
    type: Boolean,
    default: false
  },
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Idea'
  },
  similarity: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  priority: {
    type: String,
    enum: ['quick-win', 'major-project', 'fill-in', 'avoid', null],
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

ideaSchema.index({ sessionId: 1 });
ideaSchema.index({ author: 1 });
ideaSchema.index({ clusterId: 1 });

export default mongoose.model('Idea', ideaSchema);
