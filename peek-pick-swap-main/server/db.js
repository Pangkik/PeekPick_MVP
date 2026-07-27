// ponytail: single sqlite file, swap to Postgres at deploy (see TEXT json arrays below)
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ponytail: env override lets test.js point at a throwaway file instead of the real db
const dbPath = process.env.PEEKPICK_DB_PATH || path.join(__dirname, "peekpick.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  bio TEXT DEFAULT '',
  location TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  verified INTEGER DEFAULT 0,
  verify_code TEXT,
  created_at TEXT DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  have_categories TEXT DEFAULT '[]',
  want_categories TEXT DEFAULT '[]',
  condition TEXT DEFAULT '',
  radius TEXT DEFAULT 'city',
  trade_style TEXT DEFAULT 'one-for-one'
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  condition TEXT,
  description TEXT DEFAULT '',
  photo_urls TEXT DEFAULT '[]',
  wants TEXT DEFAULT '[]',
  available INTEGER DEFAULT 1,
  created_at TEXT DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS swipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  item_id INTEGER NOT NULL REFERENCES items(id),
  direction TEXT,
  created_at TEXT DEFAULT current_timestamp,
  UNIQUE(user_id, item_id)
);

CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user1_id INTEGER NOT NULL REFERENCES users(id),
  user2_id INTEGER NOT NULL REFERENCES users(id),
  item1_id INTEGER NOT NULL REFERENCES items(id),
  item2_id INTEGER NOT NULL REFERENCES items(id),
  status TEXT DEFAULT 'matched',
  created_at TEXT DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_id INTEGER NOT NULL REFERENCES trades(id),
  created_at TEXT DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id),
  sender_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TEXT DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS passports (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  items_reused INTEGER DEFAULT 0,
  co2_saved_kg REAL DEFAULT 0,
  waste_diverted_kg REAL DEFAULT 0,
  badges TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS blocks (
  blocker_id INTEGER NOT NULL REFERENCES users(id),
  blocked_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT current_timestamp,
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id),
  from_user_id INTEGER NOT NULL REFERENCES users(id),
  offer_item_id INTEGER REFERENCES items(id),
  cash_amount REAL DEFAULT 0,
  note TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_id INTEGER NOT NULL REFERENCES trades(id),
  rater_id INTEGER NOT NULL REFERENCES users(id),
  ratee_id INTEGER NOT NULL REFERENCES users(id),
  stars INTEGER NOT NULL,
  comment TEXT DEFAULT '',
  created_at TEXT DEFAULT current_timestamp,
  UNIQUE(trade_id, rater_id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT DEFAULT current_timestamp
);
`);

export default db;
