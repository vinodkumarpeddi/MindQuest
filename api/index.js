import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from '../server/routes/auth.js';
import otpRoutes from '../server/routes/otp.js';
import sessionRoutes from '../server/routes/sessions.js';
import ideaRoutes from '../server/routes/ideas.js';
import clusterRoutes from '../server/routes/clusters.js';

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB (reuse connection across invocations)
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'mindquest' });
    isConnected = true;
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB error:', err);
  }
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/clusters', clusterRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'MindQuest Backend (Vercel)' });
});

// Also handle /health for backwards compat
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'MindQuest Backend (Vercel)' });
});

export default app;
