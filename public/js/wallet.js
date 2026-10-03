// public/js/wallet.js — wallet modal, QR, copy, close-observable
let _walletCache = null;
let _closeResolver = null;

const FALLBACK_ADDRESS = '';
const FALLBACK_LABEL   = 'BlackVault Treasury';
const FALLBACK_NETWORK = 'Binance Smart Chain (BEP-20)';
const FALLBACK_ASSET   = 'USDT';

async function getWallet() {
  if (_walletCache) return _walletCache;
  let data = null;
  try {
    const res = await fetch('/api/wallet', { cache: 'no-store' });
    if (res.ok) {
      const j = await res.json();
      if (j && typeof j.address === 'string' && j.address.trim().length > 0) {
        data = {
          address: j.address.trim(),
          label: j.label || FALLBACK_LABEL,
          network: j.network || FALLBACK_NETWORK,
          asset: j.asset || FALLBACK_ASSET,
          memo: j.memo || '',
          configured: true
        };
      } else {
        console.warn('wallet endpoint returned no address — set BINANCE_WALLET_ADDRESS on the server');
      }
    } else {
      console.warn('wallet endpoint returned status', res.status);
    }
  } catch (e) {
    console.warn('wallet fetch failed', e);
  }
  if (!data) {
    data = {
      address: FALLBACK_ADDRESS,
      label: FALLBACK_LABEL,
      network: FALLBACK_NETWORK,
      asset: FALLBACK_ASSET,
      memo: '',
      configured: false
    };
  }
  _walletCache = data;
  return data;
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
          Send only <strong id="wAsset">USDT</strong> on <strong id="wChain">BEP-20</strong> to this address.<br>
          Sending from another chain results in lost funds.<br>
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

  if (!modal.dataset.wired) {
    modal.querySelectorAll('[data-close]').forEach(b =>
      b.addEventListener('click', closeWallet));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeWallet();
    });
    modal.dataset.wired = '1';
  }

  const w = await getWallet();

  const addr   = opts.address || w.address;
  const label  = opts.label   || w.label;
  const net    = opts.network || w.network;
  const asset  = opts.asset   || w.asset || FALLBACK_ASSET;
  const amount = opts.amount;
  const ref    = opts.ref;

  document.getElementById('wLabel').textContent = label;

  const addrEl = document.getElementById('wAddr');
  if (!addr) {
    addrEl.textContent = 'Address not configured. Set BINANCE_WALLET_ADDRESS in Render Environment.';
    addrEl.style.color = 'var(--danger)';
  } else {
    addrEl.textContent = addr;
    addrEl.style.color = '';
  }

  const qrTarget = document.getElementById('wQR');
  qrTarget.innerHTML = '';

  if (addr && window.QRCode && typeof addr === 'string' && addr.length >= 8) {
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
  } else if (!addr) {
    qrTarget.innerHTML = '<div style="color:#666;font-size:12px;text-align:center;padding:20px;">No address configured</div>';
  } else if (!window.QRCode) {
    console.warn('qrcodejs not loaded — showing address as text');
    qrTarget.textContent = addr;
  } else {
    qrTarget.textContent = addr;
  }

  let netLine = net;
  if (amount != null) netLine += ` · Amount: $${Number(amount).toFixed(2)}`;
  if (ref) netLine += ` · ${ref}`;
  document.getElementById('wNet').textContent = netLine;

  const assetEl = document.getElementById('wAsset');
  if (assetEl) assetEl.textContent = asset;

  const chainEl = document.getElementById('wChain');
  if (chainEl) {
    chainEl.textContent = (net || 'BEP-20').replace('Binance Smart Chain ', '');
  }

  const copyBtn = document.getElementById('wCopy');
  copyBtn.onclick = async () => {
    if (!addr) return;
    try {
      await navigator.clipboard.writeText(addr);
    } catch {
      const range = document.createRange();
      range.selectNodeContents(addrEl);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('copy');
    }
    copyBtn.textContent = 'Copied ✓';
    setTimeout(() => copyBtn.textContent = 'Copy address', 1400);
  };

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  return new Promise(resolve => { _closeResolver = resolve; });
}

window.openWallet = openWallet;
window.closeWallet = closeWallet;
