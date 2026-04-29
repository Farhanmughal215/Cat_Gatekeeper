let state = null;
let tickInterval = null;

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await refreshState();
  renderAll();
  tickInterval = setInterval(renderTimeDisplay, 1000);
  bindButtons();
});

// ── Fetch state from background ───────────────────────────────────────────────

function refreshState() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, resp => {
      if (resp) state = resp;
      resolve();
    });
  });
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderAll() {
  if (!state) return;
  renderModeBadge();
  renderTimeDisplay();
  renderStats();
  renderGoalProgress();
}

function renderModeBadge() {
  const badge = document.getElementById('mode-badge');
  const label = document.getElementById('mode-label');
  const btn   = document.getElementById('btn-break');

  if (state.mode === 'break') {
    badge.textContent  = 'BREAK';
    badge.className    = 'badge-break';
    label.textContent  = 'until break ends';
    btn.textContent    = 'End Break Early';
    btn.dataset.action = 'end';
  } else {
    badge.textContent  = 'WORK';
    badge.className    = 'badge-work';
    label.textContent  = 'until next break';
    btn.textContent    = 'Start Break Now';
    btn.dataset.action = 'start';
  }
}

function renderTimeDisplay() {
  if (!state) return;

  let remaining = 0;

  if (state.mode === 'break' && state.breakEndTime) {
    remaining = Math.max(0, state.breakEndTime - Date.now());
  } else if (state.mode === 'work' && state.workStartTime && state.settings) {
    const workEndTime = state.workStartTime + state.settings.workDuration * 60 * 1000;
    remaining = Math.max(0, workEndTime - Date.now());
  }

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  document.getElementById('time-display').textContent =
    `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function renderStats() {
  document.getElementById('sessions-count').textContent = state.sessionsToday ?? 0;

  const score   = state.focusScore ?? 100;
  const scoreEl = document.getElementById('focus-score');
  scoreEl.textContent = `${score}%`;
  scoreEl.className   = 'stat-value ' + scoreCssClass(score);
}

function scoreCssClass(score) {
  if (score >= 80) return 'score-green';
  if (score >= 50) return 'score-yellow';
  return 'score-red';
}

function renderGoalProgress() {
  const goal     = state.settings?.dailyGoal || 0;
  const sessions = state.sessionsToday ?? 0;
  const section  = document.getElementById('goal-section');

  if (!goal) {
    section.style.display = 'none';
    return;
  }

  section.style.display = '';
  const pct = Math.min(100, Math.round((sessions / goal) * 100));
  document.getElementById('goal-count').textContent = `${sessions} / ${goal}`;
  document.getElementById('goal-bar-fill').style.width = pct + '%';
}

// ── Button handlers ───────────────────────────────────────────────────────────

function bindButtons() {
  document.getElementById('btn-break').addEventListener('click', onBreakToggle);

  document.getElementById('btn-options').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  document.getElementById('btn-stats').addEventListener('click', () => {
    window.open(chrome.runtime.getURL('stats.html'), '_blank');
    window.close();
  });
}

async function onBreakToggle() {
  const action = document.getElementById('btn-break').dataset.action;

  if (action === 'start') playSound();

  const msgType = action === 'end' ? 'END_BREAK' : 'START_BREAK';
  await sendMessage(msgType);

  // Wait briefly so background.js writes new storage values before we read
  await delay(160);
  await refreshState();
  renderAll();
}

// ── Sound ─────────────────────────────────────────────────────────────────────

function playSound() {
  if (!state?.settings?.soundEnabled) return;
  try {
    const audio = new Audio(chrome.runtime.getURL('assets/cat_sound.mp3'));
    audio.volume = 0.65;
    audio.play().catch(() => {});
  } catch (_) {}
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sendMessage(type) {
  return new Promise(resolve => chrome.runtime.sendMessage({ type }, resp => {
    void chrome.runtime.lastError;
    resolve(resp);
  }));
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
