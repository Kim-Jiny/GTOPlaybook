import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import { initDatabase } from './config/initDb';
import { setupSocket } from './socket';
import gtoRoutes from './routes/gto';
import userRoutes from './routes/user';
import gameRoutes from './routes/game';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/gto', gtoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);

// Socket.IO
setupSocket(server);

const PORT = process.env.PORT || 3000;

async function start() {
  await initDatabase();
  server.listen(PORT, () => {
    console.log(`GTOPlaybook server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
