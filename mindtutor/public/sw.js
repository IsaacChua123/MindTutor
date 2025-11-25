/**
 * Service Worker for MindTutor - Offline Capabilities and Caching
 */

const CACHE_NAME = 'mindtutor-v1.0.0';
const STATIC_CACHE = 'mindtutor-static-v1.0.0';
const DYNAMIC_CACHE = 'mindtutor-dynamic-v1.0.0';
const API_CACHE = 'mindtutor-api-v1.0.0';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  // Note: manifest.json and favicon.ico are optional and will be cached if available
  // Cache critical CSS and JS (will be populated by build)
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/sample-data/',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker installing...');

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(STATIC_CACHE);
        console.log('📦 Caching static assets...');

        // Cache assets individually to handle failures gracefully
        const cachePromises = STATIC_ASSETS.map(async (asset) => {
          try {
            const response = await fetch(asset, { cache: 'no-cache' });
            if (response.ok) {
              await cache.put(asset, response);
              console.log(`✅ Cached: ${asset}`);
            } else {
              console.warn(`⚠️ Asset not available: ${asset} (${response.status})`);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to cache asset: ${asset}`, error.message);
            // Don't fail for missing assets
          }
        });

        await Promise.allSettled(cachePromises);
        console.log('📦 Static asset caching completed');
      } catch (error) {
        console.error('❌ Service worker installation failed:', error);
      }

      // Skip waiting to activate immediately
      return self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🎯 Service Worker activating...');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE &&
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== API_CACHE &&
                !cacheName.startsWith(CACHE_NAME)) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - serve cached content or fetch from network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests - Network first with cache fallback
  if (API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline page for API failures
            return new Response(
              JSON.stringify({
                error: 'Offline',
                message: 'Content not available offline'
              }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // Static assets - Cache first
  if (STATIC_ASSETS.some(asset => url.pathname === asset) ||
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'image' ||
      request.destination === 'font') {

    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML pages - Network first with cache fallback
  if (request.destination === 'document' || request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache or offline page
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return cached index.html for SPA routing
            return caches.match('/').then((indexResponse) => {
              return indexResponse || new Response(
                '<!DOCTYPE html><html><head><title>MindTutor - Offline</title></head><body><h1>MindTutor</h1><p>You are currently offline. Some features may not be available.</p></body></html>',
                {
                  headers: { 'Content-Type': 'text/html' }
                }
              );
            });
          });
        })
    );
    return;
  }

  // Other requests - Network first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request);
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Push notifications (for future features)
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received:', event);

  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: data.data
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);

  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

// Background sync implementation
async function doBackgroundSync() {
  try {
    // Get pending offline actions from IndexedDB
    const pendingActions = await getPendingActions();

    for (const action of pendingActions) {
      try {
        await syncAction(action);
        await removePendingAction(action.id);
      } catch (error) {
        console.error('Failed to sync action:', action.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// IndexedDB helpers for offline actions
async function getPendingActions() {
  // This would interact with IndexedDB to get pending actions
  // For now, return empty array
  return [];
}

async function syncAction(action) {
  // Implement action syncing logic
  console.log('Syncing action:', action);
}

async function removePendingAction(actionId) {
  // Remove synced action from IndexedDB
  console.log('Removing synced action:', actionId);
}

// Cache management utilities
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_MANAGEMENT') {
    handleCacheManagement(event.data.action, event.data.payload);
  }
});

async function handleCacheManagement(action, payload) {
  switch (action) {
    case 'CLEAR_ALL':
      await clearAllCaches();
      break;
    case 'CLEAR_DYNAMIC':
      await caches.delete(DYNAMIC_CACHE);
      break;
    case 'PRELOAD_RESOURCES':
      await preloadResources(payload.resources || []);
      break;
    default:
      console.warn('Unknown cache management action:', action);
  }
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('🗑️ All caches cleared');
}

async function preloadResources(resources) {
  const cache = await caches.open(STATIC_CACHE);
  await cache.addAll(resources);
  console.log('📦 Resources preloaded:', resources);
}

// Periodic cache cleanup
setInterval(async () => {
  try {
    await cleanupExpiredCache();
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
}, 3600000); // Every hour

async function cleanupExpiredCache() {
  // Implement cache expiration logic if needed
  console.log('🧹 Cache cleanup completed');
}

// Performance monitoring integration
if ('performance' in self && 'PerformanceObserver' in self) {
  const perfObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // Send performance data to main thread
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'PERFORMANCE_DATA',
            data: {
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime
            }
          });
        });
      });
    }
  });

  try {
    perfObserver.observe({ entryTypes: ['measure'] });
  } catch (error) {
    console.warn('Service worker performance monitoring not supported:', error);
  }
}

console.log('🎉 Service Worker loaded successfully');