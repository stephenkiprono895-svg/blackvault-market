// public/js/wallet.js — wallet modal, QR, copy, close-observable
let _walletCache = null;

async function getWallet() {
  if (_walletCache) return _walletCache;
  try {
    const r = await fetch('/api/wallet').then(x => x.json());
    _walletCache = r && r.address ? r : {
      address: 'unavailable',
      label: 'BlackVault',
      network: 'Bitcoin'
    };
  } catch {
    _walletCache = { address: 'unavailable', label: 'BlackVault', network: 'Bitcoin' };
  }
  return _walletCache;
}

function ensureModal() {
  let el = document.getElementById('walletModal');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'walletModal';
  el.className = 'wallet-modal';
  el.innerHTML = `
    <div class="wallet-backdrop" data-close></div>
    <div class="wallet-dialog">
      <div class="wallet-head">
        <span class="wallet-dot"></span>
        <span class="wallet-title">Pay with Binance</span>
        <button class="wallet-close" data-close>×</button>
      </div>
      <div class="wallet-body">
        <div class="wallet-label" id="wLabel">—</div>
        <div class="wallet-net" id="wNet">—</div>
        <div class="wallet-qr" id="wQR"></div>
        <div class="wallet-addr-block">
          <div class="wallet-addr" id="wAddr">—</div>
          <button class="wallet-copy" id="wCopy">Copy address</button>
        </div>
        <div class="wallet-note">
          Send the exact amount in BTC to this address.<br>
          Network: <strong>Binance / BEP-20 compatible</strong>.<br>
          After sending, share the TX hash in the order thread.
        </div>
        <div class="wallet-actions">
          <button class="btn btn-ghost" data-close>Close</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(el);
  return el;
}

let _closeResolver = null;

function closeWallet() {
  const modal = document.getElementById('walletModal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
  if (_closeResolver) {
    const r = _closeResolver;
    _closeResolver = null;
    r();
  }
}

async function openWallet(opts = {}) {
  const modal = ensureModal();

  // lazy-attach close handlers once
  if (!modal.dataset.wired) {
    modal.querySelectorAll('[data-close]').forEach(b =>
      b.addEventListener('click', closeWallet));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeWallet();
    });
    modal.dataset.wired = '1';
  }

  // fetch wallet (may hit network)
  const w = await getWallet();

  const addr  = opts.address || w.address;
  const label = opts.label   || w.label;
  const net   = opts.network || w.network;
  const amount = opts.amount;
  const ref = opts.ref;

  document.getElementById('wLabel').textContent = label;
  document.getElementById('wAddr').textContent  = addr;

  // QR
  const qrTarget = document.getElementById('wQR');
  qrTarget.innerHTML = '';
  if (window.QRCode && addr && addr !== 'unavailable') {
    try {
      new QRCode(qrTarget, {
        text: addr,
        width: 200,
        height: 200,
        colorDark: '#0b0d10',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    } catch (e) {
      console.error('QR render failed', e);
      qrTarget.textContent = addr;
    }
  } else {
    qrTarget.textContent = addr;
  }

  // net / amount / ref line
  let netLine = net;
  if (amount != null) netLine += ` · Amount: $${Number(amount).toFixed(2)}`;
  if (ref) netLine += ` · ${ref}`;
  document.getElementById('wNet').textContent = netLine;

  // copy button
  const copyBtn = document.getElementById('wCopy');
  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(addr);
    } catch {
      const range = document.createRange();
      range.selectNodeContents(document.getElementById('wAddr'));
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('copy');
    }
    copyBtn.textContent = 'Copied ✓';
    setTimeout(() => copyBtn.textContent = 'Copy address', 1400);
  };

  // open + return promise that resolves when user closes
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  return new Promise(resolve => { _closeResolver = resolve; });
}

window.openWallet = openWallet;
window.closeWallet = closeWallet;