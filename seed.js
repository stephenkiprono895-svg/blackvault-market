// seed.js — categories, vendors, listings
const db = require('./db');
const bcrypt = require('bcryptjs');

const CATS = [
  { slug: 'cards',     name: 'Carding & CCs',           icon: '💳', sort: 1 },
  { slug: 'fullz',     name: 'Fullz & Bank Drops',      icon: '📇', sort: 2 },
  { slug: 'tax',       name: 'Tax Refund & FAFSA',      icon: '🧾', sort: 3 },
  { slug: 'loans',     name: 'SBA & UI Loans',          icon: '🏦', sort: 4 },
  { slug: 'spam',      name: 'Spamming Infrastructure', icon: '📨', sort: 5 },
  { slug: 'rt',        name: 'Remote Tasks & Call Ops', icon: '🎧', sort: 6 },
  { slug: 'cashout',   name: 'Cashout & Drops',         icon: '💰', sort: 7 },
  { slug: 'tools',     name: 'Tools & Tutorials',       icon: '🛠️', sort: 8 },
  { slug: 'logs',      name: 'Logs & Access',           icon: '🔐', sort: 9 },
  { slug: 'id',        name: 'IDs & Docs',              icon: '🪪', sort: 10 },
  { slug: 'crypto',    name: 'Crypto & Wallets',        icon: '₿',  sort: 11 },
  { slug: 'malware',   name: 'Malware & Loaders',       icon: '☣️', sort: 12 },
  { slug: 'guides',    name: 'Guides & Courses',        icon: '📚', sort: 13 }
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

const v1 = ensureUser('darkbazaar',    'hunter2!!!', 1);
const v2 = ensureUser('shadowbroker',  'hunter2!!!', 1);
const v3 = ensureUser('taxkingpin',    'hunter2!!!', 1);
const v4 = ensureUser('spamfactory',   'hunter2!!!', 1);
const v5 = ensureUser('cryptovault',   'hunter2!!!', 1);
const v6 = ensureUser('zero_day',      'hunter2!!!', 1);

const LISTINGS = [
  // ─── CARDS ───────────────────────────────────────────
  { v: v1, cat: 'cards', title: 'US CVV — Fresh Base (50 pack)', subtitle: 'Non-VBV, verified live',
    description: 'Fresh CVV base, US issued. 50 units per pack. Non-VBV BINs only. Every card checked live against issuer before pack ships. Dead-on-arrival replaced within 24 hours.',
    price_usd: 420, unit: '50 pack', stock: 42, region: 'US', sales: 187, rating_avg: 4.8, rating_count: 96 },
  { v: v1, cat: 'cards', title: 'EU CVV — Fullz-grade (25 pack)', subtitle: 'Full info: DOB, SSN, MMN',
    description: 'EU CVV with full matched info — name, address, DOB, phone, MMN. 25 units. High-approval BINs preferred by EU processors.',
    price_usd: 560, unit: '25 pack', stock: 18, region: 'EU', sales: 94, rating_avg: 4.6, rating_count: 41 },
  { v: v1, cat: 'cards', title: 'Cardable Shops List — Weekly', subtitle: 'Non-3DS, low fraud score',
    description: 'Curated list of e-commerce shops with weak AVS, low fraud score, fast fulfillment. Includes recommended BIN per shop, proxy notes, and success-rate history.',
    price_usd: 120, unit: 'subscription', stock: 999, region: 'WW', sales: 612, rating_avg: 4.9, rating_count: 244 },
  { v: v1, cat: 'cards', title: 'Fullz + CVV Combo — 20 pack', subtitle: 'Matched card and identity',
    description: 'Card number matched to full identity: SSN, DOB, address, phone. 20 units. Best for shops requiring AVS and CVV together.',
    price_usd: 680, unit: '20 pack', stock: 27, region: 'US', sales: 122, rating_avg: 4.7, rating_count: 58 },

  // ─── FULLZ ───────────────────────────────────────────
  { v: v2, cat: 'fullz', title: 'US Fullz w/ Bank Login — Bulk 100', subtitle: 'Full ID + bank combo',
    description: 'US fullz with matched bank login. 100 units. SSN, DOB, address history, bank username, password, and security answers. Verified within 7 days.',
    price_usd: 1450, unit: '100 pack', stock: 22, region: 'US', sales: 88, rating_avg: 4.7, rating_count: 35 },
  { v: v2, cat: 'fullz', title: 'Bank Drops — Chime / Varo / SoFi', subtitle: 'Pre-verified, 24h hold',
    description: 'Bank drops at US regional banks. Chime, Varo, SoFi, Current. Pre-verified, ready for incoming transfers. 24-48h hold before first outbound.',
    price_usd: 320, unit: 'account', stock: 46, region: 'US', sales: 213, rating_avg: 4.5, rating_count: 78 },
  { v: v2, cat: 'fullz', title: 'Business Fullz — LLC + EIN + Bank', subtitle: 'SBA-ready package',
    description: 'Aged LLC with EIN, business bank account, corporate credit file. 2-5 years seasoned. Formation docs included. Perfect base for loan apps.',
    price_usd: 2400, unit: 'package', stock: 8, region: 'US', sales: 31, rating_avg: 4.8, rating_count: 14 },
  { v: v2, cat: 'fullz', title: 'Fullz — Aged 65+ (10 pack)', subtitle: 'Senior-tier identity',
    description: 'Aged fullz, 65+ demographic. Clean credit history, high approval rates on credit products. 10 units per pack.',
    price_usd: 420, unit: '10 pack', stock: 35, region: 'US', sales: 156, rating_avg: 4.6, rating_count: 71 },
  { v: v2, cat: 'fullz', title: 'Healthcare Fullz — Insurance Match', subtitle: 'Insurance + medical',
    description: 'Fullz with active healthcare insurance information. Includes member ID, policy details, provider network. 5 units per pack.',
    price_usd: 550, unit: '5 pack', stock: 22, region: 'US', sales: 68, rating_avg: 4.5, rating_count: 29 },

  // ─── TAX ─────────────────────────────────────────────
  { v: v3, cat: 'tax', title: 'Tax Refund Package — US (Single)', subtitle: 'W2 + ID + Bank drop',
    description: 'Complete tax refund package. Matched W2, government ID, SSN, bank drop. Pre-verified. Ready for e-file. Includes refund status check tool.',
    price_usd: 950, unit: 'package', stock: 35, region: 'US', sales: 142, rating_avg: 4.6, rating_count: 61 },
  { v: v3, cat: 'tax', title: 'FAFSA Student Aid Kit', subtitle: 'Full identity + enrollment',
    description: 'Complete FAFSA kit. Full identity matching an enrolled student, tax returns, enrollment verification letter, bank drop. Refund routed to drop on disbursement.',
    price_usd: 1250, unit: 'package', stock: 19, region: 'US', sales: 76, rating_avg: 4.7, rating_count: 28 },
  { v: v3, cat: 'tax', title: 'Tax Prep Software Access — Bulk API', subtitle: 'Drake, Lacerte, ProSeries',
    description: 'Bulk access to professional tax prep software APIs. Enables batch e-file from multiple prepared returns. Rotating EFIN + PTIN included.',
    price_usd: 2650, unit: 'license', stock: 5, region: 'US', sales: 22, rating_avg: 4.4, rating_count: 9 },
  { v: v3, cat: 'tax', title: 'Tax Refund Package — Bulk 5', subtitle: '5 complete sets',
    description: 'Five complete tax refund packages. Matched identities, W2s, and bank drops. Bulk discount applied. Ready for batch e-file.',
    price_usd: 3900, unit: '5 pack', stock: 12, region: 'US', sales: 41, rating_avg: 4.7, rating_count: 18 },

  // ─── LOANS ───────────────────────────────────────────
  { v: v2, cat: 'loans', title: 'SBA Loan Fraud Kit — Full Pipeline', subtitle: 'Aged entity + bank + docs',
    description: 'Complete SBA loan pipeline. Aged entity, EIN, business bank account, forged tax returns (3 years), forged financials, forged lease. Application automation script included.',
    price_usd: 3950, unit: 'kit', stock: 6, region: 'US', sales: 18, rating_avg: 4.8, rating_count: 11 },
  { v: v3, cat: 'loans', title: 'UI Claim Bundle — Multi-State', subtitle: 'Identity + employment match',
    description: 'Unemployment insurance claim bundle. Identity matched to employment history in 5 states. Automated claim filing via state portal. Direct deposit to your drop.',
    price_usd: 780, unit: 'package', stock: 40, region: 'US', sales: 189, rating_avg: 4.5, rating_count: 72 },
  { v: v3, cat: 'loans', title: 'PPP / EIDL Legacy Package', subtitle: 'Recovered accounts',
    description: 'Recovered PPP / EIDL accounts from archived portfolios. Accounts dormant and reactivatable. Includes original application + documentation package.',
    price_usd: 1650, unit: 'package', stock: 11, region: 'US', sales: 44, rating_avg: 4.3, rating_count: 19 },
  { v: v3, cat: 'loans', title: 'Personal Loan Application Kit', subtitle: 'Complete doc set',
    description: 'Personal loan application package. Matched identity, pay stubs, employment verification, tax returns. Works with most online lenders.',
    price_usd: 620, unit: 'kit', stock: 55, region: 'US', sales: 211, rating_avg: 4.6, rating_count: 89 },

  // ─── SPAM ────────────────────────────────────────────
  { v: v4, cat: 'spam', title: 'Bulk SMTP — High Inbox Rotation', subtitle: 'Aged domains, DKIM/SPF',
    description: 'Bulk SMTP service. Aged domains, DKIM/SPF/DMARC configured, warmed IP rotation. 100k/month send capacity. Bounce under 3%.',
    price_usd: 520, unit: 'month', stock: 999, region: 'WW', sales: 244, rating_avg: 4.6, rating_count: 88 },
  { v: v4, cat: 'spam', title: 'Phishing Kit — 12 Templates', subtitle: 'O365, Gmail, Coinbase, Chase…',
    description: '12 phishing landing page templates. Microsoft 365, Google Workspace, Coinbase, Chase, Wells Fargo, BoA, USAA, PayPal, Venmo, DHL, FedEx, IRS. Each with capture + redirect, admin panel, 2FA proxying.',
    price_usd: 380, unit: 'kit', stock: 999, region: 'WW', sales: 512, rating_avg: 4.8, rating_count: 217 },
  { v: v4, cat: 'spam', title: 'SMS Blaster — 5k/hour', subtitle: 'Twilio bypass + SIM farm',
    description: 'SMS blaster service. 5k messages/hour. Twilio bypass path, backup SIM farm path. Sender ID spoofing. Delivery reports. Weekly rate updates.',
    price_usd: 780, unit: 'month', stock: 999, region: 'WW', sales: 178, rating_avg: 4.5, rating_count: 63 },
  { v: v4, cat: 'spam', title: 'Cold Email Infra — Full Stack', subtitle: 'Domains + inboxes + warmup',
    description: 'Complete cold email infrastructure. 50 aged domains, 500 inboxes, automated warmup, reply handling, rotation controller. Ready for outbound at scale.',
    price_usd: 2100, unit: 'setup', stock: 999, region: 'WW', sales: 89, rating_avg: 4.7, rating_count: 34 },
  { v: v4, cat: 'spam', title: 'Call Bombing Service', subtitle: 'Voice flood, 500/min',
    description: 'Voice flood service targeting a specified number. 500 calls/min sustained. Rotating caller IDs. Weekly caps adjust to load.',
    price_usd: 220, unit: 'per hour', stock: 999, region: 'WW', sales: 301, rating_avg: 4.4, rating_count: 118 },
  { v: v4, cat: 'spam', title: 'Email Bombing Kit', subtitle: 'Subscription floods',
    description: 'Subscription-flood email bomber. Target inbox gets thousands of legit confirmation emails per hour. Includes curated signup list.',
    price_usd: 260, unit: 'kit', stock: 999, region: 'WW', sales: 187, rating_avg: 4.5, rating_count: 74 },

  // ─── REMOTE TASKS ────────────────────────────────────
  { v: v4, cat: 'rt', title: 'Remote Caller Ops — Verified Team', subtitle: '10 callers, EN/ES',
    description: 'Managed remote caller operation. 10 trained callers, fluent EN/ES, warm + cold scripts, CRM integration, call recording. Inbound and outbound.',
    price_usd: 3400, unit: 'month', stock: 12, region: 'WW', sales: 41, rating_avg: 4.6, rating_count: 17 },
  { v: v4, cat: 'rt', title: 'Remote VA Team — Bank Trained', subtitle: 'US/UK accent, 20 seats',
    description: 'Remote virtual assistant team with bank fraud and call center training. 20 seats, US/UK accent, warm transfer capable, screen-share ops, remote desktop access.',
    price_usd: 2850, unit: 'month', stock: 8, region: 'WW', sales: 27, rating_avg: 4.5, rating_count: 13 },
  { v: v4, cat: 'rt', title: 'Task Runner Network — 500+ Workers', subtitle: 'CAPTCHA, verification, KYC',
    description: 'Task runner network with 500+ micro-workers distributed across 12 countries. Handles CAPTCHA, KYC video verification, phone verification, address confirmation. Per-task pricing.',
    price_usd: 75, unit: 'per 100 tasks', stock: 9999, region: 'WW', sales: 388, rating_avg: 4.7, rating_count: 141 },
  { v: v4, cat: 'rt', title: 'Bulk Account Verification Service', subtitle: 'Bank + email + phone',
    description: 'Bulk verification service. Bank micro-deposits, email OTP, phone OTP, SMS confirmation. Batch up to 1000 per order. 24h turnaround.',
    price_usd: 180, unit: 'per 1k', stock: 999, region: 'WW', sales: 156, rating_avg: 4.6, rating_count: 62 },

  // ─── CASHOUT ─────────────────────────────────────────
  { v: v1, cat: 'cashout', title: 'Cashout — WU / MoneyGram', subtitle: '20-40% fee',
    description: 'Cashout service for carding and ATO proceeds. Western Union, MoneyGram, bank wire, crypto OTC. Fee 20-40% depending on amount and destination. Minimum $500.',
    price_usd: 500, unit: 'per transaction', stock: 999, region: 'WW', sales: 144, rating_avg: 4.6, rating_count: 58 },
  { v: v1, cat: 'cashout', title: 'Cash App / Venmo / Zelle Drops', subtitle: 'Aged, verified, US',
    description: 'Aged Cash App, Venmo, and Zelle drops. Verified US. Ready for incoming transfers. $250-5k per transfer safe size. Rotating inventory.',
    price_usd: 240, unit: 'account', stock: 62, region: 'US', sales: 271, rating_avg: 4.7, rating_count: 108 },
  { v: v5, cat: 'cashout', title: 'Crypto OTC — 15 Countries', subtitle: 'No KYC, 1% spread',
    description: 'OTC desk for crypto to fiat in 15 countries. No KYC on either side. 1% spread XMR/BTC. Same-day settlement to local bank or cash pickup.',
    price_usd: 150, unit: 'min deposit', stock: 999, region: 'WW', sales: 199, rating_avg: 4.8, rating_count: 82 },
  { v: v1, cat: 'cashout', title: 'Gift Card Cashout Service', subtitle: 'Amazon, Apple, Steam',
    description: 'Gift card liquidation. Accepts Amazon, Apple, Steam, Google Play, Walmart. 55-70% payout depending on card and current rate. Volume rates available.',
    price_usd: 100, unit: 'min order', stock: 999, region: 'WW', sales: 388, rating_avg: 4.5, rating_count: 152 },

  // ─── TOOLS ───────────────────────────────────────────
  { v: v1, cat: 'tools', title: 'ANTIDETECT Browser — 12 Profiles', subtitle: 'Fingerprint-spoofed',
    description: 'Antidetect browser with 12 pre-configured profiles. Canvas, WebGL, fonts, timezone, language all randomized. Proxy manager included. Works with any HTTP/SOCKS5.',
    price_usd: 300, unit: 'license', stock: 999, region: 'WW', sales: 458, rating_avg: 4.8, rating_count: 194 },
  { v: v6, cat: 'tools', title: 'OTP Bypass Suite — SMS/Call/Email', subtitle: 'Realtime interception',
    description: 'OTP bypass suite covering SMS, voice call, and email OTP. SIM swap, SS7, and SIM-box paths included. Realtime interception panel. Updates every 2 weeks.',
    price_usd: 1950, unit: 'license', stock: 42, region: 'WW', sales: 76, rating_avg: 4.6, rating_count: 31 },
  { v: v6, cat: 'tools', title: 'Fullz-to-Cash Pipeline — Auto', subtitle: 'End-to-end automation',
    description: 'End-to-end pipeline. Fullz ingestion → bank drop selection → card generation → shop purchase → cashout routing. Configurable per vertical. Includes monitoring dashboard.',
    price_usd: 4300, unit: 'setup', stock: 5, region: 'WW', sales: 14, rating_avg: 4.7, rating_count: 8 },
  { v: v1, cat: 'tools', title: 'Proxy Pack — Residential, 5 Countries', subtitle: 'Rotating, sticky option',
    description: 'Residential proxy pack covering 5 countries. Rotating and sticky options. 50 GB traffic included. SOCKS5 and HTTP.',
    price_usd: 210, unit: 'month', stock: 999, region: 'WW', sales: 344, rating_avg: 4.6, rating_count: 128 },
  { v: v1, cat: 'tools', title: 'Fingerprint Spoofer — Standalone', subtitle: 'Windows 10/11',
    description: 'Standalone fingerprint spoofer for Windows. Bypasses Canvas, WebGL, AudioContext, fonts, and screen metrics. Kernel-level option available.',
    price_usd: 260, unit: 'license', stock: 999, region: 'WW', sales: 267, rating_avg: 4.7, rating_count: 102 },
  { v: v6, cat: 'tools', title: 'Bulk Email Validator', subtitle: '1M/day throughput',
    description: 'Email validation tool. 1M addresses/day throughput. SMTP-level verification, catch-all detection, role-account filtering. API access included.',
    price_usd: 195, unit: 'month', stock: 999, region: 'WW', sales: 178, rating_avg: 4.5, rating_count: 71 },

  // ─── LOGS ────────────────────────────────────────────
  { v: v2, cat: 'logs', title: 'Stealer Logs — Fresh Daily', subtitle: '10k+ entries/day',
    description: 'Fresh stealer logs from live infections. 10k+ entries per day. Filter by country, browser, crypto wallet presence, corporate SSO. Bulk and single-log pricing.',
    price_usd: 130, unit: 'per 1k logs', stock: 999, region: 'WW', sales: 522, rating_avg: 4.7, rating_count: 221 },
  { v: v2, cat: 'logs', title: 'Corporate VPN / SSO Access', subtitle: 'Fortune 500, verified',
    description: 'Verified corporate VPN and SSO access. Fortune 500 targets. Each access includes session cookies, MFA bypass note, and lateral movement guide. Rotating stock.',
    price_usd: 1150, unit: 'access', stock: 24, region: 'WW', sales: 58, rating_avg: 4.8, rating_count: 22 },
  { v: v2, cat: 'logs', title: 'Email Inbox Access — Bulk', subtitle: 'Aged, verified, WW',
    description: 'Bulk email inbox access. Aged accounts, verified, worldwide mix. Includes recovery info for lockout resistance. Filter by domain, age, and services.',
    price_usd: 95, unit: 'per 100', stock: 999, region: 'WW', sales: 388, rating_avg: 4.5, rating_count: 152 },
  { v: v2, cat: 'logs', title: 'Crypto Wallet Logs — Bulk', subtitle: 'Seed + keystore',
    description: 'Crypto wallet logs. Includes seed phrase, keystore file, password, and wallet type. Filter by balance range. 100 units per pack.',
    price_usd: 420, unit: '100 pack', stock: 42, region: 'WW', sales: 187, rating_avg: 4.6, rating_count: 78 },

  // ─── IDs ─────────────────────────────────────────────
  { v: v3, cat: 'id', title: 'US Driver License — 30 States', subtitle: 'Scannable, hologram',
    description: 'US driver licenses in 30 states. Scannable, UV, hologram. Each ID ships with matching utility bill and secondary doc. Stealth shipping worldwide.',
    price_usd: 260, unit: 'ID', stock: 84, region: 'US', sales: 231, rating_avg: 4.6, rating_count: 91 },
  { v: v3, cat: 'id', title: 'SSN + Card + DOB Set — Bulk', subtitle: 'Matched US fullz core',
    description: 'Bulk matched sets. SSN, card number, DOB. 500 units per pack. US issued, verified live within 7 days. Replacement for dead on arrival.',
    price_usd: 890, unit: '500 pack', stock: 44, region: 'US', sales: 144, rating_avg: 4.6, rating_count: 61 },
  { v: v3, cat: 'id', title: 'Passport + Visa Combo — WW', subtitle: '40+ countries',
    description: 'Passports and visa combinations from 40+ countries. Includes biometrics page and secondary support. Stealth WW shipping.',
    price_usd: 420, unit: 'set', stock: 128, region: 'WW', sales: 167, rating_avg: 4.5, rating_count: 74 },
  { v: v3, cat: 'id', title: 'Utility Bill Generator — Any State', subtitle: 'PDF + print-ready',
    description: 'Utility bill generator covering all 50 US states. Address lookup included. PDF and print-ready output. Matches any name and address.',
    price_usd: 140, unit: 'license', stock: 999, region: 'US', sales: 244, rating_avg: 4.7, rating_count: 98 },

  // ─── CRYPTO ──────────────────────────────────────────
  { v: v5, cat: 'crypto', title: 'Crypto Wallet — Pre-funded', subtitle: 'Multiple chains',
    description: 'Pre-funded crypto wallets. BTC, ETH, USDT, XMR. Balances vary from $200 to $2000 depending on tier. Delivery includes seed phrase and private key.',
    price_usd: 650, unit: 'wallet', stock: 38, region: 'WW', sales: 98, rating_avg: 4.5, rating_count: 42 },
  { v: v5, cat: 'crypto', title: 'KYC-Verified Exchange Accounts', subtitle: 'Binance, Kraken, Coinbase',
    description: 'Fully KYC-verified exchange accounts. Binance, Kraken, Coinbase, KuCoin. Includes ID docs, selfie verification, and bank linking. Aged 3-12 months.',
    price_usd: 780, unit: 'account', stock: 46, region: 'WW', sales: 133, rating_avg: 4.7, rating_count: 56 },
  { v: v5, cat: 'crypto', title: 'USDT Laundry Service', subtitle: 'Tumbling + mixing',
    description: 'USDT and BTC laundry service. Mixing, tumbling, chain-hopping. Output to fresh wallets with no on-chain linkage. 3-8% fee depending on volume.',
    price_usd: 200, unit: 'min deposit', stock: 999, region: 'WW', sales: 122, rating_avg: 4.5, rating_count: 51 },
  { v: v5, cat: 'crypto', title: 'NFT Wash Trading Bot', subtitle: 'Multi-marketplace',
    description: 'NFT wash trading bot supporting OpenSea, Blur, LooksRare, Rarible. Volume generation, price manipulation, and floor management strategies.',
    price_usd: 550, unit: 'license', stock: 999, region: 'WW', sales: 87, rating_avg: 4.4, rating_count: 34 },

  // ─── MALWARE ─────────────────────────────────────────
  { v: v6, cat: 'malware', title: 'Stealer — Windows Build', subtitle: 'Browser + crypto + FTP',
    description: 'Windows stealer. Browsers (Chrome, Firefox, Edge, Brave, Opera), crypto wallets (20+ types), FTP clients, Discord tokens, Telegram sessions. FUD option available.',
    price_usd: 480, unit: 'build', stock: 999, region: 'WW', sales: 312, rating_avg: 4.6, rating_count: 131 },
  { v: v6, cat: 'malware', title: 'RAT — Cross-Platform', subtitle: 'Win / Mac / Linux',
    description: 'Remote access tool. Full remote control, keylogging, screen capture, webcam, file transfer, persistence. Win / Mac / Linux builds. Encrypted C2.',
    price_usd: 720, unit: 'license', stock: 999, region: 'WW', sales: 189, rating_avg: 4.7, rating_count: 84 },
  { v: v6, cat: 'malware', title: 'Ransomware — Custom Build', subtitle: 'AES-256 + RSA-4096',
    description: 'Custom ransomware builder. AES-256 file encryption, RSA-4096 key exchange, shadow copy deletion, extension targeting, ransom note templating. Tor payment portal included.',
    price_usd: 2650, unit: 'build', stock: 42, region: 'WW', sales: 41, rating_avg: 4.5, rating_count: 18 },
  { v: v6, cat: 'malware', title: 'Cryptominer — Silent Install', subtitle: 'XMR, cross-platform',
    description: 'Silent XMR miner. CPU/GPU hybrid. Windows / Linux installers. Persistence and watchdog included. Configurable pool and wallet.',
    price_usd: 340, unit: 'license', stock: 999, region: 'WW', sales: 178, rating_avg: 4.5, rating_count: 72 },
  { v: v6, cat: 'malware', title: 'Loader — Windows Defender Bypass', subtitle: 'FUD, signed',
    description: 'FUD loader for Windows. Signed certificate, Defender bypass, AMSI patch, ETW patch. Loads arbitrary payloads into memory. Support included.',
    price_usd: 1550, unit: 'license', stock: 88, region: 'WW', sales: 92, rating_avg: 4.6, rating_count: 39 },

  // ─── GUIDES ──────────────────────────────────────────
  { v: v6, cat: 'guides', title: 'Carding Masterclass — Video Course', subtitle: '12 hours, EN/ES',
    description: 'Full carding masterclass. 12 hours of video content. Covers BINs, carding shops, cashout, OPSEC. English and Spanish narration. Lifetime access.',
    price_usd: 480, unit: 'course', stock: 999, region: 'WW', sales: 234, rating_avg: 4.7, rating_count: 98 },
  { v: v6, cat: 'guides', title: 'SBA Loan Application Playbook', subtitle: 'Step-by-step, updated',
    description: 'Complete SBA loan application playbook. Document templates, application timeline, bank selection criteria, common rejection pitfalls. Updated quarterly.',
    price_usd: 890, unit: 'guide', stock: 999, region: 'US', sales: 76, rating_avg: 4.6, rating_count: 33 },
  { v: v6, cat: 'guides', title: 'Crypto Mixing & Laundering Guide', subtitle: 'On-chain OPSEC',
    description: 'Comprehensive crypto laundry guide. Chain-hopping, tumblers, DEX swaps, cross-chain bridges. On-chain OPSEC best practices. Includes live examples.',
    price_usd: 550, unit: 'guide', stock: 999, region: 'WW', sales: 122, rating_avg: 4.7, rating_count: 55 },
  { v: v6, cat: 'guides', title: 'OPSEC Pack — Tor, VPN, Qubes', subtitle: 'Full setup walkthrough',
    description: 'Complete OPSEC pack. Tor configuration, VPN chaining, Qubes OS setup, encrypted messaging, dead-man switches. Includes scripts and configs.',
    price_usd: 340, unit: 'guide', stock: 999, region: 'WW', sales: 201, rating_avg: 4.8, rating_count: 87 }
];

const insert = db.prepare(`
  INSERT INTO listings
    (vendor_id, category_id, title, subtitle, description, price_usd, unit, stock, region,
     ships_from, status, sales, rating_avg, rating_count)
  VALUES (?, (SELECT id FROM categories WHERE slug = ?), ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
`);

let added = 0;
for (const l of LISTINGS) {
  const existing = db.prepare(
    `SELECT id FROM listings WHERE vendor_id = ? AND title = ?`
  ).get(l.v.id, l.title);
  if (existing) continue;
  insert.run(
    l.v.id, l.cat, l.title, l.subtitle || null, l.description,
    l.price_usd, l.unit, l.stock || 100, l.region || 'WW',
    l.ships_from || 'WW', l.sales || 0, l.rating_avg || 4.6, l.rating_count || 20
  );
  added++;
}

console.log('seeded', {
  added,
  users: db.prepare(`SELECT COUNT(*) c FROM users`).get().c,
  listings: db.prepare(`SELECT COUNT(*) c FROM listings`).get().c,
  categories: db.prepare(`SELECT COUNT(*) c FROM categories`).get().c
});
