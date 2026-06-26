/* views/dashboard.js — stats cards + signup trend + status doughnut. */
(function () {
  let signupChart = null;
  let statusChart = null;

  const ICONS = {
    users: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2a4 4 0 10-4-4 4 4 0 004 4z"/>',
    spark: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>',
    active: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>',
    reply: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a4 4 0 014 4v2M3 10l4-4M3 10l4 4"/>',
    clock: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>',
  };

  function card(label, value, icon, delta) {
    return `
      <div class="stat-card">
        <div class="label"><span class="ic"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor">${icon}</svg></span>${ui.esc(label)}</div>
        <div class="value">${value}</div>
        ${delta ? `<div class="delta ${delta.up ? 'up' : ''}">${ui.esc(delta.text)}</div>` : ''}
      </div>`;
  }

  function chartColors() {
    const cs = getComputedStyle(document.documentElement);
    return {
      grid: cs.getPropertyValue('--border').trim(),
      text: cs.getPropertyValue('--text-dim').trim(),
      brand: cs.getPropertyValue('--brand').trim(),
    };
  }

  async function load() {
    const data = await api.get('/admin/api/stats');
    window.__lastStats = data;
    renderCards(data);
    renderSignupChart(data);
    renderStatusChart(data);

    const total = data.totalInquiries || 0;
    document.getElementById('inq-total-hint').textContent = `총 ${total}건`;
  }

  function renderCards(d) {
    const avg = d.avgResponseHours == null ? '-'
      : d.avgResponseHours < 1 ? `${Math.round(d.avgResponseHours * 60)}분`
      : `${d.avgResponseHours}시간`;
    document.getElementById('stats').innerHTML = [
      card('전체 사용자', d.totalUsers, ICONS.users,
        { up: d.todaySignups > 0, text: `오늘 +${d.todaySignups}` }),
      card('오늘 활성 (DAU)', d.todayActiveUsers, ICONS.active),
      card('주간 활성 (WAU)', d.weeklyActiveUsers, ICONS.active,
        { text: `재방문 ${d.returningUsers}` }),
      card('월간 활성 (MAU)', d.monthlyActiveUsers, ICONS.spark),
      card('문의 응답률', `${d.responseRate}%`, ICONS.reply),
      card('평균 응답시간', avg, ICONS.clock),
    ].join('');
  }

  function renderSignupChart(d) {
    const ctx = document.getElementById('signup-chart');
    if (!ctx || typeof Chart === 'undefined') return;
    const c = chartColors();
    const labels = d.dailySignups.map((x) =>
      new Date(x.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }));
    const values = d.dailySignups.map((x) => parseInt(x.count, 10));

    if (signupChart) signupChart.destroy();
    const grad = ctx.getContext('2d').createLinearGradient(0, 0, 0, 240);
    grad.addColorStop(0, 'rgba(99,102,241,0.35)');
    grad.addColorStop(1, 'rgba(99,102,241,0)');

    signupChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: c.brand,
          backgroundColor: grad,
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: c.text, maxTicksLimit: 8 } },
          y: { beginAtZero: true, grid: { color: c.grid }, ticks: { color: c.text, precision: 0 } },
        },
      },
    });
  }

  function renderStatusChart(d) {
    const ctx = document.getElementById('status-chart');
    if (!ctx || typeof Chart === 'undefined') return;
    const c = chartColors();
    const byStatus = { pending: 0, in_progress: 0, replied: 0 };
    (d.inquiryStats || []).forEach((s) => { byStatus[s.status] = parseInt(s.count, 10); });

    if (statusChart) statusChart.destroy();
    statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['대기', '처리중', '답변완료'],
        datasets: [{
          data: [byStatus.pending, byStatus.in_progress, byStatus.replied],
          backgroundColor: ['#f59e0b', '#3b82f6', '#22c55e'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '66%',
        plugins: {
          legend: { position: 'bottom', labels: { color: c.text, boxWidth: 10, padding: 14 } },
        },
      },
    });
  }

  // Re-theme charts when the theme toggles.
  function retheme() {
    if (window.__lastStats) {
      renderSignupChart(window.__lastStats);
      renderStatusChart(window.__lastStats);
    }
  }

  window.Views = window.Views || {};
  window.Views.dashboard = { load, retheme };
})();
