// public/js/gate.js — Binance wallet gate popup + QR
(function () {
  'use strict';

  const GATE_STORAGE_KEY = 'bv_gate_ack';
  const GATE_TTL_MS = 1000 * 60 * 30; // re-show every 30 min

  let gateConfig = null;

  async function fetchGate() {
    if (gateConfig) return gateConfig;
    const r = await fetch('/api/gate').then(x => x.json()).catch(() => null);
    gateConfig = r || { address: '', network: 'BSC (BEP20)', asset: 'USDT' };
    return gateConfig;
  }

  function buildModal(cfg, amountOverride) {
    const amount = amountOverride != null ? amountOverride : null;
    const wrap = document.createElement('div');
    wrap.className = 'bv-gate-overlay';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');

    const payload = cfg.address || 'no-address-configured';
    const uri = cfg.asset
      ? `${cfg.asset.toLowerCase()}:${cfg.address}${cfg.memo ? '?memo=' + encodeURIComponent(cfg.memo) : ''}`
      : payload;

    wrap.innerHTML = `
      <div class="bv-gate-modal">
        <div class="bv-gate-glow"></div>
        <div class="bv-gate-head">
          <div class="bv-gate-title">
            <span class="bv-skull">☠</span> PAYMENT GATE
          </div>
          <button class="bv-gate-close" aria-label="close">×</button>
        </div>
        <div class="bv-gate-sub">Fund this address to activate access. Network must match exactly.</div>

        <div class="bv-gate-qr-wrap">
          <div class="bv-gate-qr" id="bvQrBox">generating…</div>
        </div>

        <div class="bv-gate-rows">
          <div class="bv-gate-row">
            <span class="lbl">ASSET</span>
            <span class="val">${cfg.asset || 'USDT'}</span>
          </div>
          <div class="bv-gate-row">
            <span class="lbl">NETWORK</span>
            <span class="val bv-warn">${cfg.network || 'BSC (BEP20)'}</span>
          </div>
          ${amount != null ? `
          <div class="bv-gate-row">
            <span class="lbl">AMOUNT</span>
            <span class="val bv-amount">${amount.toFixed(2)} ${cfg.asset || 'USDT'}</span>
          </div>` : ''}
          <div class="bv-gate-row bv-addr-row">
            <span class="lbl">ADDRESS</span>
            <span class="val bv-addr" id="bvAddr">${escapeHtml(cfg.address || '—')}</span>
            <button class="bv-copy" id="bvCopyBtn">COPY</button>
          </div>
          ${cfg.memo ? `
          <div class="bv-gate-row">
            <span class="lbl">MEMO/TAG</span>
            <span class="val bv-warn">${escapeHtml(cfg.memo)}</span>
          </div>` : ''}
        </div>

        <div class="bv-gate-warn">
          ⚠ Sending the wrong asset or using the wrong network = permanent loss. Verify before you send.
        </div>

        <div class="bv-gate-foot">
          ${cfg.support_xmr ? `<div class="bv-xmr">alt: XMR <code>${escapeHtml(shorten(cfg.support_xmr, 8, 6))}</code></div>` : ''}
          ${cfg.support_email ? `<div class="bv-support">support: <a href="mailto:${escapeHtml(cfg.support_email)}">${escapeHtml(cfg.support_email)}</a></div>` : ''}
        </div>

        <button class="bv-gate-ack" id="bvAckBtn">
          ${amount != null ? 'I HAVE PAID' : 'I UNDERSTAND'}
        </button>
      </div>
    `;

    document.body.appendChild(wrap);

    // generate QR
    const qrBox = wrap.querySelector('#bvQrBox');
    fetch('/api/qr?text=' + encodeURIComponent(uri))
      .then(r => r.json())
      .then(d => {
        if (d.data_url) {
          qrBox.innerHTML = `<img src="${d.data_url}" alt="wallet qr" width="240" height="240">`;
        } else {
          qrBox.textContent = 'QR unavailable';
        }
      })
      .catch(() => {
        qrBox.textContent = 'QR unavailable';
      });

    // copy
    wrap.querySelector('#bvCopyBtn').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(cfg.address || '');
        wrap.querySelector('#bvCopyBtn').textContent = 'COPIED';
        setTimeout(() => wrap.querySelector('#bvCopyBtn').textContent = 'COPY', 1400);
      } catch {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = cfg.address || '';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch {}
        document.body.removeChild(ta);
        wrap.querySelector('#bvCopyBtn').textContent = 'COPIED';
        setTimeout(() => wrap.querySelector('#bvCopyBtn').textContent = 'COPY', 1400);
      }
    });

    // close
    wrap.querySelector('.bv-gate-close').addEventListener('click', () => close(wrap, false));

    // ack
    wrap.querySelector('#bvAckBtn').addEventListener('click', () => {
      try {
        sessionStorage.setItem(GATE_STORAGE_KEY, String(Date.now()));
      } catch {}
      close(wrap, true);
    });

    return wrap;
  }

  function close(wrap, ack) {
    wrap.classList.add('bv-gate-out');
    setTimeout(() => wrap.remove(), 220);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function shorten(s, head, tail) {
    if (!s) return '';
    if (s.length <= head + tail + 3) return s;
    return s.slice(0, head) + '…' + s.slice(-tail);
  }

  // public API
  window.BVGate = {
    async show(amountOverride) {
      const cfg = await fetchGate();
      return new Promise(resolve => {
        const wrap = buildModal(cfg, amountOverride);
        wrap.addEventListener('bv-close', () => resolve(true));
        wrap.querySelector('#bvAckBtn').addEventListener('click', () => resolve(true));
      });
    },
    async autoShowOnce() {
      let last = 0;
      try { last = Number(sessionStorage.getItem(GATE_STORAGE_KEY) || 0); } catch {}
      if (Date.now() - last < GATE_TTL_MS) return;
      await this.show();
    }
  };

  // auto-show on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.BVGate.autoShowOnce());
  } else {
    window.BVGate.autoShowOnce();
  }
})();