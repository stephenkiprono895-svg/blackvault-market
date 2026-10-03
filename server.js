// server.js — market only, no loans, no STK push
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const PLATFORM_FEE = Number(process.env.PLATFORM_FEE || 0.05);

// ---------- wallet config ----------
// Reads BINANCE_WALLET_ADDRESS first, falls back to BINANCE_ADDRESS
// (Render env var on Redz's setup uses the shorter name).
const BINANCE_WALLET_ADDRESS =
  process.env.BINANCE_WALLET_ADDRESS ||
  process.env.BINANCE_ADDRESS ||
  '';
const BINANCE_WALLET_LABEL =
  process.env.BINANCE_WALLET_LABEL ||
  'BlackVault Treasury';
const BINANCE_WALLET_NETWORK =
  process.env.BINANCE_NETWORK ||
  'Binance Smart Chain (BEP-20)';
const BINANCE_WALLET_ASSET =
  process.env.BINANCE_ASSET ||
  'USDT';
const BINANCE_WALLET_MEMO =
  process.env.BINANCE_MEMO ||
  '';

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: DATA_DIR }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 14
  }
}));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 180 });
app.use(limiter);
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40 });

// ---------- helpers ----------
function requireAuth(req, res, next) {
  if (!req.session.uid) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

function genRef(prefix = 'ORD') {
  return prefix + '-' + Date.now().toString(36).toUpperCase() + '-' +
         crypto.randomBytes(3).toString('hex').toUpperCase();
}

// ---------- wallet ----------
app.get('/api/wallet', (req, res) => {
  const addr = (BINANCE_WALLET_ADDRESS || '').trim();
  if (!addr) {
    console.warn('[wallet] no wallet address set — set BINANCE_WALLET_ADDRESS or BINANCE_ADDRESS in Render Environment');
  }
  res.json({
    address: addr,
    label: BINANCE_WALLET_LABEL,
    network: BINANCE_WALLET_NETWORK,
    asset: BINANCE_WALLET_ASSET,
    memo: BINANCE_WALLET_MEMO,
    configured: Boolean(addr)
  });
});

// ---------- auth ----------
app.post('/api/register', authLimiter, (req, res) => {
  const { handle, password, pgp_key, xmr_address } = req.body || {};
  if (!handle || !password) return res.status(400).json({ error: 'Missing fields' });
  if (!/^[a-zA-Z0-9_]{3,32}$/.test(handle)) return res.status(400).json({ error: 'Invalid handle' });
  if (password.length < 8) return res.status(400).json({ error: 'Password too short' });
  const exists = db.prepare(`SELECT id FROM users WHERE handle = ?`).get(handle);
  if (exists) return res.status(409).json({ error: 'Handle taken' });
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(
    `INSERT INTO users (handle, password_hash, pgp_key, xmr_address) VALUES (?, ?, ?, ?)`
  ).run(handle, hash, pgp_key || null, xmr_address || null);
  req.session.uid = info.lastInsertRowid;
  res.json({ ok: true, user: { id: info.lastInsertRowid, handle } });
});

app.post('/api/login', authLimiter, (req, res) => {
  const { handle, password } = req.body || {};
  if (!handle || !password) return res.status(400).json({ error: 'Missing fields' });
  const user = db.prepare(`SELECT * FROM users WHERE handle = ?`).get(handle);
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Invalid credentials' });
  req.session.uid = user.id;
  db.prepare(`UPDATE users SET last_login = datetime('now') WHERE id = ?`).run(user.id);
  res.json({ ok: true, user: { id: user.id, handle: user.handle } });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', requireAuth, (req, res) => {
  const u = db.prepare(
    `SELECT id, handle, pgp_key, xmr_address, balance, escrow_held, vendor, created_at, last_login FROM users WHERE id = ?`
  ).get(req.session.uid);
  res.json({ user: u });
});

// ---------- catalog ----------
app.get('/api/categories', (req, res) => {
  const cats = db.prepare(
    `SELECT c.*,
       (SELECT COUNT(*) FROM listings l WHERE l.category_id = c.id AND l.status = 'active') AS listing_count
     FROM categories c ORDER BY sort`
  ).all();
  res.json({ categories: cats });
});

app.get('/api/listings', (req, res) => {
  const { category, q, sort, limit = 40, offset = 0 } = req.query;
  const where = [`l.status = 'active'`];
  const params = [];
  if (category) { where.push(`c.slug = ?`); params.push(category); }
  if (q) { where.push(`(l.title LIKE ? OR l.description LIKE ?)`); params.push(`%${q}%`, `%${q}%`); }
  let order = `l.created_at DESC`;
  if (sort === 'price_asc')  order = `l.price_usd ASC`;
  if (sort === 'price_desc') order = `l.price_usd DESC`;
  if (sort === 'rating')     order = `l.rating_avg DESC, l.rating_count DESC`;
  if (sort === 'sales')      order = `l.sales DESC`;
  const sql = `
    SELECT l.*, c.slug AS cat_slug, c.name AS cat_name, u.handle AS vendor_handle
    FROM listings l
    JOIN categories c ON c.id = l.category_id
    JOIN users u ON u.id = l.vendor_id
    WHERE ${where.join(' AND ')}
    ORDER BY ${order}
    LIMIT ? OFFSET ?
  `;
  const rows = db.prepare(sql).all(...params, Number(limit), Number(offset));
  res.json({ listings: rows });
});

app.get('/api/listings/:id', (req, res) => {
  const l = db.prepare(
    `SELECT l.*, c.slug AS cat_slug, c.name AS cat_name, u.handle AS vendor_handle, u.created_at AS vendor_since
     FROM listings l
     JOIN categories c ON c.id = l.category_id
     JOIN users u ON u.id = l.vendor_id
     WHERE l.id = ?`
  ).get(req.params.id);
  if (!l) return res.status(404).json({ error: 'Not found' });
  db.prepare(`UPDATE listings SET views = views + 1 WHERE id = ?`).run(l.id);
  const reviews = db.prepare(
    `SELECT r.*, u.handle AS buyer_handle FROM reviews r
     JOIN users u ON u.id = r.buyer_id
     WHERE r.listing_id = ? ORDER BY r.created_at DESC LIMIT 20`
  ).all(l.id);
  res.json({ listing: l, reviews });
});

// ---------- orders / escrow ----------
app.post('/api/orders', requireAuth, (req, res) => {
  const { listing_id, qty = 1, buyer_note } = req.body || {};
  const l = db.prepare(`SELECT * FROM listings WHERE id = ? AND status = 'active'`).get(listing_id);
  if (!l) return res.status(404).json({ error: 'Listing not found' });
  if (l.vendor_id === req.session.uid) return res.status(400).json({ error: 'Cannot buy your own listing' });
  const n = Math.max(1, Math.min(1000, Number(qty)));
  if (l.stock < n) return res.status(400).json({ error: 'Insufficient stock' });
  const unit  = l.price_usd;
  const total = unit * n;
  const fee   = Math.round(total * PLATFORM_FEE * 100) / 100;
  const ref   = genRef('ORD');
  const tx = db.transaction(() => {
    db.prepare(`UPDATE listings SET stock = stock - ? WHERE id = ?`).run(n, l.id);
    const info = db.prepare(
      `INSERT INTO orders (ref, buyer_id, listing_id, vendor_id, qty, unit_price, total, fee, status, buyer_note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'escrow', ?)`
    ).run(ref, req.session.uid, l.id, l.vendor_id, n, unit, total, fee, buyer_note || null);
    db.prepare(`UPDATE users SET escrow_held = escrow_held + ? WHERE id = ?`).run(total, req.session.uid);
    return info.lastInsertRowid;
  });
  const id = tx();
  res.json({ ok: true, order: db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id) });
});

