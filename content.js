(function () {
  if (window.__scgRunning) return;
  window.__scgRunning = true;

  let overlayEl         = null;
  let countdownInterval = null;
  let currentUrl        = location.href;

  // ── Quotes ────────────────────────────────────────────────────────────────────

  const QUOTES = [
    "Even Siamese cats know when to stop and stretch.",
    "A well-rested mind is a creative mind.",
    "The cat demands you take this break seriously.",
    "Productivity is a marathon, not a sprint.",
    "Breathe. The work will still be there.",
    "Even Siamese cats nap 16 hours a day — take notes.",
    "Your brain needs rest to do its best work.",
    "Come meet us at Siamese Cat Café — we believe in breaks.",
    "The cat is watching. Step away from the screen.",
    "Five minutes of stillness beats an hour of exhaustion.",
    "Purr-fect breaks make for purr-fect work.",
    "The cat has spoken. Rest now.",
    "Look away from the screen. Your eyes will thank you.",
    "Rest is not laziness — it is maintenance.",
    "The wisest creatures on earth nap frequently.",
    "You have earned this. Breathe.",
    "Every great idea starts with a moment of stillness.",
    "The Siamese cat says: screens down, chin up.",
    "Small pauses compound into big energy.",
    "Recharge now. Conquer later.",
    "A focused mind is a rested mind.",
    "Not all who wander from their screen are lost.",
  ];

  function randomQuote() {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }

  // ── Boot ──────────────────────────────────────────────────────────────────────

  async function init() {
    await checkAndShowOverlay();
    listenForStorageChanges();
    listenForNavigation();
  }

  // ── Check break state ─────────────────────────────────────────────────────────

  async function checkAndShowOverlay() {
    const data     = await getStorage(['mode', 'breakEndTime', 'settings']);
    const settings = data.settings || {};

    if (data.mode === 'break' && data.breakEndTime) {
      const remaining = data.breakEndTime - Date.now();
      if (remaining > 0 && isSiteBlocked(settings)) {
        showOverlay(data.breakEndTime, settings);
      } else if (remaining <= 0) {
        hideOverlay();
      }
    }
  }

  // ── Build and inject overlay ──────────────────────────────────────────────────

  function showOverlay(breakEndTime, settings) {
    if (overlayEl) return;

    document.documentElement.style.setProperty('overflow', 'hidden', 'important');
    document.body.style.setProperty('overflow', 'hidden', 'important');

    const catUrl  = chrome.runtime.getURL('assets/catcafe.webp');
    const iconUrl = chrome.runtime.getURL('assets/siamese_icon.webp');
    const quote   = randomQuote();

    overlayEl = document.createElement('div');
    overlayEl.id = 'scg-overlay';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.setAttribute('aria-label', 'Break time — Siamese Cat Gatekeeper');

    overlayEl.innerHTML = `
      <div id="scg-panel">

        <div id="scg-top-bar">
          <div id="scg-branding">
            <img id="scg-icon" src="${iconUrl}" alt="Siamese Cat Cafe logo" />
            <span id="scg-brand-name">Cat Gatekeeper</span>
          </div>
          <div id="scg-badge">🐾 Break Time</div>
        </div>

        <div id="scg-cat-ring">
          <div id="scg-cat-wrap">
            <img
              id="scg-cat"
              src="${catUrl}"
              alt="Siamese cat"
              draggable="false"
            />
          </div>
        </div>

        <h2 id="scg-headline">Break Time</h2>
        <p id="scg-quote">${quote}</p>

        <div id="scg-timer-pill">
          <div id="scg-timer" aria-live="polite" aria-label="Break time remaining">05:00</div>
        </div>

        <p id="scg-unlock-text">This page will unlock when your break ends.</p>

        <a
          id="scg-cafe-link"
          href="https://siamesecat.cafe"
          target="_blank"
          rel="noopener noreferrer"
        >Meet the real cat at SiameseCat.cafe ↗</a>

      </div>
    `;

    document.documentElement.appendChild(overlayEl);

    overlayEl.addEventListener('wheel',     e => e.stopPropagation(), { passive: false });
    overlayEl.addEventListener('touchmove', e => e.stopPropagation(), { passive: false });

    if (settings && settings.soundEnabled) playMeow();

    startCountdown(breakEndTime);
  }

  function hideOverlay() {
    if (!overlayEl) return;

    clearInterval(countdownInterval);
    countdownInterval = null;

    overlayEl.classList.add('scg-fade-out');
    setTimeout(() => { overlayEl?.remove(); overlayEl = null; }, 420);

    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  // ── Countdown ─────────────────────────────────────────────────────────────────

  function startCountdown(breakEndTime) {
    function tick() {
      if (!overlayEl) return;
      const remaining = Math.max(0, breakEndTime - Date.now());
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      const timerEl = overlayEl.querySelector('#scg-timer');
      if (timerEl) timerEl.textContent =
        `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      if (remaining === 0) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        hideOverlay();
      }
    }
    tick();
    countdownInterval = setInterval(tick, 1000);
  }

  // ── Site blocking ─────────────────────────────────────────────────────────────

  function isSiteBlocked(settings) {
    const hostname = location.hostname.replace(/^www\./, '').toLowerCase();
    const domains  = (settings.blockedDomains || [])
      .map(d => d.trim().replace(/^www\./, '').toLowerCase()).filter(Boolean);
    const inList = domains.some(d => hostname === d || hostname.endsWith('.' + d));
    return settings.isWhitelistMode ? !inList : inList;
  }

  // ── Storage change listener ───────────────────────────────────────────────────

  function listenForStorageChanges() {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (!changes.mode && !changes.breakEndTime && !changes.settings) return;

      getStorage(['mode', 'breakEndTime', 'settings']).then(data => {
        const settings = data.settings || {};
        if (data.mode === 'break' && data.breakEndTime) {
          const remaining = data.breakEndTime - Date.now();
          if (remaining > 0 && isSiteBlocked(settings)) showOverlay(data.breakEndTime, settings);
          else hideOverlay();
        } else {
          hideOverlay();
        }
      });
    });
  }

  // ── SPA navigation ────────────────────────────────────────────────────────────

  function listenForNavigation() {
    window.addEventListener('popstate', onNavigate);
    const origPush    = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    history.pushState    = function (...a) { origPush(...a);    onNavigate(); };
    history.replaceState = function (...a) { origReplace(...a); onNavigate(); };
  }

  function onNavigate() {
    if (location.href === currentUrl) return;
    currentUrl = location.href;
    if (!overlayEl) checkAndShowOverlay();
  }

  // ── Sound ─────────────────────────────────────────────────────────────────────

  function playMeow() {
    try {
      const audio = new Audio(chrome.runtime.getURL('assets/cat_sound.mp3'));
      audio.volume = 0.65;
      audio.play().catch(() => {});
    } catch (_) {}
  }

  // ── Utility ───────────────────────────────────────────────────────────────────

  function getStorage(keys) {
    return new Promise(resolve => chrome.storage.local.get(keys, resolve));
  }

  init();
})();
