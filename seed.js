// seed.js — categories + demo vendors + demo listings
const db = require('./db');
const bcrypt = require('bcryptjs');

const CATS = [
  { slug: 'cards',   name: 'Carding & CCs',           icon: '💳', sort: 1 },
  { slug: 'fullz',   name: 'Fullz & Bank Drops',      icon: '📇', sort: 2 },
  { slug: 'tax',     name: 'Tax Refund & FAFSA',      icon: '🧾', sort: 3 },
  { slug: 'spam',    name: 'Spamming Infrastructure', icon: '📨', sort: 4 },
  { slug: 'rt',      name: 'Remote Tasks & Call Ops', icon: '🎧', sort: 5 },
  { slug: 'cashout', name: 'Cashout & Drops',         icon: '💰', sort: 6 },
  { slug: 'tools',   name: 'Tools & Tutorials',       icon: '🛠️', sort: 7 },
  { slug: 'logs',    name: 'Logs & Access',           icon: '🔐', sort: 8 },
  { slug: 'id',      name: 'IDs & Docs',              icon: '🪪', sort: 9 }
];

const upsertCat = db.prepare(
  `INSERT INTO categories (slug, name, icon, sort) VALUES (?, ?, ?, ?)
   ON CONFLICT(slug) DO UPDATE SET name = excluded.name, icon = excluded.icon, sort = excluded.sort`
);
for (const c of CATS) upsertCat.run(c.slug, c.name, c.icon, c.sort);

function ensureUser(handle, password, vendor = 0) {
  let u = db.prepare(`SELECT * FROM users WHERE handle = ?`).get(handle);
  if (u) return u;
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(
    `INSERT INTO users (handle, password_hash, vendor, balance) VALUES (?, ?, ?, 0)`
  ).run(handle, hash, vendor);
  return db.prepare(`SELECT * FROM users WHERE id = ?`).get(info.lastInsertRowid);
}

const v1 = ensureUser('darkbazaar',   'hunter2!!!', 1);
const v2 = ensureUser('shadowbroker', 'hunter2!!!', 1);
const v3 = ensureUser('taxkingpin',   'hunter2!!!', 1);
const v4 = ensureUser('spamfactory',  'hunter2!!!', 1);

