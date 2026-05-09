/* ════════════════════════════════════════════════════════════════
   COYOTE · app.js
   Vanilla JavaScript · no libraries · no backend · no API keys
   Closure-based factory functions for encapsulation
   textContent for ALL user input rendering (XSS-safe)
   ════════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   STORAGE FACTORY
   Wraps localStorage so the rest of the app never touches it
   directly. State lives in this closure — `_subs` is private.
   ──────────────────────────────────────────────────────────── */
function createSubscriptionStore() {
    const STORAGE_KEY = 'coyote.subscriptions.v1';
    const META_KEY    = 'coyote.meta.v1'; // last-monthly-reminder timestamp etc.

    // Private state — held in the closure, never exposed directly
    let _subs = _loadFromStorage();
    const _listeners = []; // Functions to call whenever data changes

    /* Load + parse JSON safely. Returns [] on any error. */
    function _loadFromStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            console.warn('Coyote: could not read storage, starting fresh.', err);
            return [];
        }
    }

    /* Persist current state to localStorage. */
    function _save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(_subs));
        } catch (err) {
            console.error('Coyote: could not write storage. Quota?', err);
        }
    }

    /* Notify any subscribers (UI render functions) that data changed. */
    function _emit() {
        _save();
        _listeners.forEach(fn => fn(_getAll()));
    }

    /* Return a defensive copy so callers can't mutate our state directly. */
    function _getAll() {
        return _subs.map(s => ({ ...s }));
    }

    /* Generate a stable ID. crypto.randomUUID exists in modern browsers. */
    function _generateId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback for older browsers
        return 'sub-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
    }

    /* Public API — returned from this factory */
    return {
        getAll: _getAll,
        count: () => _subs.length,

        /* Add a subscription. Validates required fields, returns new record. */
        add(record) {
            const newSub = {
                id:        _generateId(),
                name:      String(record.name || '').trim().slice(0, 60),
                cost:      Number(record.cost) || 0,
                url:       String(record.url || '').trim().slice(0, 500),
                expiresAt: Number(record.expiresAt) || 0,
                createdAt: Date.now()
            };
            _subs.push(newSub);
            _emit();
            return newSub;
        },

        /* Remove by ID. */
        remove(id) {
            const before = _subs.length;
            _subs = _subs.filter(s => s.id !== id);
            if (_subs.length !== before) _emit();
        },

        /* Update an existing subscription by ID. Returns the updated record
           or null if no subscription with that ID was found. */
        update(id, patch) {
            const idx = _subs.findIndex(s => s.id === id);
            if (idx === -1) return null;
            const old = _subs[idx];
            _subs[idx] = {
                ...old,
                name:      String(patch.name ?? old.name).trim().slice(0, 60),
                cost:      patch.cost !== undefined ? (Number(patch.cost) || 0) : old.cost,
                url:       String(patch.url ?? old.url).trim().slice(0, 500),
                expiresAt: patch.expiresAt !== undefined ? (Number(patch.expiresAt) || 0) : old.expiresAt
            };
            _emit();
            return _subs[idx];
        },

        /* Get a single subscription by ID. */
        getById(id) {
            const s = _subs.find(s => s.id === id);
            return s ? { ...s } : null;
        },

        /* Subscribe to changes — listener receives the full array. */
        onChange(fn) {
            _listeners.push(fn);
            fn(_getAll()); // Fire immediately with current state
        },

        /* Meta helpers — track when we last reminded the user. */
        getMeta() {
            try {
                const raw = localStorage.getItem(META_KEY);
                return raw ? JSON.parse(raw) : {};
            } catch { return {}; }
        },
        setMeta(meta) {
            try {
                localStorage.setItem(META_KEY, JSON.stringify(meta));
            } catch (err) {
                console.warn('Coyote: could not write meta.', err);
            }
        }
    };
}


/* ─────────────────────────────────────────────────────────────
   COUNTDOWN TICKER FACTORY
   Calls a callback every minute (and once immediately) so the
   UI can recompute days/hours/minutes for every active card.
   Encapsulated so the interval handle never escapes.
   ──────────────────────────────────────────────────────────── */
