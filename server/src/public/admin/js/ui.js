/* ui.js — shared UI helpers: toast, modal, confirm dialog, formatters. */
(function () {
  /* ---- escaping ---- */
  function esc(value) {
    const d = document.createElement('div');
    d.textContent = value == null ? '' : String(value);
    return d.innerHTML;
  }

  /* ---- date formatting ---- */
  function fmtDate(input) {
    if (!input) return '-';
    const d = new Date(input);
    if (isNaN(d)) return '-';
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }
  function fmtDateTime(input) {
    if (!input) return '-';
    const d = new Date(input);
    if (isNaN(d)) return '-';
    return d.toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  }
  // Relative "n일 전" style for recency.
  function fmtAgo(input) {
    if (!input) return '-';
    const d = new Date(input);
    if (isNaN(d)) return '-';
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return '방금 전';
    if (diff < 3600) return Math.floor(diff / 60) + '분 전';
    if (diff < 86400) return Math.floor(diff / 3600) + '시간 전';
    if (diff < 2592000) return Math.floor(diff / 86400) + '일 전';
    return fmtDate(input);
  }

  function initials(name, email) {
    const base = (name || email || '?').trim();
    return base.charAt(0).toUpperCase();
  }

  const STATUS_LABEL = { pending: '대기', in_progress: '처리중', replied: '답변완료' };
  function statusBadge(status) {
    const label = STATUS_LABEL[status] || status;
    return `<span class="badge ${esc(status)}">${esc(label)}</span>`;
  }

  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  /* ---- toast ---- */
  function toast(message, type) {
    const wrap = document.getElementById('toast-wrap');
    const el = document.createElement('div');
    el.className = 'toast ' + (type || 'success');
    el.innerHTML = `<span class="dot"></span><span>${esc(message)}</span>`;
    wrap.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .25s, transform .25s';
      el.style.opacity = '0';
      el.style.transform = 'translateX(20px)';
      setTimeout(() => el.remove(), 250);
    }, 3000);
  }

  /* ---- modal ---- */
  const overlay = () => document.getElementById('modal-overlay');
  const modalEl = () => document.getElementById('modal');

  function openModal(html) {
    modalEl().innerHTML = html;
    overlay().classList.add('open');
  }
  function closeModal() {
    overlay().classList.remove('open');
    modalEl().innerHTML = '';
  }

  // Build a standard modal frame.
  function modalFrame(title, bodyHtml, footerHtml) {
    return `
      <div class="modal-header">
        <h2>${esc(title)}</h2>
        <button class="x" data-close>&times;</button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
    `;
  }

  /* ---- confirm dialog (promise-based) ---- */
  function confirmDialog({ title, message, confirmLabel = '확인', danger = false }) {
    return new Promise((resolve) => {
      openModal(
        modalFrame(
          title,
          `<p class="confirm-text">${esc(message)}</p>`,
          `<button class="btn btn-ghost" data-confirm="0">취소</button>
           <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm="1">${esc(confirmLabel)}</button>`,
        ),
      );
      modalEl().querySelectorAll('[data-confirm]').forEach((b) => {
        b.addEventListener('click', () => {
          const ok = b.dataset.confirm === '1';
          closeModal();
          resolve(ok);
        });
      });
    });
  }

  /* ---- CSV download (auth via cookie, so a plain navigation works) ---- */
  function download(url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /* ---- skeleton rows for tables ---- */
  function skeletonRows(cols, rows = 6) {
    let html = '';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        html += '<td><div class="skeleton skeleton-row" style="margin:0;width:' + (50 + ((r + c) % 4) * 12) + '%"></div></td>';
      }
      html += '</tr>';
    }
    return html;
  }

  /* ---- global modal close wiring ---- */
  document.addEventListener('click', (e) => {
    if (e.target === overlay()) closeModal();
    if (e.target.closest('[data-close]')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay().classList.contains('open')) closeModal();
  });

  window.ui = {
    esc, fmtDate, fmtDateTime, fmtAgo, initials, statusBadge, STATUS_LABEL,
    debounce, toast, openModal, closeModal, modalFrame, modalEl,
    confirmDialog, download, skeletonRows,
  };
})();
