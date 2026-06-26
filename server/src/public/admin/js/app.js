/* app.js — routing, theme, sidebar, bootstrap. Loads last (after views). */
(function () {
  const META = {
    dashboard: { title: 'Dashboard', sub: '서비스 현황 한눈에 보기' },
    users: { title: 'Users', sub: '사용자 조회 및 관리' },
    inquiries: { title: 'Inquiries', sub: '문의 응대 및 처리' },
  };

  let current = null;
  const loaded = {};

  function navigate(route) {
    if (!META[route]) route = 'dashboard';
    current = route;

    document.querySelectorAll('.nav-item[data-route]').forEach((b) =>
      b.classList.toggle('active', b.dataset.route === route));
    document.querySelectorAll('.section').forEach((s) =>
      s.classList.toggle('active', s.id === 'section-' + route));

    document.getElementById('page-title').textContent = META[route].title;
    document.getElementById('page-sub').textContent = META[route].sub;
    location.hash = route;
    closeSidebar();

    const view = window.Views[route];
    if (view) {
      // init() binds static handlers once; load() fetches data each visit.
      if (!loaded[route] && view.init) { view.init(); loaded[route] = true; }
      view.load();
    }
  }

  /* ---- theme ---- */
  function applyThemeLabel() {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    document.getElementById('theme-label').textContent = isDark ? '라이트 모드' : '다크 모드';
    document.getElementById('theme-icon').innerHTML = isDark
      ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>'
      : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>';
  }
  function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('admin-theme', next);
    applyThemeLabel();
    if (window.Views.dashboard && window.Views.dashboard.retheme) window.Views.dashboard.retheme();
  }

  /* ---- mobile sidebar ---- */
  function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('backdrop').classList.add('show');
  }
  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('backdrop').classList.remove('show');
  }

  /* ---- pending badge ---- */
  async function refreshPending() {
    try {
      const stats = await api.get('/admin/api/stats');
      const pending = (stats.inquiryStats || []).find((s) => s.status === 'pending');
      const n = pending ? parseInt(pending.count, 10) : 0;
      const pill = document.getElementById('nav-pending');
      pill.textContent = n;
      pill.style.display = n > 0 ? '' : 'none';
    } catch (_) { /* ignore */ }
  }

  async function loadAdminChip() {
    try {
      const me = await api.get('/admin/api/me');
      if (me && me.username) {
        document.getElementById('admin-name').textContent = me.username;
        document.getElementById('admin-avatar').textContent = me.username.charAt(0).toUpperCase();
      }
    } catch (_) { /* ignore */ }
  }

  function boot() {
    document.querySelectorAll('.nav-item[data-route]').forEach((b) =>
      b.addEventListener('click', () => navigate(b.dataset.route)));
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('menu-btn').addEventListener('click', openSidebar);
    document.getElementById('backdrop').addEventListener('click', closeSidebar);
    window.addEventListener('hashchange', () => {
      const r = location.hash.replace('#', '');
      if (r && r !== current) navigate(r);
    });

    applyThemeLabel();
    loadAdminChip();
    refreshPending();

    const initial = location.hash.replace('#', '') || 'dashboard';
    navigate(initial);
  }

  window.App = { navigate, refreshPending };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