function createCountdownTicker(onTick) {
    let _intervalId = null;

    function _start() {
        if (_intervalId) return;
        onTick(); // Immediate paint
        // Tick every 60s — minute precision is plenty, saves battery
        _intervalId = setInterval(onTick, 60 * 1000);
    }

    function _stop() {
        if (_intervalId) {
            clearInterval(_intervalId);
            _intervalId = null;
        }
    }

    return { start: _start, stop: _stop };
}


/* ─────────────────────────────────────────────────────────────
   TIME UTILITIES
   Pure functions — no state, no side effects.
   ──────────────────────────────────────────────────────────── */

/* Compute days/hours/minutes between now and a future timestamp.
   Returns negative numbers if expired. */
function timeUntil(timestamp) {
    const diff = timestamp - Date.now();
    const expired = diff <= 0;
    const absDiff = Math.abs(diff);
    const days    = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    const hours   = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((absDiff % (1000 * 60 * 60))      / (1000 * 60));
    return { expired, days, hours, minutes, totalMs: diff };
}

/* Is this expiration within the next 24 hours (and not yet past)? */
function isUrgent(timestamp) {
    const ms = timestamp - Date.now();
    return ms > 0 && ms <= 24 * 60 * 60 * 1000;
}

/* Pad single digits to two characters for display */
function pad2(n) {
    return String(Math.max(0, n)).padStart(2, '0');
}

/* Format a number as USD with two decimals */
function formatCost(n) {
    const num = Number(n) || 0;
    return '$' + num.toFixed(2);
}


/* ─────────────────────────────────────────────────────────────
   NOTIFICATION FACTORY
   Wraps the browser Notification API. Hides permission state
   inside the closure so the rest of the app just calls notify().
   ──────────────────────────────────────────────────────────── */
function createNotifier() {
    function _supported() {
        return 'Notification' in window;
    }

    function _permission() {
        return _supported() ? Notification.permission : 'denied';
    }

    /* Ask the user for permission. Returns a promise resolving to
       'granted' / 'denied' / 'default'. */
    async function requestPermission() {
        if (!_supported()) return 'denied';
        if (Notification.permission === 'granted') return 'granted';
        if (Notification.permission === 'denied')  return 'denied';
        try {
            const perm = await Notification.requestPermission();
            return perm;
        } catch {
            return 'denied';
        }
    }

    /* Fire a notification. Quietly no-ops if not granted. */
    function notify(title, body, options = {}) {
        if (!_supported() || Notification.permission !== 'granted') return;
        try {
            new Notification(title, {
                body,
                icon: 'icon-192.png',
                badge: 'icon-192.png',
                tag: options.tag || 'coyote',
                ...options
            });
        } catch (err) {
            console.warn('Coyote: notification failed.', err);
        }
    }

    return { supported: _supported, permission: _permission, requestPermission, notify };
}


/* ─────────────────────────────────────────────────────────────
   CALENDAR REMINDERS — three paths, no backend
   1. Download .ics file (Apple, ProtonMail, Fastmail, anything)
   2. Google Calendar URL (opens GCal pre-filled in browser)
   3. Outlook URL (opens Outlook web pre-filled)

   All three use the same source data: a subscription's name +
   expiration. We set a calendar event 1 hour wide ending exactly
   at the trial expiration, with a 24-hour-before reminder.
   ──────────────────────────────────────────────────────────── */

/* Format a Date as YYYYMMDDTHHMMSSZ (iCalendar UTC format) */
function toICalDate(d) {
    return d.getUTCFullYear()
         + String(d.getUTCMonth() + 1).padStart(2, '0')
         + String(d.getUTCDate()).padStart(2, '0')
         + 'T'
         + String(d.getUTCHours()).padStart(2, '0')
         + String(d.getUTCMinutes()).padStart(2, '0')
         + String(d.getUTCSeconds()).padStart(2, '0')
         + 'Z';
}

/* Escape characters that have meaning in iCalendar TEXT fields. */
function icsEscape(s) {
    return String(s || '')
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
}

