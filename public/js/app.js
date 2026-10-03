// public/js/app.js — shared helpers
window.BV = {
  escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  },
  fmtUsd(n) {
    return '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },
  shortHandle(h) {
    if (!h) return '';
    return h.length > 16 ? h.slice(0, 6) + '…' + h.slice(-4) : h;
  }
};