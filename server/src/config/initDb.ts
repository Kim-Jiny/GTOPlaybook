import pool from './db';
import bcrypt from 'bcrypt';

const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    display_name TEXT,
    photo_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

  CREATE TABLE IF NOT EXISTS inquiries (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_reply TEXT,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
  CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);

  CREATE TABLE IF NOT EXISTS gto_charts (
    id SERIAL PRIMARY KEY,
    position TEXT NOT NULL,
    situation TEXT NOT NULL,
    vs_position TEXT,
    caller_position TEXT,
    stack_depth INTEGER DEFAULT 100,
    max_players INTEGER DEFAULT 6,
    description TEXT,
    category TEXT,
    action_types JSONB,
    flop_texture TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Migration: add columns for existing DBs
  ALTER TABLE gto_charts ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 6;
  ALTER TABLE gto_charts ADD COLUMN IF NOT EXISTS category TEXT;
  ALTER TABLE gto_charts ADD COLUMN IF NOT EXISTS action_types JSONB;
  ALTER TABLE gto_charts ADD COLUMN IF NOT EXISTS flop_texture TEXT;
  ALTER TABLE gto_charts ADD COLUMN IF NOT EXISTS caller_position TEXT;

  CREATE TABLE IF NOT EXISTS gto_ranges (
    id SERIAL PRIMARY KEY,
    chart_id INTEGER NOT NULL REFERENCES gto_charts(id) ON DELETE CASCADE,
    hand TEXT NOT NULL,
    row_idx INTEGER NOT NULL,
    col_idx INTEGER NOT NULL,
    action TEXT NOT NULL DEFAULT 'fold',
    raise_freq REAL DEFAULT 0,
    call_freq REAL DEFAULT 0,
    fold_freq REAL DEFAULT 0,
    frequencies JSONB
  );

  ALTER TABLE gto_ranges ADD COLUMN IF NOT EXISTS frequencies JSONB;

  CREATE INDEX IF NOT EXISTS idx_gto_ranges_chart_id ON gto_ranges(chart_id);
  CREATE INDEX IF NOT EXISTS idx_gto_charts_stack_depth ON gto_charts(stack_depth);
  CREATE INDEX IF NOT EXISTS idx_gto_charts_max_players ON gto_charts(max_players);

  CREATE TABLE IF NOT EXISTS admin_accounts (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Users: last active tracking
  ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
`;

export async function initDatabase(): Promise<void> {
  try {
    await pool.query(CREATE_TABLES);

    const adminUsername = process.env.ADMIN_USERNAME?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminUsername || adminPassword) {
      if (!adminUsername || !adminPassword) {
        throw new Error(
          'Both ADMIN_USERNAME and ADMIN_PASSWORD must be set together.',
        );
      }

      const hash = await bcrypt.hash(adminPassword, 10);
      await pool.query(
        `INSERT INTO admin_accounts (username, password_hash)
         VALUES ($1, $2)
         ON CONFLICT (username) DO NOTHING`,
        [adminUsername, hash],
      );
    }

    console.log('Database tables initialized');
  } catch (err) {
    console.error('Failed to initialize database:', err);
    throw err;
  }
}
