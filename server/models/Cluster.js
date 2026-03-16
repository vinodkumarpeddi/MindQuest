import mongoose from 'mongoose';

const clusterSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  ideas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Idea'
  }],
  color: {
    type: String,
    default: '#3b82f6'
  },
  centroid: {
    type: [Number],
    default: []
  },
  algorithm: {
    type: String,
    enum: ['kmeans', 'dbscan', 'hierarchical'],
    default: 'kmeans'
  },
  confidence: {
    type: Number,
    default: 0
  },
  summary: {
    type: String,
    default: ''
  },
  keywords: [{
    word: String,
    score: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

clusterSchema.index({ sessionId: 1 });

export default mongoose.model('Cluster', clusterSchema);