/* Build the reminder event details from a subscription record. */
function buildReminderDetails(sub) {
    // Event ENDS at the trial expiration. Starts 1 hour earlier
    // so it's a visible block on the calendar.
    const endDate   = new Date(sub.expiresAt);
    const startDate = new Date(sub.expiresAt - 60 * 60 * 1000);
    const title     = `${sub.name} trial ends — cancel or get charged ${formatCost(sub.cost)}`;
    const description =
        `Your free trial of ${sub.name} is about to convert to a paid subscription.\n\n` +
        `If you don't want to be charged ${formatCost(sub.cost)}/month, cancel before this time.\n\n` +
        (sub.url ? `Manage: ${sub.url}\n\n` : '') +
        `Reminder set by Coyote.`;
    return { startDate, endDate, title, description, location: sub.url || '' };
}

/* Generate iCalendar (.ics) text for a subscription. */
function buildIcsContent(sub) {
    const { startDate, endDate, title, description, location } = buildReminderDetails(sub);
    const now = new Date();
    const uid = 'coyote-' + sub.id + '@coyote.local';

    // Standard iCalendar format. Lines must use CRLF (\r\n).
    // VALARM section creates a 24-hour-before notification.
    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Coyote//Trial Tracker//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        'UID:' + uid,
        'DTSTAMP:' + toICalDate(now),
        'DTSTART:' + toICalDate(startDate),
        'DTEND:'   + toICalDate(endDate),
        'SUMMARY:' + icsEscape(title),
        'DESCRIPTION:' + icsEscape(description),
        location ? 'LOCATION:' + icsEscape(location) : '',
        'BEGIN:VALARM',
        'TRIGGER:-P1D',                          // 1 day before
        'ACTION:DISPLAY',
        'DESCRIPTION:' + icsEscape(title),
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');
}

