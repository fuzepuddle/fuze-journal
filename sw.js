// fuze's Journal — Service Worker
// Handles background notifications at 14:25 UK every weekday

const SW_VERSION = '1.0.0';

// ── Install & activate ──
self.addEventListener('install', e => {
  console.log('[SW] Installed', SW_VERSION);
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  console.log('[SW] Activated');
  e.waitUntil(clients.claim());
});

// ── Message from page ──
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_REMINDER') {
    console.log('[SW] Scheduling reminder');
    scheduleReminder();
  }
});

// ── Helpers ──
function msUntilUKTime(h, m) {
  const now = new Date();
  // Get current time in Europe/London
  const ukNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
  const target = new Date(ukNow);
  target.setHours(h, m, 0, 0);
  if (target <= ukNow) target.setDate(target.getDate() + 1);
  // Skip weekends
  while (target.getDay() === 0 || target.getDay() === 6) {
    target.setDate(target.getDate() + 1);
  }
  // ms difference (ukNow and now differ only by timezone display, underlying UTC is same)
  const diff = target - ukNow;
  console.log('[SW] Next reminder in', Math.round(diff / 60000), 'minutes');
  return diff;
}

function scheduleReminder() {
  // Clear any existing timer
  if (self._reminderTimer) clearTimeout(self._reminderTimer);

  const ms = msUntilUKTime(14, 25);

  self._reminderTimer = setTimeout(() => {
    self.registration.showNotification("fuze's Journal — NY window in 5 mins 🟡", {
      body: '14:30 UK — check your HTF draw and get ready.',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'ny-reminder',
      renotify: true,
      requireInteraction: false,
      vibrate: [200, 100, 200]
    });
    // Schedule for next day — wait 2 min then reschedule
    setTimeout(scheduleReminder, 2 * 60 * 1000);
  }, ms);
}

// ── Notification click — open the journal ──
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // If journal is already open, focus it
      for (const client of clientList) {
        if (client.url.includes('fuze-journal') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open it
      if (clients.openWindow) {
        return clients.openWindow('https://fuze-journal.vercel.app');
      }
    })
  );
});

// ── On SW startup, auto-schedule if we were previously active ──
// This fires when the browser restarts and re-activates the SW
self.addEventListener('activate', e => {
  e.waitUntil(
    clients.claim().then(() => {
      scheduleReminder();
    })
  );
});
