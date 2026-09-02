/**
 * Lo común a todas las pruebas.
 *
 * La app es un solo archivo HTML, así que probar su lógica pasa por sacarle el
 * JavaScript y cargar trozos sueltos. Esa maniobra es frágil y por eso vive en
 * un sitio único: si cambia la forma de recortar, cambia acá y no en siete
 * archivos que se van desincronizando de a uno.
 *
 * La ruta se deduce de dónde está este archivo. Las pruebas vivieron un tiempo
 * en una carpeta temporal con la ruta de una máquina escrita a mano dentro, y
 * eso las ataba a un solo computador.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')

const html = readFileSync(join(RAIZ, 'la-d.html'), 'utf8')

/** Todo el JavaScript de la página, sin las etiquetas. */
export const js = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'))

/** El marcado y los estilos, para las comprobaciones de estructura. */
export const marcado = html.slice(0, html.indexOf('<script>'))

/**
 * Un trozo del código, de un ancla a otra.
 *
 * Falla ruidosamente si un ancla no existe. Antes devolvía una porción vacía en
 * silencio y la prueba pasaba a comprobar nada, que es peor que fallar: una
 * prueba verde sobre código ausente da una confianza que no corresponde.
 */
export function trozo(desde, hasta) {
  const i = js.indexOf(desde)
  const j = js.indexOf(hasta)
  if (i === -1) throw new Error(`El ancla de inicio no está en la página: «${desde}»`)
  if (j === -1) throw new Error(`El ancla de fin no está en la página: «${hasta}»`)
  if (j <= i) throw new Error(`Las anclas están al revés: «${desde}» va después de «${hasta}»`)
  return js.slice(i, j)
}

/** Carga un módulo armado con trozos del archivo, sin escribir nada al disco. */
export const cargar = (fuente) =>
  import('data:text/javascript,' + encodeURIComponent(fuente))
