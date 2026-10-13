/* views/purchases.js — ad-free purchases: filter by status/OS, search, paginate, CSV. */
(function () {
  const state = { status: '', platform: '', search: '', page: 1, limit: 20 };

  const PLATFORM_LABEL = { ios: 'iOS', android: 'Android' };

  function init() {
    const search = document.getElementById('purchase-search');
    search.addEventListener('input', ui.debounce(() => {
      state.search = search.value.trim();
      load(1);
    }, 300));

    document.querySelectorAll('#purchase-tabs .tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#purchase-tabs .tab').forEach((t) => t.classList.toggle('active', t === tab));
        state.status = tab.dataset.filter;
        load(1);
      });
    });

    document.querySelectorAll('#purchase-platforms .tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#purchase-platforms .tab').forEach((t) => t.classList.toggle('active', t === tab));
        state.platform = tab.dataset.platform;
        load(1);
      });
    });

    document.getElementById('purchases-export').addEventListener('click', () => {
      ui.download('/admin/api/purchases/export' + api.qs({
        status: state.status, platform: state.platform, search: state.search,
      }));
    });
  }

  async function load(page) {
    if (page) state.page = page;
    const tbody = document.getElementById('purchases-tbody');
    const empty = document.getElementById('purchases-empty');
    tbody.innerHTML = ui.skeletonRows(6);
    empty.style.display = 'none';

    try {
      const data = await api.get('/admin/api/purchases' + api.qs(state));
      if (!data.purchases.length) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        document.getElementById('purchases-pagination').innerHTML = '';
        return;
      }
      tbody.innerHTML = data.purchases.map(rowHtml).join('');
      renderPagination(data);
    } catch (err) {
      tbody.innerHTML = '';
      ui.toast(err.message, 'error');
    }
  }

  function rowHtml(p) {
    const refunded = !!p.revoked_at;
    const status = refunded
      ? `<span class="badge refunded">환불</span><div class="cell-sub">${ui.fmtDateTime(p.revoked_at)}</div>`
      : '<span class="badge active">유효</span>';
    return `
      <tr>
        <td>${ui.fmtDateTime(p.created_at)}</td>
        <td>
          <div class="cell-strong">${ui.esc(p.display_name || '이름 없음')}</div>
          <div class="cell-sub">${ui.esc(p.email)}</div>
        </td>
        <td><span class="badge ${ui.esc(p.platform)}">${ui.esc(PLATFORM_LABEL[p.platform] || p.platform)}</span></td>
        <td class="mono">${ui.esc(p.product_id)}</td>
        <td>${status}</td>
        <td>${p.last_checked_at ? ui.fmtAgo(p.last_checked_at) : '<span class="text-dim">-</span>'}</td>
      </tr>`;
  }

  function renderPagination(data) {
    const totalPages = Math.max(1, Math.ceil(data.total / data.limit));
    const el = document.getElementById('purchases-pagination');
    el.innerHTML = `
      <span>총 ${data.total}건 · ${data.page} / ${totalPages} 페이지</span>
      <div class="pages">
        <button ${data.page <= 1 ? 'disabled' : ''} data-pg="${data.page - 1}">이전</button>
        <button ${data.page >= totalPages ? 'disabled' : ''} data-pg="${data.page + 1}">다음</button>
      </div>`;
    el.querySelectorAll('[data-pg]').forEach((b) =>
      b.addEventListener('click', () => load(parseInt(b.dataset.pg, 10))));
  }

  window.Views = window.Views || {};
  window.Views.purchases = { init, load };
})();
