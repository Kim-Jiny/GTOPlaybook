/* views/inquiries.js — inquiry workflow: filter, search, reply/edit/delete, status. */
(function () {
  const state = { status: '', search: '', sort: 'created_at', order: 'desc' };

  function init() {
    document.querySelectorAll('#inq-tabs .tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#inq-tabs .tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        state.status = tab.dataset.filter;
        load();
      });
    });

    const search = document.getElementById('inq-search');
    search.addEventListener('input', ui.debounce(() => {
      state.search = search.value.trim();
      load();
    }, 300));

    document.querySelectorAll('#section-inquiries th.sortable').forEach((th) => {
      th.addEventListener('click', () => {
        state.order = state.order === 'asc' ? 'desc' : 'asc';
        const arrow = th.querySelector('.arrow');
        if (arrow) arrow.textContent = state.order === 'asc' ? '▲' : '▼';
        load();
      });
    });

    document.getElementById('inq-export').addEventListener('click', () => {
      ui.download('/admin/api/inquiries/export' + api.qs({ status: state.status }));
    });

    document.getElementById('inquiries-tbody').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-open]');
      if (btn) openDetail(btn.dataset.open);
    });
  }

  let cache = [];

  async function load() {
    const tbody = document.getElementById('inquiries-tbody');
    const empty = document.getElementById('inquiries-empty');
    tbody.innerHTML = ui.skeletonRows(6);
    empty.style.display = 'none';
    try {
      const rows = await api.get('/admin/api/inquiries' + api.qs(state));
      cache = rows;
      if (!rows.length) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
      }
      tbody.innerHTML = rows.map(rowHtml).join('');
    } catch (err) {
      tbody.innerHTML = '';
      ui.toast(err.message, 'error');
    }
  }

  function rowHtml(r) {
    return `
      <tr>
        <td class="mono">#${ui.esc(r.id)}</td>
        <td>
          <div class="cell-strong">${ui.esc(r.display_name || '이름 없음')}</div>
          <div class="cell-sub">${ui.esc(r.email)}</div>
        </td>
        <td><div style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ui.esc(r.title)}</div></td>
        <td>${ui.statusBadge(r.status)}</td>
        <td>${ui.fmtDate(r.created_at)}</td>
        <td><div class="row-actions"><button class="btn btn-secondary btn-sm" data-open="${ui.esc(r.id)}">보기</button></div></td>
      </tr>`;
  }

  function openDetail(id) {
    const r = cache.find((x) => String(x.id) === String(id));
    if (!r) return;
    renderDetail(r);
  }

  function renderDetail(r) {
    const hasReply = !!r.admin_reply;
    const statusOptions = Object.entries(ui.STATUS_LABEL)
      .map(([v, label]) => `<option value="${v}" ${r.status === v ? 'selected' : ''}>${label}</option>`)
      .join('');

    const replyBlock = hasReply
      ? `<div class="bubble reply">
           <div class="field-label" style="margin-bottom:6px">관리자 답변 · ${ui.fmtDateTime(r.replied_at)}</div>
           <div class="field-value" id="reply-display">${ui.esc(r.admin_reply)}</div>
         </div>
         <div id="reply-edit" style="display:none;margin-top:10px">
           <textarea id="reply-text">${ui.esc(r.admin_reply)}</textarea>
         </div>`
      : `<div class="field" style="margin:0">
           <div class="field-label">답변 작성</div>
           <textarea id="reply-text" placeholder="답변을 입력하세요…"></textarea>
         </div>`;

    const body = `
      <div style="display:flex;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap">
        ${ui.statusBadge(r.status)}
        <span class="text-dim" style="font-size:12px">접수 ${ui.fmtDateTime(r.created_at)}</span>
        <div class="spacer" style="flex:1"></div>
        <select id="status-select" style="width:auto">${statusOptions}</select>
      </div>
      <div class="field"><div class="field-label">사용자</div>
        <div class="field-value">${ui.esc(r.display_name || '이름 없음')} <span class="text-dim">(${ui.esc(r.email)})</span></div>
      </div>
      <div class="field"><div class="field-label">제목</div><div class="field-value cell-strong">${ui.esc(r.title)}</div></div>
      <div class="field"><div class="field-label">내용</div>
        <div class="bubble"><div class="field-value">${ui.esc(r.content)}</div></div>
      </div>
      <div class="field" style="margin-bottom:0">${replyBlock}</div>`;

    const footer = hasReply
      ? `<button class="btn btn-danger" data-action="delete-reply">답변 삭제</button>
         <div class="spacer" style="flex:1"></div>
         <button class="btn btn-secondary" data-action="edit-reply">답변 수정</button>
         <button class="btn btn-primary" data-action="save-reply" style="display:none">저장</button>
         <button class="btn btn-ghost" data-close>닫기</button>`
      : `<div class="spacer" style="flex:1"></div>
         <button class="btn btn-ghost" data-close>닫기</button>
         <button class="btn btn-primary" data-action="send-reply">답변 보내기</button>`;

    ui.openModal(ui.modalFrame(`문의 #${r.id}`, body, footer));
    wireDetail(r);
  }

  function wireDetail(r) {
    const root = ui.modalEl();

    // Status select.
    root.querySelector('#status-select').addEventListener('change', async (e) => {
      const status = e.target.value;
      try {
        await api.patch('/admin/api/inquiries/' + r.id + '/status', { status });
        r.status = status;
        ui.toast('상태를 변경했습니다');
        load();
        refreshBadges();
      } catch (err) {
        ui.toast(err.message, 'error');
      }
    });

    const sendBtn = root.querySelector('[data-action="send-reply"]');
    if (sendBtn) sendBtn.addEventListener('click', () => submitReply(r, 'post'));

    const editBtn = root.querySelector('[data-action="edit-reply"]');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        root.querySelector('#reply-display').parentElement.style.display = 'none';
        root.querySelector('#reply-edit').style.display = 'block';
        editBtn.style.display = 'none';
        root.querySelector('[data-action="save-reply"]').style.display = '';
      });
    }

    const saveBtn = root.querySelector('[data-action="save-reply"]');
    if (saveBtn) saveBtn.addEventListener('click', () => submitReply(r, 'put'));

    const delBtn = root.querySelector('[data-action="delete-reply"]');
    if (delBtn) {
      delBtn.addEventListener('click', async () => {
        const ok = await ui.confirmDialog({
          title: '답변 삭제',
          message: '답변을 삭제하면 문의가 다시 대기 상태로 돌아갑니다. 계속할까요?',
          confirmLabel: '삭제', danger: true,
        });
        if (!ok) return;
        try {
          await api.del('/admin/api/inquiries/' + r.id + '/reply');
          ui.toast('답변을 삭제했습니다');
          ui.closeModal();
          load();
          refreshBadges();
        } catch (err) {
          ui.toast(err.message, 'error');
        }
      });
    }
  }

  async function submitReply(r, method) {
    const reply = ui.modalEl().querySelector('#reply-text').value.trim();
    if (!reply) { ui.toast('답변 내용을 입력하세요', 'error'); return; }
    const btn = ui.modalEl().querySelector(method === 'put' ? '[data-action="save-reply"]' : '[data-action="send-reply"]');
    btn.disabled = true;
    try {
      const fn = method === 'put' ? api.put : api.post;
      await fn('/admin/api/inquiries/' + r.id + '/reply', { reply });
      ui.toast(method === 'put' ? '답변을 수정했습니다' : '답변을 보냈습니다');
      ui.closeModal();
      load();
      refreshBadges();
    } catch (err) {
      ui.toast(err.message, 'error');
      btn.disabled = false;
    }
  }

  function refreshBadges() {
    if (window.App && window.App.refreshPending) window.App.refreshPending();
  }

  window.Views = window.Views || {};
  window.Views.inquiries = { init, load };
})();