const LISTINGS = [
  { v: v1, cat: 'cards',   title: 'US CVV — Fresh Base (50 pack)',        subtitle: 'Non-VBV, verified live',              description: 'Fresh CVV base, US issued, 50 units. Non-VBV BINs. Live check included. Replacement for dead on arrival within 24h.', price_usd: 350,  unit: '50 pack',        stock: 42,   region: 'US', sales: 187, rating_avg: 4.8, rating_count: 96 },
  { v: v1, cat: 'cards',   title: 'EU CVV — Fullz-grade (25 pack)',       subtitle: 'Full info incl. DOB/SSN/MMN',         description: 'EU CVV with full matched info: name, address, DOB, phone, MMN. 25 units per pack. High approval BINs.',                 price_usd: 480,  unit: '25 pack',        stock: 18,   region: 'EU', sales: 94,  rating_avg: 4.6, rating_count: 41 },
  { v: v1, cat: 'cards',   title: 'Cardable Shops List — Weekly Update',  subtitle: 'Non-3DS, low fraud score',            description: 'Curated list of e-commerce shops with weak AVS, low risk scores, fast fulfillment. Updated weekly.',                     price_usd: 75,   unit: 'subscription',   stock: 999,  region: 'WW', sales: 612, rating_avg: 4.9, rating_count: 244 },
  { v: v2, cat: 'fullz',   title: 'US Fullz w/ Bank Logins — Bulk 100',   subtitle: 'Full ID + bank combo',                description: 'US fullz, matched bank login. 100 units. SSN, DOB, address history, bank username + password + security answers.',      price_usd: 1200, unit: '100 pack',       stock: 22,   region: 'US', sales: 88,  rating_avg: 4.7, rating_count: 35 },
  { v: v2, cat: 'fullz',   title: 'Bank Drops — Chime, Varo, SoFi',       subtitle: 'Pre-verified, 24h hold',              description: 'Bank drops at US regional banks. Pre-verified, ready for incoming transfers. 24-48h hold before first outbound.',         price_usd: 250,  unit: 'account',        stock: 46,   region: 'US', sales: 213, rating_avg: 4.5, rating_count: 78 },
  { v: v2, cat: 'fullz',   title: 'Business Fullz — LLC + EIN + Bank',    subtitle: 'Aged entity package',                 description: 'Aged LLC with EIN, business bank account, corporate credit file. 2-5 years seasoned. Formation docs included.',          price_usd: 2200, unit: 'package',        stock: 8,    region: 'US', sales: 31,  rating_avg: 4.8, rating_count: 14 },
  { v: v3, cat: 'tax',     title: 'Tax Refund Package — US',              subtitle: 'W2 + ID + Bank drop',                 description: 'Complete tax refund package: matched W2, government ID, SSN, bank drop. Pre-verified. Ready for e-file.',                 price_usd: 850,  unit: 'package',        stock: 35,   region: 'US', sales: 142, rating_avg: 4.6, rating_count: 61 },
  { v: v3, cat: 'tax',     title: 'FAFSA Student Aid Kit',                subtitle: 'Full identity + enrollment',          description: 'Complete FAFSA kit: full identity matching an enrolled student, tax returns, enrollment letter, bank drop.',              price_usd: 1100, unit: 'package',        stock: 19,   region: 'US', sales: 76,  rating_avg: 4.7, rating_count: 28 },
  { v: v3, cat: 'tax',     title: 'Tax Prep Software Access — Bulk API',  subtitle: 'Drake, Lacerte, ProSeries',           description: 'Bulk access to professional tax prep software APIs. Batch e-file. Rotating EFIN + PTIN included.',                        price_usd: 2400, unit: 'license',        stock: 5,    region: 'US', sales: 22,  rating_avg: 4.4, rating_count: 9 },
  { v: v4, cat: 'spam',    title: 'Bulk SMTP — High Inbox Rotation',      subtitle: 'Aged domains, DKIM/SPF',              description: 'Bulk SMTP. Aged domains, DKIM/SPF/DMARC, warmed IP rotation. 100k/month send capacity. Bounce under 3%.',                  price_usd: 450,  unit: 'month',          stock: 999,  region: 'WW', sales: 244, rating_avg: 4.6, rating_count: 88 },
  { v: v4, cat: 'spam',    title: 'Phishing Kit — 12 Templates',          subtitle: 'O365, Gmail, Coinbase, Chase…',       description: '12 phishing templates: Microsoft 365, Gmail, Coinbase, Chase, Wells Fargo, BoA, USAA, PayPal, Venmo, DHL, FedEx, IRS.',   price_usd: 320,  unit: 'kit',            stock: 999,  region: 'WW', sales: 512, rating_avg: 4.8, rating_count: 217 },
  { v: v4, cat: 'spam',    title: 'SMS Blaster — 5k/hour',                subtitle: 'Twilio bypass + SIM farm',            description: 'SMS blaster. 5k/hr. Twilio bypass path, backup SIM farm. Sender ID spoofing. Weekly rate updates.',                        price_usd: 700,  unit: 'month',          stock: 999,  region: 'WW', sales: 178, rating_avg: 4.5, rating_count: 63 },
  { v: v4, cat: 'spam',    title: 'Cold Email Infra — Full Stack',        subtitle: 'Domains + inboxes + warmup',          description: 'Complete cold email infra: 50 aged domains, 500 inboxes, warmup, reply handling, rotation controller.',                    price_usd: 1900, unit: 'setup',          stock: 999,  region: 'WW', sales: 89,  rating_avg: 4.7, rating_count: 34 },
  { v: v4, cat: 'rt',      title: 'Remote Caller Ops — Verified Team',    subtitle: '10 callers, EN/ES',                   description: 'Managed remote caller op. 10 trained callers, EN/ES, warm + cold scripts, CRM integration, call recording.',              price_usd: 3200, unit: 'month',          stock: 12,   region: 'WW', sales: 41,  rating_avg: 4.6, rating_count: 17 },
  { v: v4, cat: 'rt',      title: 'Remote VA Team — Bank Trained',        subtitle: 'US/UK accent, 20 seats',              description: 'Remote VA team with bank fraud and call center training. 20 seats, US/UK accent, warm transfer, remote desktop.',         price_usd: 2600, unit: 'month',          stock: 8,    region: 'WW', sales: 27,  rating_avg: 4.5, rating_count: 13 },
  { v: v4, cat: 'rt',      title: 'Task Runner Network — 500+ Workers',   subtitle: 'CAPTCHA, verification, KYC',          description: 'Task runner network 500+ workers across 12 countries. CAPTCHA, KYC video verify, phone verify, address confirm.',         price_usd: 40,   unit: 'per 100 tasks',  stock: 9999, region: 'WW', sales: 388, rating_avg: 4.7, rating_count: 141 },
  { v: v1, cat: 'cashout', title: 'Cashout — WU / MoneyGram',             subtitle: '20-40% fee',                          description: 'Cashout service. Western Union, MoneyGram, bank wire, crypto OTC. Fee 20-40% depending on amount. Minimum $500.',         price_usd: 500,  unit: 'per transaction', stock: 999, region: 'WW', sales: 144, rating_avg: 4.6, rating_count: 58 },
  { v: v1, cat: 'cashout', title: 'Cash App / Venmo / Zelle Drops',       subtitle: 'Aged, verified, US',                  description: 'Aged Cash App, Venmo, Zelle drops. Verified US. $250-5k per transfer safe size. Rotating inventory.',                     price_usd: 180,  unit: 'account',        stock: 62,   region: 'US', sales: 271, rating_avg: 4.7, rating_count: 108 },
  { v: v2, cat: 'cashout', title: 'Crypto OTC — 15 Countries',            subtitle: 'No KYC, 1% spread',                   description: 'OTC desk for crypto to fiat in 15 countries. No KYC either side. 1% spread XMR/BTC. Same-day settlement.',                 price_usd: 100,  unit: 'min deposit',    stock: 999,  region: 'WW', sales: 199, rating_avg: 4.8, rating_count: 82 },
  { v: v1, cat: 'tools',   title: 'ANTIDETECT Browser — 12 Profiles',     subtitle: 'Fingerprint-spoofed',                 description: 'Antidetect browser with 12 profiles. Canvas, WebGL, fonts, timezone, language randomized. Proxy manager included.',       price_usd: 260,  unit: 'license',        stock: 999,  region: 'WW', sales: 458, rating_avg: 4.8, rating_count: 194 },
  { v: v2, cat: 'tools',   title: 'OTP Bypass Suite — SMS/Call/Email',    subtitle: 'Realtime interception',               description: 'OTP bypass covering SMS, voice, email. SIM swap, SS7, SIM-box paths. Realtime panel. Updates every 2 weeks.',              price_usd: 1800, unit: 'license',        stock: 42,   region: 'WW', sales: 76,  rating_avg: 4.6, rating_count: 31 },
  { v: v2, cat: 'tools',   title: 'Fullz-to-Cash Pipeline — Auto',        subtitle: 'End-to-end automation',               description: 'End-to-end pipeline: fullz ingestion → bank drop selection → card generation → shop purchase → cashout routing.',         price_usd: 4200, unit: 'setup',          stock: 5,    region: 'WW', sales: 14,  rating_avg: 4.7, rating_count: 8 },
  { v: v2, cat: 'logs',    title: 'Stealer Logs — Fresh Daily',           subtitle: '10k+ entries/day',                    description: 'Fresh stealer logs from live infections. 10k+ entries/day. Filter by country, browser, wallet, corporate SSO.',            price_usd: 90,   unit: 'per 1k logs',    stock: 999,  region: 'WW', sales: 522, rating_avg: 4.7, rating_count: 221 },
  { v: v1, cat: 'logs',    title: 'Corporate VPN / SSO Access',           subtitle: 'Fortune 500, verified',               description: 'Verified corporate VPN and SSO access. Fortune 500 targets. Session cookies, MFA bypass note, lateral movement guide.',   price_usd: 950,  unit: 'access',         stock: 24,   region: 'WW', sales: 58,  rating_avg: 4.8, rating_count: 22 },
  { v: v1, cat: 'logs',    title: 'Email Inbox Access — Bulk',            subtitle: 'Aged, verified, WW',                  description: 'Bulk email inbox access. Aged accounts, verified, WW mix. Recovery info for lockout resistance.',                         price_usd: 60,   unit: 'per 100',        stock: 999,  region: 'WW', sales: 388, rating_avg: 4.5, rating_count: 152 },
  { v: v3, cat: 'id',      title: 'US Driver License — 30 States',        subtitle: 'Scannable, hologram',                 description: 'US DL in 30 states. Scannable, UV, hologram. Each ID ships with matching utility bill and secondary doc.',                price_usd: 220,  unit: 'ID',             stock: 84,   region: 'US', sales: 231, rating_avg: 4.6, rating_count: 91 },
  { v: v3, cat: 'id',      title: 'SSN + Card + DOB Set — Bulk',          subtitle: 'Matched US fullz core',               description: 'Bulk matched sets: SSN + card number + DOB. 500 units. US issued, verified live within 7 days.',                          price_usd: 780,  unit: '500 pack',       stock: 44,   region: 'US', sales: 144, rating_avg: 4.6, rating_count: 61 },
  { v: v3, cat: 'id',      title: 'Passport + Visa Combo — WW',           subtitle: '40+ countries',                       description: 'Passports and visa combinations from 40+ countries. Includes biometrics page and secondary support.',                     price_usd: 380,  unit: 'set',            stock: 128,  region: 'WW', sales: 167, rating_avg: 4.5, rating_count: 74 }
];

const insert = db.prepare(`
  INSERT INTO listings
    (vendor_id, category_id, title, subtitle, description, price_usd, unit, stock, region,
     ships_from, status, sales, rating_avg, rating_count)
  VALUES (?, (SELECT id FROM categories WHERE slug = ?), ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
`);

for (const l of LISTINGS) {
  const existing = db.prepare(`SELECT id FROM listings WHERE vendor_id = ? AND title = ?`).get(l.v.id, l.title);
  if (existing) continue;
  insert.run(
    l.v.id, l.cat, l.title, l.subtitle || null, l.description,
    l.price_usd, l.unit, l.stock || 100, l.region || 'WW',
    l.ships_from || 'WW', l.sales || 0, l.rating_avg || 4.6, l.rating_count || 20
  );
}

console.log('seeded', {
  users: db.prepare(`SELECT COUNT(*) c FROM users`).get().c,
  listings: db.prepare(`SELECT COUNT(*) c FROM listings`).get().c,
  categories: db.prepare(`SELECT COUNT(*) c FROM categories`).get().c
});