/* Trigger a download of the .ics file for a subscription. */
function downloadIcs(sub) {
    const content = buildIcsContent(sub);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // File name: coyote-hulu-2026-05-15.ics
    const safeName = (sub.name || 'subscription').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const expDate = new Date(sub.expiresAt).toISOString().slice(0, 10);
    a.download = `coyote-${safeName}-${expDate}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* Build a Google Calendar event-creation URL.
   Opens GCal pre-filled with the event details. */
function buildGoogleCalendarUrl(sub) {
    const { startDate, endDate, title, description, location } = buildReminderDetails(sub);
    // Google's format: YYYYMMDDTHHMMSSZ/YYYYMMDDTHHMMSSZ (no separator dashes)
    const dates = toICalDate(startDate) + '/' + toICalDate(endDate);
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: dates,
        details: description,
        location: location
    });
    return 'https://calendar.google.com/calendar/render?' + params.toString();
}

/* Build an Outlook (live.com) event-creation URL.
   Outlook expects ISO-8601 with timezone offset. */
function buildOutlookUrl(sub) {
    const { startDate, endDate, title, description, location } = buildReminderDetails(sub);
    const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        startdt: startDate.toISOString(),
        enddt:   endDate.toISOString(),
        subject: title,
        body:    description,
        location: location
    });
    return 'https://outlook.live.com/calendar/0/deeplink/compose?' + params.toString();
}




/* ─────────────────────────────────────────────────────────────
   RENDER — pure DOM functions; never touch state directly
   All user-input fields are written via textContent (XSS-safe)
   ──────────────────────────────────────────────────────────── */

/* Build a single subscription card and return the element. */
function buildSubCard(sub) {
    const card = document.createElement('article');
    card.className = 'sub-card';
    card.dataset.id = sub.id;

    const t = timeUntil(sub.expiresAt);
    if (isUrgent(sub.expiresAt)) card.classList.add('is-urgent');

    /* ── Head: name + cost ── */
    const head = document.createElement('div');
    head.className = 'sub-card-head';

    const nameWrap = document.createElement('div');
    const nameEl = document.createElement('div');
    nameEl.className = 'sub-name';
    // textContent — never innerHTML for user input
    nameEl.textContent = sub.name || 'Untitled';
    nameWrap.appendChild(nameEl);

    if (t.expired) {
        const badge = document.createElement('span');
        badge.className = 'sub-expired-badge';
        badge.textContent = 'expired';
        nameWrap.appendChild(badge);
    }

    const costWrap = document.createElement('div');
    costWrap.style.textAlign = 'right';
    const costEl = document.createElement('div');
    costEl.className = 'sub-cost';
    costEl.textContent = formatCost(sub.cost);
    const costSub = document.createElement('div');
    costSub.className = 'sub-cost-sub';
    costSub.textContent = '/ month';
    costWrap.appendChild(costEl);
    costWrap.appendChild(costSub);

    head.appendChild(nameWrap);
    head.appendChild(costWrap);
    card.appendChild(head);

    /* ── Countdown timer (days / hours / minutes) ── */
    const countdown = document.createElement('div');
    countdown.className = 'sub-countdown';

    const cells = [
        { num: t.expired ? '—' : pad2(t.days),    label: 'days' },
        { num: t.expired ? '—' : pad2(t.hours),   label: 'hours' },
        { num: t.expired ? '—' : pad2(t.minutes), label: 'mins' }
    ];

    cells.forEach(c => {
        const cell = document.createElement('div');
        cell.className = 'countdown-cell';
        const numEl = document.createElement('div');
        numEl.className = 'countdown-num';
        numEl.textContent = c.num;
        const labelEl = document.createElement('div');
        labelEl.className = 'countdown-label';
        labelEl.textContent = c.label;
        cell.appendChild(numEl);
        cell.appendChild(labelEl);
        countdown.appendChild(cell);
    });
    card.appendChild(countdown);

    /* ── Meta row: link + delete button ── */
    const meta = document.createElement('div');
    meta.className = 'sub-meta';

    if (sub.url) {
        const link = document.createElement('a');
        link.className = 'sub-link';
        // Defensive: only allow http(s); reject javascript:, data:, file:, etc.
        let safeUrl = '';
        if (/^https?:\/\//i.test(sub.url)) {
            safeUrl = sub.url;
        } else if (/^[a-z][a-z0-9+.-]*:/i.test(sub.url)) {
            // Has a scheme but not http(s) — reject for safety
            safeUrl = '';
        } else {
            // No scheme — assume https
            safeUrl = 'https://' + sub.url;
        }
        if (safeUrl) {
            link.href = safeUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            try {
                link.textContent = new URL(safeUrl).hostname;
            } catch {
                link.textContent = sub.url.slice(0, 40);
            }
            meta.appendChild(link);
        } else {
            const placeholder = document.createElement('span');
            placeholder.style.color = 'var(--c-bone-mute)';
            placeholder.textContent = 'Invalid URL';
            meta.appendChild(placeholder);
        }
    } else {
        const placeholder = document.createElement('span');
        placeholder.style.color = 'var(--c-bone-mute)';
        placeholder.textContent = 'No URL';
        meta.appendChild(placeholder);
    }

    const actions = document.createElement('div');
    actions.className = 'sub-actions';

    // Calendar button — opens popover with three options
    const calBtn = document.createElement('button');
    calBtn.className = 'sub-action calendar';
    calBtn.setAttribute('aria-label', 'Add to calendar');
    calBtn.title = 'Add to calendar';
    calBtn.textContent = '📅';
    calBtn.dataset.action = 'calendar';
    calBtn.dataset.id = sub.id;
    actions.appendChild(calBtn);

    // Edit button — opens the form pre-filled with this subscription's data
    const editBtn = document.createElement('button');
    editBtn.className = 'sub-action edit';
    editBtn.setAttribute('aria-label', 'Edit subscription');
    editBtn.title = 'Edit';
    editBtn.textContent = '✎';
    editBtn.dataset.action = 'edit';
    editBtn.dataset.id = sub.id;
    actions.appendChild(editBtn);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'sub-action delete';
    deleteBtn.setAttribute('aria-label', 'Delete subscription');
    deleteBtn.title = 'Delete';
    deleteBtn.textContent = '×';
    deleteBtn.dataset.action = 'delete';
    deleteBtn.dataset.id = sub.id;
    actions.appendChild(deleteBtn);

    meta.appendChild(actions);
    card.appendChild(meta);

    return card;
}

/* Render all subscriptions into the list. */
function renderSubsList(subs, listEl, emptyEl) {
    listEl.innerHTML = ''; // safe: we control this content
    if (subs.length === 0) {
        emptyEl.hidden = false;
        return;
    }
    emptyEl.hidden = true;
    // Sort by expiration ascending (most urgent first)
    const sorted = [...subs].sort((a, b) => a.expiresAt - b.expiresAt);
    sorted.forEach(sub => listEl.appendChild(buildSubCard(sub)));
}

/* Render the three stat cards. */
function renderStats(subs) {
    const active = subs.filter(s => !timeUntil(s.expiresAt).expired);
    const urgent = active.filter(s => isUrgent(s.expiresAt));
    const totalCost = active.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);

    const $ = (id) => document.getElementById(id);

    $('statActive').textContent = active.length;
    $('statActiveSub').textContent =
        active.length === 0 ? 'Add one to start' :
        active.length === 1 ? 'One being watched' :
        `Across ${active.length} services`;

    $('statCost').textContent = formatCost(totalCost);
    $('statCostSub').textContent = active.length === 0 ? 'Nothing active' : 'Per month, all active';

    $('statWarn').textContent = urgent.length;
    $('statWarnSub').textContent =
        urgent.length === 0 ? 'All clear' :
        urgent.length === 1 ? 'One needs attention' :
        `${urgent.length} need attention`;

    // Toggle the warning state styling
    const warnCard = $('statWarnCard');
    if (urgent.length > 0) warnCard.classList.add('has-warning');
    else warnCard.classList.remove('has-warning');
}


/* ─────────────────────────────────────────────────────────────
   TOAST — small bottom feedback chip
   ──────────────────────────────────────────────────────────── */
function showToast(message, kind = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.toggle('toast-warn', kind === 'warn');
    toast.hidden = false;
    // Force reflow so transition triggers
    void toast.offsetWidth;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        // Hide after fade
        setTimeout(() => { toast.hidden = true; }, 300);
    }, 2400);
}


/* ─────────────────────────────────────────────────────────────
   MODAL CONTROLS
   ──────────────────────────────────────────────────────────── */
function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.hidden = false;
    // Focus the first input or close button for keyboard users
    const firstInput = m.querySelector('input:not([type=hidden]), button');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
    // NOTE: removed body.style.overflow=hidden because it caused stuck-modal
    // edge cases in some browsers. The fixed-position backdrop already
    // covers the viewport, so background scroll is mostly cosmetic.
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.hidden = true;
    document.body.style.overflow = '';
}

// Global hard-close: nukes any open modal-backdrop element.
function closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => {
        m.hidden = true;
    });
    document.body.style.overflow = '';
}


/* ─────────────────────────────────────────────────────────────
   PWA INSTALL
   Captures the beforeinstallprompt event so we can show our own
   "Install" button (better UX than the browser default banner).
   ──────────────────────────────────────────────────────────── */
function setupInstallPrompt() {
    let _deferredPrompt = null;
    const installBtn = document.getElementById('installBtn');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();        // Don't show the browser's own banner
        _deferredPrompt = e;       // Stash for later use
        if (installBtn) installBtn.hidden = false;
    });

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!_deferredPrompt) {
                // iOS Safari has no programmatic install, so we explain manually
                showToast('On iPhone: tap Share, then "Add to Home Screen"', 'info');
                return;
            }
            _deferredPrompt.prompt();
            const { outcome } = await _deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                showToast('Coyote installed. Look for the icon on your home screen.');
            }
            _deferredPrompt = null;
            installBtn.hidden = true;
        });
    }

    // If running standalone (already installed) — hide the install button
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
        if (installBtn) installBtn.hidden = true;
    }
}


/* ─────────────────────────────────────────────────────────────
   PREFILL FROM URL
   When Coyote is opened via the Web Share Target API, query params
   populate the form. Triggered by ?prefill=1 OR by share-target params.
   ──────────────────────────────────────────────────────────── */
function checkPrefillFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const fromBookmarklet = params.has('prefill');
    const fromShareTarget = params.has('title') || params.has('text');

    if (!fromBookmarklet && !fromShareTarget) return;

    // Pull whichever fields are present
    const name = params.get('name') || params.get('title') || '';
    const url  = params.get('url')  || params.get('text')  || '';

    // Open the Add modal with values pre-filled
    setTimeout(() => {
        openModal('addModal');
        const nameField = document.getElementById('fName');
        const urlField  = document.getElementById('fUrl');
        if (nameField && name) nameField.value = name.slice(0, 60);
        if (urlField  && url)  urlField.value  = url.slice(0, 500);
        // Clear the URL so refresh doesn't re-trigger
        history.replaceState({}, '', window.location.pathname);
    }, 200);
}


/* ─────────────────────────────────────────────────────────────
   MONTHLY REMINDER
   Once per calendar month, on first launch, show a notification
   summarizing how many subscriptions the user has.
   ──────────────────────────────────────────────────────────── */
function maybeFireMonthlyReminder(store, notifier) {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
    const meta = store.getMeta();

    if (meta.lastMonthlyReminder === yearMonth) return; // Already done this month

    const subs = store.getAll();
    if (subs.length === 0) {
        // Save anyway so we don't re-check repeatedly this month
        store.setMeta({ ...meta, lastMonthlyReminder: yearMonth });
        return;
    }

    const totalCost = subs.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);
    const summary = `You're tracking ${subs.length} subscription${subs.length === 1 ? '' : 's'} totaling ${formatCost(totalCost)}/mo.`;

    // Show in-app toast always (works without notification permission)
    showToast(summary);

    // Also fire a system notification if permitted
    if (notifier.permission() === 'granted') {
        notifier.notify('Coyote · Monthly check-in', summary, { tag: 'monthly' });
    }

    store.setMeta({ ...meta, lastMonthlyReminder: yearMonth });
}


