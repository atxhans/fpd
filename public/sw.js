// Fieldpiece Digital — Service Worker
// Handles Web Push notifications for the live chat feature.

self.addEventListener('push', event => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'New message', body: event.data.text() }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'New message', {
      body: payload.body ?? '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { url: payload.url ?? '/' },
      tag: 'chat-message', // collapses multiple into one notification
      renotify: true,
    }),
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Focus existing tab if already open
        for (const client of windowClients) {
          if ('focus' in client) return client.focus()
        }
        return clients.openWindow(url)
      }),
  )
})
