import pool from './db';

const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    display_name TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS gto_charts (
    id SERIAL PRIMARY KEY,
    position TEXT NOT NULL,
    situation TEXT NOT NULL,
    vs_position TEXT,
    stack_depth INTEGER DEFAULT 100,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS gto_ranges (
    id SERIAL PRIMARY KEY,
    chart_id INTEGER NOT NULL REFERENCES gto_charts(id) ON DELETE CASCADE,
    hand TEXT NOT NULL,
    row_idx INTEGER NOT NULL,
    col_idx INTEGER NOT NULL,
    action TEXT NOT NULL DEFAULT 'fold',
    raise_freq REAL DEFAULT 0,
    call_freq REAL DEFAULT 0,
    fold_freq REAL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_gto_ranges_chart_id ON gto_ranges(chart_id);

  CREATE TABLE IF NOT EXISTS game_rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    max_players INTEGER DEFAULT 6,
    small_blind INTEGER DEFAULT 10,
    big_blind INTEGER DEFAULT 20,
    status TEXT DEFAULT 'waiting',
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS game_hands (
    id SERIAL PRIMARY KEY,
    room_id TEXT REFERENCES game_rooms(id),
    hand_number INTEGER NOT NULL,
    community_cards TEXT[],
    pot INTEGER DEFAULT 0,
    winners TEXT[],
    summary JSONB,
    played_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS player_stats (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    hands_played INTEGER DEFAULT 0,
    hands_won INTEGER DEFAULT 0,
    total_winnings INTEGER DEFAULT 0,
    biggest_pot INTEGER DEFAULT 0,
    vpip_hands INTEGER DEFAULT 0,
    pfr_hands INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
  );
`;

export async function initDatabase(): Promise<void> {
  try {
    await pool.query(CREATE_TABLES);
    console.log('Database tables initialized');
  } catch (err) {
    console.error('Failed to initialize database:', err);
    throw err;
  }
}