app.get('/api/orders', requireAuth, (req, res) => {
  const rows = db.prepare(
    `SELECT o.*, l.title, l.unit, u.handle AS vendor_handle, ub.handle AS buyer_handle
     FROM orders o
     JOIN listings l ON l.id = o.listing_id
     JOIN users u ON u.id = o.vendor_id
     JOIN users ub ON ub.id = o.buyer_id
     WHERE o.buyer_id = ? OR o.vendor_id = ?
     ORDER BY o.created_at DESC`
  ).all(req.session.uid, req.session.uid);
  res.json({ orders: rows });
});

app.get('/api/orders/:ref', requireAuth, (req, res) => {
  const o = db.prepare(
    `SELECT o.*, l.title, l.unit, u.handle AS vendor_handle, ub.handle AS buyer_handle
     FROM orders o
     JOIN listings l ON l.id = o.listing_id
     JOIN users u ON u.id = o.vendor_id
     JOIN users ub ON ub.id = o.buyer_id
     WHERE o.ref = ? AND (o.buyer_id = ? OR o.vendor_id = ?)`
  ).get(req.params.ref, req.session.uid, req.session.uid);
  if (!o) return res.status(404).json({ error: 'Not found' });
  const msgs = db.prepare(
    `SELECT m.*, u.handle AS from_handle FROM messages m
     JOIN users u ON u.id = m.from_id
     WHERE m.order_id = ? ORDER BY m.created_at ASC`
  ).all(o.id);
  res.json({ order: o, messages: msgs });
});

app.post('/api/orders/:ref/messages', requireAuth, (req, res) => {
  const o = db.prepare(
    `SELECT * FROM orders WHERE ref = ? AND (buyer_id = ? OR vendor_id = ?)`
  ).get(req.params.ref, req.session.uid, req.session.uid);
  if (!o) return res.status(404).json({ error: 'Not found' });
  const { body } = req.body || {};
  if (!body || !body.trim()) return res.status(400).json({ error: 'Empty' });
  const to_id = o.buyer_id === req.session.uid ? o.vendor_id : o.buyer_id;
  const info = db.prepare(
    `INSERT INTO messages (order_id, from_id, to_id, body) VALUES (?, ?, ?, ?)`
  ).run(o.id, req.session.uid, to_id, body.trim());
  res.json({ ok: true, message: db.prepare(`SELECT * FROM messages WHERE id = ?`).get(info.lastInsertRowid) });
});

