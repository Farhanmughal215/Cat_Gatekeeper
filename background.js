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
  dailyGoal: 0,            // 0 = no goal set
  autoStartEnabled: false,
  autoStartTime: '09:00'
};

const ALARM_WORK      = 'workEnd';
const ALARM_BREAK     = 'breakEnd';
const ALARM_AUTOSTART = 'autoStart';

// ── Init ──────────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(['settings', 'mode']);
  if (!data.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
  if (!data.mode) {
    await startWork();
  }
  const s = data.settings || DEFAULT_SETTINGS;
  if (s.autoStartEnabled && s.autoStartTime) {
    scheduleAutoStart(s.autoStartTime);
  }
});

// ── Alarms ────────────────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_WORK) {
    await endWorkSession();
  } else if (alarm.name === ALARM_BREAK) {
    await startWork();
  } else if (alarm.name === ALARM_AUTOSTART) {
    // Only auto-start if not already in a work session
    const { mode } = await chrome.storage.local.get('mode');
    if (!mode || mode === 'break') {
      await startWork();
    }
  }
});

// ── Messages from popup / options ─────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_STATE') {
    getState().then(sendResponse);
    return true;
  }
  if (msg.type === 'START_BREAK') {
    startBreakNow().then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.type === 'END_BREAK') {
    startWork().then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.type === 'RECORD_SKIP') {
    recordSkip().then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.type === 'SAVE_SETTINGS') {
    saveSettings(msg.settings).then(() => sendResponse({ ok: true }));
    return true;
  }
});

// ── Core cycle ────────────────────────────────────────────────────────────────

async function startWork() {
  const { settings } = await chrome.storage.local.get('settings');
  const s = settings || DEFAULT_SETTINGS;

  await chrome.alarms.clear(ALARM_BREAK);
  await chrome.storage.local.set({
    mode: 'work',
    workStartTime: Date.now(),
    breakEndTime: null
  });
  chrome.alarms.create(ALARM_WORK, { delayInMinutes: s.workDuration });
}

async function endWorkSession() {
  const data = await chrome.storage.local.get(
    ['settings', 'sessionsToday', 'sessionsDate', 'stats']
  );
  const s = data.settings || DEFAULT_SETTINGS;
  const today = getToday();

  const prevSessions = data.sessionsDate === today ? (data.sessionsToday || 0) : 0;
  const sessions = prevSessions + 1;

  const dailyStats = data.stats || {};
  if (!dailyStats[today]) dailyStats[today] = { sessions: 0, skips: 0 };
  dailyStats[today].sessions = sessions;

  const isLongBreak = sessions % s.longBreakInterval === 0;
  const duration = isLongBreak ? s.longBreakDuration : s.breakDuration;
  const breakEndTime = Date.now() + duration * 60 * 1000;

  await chrome.alarms.clear(ALARM_WORK);
  await chrome.storage.local.set({
    mode: 'break',
    breakEndTime,
    sessionsToday: sessions,
    sessionsDate: today,
    stats: dailyStats
  });
  chrome.alarms.create(ALARM_BREAK, { delayInMinutes: duration });
}

// Triggered manually — does NOT count as a completed session
async function startBreakNow() {
  const { settings } = await chrome.storage.local.get('settings');
  const s = settings || DEFAULT_SETTINGS;
  const breakEndTime = Date.now() + s.breakDuration * 60 * 1000;

  await chrome.alarms.clear(ALARM_WORK);
  await chrome.storage.local.set({
    mode: 'break',
    breakEndTime,
    workStartTime: null
  });
  chrome.alarms.create(ALARM_BREAK, { delayInMinutes: s.breakDuration });
}

// ── Stats & score ─────────────────────────────────────────────────────────────

async function recordSkip() {
  const { stats } = await chrome.storage.local.get('stats');
  const today = getToday();
  const dailyStats = stats || {};
  if (!dailyStats[today]) dailyStats[today] = { sessions: 0, skips: 0 };
  dailyStats[today].skips = (dailyStats[today].skips || 0) + 1;
  await chrome.storage.local.set({ stats: dailyStats });
}

function calcFocusScore(sessions, skips) {
  const total = (sessions || 0) + (skips || 0);
  if (total === 0) return 100;
  return Math.round(((sessions || 0) / total) * 100);
}

// ── Settings ──────────────────────────────────────────────────────────────────

async function saveSettings(newSettings) {
  const { settings } = await chrome.storage.local.get('settings');
  const merged = Object.assign({}, DEFAULT_SETTINGS, settings || {}, newSettings);
  await chrome.storage.local.set({ settings: merged });

  // Re-schedule work alarm if duration changed and currently in work mode
  const { mode } = await chrome.storage.local.get('mode');
  if (mode === 'work') {
    await chrome.alarms.clear(ALARM_WORK);
    await chrome.storage.local.set({ workStartTime: Date.now() });
    chrome.alarms.create(ALARM_WORK, { delayInMinutes: merged.workDuration });
  }

  // Re-schedule or cancel auto-start
  await chrome.alarms.clear(ALARM_AUTOSTART);
  if (merged.autoStartEnabled && merged.autoStartTime) {
    scheduleAutoStart(merged.autoStartTime);
  }
}

// ── Auto-start scheduling ─────────────────────────────────────────────────────

function scheduleAutoStart(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now  = Date.now();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);
  if (next.getTime() <= now) {
    next.setDate(next.getDate() + 1);
  }
  chrome.alarms.create(ALARM_AUTOSTART, {
    when: next.getTime(),
    periodInMinutes: 24 * 60
  });
}

// ── State snapshot for popup ──────────────────────────────────────────────────

async function getState() {
  const data = await chrome.storage.local.get([
    'mode', 'breakEndTime', 'workStartTime',
    'sessionsToday', 'sessionsDate', 'settings', 'stats'
  ]);

  const today    = getToday();
  const sessions = data.sessionsDate === today ? (data.sessionsToday || 0) : 0;
  const dayStats = (data.stats || {})[today] || { sessions: 0, skips: 0 };
  const focusScore = calcFocusScore(dayStats.sessions, dayStats.skips);

  return {
    mode:          data.mode || 'work',
    breakEndTime:  data.breakEndTime  || null,
    workStartTime: data.workStartTime || null,
    sessionsToday: sessions,
    settings:      data.settings || DEFAULT_SETTINGS,
    focusScore,
    stats:         data.stats || {}
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getToday() {
  return new Date().toISOString().split('T')[0];
}
