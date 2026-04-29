const DEFAULT_SETTINGS = {
  workDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  blockedDomains: [
    'twitter.com', 'x.com', 'reddit.com', 'youtube.com',
    'instagram.com', 'facebook.com', 'tiktok.com'
  ],
  isWhitelistMode: false,
  soundEnabled: false,
  dailyGoal: 0,
  autoStartEnabled: false,
  autoStartTime: '09:00'
};

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  bindEvents();
});

// ── Load ──────────────────────────────────────────────────────────────────────

async function loadSettings() {
  const { settings } = await getStorage(['settings']);
  const s = Object.assign({}, DEFAULT_SETTINGS, settings || {});

  el('work-duration').value       = s.workDuration;
  el('break-duration').value      = s.breakDuration;
  el('long-break-duration').value = s.longBreakDuration;
  el('long-break-interval').value = s.longBreakInterval;
  el('daily-goal').value          = s.dailyGoal || 0;
  el('domains').value             = (s.blockedDomains || []).join('\n');
  el('sound-toggle').checked      = !!s.soundEnabled;
  el('autostart-toggle').checked  = !!s.autoStartEnabled;
  el('autostart-time').value      = s.autoStartTime || '09:00';

  const modeVal   = s.isWhitelistMode ? 'whitelist' : 'blocklist';
  const modeRadio = document.querySelector(`input[name="blocking-mode"][value="${modeVal}"]`);
  if (modeRadio) modeRadio.checked = true;

  updateModeLabels(s.isWhitelistMode);
  updateAutoStartVisibility(!!s.autoStartEnabled);
}

// ── Read form values ──────────────────────────────────────────────────────────

function getFormValues() {
  const modeChecked     = document.querySelector('input[name="blocking-mode"]:checked');
  const isWhitelistMode = modeChecked ? modeChecked.value === 'whitelist' : false;

  const blockedDomains = el('domains').value
    .split('\n')
    .map(d => d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
    .filter(Boolean);

  return {
    workDuration:      clamp(parseInt(el('work-duration').value,       10), 1, 180) || 25,
    breakDuration:     clamp(parseInt(el('break-duration').value,      10), 1,  60) || 5,
    longBreakDuration: clamp(parseInt(el('long-break-duration').value, 10), 1,  60) || 15,
    longBreakInterval: clamp(parseInt(el('long-break-interval').value, 10), 1,  20) || 4,
    dailyGoal:         clamp(parseInt(el('daily-goal').value,          10), 0,  20) || 0,
    isWhitelistMode,
    blockedDomains,
    soundEnabled:      el('sound-toggle').checked,
    autoStartEnabled:  el('autostart-toggle').checked,
    autoStartTime:     el('autostart-time').value || '09:00'
  };
}

// ── Save ──────────────────────────────────────────────────────────────────────

async function saveSettings() {
  const settings = getFormValues();

  el('work-duration').value       = settings.workDuration;
  el('break-duration').value      = settings.breakDuration;
  el('long-break-duration').value = settings.longBreakDuration;
  el('long-break-interval').value = settings.longBreakInterval;
  el('daily-goal').value          = settings.dailyGoal;

  await sendMessage({ type: 'SAVE_SETTINGS', settings });
  showToast('Settings saved!');
}

// ── Reset ─────────────────────────────────────────────────────────────────────

async function resetSettings() {
  const s = DEFAULT_SETTINGS;

  el('work-duration').value       = s.workDuration;
  el('break-duration').value      = s.breakDuration;
  el('long-break-duration').value = s.longBreakDuration;
  el('long-break-interval').value = s.longBreakInterval;
  el('daily-goal').value          = s.dailyGoal;
  el('domains').value             = s.blockedDomains.join('\n');
  el('sound-toggle').checked      = s.soundEnabled;
  el('autostart-toggle').checked  = s.autoStartEnabled;
  el('autostart-time').value      = s.autoStartTime;

  const blocklistRadio = document.querySelector('input[name="blocking-mode"][value="blocklist"]');
  if (blocklistRadio) blocklistRadio.checked = true;
  updateModeLabels(false);
  updateAutoStartVisibility(false);

  await sendMessage({ type: 'SAVE_SETTINGS', settings: s });
  showToast('Reset to defaults!');
}

// ── Start break now ───────────────────────────────────────────────────────────

async function startBreakNow() {
  playSound();
  await sendMessage({ type: 'START_BREAK' });
  showToast('Break started! Check a blocked site.');
}

// ── Sound ─────────────────────────────────────────────────────────────────────

function playSound() {
  if (!el('sound-toggle').checked) return;
  try {
    const audio = new Audio(chrome.runtime.getURL('assets/cat_sound.mp3'));
    audio.volume = 0.65;
    audio.play().catch(() => {});
  } catch (_) {}
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function updateModeLabels(isWhitelistMode) {
  const modeHint  = el('mode-hint');
  const domsLabel = el('domains-label');
  const domsHint  = el('domains-hint');

  if (isWhitelistMode) {
    modeHint.textContent  = 'Block ALL sites except the ones listed below during breaks.';
    domsLabel.textContent = 'Allowed Domains (Whitelist)';
    domsHint.textContent  = 'One domain per line. These sites will NOT be blocked.';
  } else {
    modeHint.textContent  = 'Block only the sites listed below during breaks.';
    domsLabel.textContent = 'Blocked Domains';
    domsHint.textContent  = 'One domain per line. No need to include www.';
  }
}

function updateAutoStartVisibility(enabled) {
  el('autostart-time-row').style.display = enabled ? '' : 'none';
}

// ── Bind events ───────────────────────────────────────────────────────────────

function bindEvents() {
  el('btn-save').addEventListener('click',  saveSettings);
  el('btn-reset').addEventListener('click', resetSettings);
  el('btn-break').addEventListener('click', startBreakNow);

  document.querySelectorAll('input[name="blocking-mode"]').forEach(radio => {
    radio.addEventListener('change', () => updateModeLabels(radio.value === 'whitelist'));
  });

  el('autostart-toggle').addEventListener('change', () => {
    updateAutoStartVisibility(el('autostart-toggle').checked);
  });
}

// ── Toast ─────────────────────────────────────────────────────────────────────

let toastTimer = null;

function showToast(message) {
  const toast = el('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function el(id) { return document.getElementById(id); }

function clamp(value, min, max) {
  if (isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function getStorage(keys) {
  return new Promise(resolve => chrome.storage.local.get(keys, resolve));
}

function sendMessage(msg) {
  return new Promise(resolve => chrome.runtime.sendMessage(msg, resp => {
    void chrome.runtime.lastError;
    resolve(resp);
  }));
}