app.post('/api/orders/:ref/release', requireAuth, (req, res) => {
  const o = db.prepare(
    `SELECT * FROM orders WHERE ref = ? AND buyer_id = ?`
  ).get(req.params.ref, req.session.uid);
  if (!o) return res.status(404).json({ error: 'Not found' });
  if (o.status !== 'escrow') return res.status(400).json({ error: 'Not in escrow' });
  const vendor_cut = Math.round((o.total - o.fee) * 100) / 100;
  const tx = db.transaction(() => {
    db.prepare(`UPDATE users SET escrow_held = escrow_held - ? WHERE id = ?`).run(o.total, o.buyer_id);
    db.prepare(`UPDATE users SET balance = balance + ? WHERE id = ?`).run(vendor_cut, o.vendor_id);
    db.prepare(`UPDATE listings SET sales = sales + ? WHERE id = ?`).run(o.qty, o.listing_id);
    db.prepare(`UPDATE orders SET status = 'released', released_at = datetime('now') WHERE id = ?`).run(o.id);
  });
  tx();
  res.json({ ok: true });
});

app.post('/api/orders/:ref/dispute', requireAuth, (req, res) => {
  const o = db.prepare(
    `SELECT * FROM orders WHERE ref = ? AND (buyer_id = ? OR vendor_id = ?)`
  ).get(req.params.ref, req.session.uid, req.session.uid);
  if (!o) return res.status(404).json({ error: 'Not found' });
  if (o.status !== 'escrow') return res.status(400).json({ error: 'Not in escrow' });
  db.prepare(`UPDATE orders SET status = 'disputed' WHERE id = ?`).run(o.id);
  res.json({ ok: true });
});

app.post('/api/orders/:ref/review', requireAuth, (req, res) => {
  const o = db.prepare(
    `SELECT * FROM orders WHERE ref = ? AND buyer_id = ?`
  ).get(req.params.ref, req.session.uid);
  if (!o) return res.status(404).json({ error: 'Not found' });
  if (o.status !== 'released') return res.status(400).json({ error: 'Order not released' });
  const { stars, body } = req.body || {};
  const s = Math.max(1, Math.min(5, Number(stars) || 5));
  try {
    db.prepare(
      `INSERT INTO reviews (listing_id, order_id, buyer_id, stars, body) VALUES (?, ?, ?, ?, ?)`
    ).run(o.listing_id, o.id, req.session.uid, s, body || null);
  } catch {
    return res.status(409).json({ error: 'Already reviewed' });
  }
  const agg = db.prepare(`SELECT AVG(stars) a, COUNT(*) c FROM reviews WHERE listing_id = ?`).get(o.listing_id);
  db.prepare(`UPDATE listings SET rating_avg = ?, rating_count = ? WHERE id = ?`)
    .run(Math.round(agg.a * 10) / 10, agg.c, o.listing_id);
  res.json({ ok: true });
});

// ---------- vendor ----------
app.post('/api/vendor/listings', requireAuth, (req, res) => {
  const u = db.prepare(`SELECT vendor FROM users WHERE id = ?`).get(req.session.uid);
  if (!u?.vendor) return res.status(403).json({ error: 'Not a vendor' });
  const { category_slug, title, subtitle, description, price_usd, unit, stock, region } = req.body || {};
  if (!title || !description || !price_usd) return res.status(400).json({ error: 'Missing fields' });
  const cat = db.prepare(`SELECT id FROM categories WHERE slug = ?`).get(category_slug);
  if (!cat) return res.status(400).json({ error: 'Unknown category' });
  const info = db.prepare(
    `INSERT INTO listings (vendor_id, category_id, title, subtitle, description, price_usd, unit, stock, region)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(req.session.uid, cat.id, title, subtitle || null, description, Number(price_usd),
        unit || 'unit', Number(stock) || 1, region || 'WW');
  res.json({ ok: true, id: info.lastInsertRowid });
});

// ---------- stats ----------
app.get('/api/stats', (req, res) => {
  const lc = db.prepare(`SELECT COUNT(*) c FROM listings WHERE status = 'active'`).get().c;
  const vc = db.prepare(`SELECT COUNT(*) c FROM users WHERE vendor = 1`).get().c;
  const oc = db.prepare(`SELECT COUNT(*) c FROM orders`).get().c;
  const vol = db.prepare(`SELECT COALESCE(SUM(total),0) v FROM orders WHERE status = 'released'`).get().v;
  res.json({ listings: lc, vendors: vc, orders: oc, volume: vol });
});

// ---------- SPA fallback ----------
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`market on http://localhost:${PORT}`));
