import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { initDatabase } from './config/initDb';
import gtoRoutes from './routes/gto';
import userRoutes from './routes/user';
import inquiryRoutes from './routes/inquiry';
import adminRoutes from './routes/admin';

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/gto', gtoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 3000;

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`GTOPlaybook server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
