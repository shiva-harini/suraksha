// Service Worker for Disaster Management PWA
const CACHE_NAME = 'disaster-management-v1';
const OFFLINE_URL = '/offline.html';

const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    'https://cdn.tailwindcss.com/',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Failed to cache resources:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    // Handle navigation requests
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.open(CACHE_NAME)
                        .then((cache) => {
                            return cache.match('/index.html');
                        });
                })
        );
        return;
    }

    // Handle API requests
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Clone the response for caching
                    const responseClone = response.clone();
                    
                    // Cache successful API responses
                    if (response.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    
                    return response;
                })
                .catch(() => {
                    // Return cached API response if available
                    return caches.match(event.request)
                        .then((cachedResponse) => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            
                            // Return offline message for critical endpoints
                            if (event.request.url.includes('/api/sos')) {
                                return new Response(
                                    JSON.stringify({
                                        success: false,
                                        message: 'You are offline. Please try calling emergency services directly at 112.',
                                        offline: true
                                    }),
                                    {
                                        status: 503,
                                        headers: { 'Content-Type': 'application/json' }
                                    }
                                );
                            }
                            
                            // Return empty array for other API endpoints
                            return new Response(
                                JSON.stringify({
                                    success: false,
                                    message: 'Offline - showing cached data',
                                    data: [],
                                    offline: true
                                }),
                                {
                                    status: 200,
                                    headers: { 'Content-Type': 'application/json' }
                                }
                            );
                        });
                })
        );
        return;
    }

    // Handle other requests (images, CSS, JS, etc.)
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    return response;
                }
                
                // Fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache if not a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response for caching
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Return fallback for images
                        if (event.request.destination === 'image') {
                            return new Response(
                                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#374151"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#9CA3AF">No Image</text></svg>',
                                { headers: { 'Content-Type': 'image/svg+xml' } }
                            );
                        }
                        
                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});

// Background sync for SOS alerts when back online
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync-sos') {
        console.log('Background sync triggered for SOS alerts');
        
        event.waitUntil(
            // Get pending SOS alerts from IndexedDB and send them
            getPendingSOSAlerts().then((alerts) => {
                return Promise.all(
                    alerts.map((alert) => {
                        return fetch('/api/sos', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(alert)
                        }).then(() => {
                            // Remove from pending alerts
                            return removePendingSOSAlert(alert.id);
                        });
                    })
                );
            })
        );
    }
});

// Push notification event
self.addEventListener('push', (event) => {
    let data = {};
    
    if (event.data) {
        data = event.data.json();
    }
    
    const options = {
        body: data.body || 'New emergency alert received',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        sound: '/sounds/emergency-alert.mp3',
        tag: data.tag || 'disaster-alert',
        renotify: true,
        requireInteraction: true,
        actions: [
            {
                action: 'view',
                title: 'View Details',
                icon: '/icons/view-icon.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/icons/dismiss-icon.png'
            }
        ],
        data: {
            url: data.url || '/',
            alertId: data.alertId
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Emergency Alert', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/')
        );
    } else if (event.action === 'dismiss') {
        // Just close the notification
        return;
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then((clientList) => {
                for (let client of clientList) {
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
        );
    }
});

// Message event - communicate with the app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

// Helper functions for IndexedDB operations
function getPendingSOSAlerts() {
    return new Promise((resolve) => {
        // In a real implementation, this would use IndexedDB
        // For now, return empty array
        resolve([]);
    });
}

function removePendingSOSAlert(alertId) {
    return new Promise((resolve) => {
        // In a real implementation, this would remove from IndexedDB
        resolve();
    });
}

// Error handling
self.addEventListener('error', (event) => {
    console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker script loaded');
