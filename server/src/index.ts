import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { initDatabase } from './config/initDb';
import pool from './config/db';
import gtoRoutes from './routes/gto';
import userRoutes from './routes/user';
import inquiryRoutes from './routes/inquiry';
import adminRoutes from './routes/admin';
import adminWebRoutes from './routes/adminWeb';

const app = express();
const PgStore = connectPgSimple(session);
const isProduction = process.env.NODE_ENV === 'production';
// Prefer the configured secret. If it's missing, fall back to a random
// ephemeral secret so the server still boots — but never to a hardcoded
// value. The trade-off: admin web sessions reset whenever the process
// restarts, so SESSION_SECRET should always be set in production.
const sessionSecret =
  process.env.SESSION_SECRET ?? crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET) {
  console.warn(
    '[WARN] SESSION_SECRET is not set — using a random ephemeral secret. ' +
      'Admin sessions will be invalidated on every restart. ' +
      'Set SESSION_SECRET in production.',
  );
}
const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set('trust proxy', 1);

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (allowedOrigins.length === 0) {
        callback(null, true);
        return;
      }

      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: sessionSecret,
    store: new PgStore({
      pool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    }),
    resave: false,
    saveUninitialized: false,
    name: 'gto_admin_session',
    proxy: isProduction,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
    },
  }),
);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Admin web dashboard
app.use('/admin', adminWebRoutes);

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