/* ─────────────────────────────────────────────────────────────
   24-HOUR-WARNING NOTIFICATIONS
   Runs whenever data changes. Sends a one-time notification per
   subscription when it crosses the 24-hour threshold.
   ──────────────────────────────────────────────────────────── */
function fireUrgencyNotifications(subs, store, notifier) {
    if (notifier.permission() !== 'granted') return;
    const meta = store.getMeta();
    const warned = meta.warnedIds || [];
    const stillUrgent = [];
    let changed = false;

    subs.forEach(sub => {
        if (isUrgent(sub.expiresAt)) {
            stillUrgent.push(sub.id);
            if (!warned.includes(sub.id)) {
                notifier.notify(
                    `${sub.name} ends within 24 hours`,
                    `Your trial expires soon. Tap to review.`,
                    { tag: 'urgent-' + sub.id }
                );
                changed = true;
            }
        }
    });

    // Save the new warned-list (only IDs that are STILL urgent — old ones drop off)
    if (changed || warned.length !== stillUrgent.length) {
        store.setMeta({ ...meta, warnedIds: stillUrgent });
    }
}


/* ─────────────────────────────────────────────────────────────
   INIT — wire everything together
   ──────────────────────────────────────────────────────────── */
function init() {
    const store    = createSubscriptionStore();
    const notifier = createNotifier();

    const listEl  = document.getElementById('subsList');
    const emptyEl = document.getElementById('emptyState');

    /* Render whenever data changes */
    function rerender(subs) {
        renderSubsList(subs, listEl, emptyEl);
        renderStats(subs);
        fireUrgencyNotifications(subs, store, notifier);
    }
    store.onChange(rerender);

    /* Tick countdowns every minute */
    const ticker = createCountdownTicker(() => rerender(store.getAll()));
    ticker.start();

    /* ── Edit-mode tracking ──
       When _editingId is null, the modal is in "add" mode.
       When _editingId is a subscription ID, the modal is editing it.
       This single variable controls modal title, button text, and submit behavior. */
    let _editingId = null;

    /* Helper: switch the Add modal between add-mode and edit-mode display. */
    function setModalMode(mode, sub = null) {
        const titleEl    = document.getElementById('addModalTitle');
        const subEl      = document.querySelector('#addModal .modal-sub');
        const saveBtn    = document.getElementById('saveBtn');
        const fieldset   = document.querySelector('#addModal .remember-fieldset');

        if (mode === 'edit' && sub) {
            _editingId = sub.id;
            titleEl.textContent = 'Edit subscription';
            if (subEl) subEl.textContent = 'Update any field and save.';
            saveBtn.textContent = 'Update';
            // The "Want me to remember this?" question is only relevant on first save
            if (fieldset) fieldset.style.display = 'none';
        } else {
            _editingId = null;
            titleEl.textContent = 'Did you just sign up?';
            if (subEl) subEl.textContent = 'I\'ll remember it for you and warn you before you get charged.';
            saveBtn.textContent = 'Save it';
            if (fieldset) fieldset.style.display = '';
            // Reset the radio to default Yes
            const yesRadio = document.querySelector('input[name="remember"][value="yes"]');
            if (yesRadio) yesRadio.checked = true;
        }
    }

    /* ── Add button → open modal in add mode ── */
    document.getElementById('addBtn').addEventListener('click', () => {
        const form = document.getElementById('addForm');
        if (form) form.reset();
        // Pre-fill expiration to 7 days out — typical free-trial length
        const exp = document.getElementById('fExpires');
        if (exp) {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            exp.value = d.toISOString().slice(0, 10);
        }
        setModalMode('add');
        openModal('addModal');
    });

    document.getElementById('addCloseBtn').addEventListener('click', () => closeModal('addModal'));
    document.getElementById('cancelBtn').addEventListener('click', () => closeModal('addModal'));

    /* ── Add/Edit form submit ── */
    document.getElementById('addForm').addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('fName').value.trim();
        const cost = parseFloat(document.getElementById('fCost').value);
        const url  = document.getElementById('fUrl').value.trim();
        const expDateStr = document.getElementById('fExpires').value;

        if (!name) { showToast('Please enter a service name.', 'warn'); return; }
        if (isNaN(cost) || cost < 0) { showToast('Please enter a valid cost.', 'warn'); return; }
        if (!expDateStr) { showToast('Please pick an expiration date.', 'warn'); return; }

        // Date input gives us YYYY-MM-DD; treat as end-of-day local time
        const expiresAt = new Date(expDateStr + 'T23:59:59').getTime();

        if (_editingId) {
            // EDIT MODE — update existing record
            store.update(_editingId, { name, cost, url, expiresAt });
            closeModal('addModal');
            showToast(`Updated ${name}.`);
            _editingId = null;
        } else {
            // ADD MODE — check the remember question first
            const remember = document.querySelector('input[name="remember"]:checked').value;
            if (remember === 'no') {
                closeModal('addModal');
                showToast('Got it. Nothing saved.');
                return;
            }
            store.add({ name, cost, url, expiresAt });
            closeModal('addModal');
            showToast(`Saved. I'll remind you before ${name} bills.`);
        }
    });

    /* ── Card click handlers (event delegation): calendar + edit + delete ── */
    listEl.addEventListener('click', (e) => {
        // Calendar button — opens the choice modal with this sub's data
        const calTarget = e.target.closest('[data-action="calendar"]');
        if (calTarget) {
            const id = calTarget.dataset.id;
            const sub = store.getById(id);
            if (!sub) return;

            // Wire the three choice buttons to THIS subscription's data
            const googleLink  = document.getElementById('calGoogleBtn');
            const outlookLink = document.getElementById('calOutlookBtn');
            const icsBtn      = document.getElementById('calIcsBtn');

            googleLink.href  = buildGoogleCalendarUrl(sub);
            outlookLink.href = buildOutlookUrl(sub);

            // Replace previous click handler on the .ics button
            // (we do this via property assignment so re-opening the modal
            // for a different subscription doesn't stack listeners)
            icsBtn.onclick = () => {
                downloadIcs(sub);
                showToast('Calendar file downloaded. Open it to add the reminder.');
                closeModal('calendarModal');
            };

            // Show a friendly toast on choosing Google or Outlook + close modal
            googleLink.onclick = () => {
                showToast('Opening Google Calendar…');
                setTimeout(() => closeModal('calendarModal'), 200);
            };
            outlookLink.onclick = () => {
                showToast('Opening Outlook…');
                setTimeout(() => closeModal('calendarModal'), 200);
            };

            openModal('calendarModal');
            return;
        }

        // Edit button
        const editTarget = e.target.closest('[data-action="edit"]');
        if (editTarget) {
            const id = editTarget.dataset.id;
            const sub = store.getById(id);
            if (!sub) return;

            // Pre-fill form with current values
            document.getElementById('fName').value = sub.name || '';
            document.getElementById('fCost').value = sub.cost ?? '';
            document.getElementById('fUrl').value  = sub.url  || '';
            // Convert ms timestamp back to YYYY-MM-DD for the date input
            const d = new Date(sub.expiresAt);
            const yyyy = d.getFullYear();
            const mm   = String(d.getMonth() + 1).padStart(2, '0');
            const dd   = String(d.getDate()).padStart(2, '0');
            document.getElementById('fExpires').value = `${yyyy}-${mm}-${dd}`;

            setModalMode('edit', sub);
            openModal('addModal');
            return;
        }

        // Delete button
        const deleteTarget = e.target.closest('[data-action="delete"]');
        if (deleteTarget) {
            const id = deleteTarget.dataset.id;
            if (!id) return;
            if (confirm('Stop tracking this subscription?')) {
                store.remove(id);
                showToast('Removed.');
            }
        }
    });

    /* ── Notification permission button ── */
    document.getElementById('notifyBtn').addEventListener('click', async () => {
        if (!notifier.supported()) {
            showToast('This browser does not support notifications.', 'warn');
            return;
        }
        const result = await notifier.requestPermission();
        if (result === 'granted') {
            showToast('Notifications on. I\'ll warn you 24h before charges.');
        } else if (result === 'denied') {
            showToast('Notifications blocked. Check your browser settings.', 'warn');
        } else {
            showToast('Permission not granted.');
        }
    });

    /* ── Capture explainer modal ── */
    document.getElementById('captureBtn').addEventListener('click', () => openModal('captureModal'));
    document.getElementById('captureCloseBtn').addEventListener('click', () => closeModal('captureModal'));
    document.getElementById('captureDoneBtn').addEventListener('click', () => closeModal('captureModal'));

    /* ── Close modals on backdrop click + Escape key ── */
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeAllModals();
        });
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllModals();
    });

    /* ── PARANOID-MODE GLOBAL CLOSER ──
       Window-level capture-phase click listener that closes ANY open modal
       when ANY of these is clicked:
         - element with [data-close-modal]
         - element with class "modal-close"
         - the .modal-backdrop itself (clicked outside the modal box)
       Capture phase = runs BEFORE any other handler, even if a child element
       has stopPropagation. This is the safety net that guarantees the user
       can always escape the modal. ── */
    window.addEventListener('click', (e) => {
        const t = e.target;
        if (!t || !t.closest) return;

        const isCloseRequest =
            t.closest('[data-close-modal]') ||
            t.closest('.modal-close');

        if (isCloseRequest) {
            closeAllModals();
            return;
        }

        // Backdrop clicked directly (not its children)
        if (t.classList && t.classList.contains('modal-backdrop')) {
            closeAllModals();
        }
    }, true); // ← capture phase

    /* ── PWA install prompt ── */
    setupInstallPrompt();

    /* ── Register service worker (PWA offline + installable) ── */
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => {
            console.warn('Coyote: service worker registration failed.', err);
        });
    }

    /* ── Check for prefill from Share Target ── */
    checkPrefillFromUrl();

    /* ── Once-per-month reminder ── */
    setTimeout(() => maybeFireMonthlyReminder(store, notifier), 1500);
}

/* Boot the app */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
