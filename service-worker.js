// service-worker.js
const CACHE_NAME = 'todo-app-cache-v1';
const ASSETS_TO_CACHE = [
  '/todo-board/',
  '/todo-board/index.html',
  '/todo-board/styles.css',
  '/todo-board/app.js',
  '/todo-board/models/task.js',
  '/todo-board/models/taskList.js',
  '/todo-board/banners/banner.png',
  '/todo-board/manifest.webmanifest',
  '/todo-board/vendor/quill/quill.snow.css',
  '/todo-board/vendor/quill/quill.js',
  '/todo-board/vendor/highlightjs/base16-dracula.min.css',
  '/todo-board/vendor/highlightjs/highlight.min.js'
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
