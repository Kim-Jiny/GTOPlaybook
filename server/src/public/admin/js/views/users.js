/* views/users.js — user list, search/sort/paginate, detail modal with actions. */
(function () {
  const state = { search: '', page: 1, sort: 'created_at', order: 'desc', limit: 20 };

  function init() {
    const search = document.getElementById('user-search');
    search.addEventListener('input', ui.debounce(() => {
      state.search = search.value.trim();
      load(1);
    }, 300));

    document.querySelectorAll('#section-users th.sortable').forEach((th) => {
      th.addEventListener('click', () => {
        const col = th.dataset.sort;
        if (state.sort === col) {
          state.order = state.order === 'asc' ? 'desc' : 'asc';
        } else {
          state.sort = col;
          state.order = 'desc';
        }
        updateSortArrows();
        load(1);
      });
    });

    document.getElementById('users-export').addEventListener('click', () => {
      ui.download('/admin/api/users/export' + api.qs({ search: state.search }));
    });

    // Delegated row actions.
    document.getElementById('users-tbody').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-view]');
      if (btn) openDetail(btn.dataset.view);
    });
  }

  function updateSortArrows() {
    document.querySelectorAll('#section-users th.sortable').forEach((th) => {
      const arrow = th.querySelector('.arrow');
      if (th.dataset.sort === state.sort) {
        arrow.textContent = state.order === 'asc' ? '▲' : '▼';
        arrow.style.opacity = '1';
      } else {
        arrow.textContent = '';
      }
    });
  }

  async function load(page) {
    if (page) state.page = page;
    const tbody = document.getElementById('users-tbody');
    const empty = document.getElementById('users-empty');
    tbody.innerHTML = ui.skeletonRows(6);
    empty.style.display = 'none';

    try {
      const data = await api.get('/admin/api/users' + api.qs(state));
      if (!data.users.length) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        document.getElementById('users-pagination').innerHTML = '';
        return;
      }
      tbody.innerHTML = data.users.map(rowHtml).join('');
      renderPagination(data);
    } catch (err) {
      tbody.innerHTML = '';
      ui.toast(err.message, 'error');
    }
  }

  function rowHtml(u) {
    const avatar = u.photo_url
      ? `<img class="avatar-sm" src="${ui.esc(u.photo_url)}" alt="" referrerpolicy="no-referrer" />`
      : `<div class="avatar-sm" style="display:grid;place-items:center;font-weight:700;color:var(--text-muted)">${ui.esc(ui.initials(u.display_name, u.email))}</div>`;
    const adminTag = u.is_admin ? ' <span class="badge admin">admin</span>' : '';
    const count = parseInt(u.inquiry_count, 10) || 0;
    return `
      <tr>
        <td>
          <div class="user-cell">
            ${avatar}
            <div>
              <div class="cell-strong">${ui.esc(u.display_name || '이름 없음')}${adminTag}</div>
              <div class="cell-sub mono">${ui.esc(String(u.id).slice(0, 10))}…</div>
            </div>
          </div>
        </td>
        <td>${ui.esc(u.email)}</td>
        <td>${ui.fmtDate(u.created_at)}</td>
        <td>${u.last_active_at ? ui.fmtAgo(u.last_active_at) : '<span class="text-dim">-</span>'}</td>
        <td>${count ? count + '건' : '<span class="text-dim">0</span>'}</td>
        <td><div class="row-actions"><button class="btn btn-secondary btn-sm" data-view="${ui.esc(u.id)}">상세</button></div></td>
      </tr>`;
  }

  function renderPagination(data) {
    const totalPages = Math.max(1, Math.ceil(data.total / data.limit));
    const el = document.getElementById('users-pagination');
    el.innerHTML = `
      <span>총 ${data.total}명 · ${data.page} / ${totalPages} 페이지</span>
      <div class="pages">
        <button ${data.page <= 1 ? 'disabled' : ''} data-pg="${data.page - 1}">이전</button>
        <button ${data.page >= totalPages ? 'disabled' : ''} data-pg="${data.page + 1}">다음</button>
      </div>`;
    el.querySelectorAll('[data-pg]').forEach((b) =>
      b.addEventListener('click', () => load(parseInt(b.dataset.pg, 10))));
  }

  /* ---- detail modal ---- */
  async function openDetail(id) {
    ui.openModal(ui.modalFrame('사용자 상세', '<div class="empty">불러오는 중…</div>'));
    try {
      const [u, inquiries] = await Promise.all([
        api.get('/admin/api/users/' + encodeURIComponent(id)),
        api.get('/admin/api/users/' + encodeURIComponent(id) + '/inquiries'),
      ]);
      renderDetail(u, inquiries);
    } catch (err) {
      ui.toast(err.message, 'error');
      ui.closeModal();
    }
  }

  function renderDetail(u, inquiries) {
    const avatar = u.photo_url
      ? `<img class="avatar-sm" style="width:48px;height:48px" src="${ui.esc(u.photo_url)}" referrerpolicy="no-referrer" />`
      : `<div class="avatar-sm" style="width:48px;height:48px;display:grid;place-items:center;font-weight:700;font-size:18px">${ui.esc(ui.initials(u.display_name, u.email))}</div>`;

    const inqList = inquiries.length
      ? inquiries.map((i) => `
          <div class="bubble" style="margin-bottom:8px;display:flex;justify-content:space-between;gap:10px;align-items:center">
            <div style="min-width:0">
              <div class="cell-strong" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ui.esc(i.title)}</div>
              <div class="cell-sub">${ui.fmtDate(i.created_at)}</div>
            </div>
            ${ui.statusBadge(i.status)}
          </div>`).join('')
      : '<div class="text-dim" style="font-size:13px">문의 내역이 없습니다.</div>';

    const body = `
      <div style="display:flex;gap:14px;align-items:center;margin-bottom:18px">
        ${avatar}
        <div>
          <div style="font-size:16px;font-weight:700">${ui.esc(u.display_name || '이름 없음')}
            ${u.is_admin ? '<span class="badge admin">admin</span>' : ''}</div>
          <div class="text-muted" style="font-size:13px">${ui.esc(u.email)}</div>
        </div>
      </div>
      <div class="info-grid" style="margin-bottom:18px">
        <div class="field" style="margin:0"><div class="field-label">User ID</div><div class="field-value mono">${ui.esc(u.id)}</div></div>
        <div class="field" style="margin:0"><div class="field-label">문의 수</div><div class="field-value">${ui.esc(u.inquiry_count || 0)}건</div></div>
        <div class="field" style="margin:0"><div class="field-label">가입일</div><div class="field-value">${ui.fmtDateTime(u.created_at)}</div></div>
        <div class="field" style="margin:0"><div class="field-label">최근 활동</div><div class="field-value">${u.last_active_at ? ui.fmtDateTime(u.last_active_at) : '-'}</div></div>
      </div>
      <div class="field-label" style="margin-bottom:8px">문의 내역</div>
      ${inqList}`;

    const footer = `
      <button class="btn btn-danger" data-action="delete">사용자 삭제</button>
      <div class="spacer" style="flex:1"></div>
      <button class="btn btn-secondary" data-action="toggle-admin">${u.is_admin ? '관리자 해제' : '관리자 지정'}</button>
      <button class="btn btn-ghost" data-close>닫기</button>`;

    ui.openModal(ui.modalFrame('사용자 상세', body, footer));

    ui.modalEl().querySelector('[data-action="toggle-admin"]').addEventListener('click', async (e) => {
      const next = !u.is_admin;
      e.target.disabled = true;
      try {
        await api.patch('/admin/api/users/' + encodeURIComponent(u.id) + '/admin', { isAdmin: next });
        ui.toast(next ? '관리자로 지정했습니다' : '관리자를 해제했습니다');
        ui.closeModal();
        load();
      } catch (err) {
        ui.toast(err.message, 'error');
        e.target.disabled = false;
      }
    });

    ui.modalEl().querySelector('[data-action="delete"]').addEventListener('click', async () => {
      const ok = await ui.confirmDialog({
        title: '사용자 삭제',
        message: `${u.display_name || u.email} 사용자를 삭제할까요? 관련 문의도 함께 삭제되며 되돌릴 수 없습니다.`,
        confirmLabel: '삭제',
        danger: true,
      });
      if (!ok) return;
      try {
        await api.del('/admin/api/users/' + encodeURIComponent(u.id));
        ui.toast('사용자를 삭제했습니다');
        ui.closeModal();
        load(1);
      } catch (err) {
        ui.toast(err.message, 'error');
      }
    });
  }

  window.Views = window.Views || {};
  window.Views.users = { init, load };
})();
