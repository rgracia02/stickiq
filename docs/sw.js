/*
  Generado por scripts/sw.mjs — no editar a mano.
  La version es el hash del sitio: cada publicacion crea un cache nuevo y los
  viejos se borran solos.
*/
const CACHE = 'stickiq-3cf957a0daf5'
const PIEZAS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icono-180.png',
  './icono-192.png',
  './icono-512.png'
]

self.addEventListener('install', (e) => {
  // No espera a que se cierren las pestañas viejas: es una app de una sola
  // pagina, no hay nada a medio hacer que proteger.
  self.skipWaiting()
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PIEZAS)))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ns) => Promise.all(ns.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  // Solo lo propio y solo lecturas. Un POST no se cachea nunca.
  if (e.request.method !== 'GET') return
  if (new URL(e.request.url).origin !== self.location.origin) return

  e.respondWith(
    caches.match(e.request).then((guardado) => {
      const red = fetch(e.request)
        .then((r) => {
          if (r && r.ok) caches.open(CACHE).then((c) => c.put(e.request, r.clone()))
          return r
        })
        // Sin red y sin copia no hay nada que devolver: que falle como falla
        // una pagina normal, en vez de inventar una respuesta vacia.
        .catch(() => guardado)
      return guardado || red
    })
  )
})
