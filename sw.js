// Carlos Mentor AI — Service Worker v1.0
const CACHE = 'carlos-mentor-v1';
const ASSETS = ['/carlos-mentor/', '/carlos-mentor/index.html'];

// Instala e faz cache dos assets principais
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// Ativa e limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Serve da cache quando offline (network first, fallback cache)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Recebe mensagem do app para agendar alarme via background sync
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'ALARM_PING') {
    // Mantém SW ativo
  }
});

// Push notification de alarme (quando app está fechado)
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: '⏰ Alarme', body: 'Hora de agir!' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/carlos-mentor/icon-192.png',
      badge: '/carlos-mentor/icon-192.png',
      vibrate: [500, 300, 500, 300, 500],
      requireInteraction: true,
      actions: [
        { action: 'stop', title: '⛔ Desligar' },
        { action: 'snooze', title: '💤 Soneca' }
      ]
    })
  );
});

// Clique na notificação
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'snooze') {
    // Manda mensagem pro app fazer soneca
    self.clients.matchAll().then(clients => {
      clients.forEach(c => c.postMessage({ type: 'SNOOZE' }));
    });
  } else {
    // Abre o app
    e.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        if (clients.length) return clients[0].focus();
        return self.clients.openWindow('/carlos-mentor/');
      })
    );
  }
});
