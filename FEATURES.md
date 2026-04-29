# Siamese Cat Gatekeeper — Feature List

A Pomodoro productivity Chrome extension. A Siamese cat blocks distracting websites
during your breaks so you actually rest.

---

## 1. Pomodoro Timer

- Automatic work → break → work cycle
- **Work duration** — default 25 min (configurable 1–180 min)
- **Break duration** — default 5 min (configurable 1–60 min)
- **Long break duration** — default 15 min (configurable 1–60 min)
- **Long break interval** — every 4 sessions a long break replaces a regular one (configurable 1–20)
- Countdown timer shown live in the popup
- Timer persists across tab switches and browser restarts (uses `chrome.alarms`)

---

## 2. Break Overlay

Appears on blocked sites when a break starts.

- Full-screen overlay with ~25% background website visibility (frosted glass effect)
- Animated Siamese cat image (floating animation)
- Large countdown timer showing time remaining
- Random rotating quote each break (22 built-in quotes about cats, focus, and rest)
- **Siamese Cat Cafe** branding with logo
- "Break Time" badge and "This page will unlock when your break ends" message
- Link to SiameseCat.cafe
- Smooth fade-in / fade-out animations
- Card slides in with spring animation on appearance
- Automatically disappears when break ends
- Scroll and touch interaction blocked on the page behind it

---

## 3. Website Blocking

- **Blocklist mode** — block only the sites you list (default)
- **Whitelist mode** — block everything EXCEPT the sites you list
- Fully customisable domain list (one domain per line, no www needed)
- Default blocked domains: `twitter.com`, `x.com`, `reddit.com`, `youtube.com`,
  `instagram.com`, `facebook.com`, `tiktok.com`
- Works on **single-page apps** (React, Vue, Next.js, etc.) by patching
  `history.pushState` / `replaceState`
- Overlay injected into `<html>` directly — cannot be out-z-indexed by the page

---

## 4. Session Counter

- Counts how many **complete** work sessions you finish each day
- Only increments when the full work timer runs out naturally (not on manual breaks)
- Resets automatically at midnight every day
- Shown in the popup under "sessions today"

---

## 5. Focus Score

- Calculated as: `sessions ÷ (sessions + skips) × 100`
- Colour coded in the popup and stats page:
  - 🟢 **Green** — 80% or above
  - 🟡 **Yellow** — 50–79%
  - 🔴 **Red** — below 50%
- Starts at 100% with no data

---

## 6. Daily Session Goal

- Set a target number of sessions per day (e.g. 6 sessions ≈ 2.5 hrs at 25 min each)
- A **progress bar** appears in the popup showing `completed / goal`
- Bar fills with a mint→pink gradient as you make progress
- Set to **0** to hide the goal bar entirely
- Stats page shows how many of the last 7 days you hit your goal
- Configured in Settings → Timer Settings

---

## 7. Scheduled Auto-start

- Automatically starts a work session at a fixed time every day
- Set your preferred start time using a time picker (e.g. 09:00)
- Toggle on/off without losing your saved time
- Uses `chrome.alarms` — survives browser restarts
- Note: Chrome must be open at the scheduled time

---

## 8. Cat Sound Effect

- Plays a meow (`cat_sound.mp3`) when:
  - A break starts automatically (work timer ends)
  - "Start Break Now" is clicked from the popup
  - "Start Break Now" is clicked from the Settings page
- Can be toggled on/off in Settings → Sound
- Off by default

---

## 9. Extension Popup

Opens when you click the toolbar icon.

- **Mode badge** — WORK (mint) or BREAK (pink) with a coloured dot indicator
- **Large countdown** — live timer showing time until next break or until break ends
- **Sessions today** — number of completed work sessions today
- **Focus score** — today's score with colour coding
- **Daily goal progress bar** — visible only when a goal is set
- **Start Break Now** button — manually trigger a break early
- **End Break Early** button — shown during breaks
- **Settings** button — opens the Settings page
- **View Stats** button — opens the weekly stats page in a new tab
- Siamese Cat Cafe link in the footer

---

## 10. Settings Page

Full configuration page (replaces the browser's default options page).

| Section | Options |
|---|---|
| Timer Settings | Work duration, break duration, long break duration, long break interval, daily session goal |
| Blocking Mode | Blocklist / Whitelist toggle, domain textarea |
| Sound | Toggle cat sound on break start |
| Scheduled Auto-start | Enable toggle, start time picker |
| Actions | Save Settings, Start Break Now, Reset to Defaults |

- Shows a toast notification on save/reset
- Live label updates when switching blocklist ↔ whitelist mode
- Auto-start time row hides/shows based on toggle state
- Info and warning boxes explain features inline

---

## 11. Weekly Stats Page

Opens in a new tab via "View Stats" in the popup.

- **Summary cards:**
  - Total sessions this week
  - Best day (day name + session count)
  - Average focus score this week
  - Goal days hit this week (shown only when a daily goal is set)
- **7-day bar chart:**
  - One bar per day (last 7 days)
  - Bar height = sessions relative to the week's maximum
  - Today's bar highlighted in pink, other days in mint
  - Session count and focus score shown per bar
  - Animated grow-in on page load
- **Focus Score Guide** — colour key explaining green/yellow/red thresholds
- **Empty state** — friendly cat image with message when no sessions recorded yet

---

## 12. Technical Details

| Detail | Value |
|---|---|
| Manifest version | MV3 |
| Permissions | `storage`, `alarms` |
| Host permissions | `<all_urls>` |
| Storage | `chrome.storage.local` (persists across restarts) |
| Background | Service worker (`background.js`) |
| No external dependencies | Plain HTML, CSS, JavaScript only |
| Icon sizes | 16×16, 48×48, 128×128 PNG |

---

*Inspired by the cats at [SiameseCat.cafe](https://siamesecat.cafe) — take your breaks seriously, the cats insist.*
