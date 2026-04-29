document.addEventListener('DOMContentLoaded', async () => {
  const [data, dailyGoal] = await Promise.all([buildChartData(), getDailyGoal()]);
  const hasAnyData = data.some(d => d.sessions > 0);

  if (hasAnyData) {
    const summary = calcSummary(data, dailyGoal);
    renderSummary(summary, dailyGoal);
    renderChart(data);
  } else {
    showEmptyState();
  }

  document.getElementById('btn-close').addEventListener('click', () => window.close());
});

// ── Data ──────────────────────────────────────────────────────────────────────

async function getDailyGoal() {
  const { settings } = await getStorage(['settings']);
  return (settings && settings.dailyGoal) || 0;
}

async function buildChartData() {
  const { stats } = await getStorage(['stats']);
  const dailyStats = stats || {};

  return getLast7Days().map(day => {
    const d = dailyStats[day.dateStr] || { sessions: 0, skips: 0 };
    const sessions = d.sessions || 0;
    const skips    = d.skips    || 0;
    const total    = sessions + skips;
    const focusScore = total === 0 ? null : Math.round((sessions / total) * 100);

    return { ...day, sessions, skips, focusScore };
  });
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      dateStr: d.toISOString().split('T')[0],
      label:   d.toLocaleDateString('en-US', { weekday: 'short' }),
      isToday: i === 0
    });
  }
  return days;
}

// ── Summary ───────────────────────────────────────────────────────────────────

function calcSummary(data, dailyGoal) {
  const totalSessions = data.reduce((s, d) => s + d.sessions, 0);

  const bestDay = data.reduce(
    (best, d) => d.sessions > (best ? best.sessions : -1) ? d : best,
    null
  );

  const withData = data.filter(d => d.focusScore !== null);
  const avgFocus = withData.length === 0
    ? null
    : Math.round(withData.reduce((s, d) => s + d.focusScore, 0) / withData.length);

  const goalDays = dailyGoal > 0
    ? data.filter(d => d.sessions >= dailyGoal).length
    : null;

  return { totalSessions, bestDay, avgFocus, goalDays };
}

function renderSummary(summary, dailyGoal) {
  document.getElementById('stat-total').textContent = summary.totalSessions;

  const bestDayEl   = document.getElementById('stat-best-day');
  const bestCountEl = document.getElementById('stat-best-day-count');

  if (summary.bestDay && summary.bestDay.sessions > 0) {
    bestDayEl.textContent   = summary.bestDay.label;
    bestCountEl.textContent = `${summary.bestDay.sessions} session${summary.bestDay.sessions !== 1 ? 's' : ''}`;
  } else {
    bestDayEl.textContent   = '—';
    bestCountEl.textContent = '';
  }

  const avgEl = document.getElementById('stat-avg-focus');
  if (summary.avgFocus !== null) {
    avgEl.textContent = `${summary.avgFocus}%`;
    avgEl.classList.add(scoreClass(summary.avgFocus));
  } else {
    avgEl.textContent = '—';
  }

  // Goal card — only shown when a goal is configured
  const goalCard = document.getElementById('goal-card');
  if (dailyGoal > 0 && summary.goalDays !== null) {
    goalCard.hidden = false;
    document.getElementById('stat-goal-days').textContent = `${summary.goalDays}/7`;
    document.getElementById('stat-goal-sub').textContent  = `goal: ${dailyGoal} sessions/day`;
  } else {
    goalCard.hidden = true;
  }
}

// ── Chart ─────────────────────────────────────────────────────────────────────

function renderChart(data) {
  const maxSessions = Math.max(...data.map(d => d.sessions), 1);
  const container   = document.getElementById('chart');

  container.innerHTML = '';

  data.forEach(day => {
    const heightPct = day.sessions === 0
      ? 0
      : Math.max(5, Math.round((day.sessions / maxSessions) * 100));

    const col = document.createElement('div');
    col.className = [
      'bar-col',
      day.isToday ? 'today' : '',
      day.sessions === 0 ? 'zero' : ''
    ].filter(Boolean).join(' ');

    col.innerHTML = `
      <div class="bar-wrap">
        <div class="bar" data-height="${heightPct}" style="height:0%"></div>
      </div>
      <div class="bar-sessions">${day.sessions > 0 ? day.sessions : ''}</div>
      <div class="bar-label">${day.label}${day.isToday ? ' ·' : ''}</div>
      <div class="bar-score ${day.focusScore !== null ? scoreClass(day.focusScore) : 'score-empty'}">
        ${day.focusScore !== null ? day.focusScore + '%' : '—'}
      </div>
    `;

    container.appendChild(col);
  });

  // Animate bars in after paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll('#chart .bar').forEach(bar => {
        bar.style.height = bar.dataset.height + '%';
      });
    });
  });
}

// ── Empty state ───────────────────────────────────────────────────────────────

function showEmptyState() {
  document.getElementById('summary').hidden      = true;
  document.getElementById('chart-section').hidden = true;
  document.getElementById('score-key').hidden    = true;
  document.getElementById('empty-state').hidden  = false;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreClass(score) {
  if (score >= 80) return 'score-green';
  if (score >= 50) return 'score-yellow';
  return 'score-red';
}

function getStorage(keys) {
  return new Promise(resolve => chrome.storage.local.get(keys, resolve));
}
