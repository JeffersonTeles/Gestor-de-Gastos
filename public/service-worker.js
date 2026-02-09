const CACHE_NAME = 'gestor-gastos-v1';
const OFFLINE_URL = '/offline.html';

// Recursos para cache na instalação
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static resources');
      return cache.addAll(STATIC_RESOURCES);
    })
  );
  
  // Força o SW a se tornar ativo imediatamente
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Toma controle de todas as páginas imediatamente
  return self.clients.claim();
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  // Apenas cachear requisições GET
  if (event.request.method !== 'GET') return;
  
  // Ignorar requisições de API (deixar passar para o Supabase)
  if (event.request.url.includes('/rest/v1/') || 
      event.request.url.includes('/auth/v1/') ||
      event.request.url.includes('/storage/v1/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Retornar do cache se disponível
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Tentar buscar da rede
      return fetch(event.request)
        .then((response) => {
          // Não cachear respostas inválidas
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          
          // Clonar a resposta
          const responseToCache = response.clone();
          
          // Adicionar ao cache
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // Se falhar, retornar página offline para navegação
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
    })
  );
});

// Sincronização em background (quando voltar online)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-transactions') {
    event.waitUntil(
      // Aqui você pode implementar lógica para sincronizar
      // transações offline com o servidor
      syncTransactions()
    );
  }
});

// Notificações push
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova atualização disponível',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver agora',
      },
      {
        action: 'close',
        title: 'Fechar',
      },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification('Gestor de Gastos', options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Função auxiliar para sincronizar transações
async function syncTransactions() {
  try {
    // Buscar transações pendentes do IndexedDB
    // Enviar para o servidor
    console.log('[SW] Syncing transactions...');
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    return Promise.reject(error);
  }
}
