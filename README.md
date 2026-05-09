<p align="center">
  <img src="icon-192.png" alt="Coyote Logo" width="140">
</p>

A subscription and free-trial tracker built for the moment that always catches you off guard — *the surprise charge after a forgotten trial*. Coyote lives in your browser, watches the clock, pulses when a trial is about to bill, and pushes calendar reminders to wherever your calendar already syncs. The whole experience is local-only, no account, no signup — *catch the trial before it bills*.

## 👤 Author
**Jacqueline**
[Check out my GitHub Profile](https://github.com/jdbostonbu-ops)
🚀 **[Try the Live App](https://jdbostonbu-ops.github.io/Claude-coyote-subscription-tracker/)**

<p align="center">
  <img src="coyote-demo.gif" alt="Coyote Showcase Demo" width="600">
</p>

## 🎨 Brand Identity — Theme & Font Choices

Coyote's brand is built around one idea: **a calm desert at night, watching for what's about to bill you**. Every design decision serves that mood.

### The Moonlit Canyon Palette

| Color | Hex | Role |
| :--- | :--- | :--- |
| **Midnight** | `#0F1419` | Primary background — deep canyon at night |
| **Coyote Gold** | `#E0A458` | Primary accent — the moon, the eye, the price |
| **Bone** | `#E8DCC4` | Primary text — warm off-white, easy on tired eyes |
| **Sage** | `#6B7257` | Secondary accent — calm, hopeful |
| **Clay** | `#C76847` | Urgent state — pulses when a trial is under 24 hours |

The midnight-and-gold pairing is intentional. Most subscription apps go cold tech-blue. Coyote went warm-dark — the feeling of looking up at a night sky over a canyon, not staring at a server admin panel. The gold accent is exclusively reserved for prices, the moon mark, and active states; clay-red is reserved for urgency. Color carries meaning at every step.

### Typography — Fraunces + Inter

| Typeface | Use | Why |
| :--- | :--- | :--- |
| **Fraunces** (700 italic-capable serif) | Wordmark, prices, status headings | Editorial gravitas — the serif italic in *"Coyote"* makes the wordmark unmistakable |
| **Inter** (400/500/600 sans) | Body, UI labels, buttons | Modern, neutral, screen-optimized — handles the utility |
| **JetBrains Mono** (400/500) | Countdown numerals | Tabular, monospaced — the seconds line up perfectly as they tick |

The typography pairs an italic serif (warmth, deliberateness) with a sans (utility, screen legibility) and a mono (data, precision). That three-voice contrast is the brand. Wherever you see *Coy**o**te* in italic Fraunces with the gold middle "o," you know it's the same product. **The gold "o" doubles as the moon** — tiny, ownable, repeatable across icons, social posts, and screenshots.

## 🎓 Built During Next Chapter — Phase I

This project was designed and built during **Phase I of Thinking with AI** at Next Chapter Apprenticeship. Each lesson fed directly into this build:

- **Computational Thinking** — Decomposing the project into independent units (state store, countdown ticker, notifier, calendar exporter), recognizing the recurring closure-based factory pattern, and abstracting the calendar reminder into three interchangeable paths (.ics, Google, Outlook) so the UI doesn't care which one the user picks.
- **HTML / CSS / Forms** — Semantic landmark structure, accessible labels with `for` attributes throughout, mobile-first responsive layouts, three-up dashboard at 600px+ breakpoint, urgent-state pulsing animations with `prefers-reduced-motion` respected.
- **JavaScript Fundamentals** — Closure-based factory functions (`createSubscriptionStore`, `createCountdownTicker`, `createNotifier`) keeping all state private; `textContent` for every user-rendered field for XSS safety; URL sanitization that rejects `javascript:`, `data:`, and `file:` schemes outright.
- **Debugging** — Hunting a stuck-modal bug across multiple rounds and learning the hard way that `display: grid` overrides the browser's default `[hidden]` behavior — fixed with a `.modal-backdrop[hidden] { display: none !important; }` rule that has since become a permanent pattern.

The project demonstrates everything Phase II covered, deployed as a working PWA.

## 🌐 Browser & Device Compatibility

| Browser / Device | Status | Performance Notes |
| :--- | :--- | :--- |
| **Google Chrome** | ✅ Tested | Full support — countdown timers, notifications, PWA install, calendar export. |
| **Microsoft Edge** | ✅ Tested | Matches Chrome rendering engine exactly. |
| **Firefox** | ✅ Tested | Full feature support including notifications and `.ics` download. |
| **Apple Safari (macOS)** | ✅ Tested | Calendar files open directly into Apple Calendar with one click. |
| **iPhone (iOS Safari)** | ✅ Tested | Add-to-Home-Screen, Web Share Target, calendar imports to iCloud Calendar. |
| **iPad / iPadOS** | ✅ Tested | Responsive grids adapt correctly to tablet viewports. |

## 🌟 Key Features

- **Live Countdown Cards:** Every subscription becomes a card showing days, hours, and minutes remaining. Numbers tick every minute with millisecond accuracy preserved across tab backgrounding via `requestAnimationFrame` + end-timestamp recomputation.
- **Pulsing Urgent State:** When a trial drops under 24 hours, the card border pulses clay-red and the card moves to the top of the dashboard.
- **Stat Dashboard:** Three at-a-glance metrics — active trials, total monthly cost across active subscriptions, and ending-soon count. The Ending Soon card visually shifts to a warning state when anything's urgent.
- **Web Share Target Capture:** Coyote installs as a PWA on iPhone, Android, Mac, and Windows — and once installed, *appears in your phone's Share menu*. On any signup page, hit Share → Coyote, and the Add form opens with the URL and page title pre-filled. You only type the cost and trial-end date.
- **Edit-in-Place:** Each card has a ✎ button that opens the form pre-filled with current values. Modal title swaps to "Edit subscription," save button swaps to "Update," and the same card updates without creating a duplicate.
- **One-Click Calendar Reminders:** Each card has a 📅 button that opens a three-choice modal — *Google Calendar*, *Outlook*, *Apple Calendar / Other (.ics)*. The reminder fires 24 hours before the trial expires.
- **Browser Notifications:** Optional permission-based system notifications fire when a trial enters the under-24-hour urgent window.
- **Monthly Check-In:** Once per calendar month, Coyote shows a soft summary toast on first visit — "You're tracking 3 subscriptions totaling $42.97/mo."
- **PWA Installable:** Add to Home Screen on iPhone, ⬇ Install button on Chrome/Edge desktop. Coyote becomes a standalone app with no browser chrome.
- **Progress Persistence:** All data saves to `localStorage` — no account required, no server, nothing leaves the device.
- **Accessible Throughout:** Every label uses `for` attributes, `aria-pressed` toggles correctly, keyboard navigation works for all controls, every animation respects `@media (prefers-reduced-motion)`.

## 🔒 Privacy & Your Data

Coyote was built to know nothing about you that you don't tell it.

- **No account, no signup.** You can track subscriptions, get reminders, and export to calendar without creating an account or sharing personal information.
- **Your subscriptions stay on your device.** All subscription data, reminder preferences, and meta state are saved only in your browser's local storage. Clearing your browser data clears your subscriptions — nothing lives on a server.
- **No server, anywhere.** Coyote has no backend, no database, no API. It's a static site. Once your browser loads it, nothing else gets sent over the network.
- **Calendar exports are local.** When you click "Apple Calendar / Other," a `.ics` file is generated in your browser using the iCalendar standard and downloaded to your device. The file never touches a server.
- **Google Calendar / Outlook links open with your data in the URL** so the calendar provider can pre-fill the event form — but the data is sent only to that provider, only when you click, and only with the fields you've already entered (service name, cost, expiration date, optional URL).

Coyote doesn't use cookies, doesn't track you, and doesn't have a database that stores anything about you.

## 🛠️ Tech Stack

- **Frontend:** Vanilla JavaScript (ES6+) — closure-based factory functions, `requestAnimationFrame` for accurate countdowns, `localStorage` for persistence, `crypto.randomUUID()` for stable IDs
- **Styling:** CSS3 — Custom Properties, CSS Grid, Flexbox, `@keyframes` for the urgent pulse, `clamp()` for fluid typography, mobile-first responsive design with breakpoints at 480px and 600px
- **Typography:** Fraunces, Inter, JetBrains Mono — Google Fonts
- **PWA:** Web App Manifest with `share_target` for Android/Chrome share menu integration; service worker (`sw.js`) using network-first strategy with offline fallback
- **Calendar Standard:** RFC 5545 iCalendar (`.ics`) generated client-side — no library; includes `VALARM` block with `TRIGGER:-P1D` for 24-hours-before reminders
- **Calendar URL Templates:** Google Calendar's `action=TEMPLATE` URL format and Outlook's `rru=addevent` deeplink format — both fully URL-encoded with `URLSearchParams`
- **Notifications:** Browser-native `Notification` API with permission gating, falls back to in-app toast when not permitted
- **Deployment:** GitHub Pages — static site, automatic HTTPS, auto-deploy on every push to `main`

## 🚀 The User Flow

- **Land on the dashboard** → see the *Coy**o**te* wordmark with the gold "o" moon, three stat cards (active / monthly cost / ending soon), and a clean empty state if nothing's tracked yet
- **Click "+ Add subscription"** → modal opens with Service Name, Monthly Cost, URL (optional), Trial End Date, and a "Want me to remember this?" yes/no question
- **Or share to Coyote from your phone** → install Coyote as a PWA → finish a free-trial signup → tap Share on the confirmation page → pick Coyote → the form opens with URL and title pre-filled
- **Save the subscription** → a card appears with a live countdown ticking days/hours/minutes
- **Watch the dashboard update** → stats recompute, monthly cost totals across all active trials, urgent count tracks anything under 24 hours
- **Click 📅 on any card** → choose how you want to be reminded: Google Calendar, Outlook, or `.ics` download for everything else
- **Click ✎ on any card** → fix a typo or update the date without re-entering everything
- **Receive your reminder 24 hours before the trial bills** → from your calendar, your phone, your watch, wherever your calendar syncs

## 📅 Calendar Reminder System — How It Works

Coyote's reminder system is built on the principle that **the most reliable reminder is one that lives outside Coyote**. Browser notifications can fail when tabs are closed; calendar reminders fire from your phone, your watch, your laptop — anywhere your calendar already syncs.

### Three Calendar Paths, One Standard

| Choice | What Happens | Best For |
| :--- | :--- | :--- |
| **Google Calendar** | Opens calendar.google.com with the event pre-filled. User clicks Save. | Gmail and Google Workspace users (most personal accounts) |
| **Outlook** | Opens outlook.live.com with the event pre-filled. User clicks Save. | Outlook, Office 365, Hotmail users |
| **Apple Calendar / Other (.ics)** | Downloads a `.ics` file. Opens directly into the user's default calendar app. | Apple Calendar, ProtonMail, Fastmail, anything else |

All three paths produce the **same event** — Coyote builds the data once and offers three ways to ship it.

### The Mac → iPhone Sync (Why Apple Users Get the Best Experience)

For Mac users with iCloud Calendar enabled, the flow is genuinely magical:

1. Click 📅 on a Coyote card on your MacBook
2. Pick "Apple Calendar / Other"
3. The `.ics` file downloads — double-click it
4. Apple Calendar opens with an "Add to Calendar" dialog. Confirm.
5. **The event syncs to iCloud automatically.**
6. Within seconds, the same event appears on your iPhone, your iPad, your Apple Watch — every device signed into the same iCloud account.

You don't repopulate anything. You don't email yourself. You don't open a separate app on your phone. macOS Calendar pushes the event up to iCloud, iCloud pushes it down to every device, and 24 hours before your trial bills, *every screen you own* is going to remind you.

This is the same `.ics` standard the entire calendar industry runs on (RFC 5545) — but the Apple ecosystem treats Coyote the same way it treats events from your job, your dentist, or your travel itinerary. **Once the event is in your calendar, Coyote's job is done.**

### What's Inside the Reminder Event

Every Coyote calendar event is built with the user in mind:

- **Title:** *"Hulu trial ends — cancel or get charged $14.99"* (the cost is right in the event title)
- **Time:** 1-hour block ending at the trial expiration so you can see it on your day view
- **Description:** Clear next-action language ("Cancel before this time if you don't want to be charged") + the manage-subscription URL if you saved one
- **Alarm:** 24-hour-before reminder via the iCalendar `VALARM` block (`TRIGGER:-P1D`)
- **Location:** The subscription URL, so on iPhone, tapping the location opens straight to the cancellation page

The end result: a calendar event that doesn't need explanation. *"I see this. I know what to do. I have time to do it."*

## 🔐 Architecture Overview

```
Browser (everything happens here)
  ↓ User adds subscription via form OR Web Share Target
Closure-based store
  ↓ createSubscriptionStore() factory holds private _subs array
  ↓ Public API: add, update, remove, getAll, getById, onChange
  ↓ All changes persist to localStorage automatically
Render layer
  ↓ Subscribe to store changes, rebuild dashboard + cards on emit
  ↓ textContent for every user-supplied value (XSS-safe)
Countdown ticker
  ↓ createCountdownTicker() runs every 60 seconds
  ↓ Recomputes days/hours/minutes from end-timestamps
  ↓ Adds .is-urgent class to cards under 24 hours
Calendar export
  ↓ User clicks 📅 → modal opens with three choice buttons
  ↓ buildReminderDetails(sub) computes title, dates, description
  ↓ Three exporters: buildIcsContent, buildGoogleCalendarUrl, buildOutlookUrl
  ↓ User picks one → file downloads OR new tab opens
```

The whole app is **three factory functions** wired together by an `init()` function that handles DOM events. State stays private, the UI subscribes to changes, and persistence is automatic.

## 🎓 Future Vision

- **Bank/Card Integration:** A Plaid integration to detect new subscription charges automatically — capture the cost and merchant without the user typing.
- **Email Forwarding:** A unique "subscriptions@coyote.app" address users could forward signup confirmations to; backend parses the receipt and creates a card.
- **Family Sharing:** Optional shared dashboard for couples or households — "Our trials" not just "My trials."
- **Subscription Cost Drift Detection:** Notify when a recurring charge changes price (Netflix raises monthly fee), not just when a trial expires.
- **Cancellation Concierge:** One-click "cancel for me" assistance for the most common services.
- **Browser Extension:** A capture extension that auto-detects "Free trial — your card will be charged $X.XX after 7 days" language on signup pages and offers to add to Coyote.

## 🧰 Run It Locally

If you want to run a local copy for development:

```bash
# Clone the repo
git clone <your-repo-url>
cd coyote

# Serve as a static site — any of these work:
python3 -m http.server 8000
# OR with VS Code's Live Server extension
# OR with any static file server you prefer

# Open http://localhost:8000 in your browser
```

There's no build step, no `npm install`, no backend to run. Coyote is plain HTML, CSS, and JavaScript — open the folder, serve it, you're running it. PWA features (service worker, install button, Web Share Target) require HTTPS or localhost, both of which the above setup satisfies.

## 🎓 Phase I

Coyote is what I built during Phase I of Thinking with AI — a single, focused tool that solves one real problem (the surprise trial charge) using only the browser, with no backend, no API key, no account, and a calendar-export system reliable enough to live across every device the user owns.

⭐ Love this project? Give it a star and explore the other deployed projects in this portfolio.

<p align="center">
  <img src="favicon.svg" alt="Coyote Logo" width="240">
</p>