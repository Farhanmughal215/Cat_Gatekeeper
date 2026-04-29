# Siamese Cat Gatekeeper

A Pomodoro-style productivity Chrome extension. After a configurable work interval, a Siamese cat appears on distracting websites and blocks the page for a configurable break duration. Inspired by the cats at [Siamese Cat Cafe](https://siamesecat.cafe).

---

## Features

- **Work / break cycle** — 25-minute work sessions with 5-minute breaks (fully configurable)
- **Long breaks** — 15-minute break automatically triggers every 4 sessions
- **Break overlay** — full-screen Siamese cat blocks distracting sites during break, with live countdown
- **Session counter** — tracks how many sessions you complete each day
- **Focus score** — daily score based on sessions vs skips
- **Weekly stats** — 7-day bar chart with session counts and focus scores
- **Blocklist mode** — only blocks the sites you list
- **Whitelist mode** — blocks everything except the sites you list
- **Cat sound toggle** — optional meow when the overlay appears (off by default)
- **No tracking, no ads, no external requests** — everything is stored locally

---

## Installation

### From source (Developer Mode)

1. Download or clone this repository to your computer
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer Mode** using the toggle in the top-right corner
4. Click **"Load unpacked"**
5. Select the `siamese-cat-gatekeeper` folder
6. The extension will appear in your toolbar with the Siamese cat icon

### Updating after changes

1. Go to `chrome://extensions`
2. Find **Siamese Cat Gatekeeper**
3. Click the **refresh icon** on the extension card

---

## How to Use

1. Click the cat icon in your Chrome toolbar to open the popup
2. The popup shows your current mode (Work or Break), time remaining, session count, and focus score
3. Open **Options** to configure:
   - Work and break durations
   - Blocklist or whitelist mode
   - Which domains to block or allow
   - Whether to play a meow sound on break
4. Once a work session ends, the break overlay will appear automatically on blocked sites
5. Click **"Start Break Now"** in the popup or options page to trigger a break immediately for testing
6. Open **"View Stats"** to see your 7-day session history and focus scores

---

## File Structure

```
siamese-cat-gatekeeper/
├── manifest.json        Chrome extension config (MV3)
├── background.js        Timer engine, alarms, session tracking
├── content.js           Break overlay injected into web pages
├── overlay.css          Overlay styles and animations
├── popup.html           Toolbar popup UI
├── popup.js             Popup logic
├── popup.css            Popup styles
├── options.html         Settings page
├── options.js           Settings logic
├── stats.html           Weekly stats page
├── stats.js             Stats chart rendering
├── stats.css            Stats page styles
├── README.md            This file
└── assets/
    ├── catcafe.webp     Siamese cat photo (used in overlay)
    └── siamese_icon.webp  Extension icon
```

---

## Chrome Web Store Compliance Notes

This extension is designed to fully comply with the [Chrome Web Store Developer Program Policies](https://developer.chrome.com/docs/webstore/program-policies/).

### Permissions justification

| Permission | Why it is needed |
|---|---|
| `storage` | Saves user settings, session counts, and daily stats locally on the user's device |
| `alarms` | Runs the work/break timer reliably, including when the browser is idle or restarted |
| `host_permissions: <all_urls>` | Required so the content script can check break mode on any site the user adds to their blocklist. The extension takes no action on sites not in the user's list (or in whitelist mode, sites that are in the list). No data from visited pages is read or transmitted. |

No other permissions are requested. The extension does not use `tabs`, `history`, `webRequest`, `cookies`, `scripting`, `identity`, or `browsingData`.

### Branding and promotional content

- The extension includes one small text link on the break overlay: *"Meet the real cat at SiameseCat.cafe"*
- This link only opens when the user clicks it. No automatic redirects or tab openings occur.
- The link is clearly labelled as the developer's own cafe website
- The branding does not imitate or reference Google, Chrome, or any third-party platform
- The options page includes a small "About" section disclosing that this extension is made by Siamese Cat Cafe
- Promotional elements are secondary to the core productivity feature

### What this extension does NOT do

- Does not auto-redirect users to any website
- Does not open new tabs automatically
- Does not inject links or content into third-party web pages
- Does not alter search results, social posts, or shopping pages
- Does not use affiliate links, affiliate cookies, tracking pixels, or any monetisation mechanism
- Does not collect, transmit, store remotely, or sell any user data
- Does not read the content of pages the user visits
- Does not use any external analytics, crash reporting, or telemetry services

---

## Privacy Policy

**All data stays on your device.**

- **Settings** (work duration, break duration, blocked domains, sound preference) are stored using `chrome.storage.local`. This data never leaves your browser.
- **Session counts and focus scores** are stored using `chrome.storage.local`. Only the last 30 days of data are kept.
- **No browsing history is collected.** The extension checks the current page hostname against your configured list, but does not record, log, or transmit it.
- **No personal data is collected.** The extension has no concept of user accounts, identifiers, or profiles.
- **No data is sold or shared.** There are no third-party services, analytics libraries, or ad networks included.
- **No remote assets are fetched.** All images, sounds, and scripts are bundled within the extension package.

---

## Replacing the Cat Photo

The overlay uses `assets/catcafe.webp`. To use a photo of your own cat:

1. Replace `assets/catcafe.webp` with your photo (keep the same filename, or update the reference in `content.js`)
2. The overlay crops the image into a circle — a square or portrait crop works best
3. Reload the extension at `chrome://extensions`

---

## Development Notes

### Tech stack
- Plain JavaScript, HTML, CSS — no frameworks, no build tools, no npm
- Chrome Extension Manifest V3
- `chrome.alarms` for persistent timer (survives browser restart and service worker termination)
- `chrome.storage.local` for all state — shared between background, popup, options, and content scripts
- `chrome.storage.onChanged` in the content script to react instantly when break mode starts, without requiring the `tabs` permission
- Web Audio API for the meow sound — fully synthesised, no audio files needed

### How the timer works
1. When the extension installs, `background.js` sets `mode: "work"` and creates a `chrome.alarm` for the work duration
2. When the alarm fires, the mode switches to `"break"` and a break alarm is created
3. The content script listens to `chrome.storage.onChanged` — when `mode` changes to `"break"`, it injects the overlay on blocked sites
4. When the break alarm fires, mode returns to `"work"` and the cycle repeats

### Running locally
No build step required. Load the folder directly via `chrome://extensions` → Developer Mode → Load unpacked.

---

## Credits

- Extension concept and development: [Siamese Cat Cafe](https://siamesecat.cafe)
- Cat photo: the real cats at Siamese Cat Cafe
- Built with Chrome Extension Manifest V3, plain JavaScript, and no external dependencies
