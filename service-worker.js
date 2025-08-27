// service-worker.js
const CACHE_NAME = 'todo-app-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/models/task.js',
  '/models/taskList.js',
  '/logo-gr.png',
  '/icons/icon2.jpg',
  '/icons/icon8.jpg',
  '/manifest.webmanifest',
  'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css',
  'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/base16/dracula.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
