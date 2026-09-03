/**
 * El service worker: lo que hace que la app funcione sin señal.
 *
 * Sin esto la página se guarda diez minutos y ya —GitHub manda
 * `Cache-Control: max-age=600`—, así que en una cancha sin datos te da error
 * justo cuando la necesitas. Con esto el navegador se queda con una copia y la
 * sirve aunque no haya red.
 *
 * Vive solo en `docs/`, no en `la-d.html`: dentro de un Artifact la página
 * corre en un marco ajeno donde esto no aplica, y meterlo ahí sería código que
 * no puede funcionar.
 *
 * La estrategia es «primero la copia, y de fondo busca una nueva»:
 *
 *   - Abre al instante, con o sin internet.
 *   - Si hay red, baja la versión nueva mientras tanto y la deja lista.
 *   - Al terminar avisa a la página, que muestra un aviso para recargar. Sin
 *     ese aviso la actualización llegaría en la SEGUNDA apertura y parecería
 *     que la app se quedó pegada.
 */

/** El worker en sí. `VERSION` la pone construir.mjs con el hash del sitio. */
export const worker = (version) => `/*
  Generado por scripts/sw.mjs — no editar a mano.
  La version es el hash del sitio: cada publicacion crea un cache nuevo y los
  viejos se borran solos.
*/
const CACHE = 'stickiq-${version}'
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
`

/**
 * Lo que va en la página: registra el worker y avisa cuando hay versión nueva.
 *
 * El aviso importa. Sin él, una app que se guarda a sí misma se actualiza
 * recién a la segunda apertura, y desde afuera eso se ve exactamente igual que
 * una app rota.
 */
export const registro = `<div id="hay-version" hidden>
  <span>Hay una versión nueva.</span>
  <button type="button" id="recargar">Actualizar</button>
</div>
<script>
  if ('serviceWorker' in navigator) {
    addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        reg.addEventListener('updatefound', () => {
          const nuevo = reg.installing
          if (!nuevo) return
          nuevo.addEventListener('statechange', () => {
            // 'installed' con un controlador ya puesto = habia una version
            // antes, o sea que esto es una actualizacion y no la instalacion.
            if (nuevo.state === 'installed' && navigator.serviceWorker.controller) {
              document.getElementById('hay-version').hidden = false
            }
          })
        })
      })
      document.getElementById('recargar').addEventListener('click', () => location.reload())
    })
  }
</script>`

/** El estilo del aviso, con los mismos tokens de la app. */
export const estilo = `
  #hay-version {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(5.2rem + env(safe-area-inset-bottom));
    /* Debajo de la hoja (35): un aviso flotante sobre el boton de guardar es
       el mismo fallo que acabo de arreglar en la barra de pestañas. */
    z-index: 25;
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.5rem 0.6rem 0.5rem 0.9rem;
    border-radius: 999px;
    background: var(--tarjeta);
    color: var(--tinta);
    border: 1px solid var(--borde);
    box-shadow: 0 6px 24px rgb(0 0 0 / 0.18);
    font-size: 0.88rem;
  }
  #hay-version button {
    font: inherit;
    font-weight: 600;
    /* 44 px es el minimo con el que un dedo acierta. */
    min-height: 44px;
    padding: 0 0.9rem;
    border: none;
    border-radius: 999px;
    background: var(--cancha);
    color: #fff;
    cursor: pointer;
  }`
