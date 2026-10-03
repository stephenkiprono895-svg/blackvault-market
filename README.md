# BlackVault Market

A full-stack underground marketplace with escrow, wallet popup, and darkweb styling.
Node.js + Express + SQLite. Single-file backend. No build step.

---

## What it is

A marketplace where vendors list products under fixed categories, buyers place orders
into escrow, and funds release only after the buyer confirms delivery. Payments are
routed through a Binance wallet shown to every visitor via QR popup.

Categories included:

- Carding & CCs
- Fullz & Bank Drops
- Tax Refund & FAFSA
- SBA & UI Loans
- Spamming Infrastructure
- Remote Tasks & Call Ops
- Cashout & Drops
- Tools & Tutorials
- Logs & Access
- IDs & Docs

Every listing has a price, a unit, stock count, and vendor handle. All prices are in USD.

---

## Features

- **Escrow flow** — buyer pays, funds held, buyer releases or disputes
- **Wallet popup** — Binance address + QR appears on every order and via topbar button
- **Auto-popup on first visit** — session-scoped, dismissible
- **Reviews & ratings** — computed per listing from released orders
- **Per-order messaging** — buyer and vendor chat in a thread
- **Vendor listings** — vendors create listings from `/sell.html`
- **Search + filter** — by category, keyword, price, rating, sales
- **Session auth** — bcrypt + express-session + SQLite store
- **Darkweb aesthetic** — monospace, scanlines, neon green, marquee ticker

---

## Stack

| Layer | Tech |
|-------|------|
| Runtime | Node.js 20+ |
| Server | Express 4 |
| Database | SQLite via `better-sqlite3` |
| Sessions | `express-session` + `connect-sqlite3` |
| Auth | `bcryptjs` |
| Security | `helmet`, `express-rate-limit` |
| Frontend | Vanilla HTML/CSS/JS, no framework |
| QR codes | `qrcodejs` (CDN) |

---

## Project structure
