// Reusable activity heartbeat.
//
// While the user is logged in, this pings POST /user/heartbeat every 45s so the
// backend can track "online / last active" status. It is:
//   • Visibility-aware — no ping fires while the tab is hidden (saves requests),
//     and it fires immediately the moment the tab becomes visible again.
//   • Idempotent — startHeartbeat() is safe to call repeatedly.
//   • Best-effort — failures are swallowed so activity tracking never surfaces
//     an error to the user or interferes with any page.
//
// Usage: startHeartbeat() after login / on session restore, stopHeartbeat() on
// logout. AuthContext wires this to the auth token lifecycle.

import axios from './axios';

const INTERVAL_MS = 45_000;

let timer = null;
let started = false;

function ping() {
    // Don't ping a hidden tab, and don't ping without a session.
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    if (!localStorage.getItem('token')) return;
    axios.post('/user/heartbeat').catch(() => { /* best-effort */ });
}

function handleVisibility() {
    // Fire straight away when the user comes back to the tab so their status
    // flips to "online" without waiting up to 45s for the next interval.
    if (document.visibilityState === 'visible') ping();
}

export function startHeartbeat() {
    if (started) return;
    started = true;
    ping();                                   // immediate first beat on start
    timer = setInterval(ping, INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibility);
}

export function stopHeartbeat() {
    started = false;
    if (timer) clearInterval(timer);
    timer = null;
    document.removeEventListener('visibilitychange', handleVisibility);
}
