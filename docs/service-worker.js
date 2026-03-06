/**
 * Service Worker - SaludTrack PWA
 * =================================
 * Manejo de caché y funcionamiento offline.
 */

const CACHE_NAME = 'saludtrack-v1.0.0';
const OFFLINE_URL = 'offline.html';

// Archivos a cachear durante la instalación
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/offline.html',
    '/manifest.json',
    '/css/styles.css',
    '/css/responsive.css',
    '/js/firebase-config.js',
    '/js/utils.js',
    '/js/auth.js',
    '/js/firestore.js',
    '/js/sync.js',
    '/js/app.js',
    '/js/dashboard.js',
    '/lib/indexeddb.js',
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Instalando...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Cacheando archivos principales');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => {
                console.log('[ServiceWorker] Instalación completada');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[ServiceWorker] Error en instalación:', error);
            })
    );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activando...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[ServiceWorker] Eliminando caché antigua:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[ServiceWorker] Activación completada');
                return self.clients.claim();
            })
    );
});

// Intercepción de peticiones
self.addEventListener('fetch', (event) => {
    // Solo manejar peticiones GET
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Ignorar peticiones a Firebase
    const url = new URL(event.request.url);
    if (url.hostname.includes('firebase') || 
        url.hostname.includes('googleapis') ||
        url.hostname.includes('gstatic')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Retornar respuesta cacheada
                    return cachedResponse;
                }
                
                // Intentar obtener de la red
                return fetch(event.request)
                    .then((response) => {
                        // Verificar respuesta válida
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clonar respuesta para cachear
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch((error) => {
                        console.error('[ServiceWorker] Error en fetch:', error);
                        
                        // Si es una navegación, mostrar página offline
                        if (event.request.mode === 'navigate') {
                            return caches.match(OFFLINE_URL);
                        }
                        
                        return new Response('Sin conexión', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// Escuchar mensajes del cliente
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Sincronización en background (si el navegador lo soporta)
self.addEventListener('sync', (event) => {
    console.log('[ServiceWorker] Sincronización en background:', event.tag);
    
    if (event.tag === 'sync-mediciones') {
        event.waitUntil(
            // Aquí se implementaría la sincronización
            Promise.resolve()
        );
    }
});

// Notificaciones push (si se implementan)
self.addEventListener('push', (event) => {
    console.log('[ServiceWorker] Push recibido');
    
    const options = {
        body: event.data?.text() || 'Nueva notificación de SaludTrack',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };
    
    event.waitUntil(
        self.registration.showNotification('SaludTrack', options)
    );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
    console.log('[ServiceWorker] Click en notificación');
    
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/dashboard.html')
    );
});
