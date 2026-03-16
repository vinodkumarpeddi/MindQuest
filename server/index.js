import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';


import mongoose from 'mongoose';
import sessionRoutes from './routes/sessions.js';
import ideaRoutes from './routes/ideas.js';
import authRoutes from './routes/auth.js';
import otpRoutes from './routes/otp.js';
import clusterRoutes from './routes/clusters.js';
import { setupSocketHandlers } from './sockets/handlers.js';


const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, {
  dbName: 'mindquest'
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => console.error('❌ MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/clusters', clusterRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'MindQuest Backend' });
});

setupSocketHandlers(io);

console.log('🔧 ENV CHECK:', {
  EMAIL_USER: process.env.EMAIL_USER ? '✅ loaded' : '❌ missing',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? '✅ loaded' : '❌ missing',
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 MindQuest Backend running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for real-time collaboration`);
});



export { io };
