// db.js — SQLite schema
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'market.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  handle        TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  pgp_key       TEXT,
  xmr_address   TEXT,
  balance       REAL NOT NULL DEFAULT 0,
  escrow_held   REAL NOT NULL DEFAULT 0,
  vendor        INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_login    TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  slug  TEXT UNIQUE NOT NULL,
  name  TEXT NOT NULL,
  icon  TEXT,
  sort  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS listings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id     INTEGER NOT NULL REFERENCES users(id),
  category_id   INTEGER NOT NULL REFERENCES categories(id),
  title         TEXT NOT NULL,
  subtitle      TEXT,
  description   TEXT NOT NULL,
  price_usd     REAL NOT NULL,
  unit          TEXT NOT NULL DEFAULT 'unit',
  stock         INTEGER NOT NULL DEFAULT 0,
  region        TEXT,
  ships_from    TEXT,
  status        TEXT NOT NULL DEFAULT 'active',
  views         INTEGER NOT NULL DEFAULT 0,
  sales         INTEGER NOT NULL DEFAULT 0,
  rating_avg    REAL NOT NULL DEFAULT 0,
  rating_count  INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_listings_cat ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_vendor ON listings(vendor_id);

CREATE TABLE IF NOT EXISTS orders (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  ref           TEXT UNIQUE NOT NULL,
  buyer_id      INTEGER NOT NULL REFERENCES users(id),
  listing_id    INTEGER NOT NULL REFERENCES listings(id),
  vendor_id     INTEGER NOT NULL REFERENCES users(id),
  qty           INTEGER NOT NULL DEFAULT 1,
  unit_price    REAL NOT NULL,
  total         REAL NOT NULL,
  fee           REAL NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'escrow',
  escrow_note   TEXT,
  buyer_note    TEXT,
  delivery_blob TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  released_at   TEXT
);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor ON orders(vendor_id);

CREATE TABLE IF NOT EXISTS messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER REFERENCES orders(id),
  from_id     INTEGER NOT NULL REFERENCES users(id),
  to_id       INTEGER NOT NULL REFERENCES users(id),
  body        TEXT NOT NULL,
  read        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_msg_thread ON messages(order_id);
CREATE INDEX IF NOT EXISTS idx_msg_to ON messages(to_id);

CREATE TABLE IF NOT EXISTS reviews (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id  INTEGER NOT NULL REFERENCES listings(id),
  order_id    INTEGER NOT NULL REFERENCES orders(id),
  buyer_id    INTEGER NOT NULL REFERENCES users(id),
  stars       INTEGER NOT NULL,
  body        TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(order_id)
);
`);

module.exports = db;