/**
 * Que la cancha del encabezado esté bien dibujada.
 *
 * Un arco de SVG con la bandera de sentido al revés, o centrado donde no toca,
 * no lanza ningún error: dibuja una forma equivocada que solo se ve mirándola.
 * Como el dibujo sale de números del reglamento, se puede comprobar contra esos
 * mismos números.
 *
 * Ya evitó dos errores: la primera cancha tenía las D centradas en el centro del
 * arco en vez de en cada poste, lo que da un semicírculo y no una D.
 */
import { marcado } from '../pruebas/marco.mjs'

const LARGO = 91.4
const ANCHO = 55
const MEDIO_ARCO = 1.83
const CENTRO = ANCHO / 2
const POSTES = [
  [0, CENTRO - MEDIO_ARCO],
  [0, CENTRO + MEDIO_ARCO],
  [LARGO, CENTRO - MEDIO_ARCO],
  [LARGO, CENTRO + MEDIO_ARCO]
]

let mal = 0
const ok = (nombre, cond, detalle = '') => {
  console.log((cond ? '  ok    ' : ' FALLA  ') + nombre + (detalle ? ' — ' + detalle : ''))
  if (!cond) mal++
}

const svg = marcado.slice(
  marcado.indexOf('<svg class="lineas"'),
  marcado.indexOf('</svg>', marcado.indexOf('<svg class="lineas"'))
)

ok('la cancha mide 91,4 por 55', svg.includes('width="91.4"') && svg.includes('height="55"'))
ok('tiene línea del medio', svg.includes('x1="45.7"'))
ok('y las dos de 23', svg.includes('x1="22.9"') && svg.includes('x1="68.5"'))

/** De extremos y radio a centro, con la fórmula de la especificación de SVG. */
function centroDelArco(x1, y1, x2, y2, r, fA, fS) {
  const dx = (x1 - x2) / 2
  const dy = (y1 - y2) / 2
  const suma = dx * dx + dy * dy
  const signo = fA !== fS ? 1 : -1
  const f = signo * Math.sqrt(Math.max(0, (r * r - suma) / suma))
  return { x: f * dy + (x1 + x2) / 2, y: -f * dx + (y1 + y2) / 2 }
}

const trazos = [...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1].replace(/\s+/g, ' '))
ok('hay cuatro trazos curvos', trazos.length === 4, `${trazos.length} encontrados`)

let arcosBuenos = 0
let rectosBuenos = 0

for (const d of trazos) {
  let x = 0
  let y = 0
  const paso = /([ML]) (-?[\d.]+) (-?[\d.]+)|A (-?[\d.]+) (-?[\d.]+) 0 (\d) (\d) (-?[\d.]+) (-?[\d.]+)/g
  let m
  while ((m = paso.exec(d))) {
    if (m[1] === 'M') {
      x = +m[2]
      y = +m[3]
    } else if (m[1] === 'L') {
      // El tramo recto de la D mide justo el ancho del arco. Sin él, la figura
      // es un semicírculo y no una D.
      const largo = Math.hypot(+m[2] - x, +m[3] - y)
      if (Math.abs(largo - 2 * MEDIO_ARCO) < 0.01) rectosBuenos++
      else console.log(`         tramo recto de ${largo.toFixed(2)}, deberían ser 3.66`)
      x = +m[2]
      y = +m[3]
    } else {
      const c = centroDelArco(x, y, +m[8], +m[9], +m[4], +m[6], +m[7])
      const enPoste = POSTES.some(([px, py]) => Math.hypot(c.x - px, c.y - py) < 0.02)
      if (enPoste) arcosBuenos++
      else console.log(`         arco centrado en (${c.x.toFixed(2)}, ${c.y.toFixed(2)})`)
      x = +m[8]
      y = +m[9]
    }
  }
}

ok('los 8 arcos están centrados en un poste', arcosBuenos === 8, `${arcosBuenos} de 8`)
ok('los 4 tramos rectos miden 3,66', rectosBuenos === 4, `${rectosBuenos} de 4`)

console.log(mal ? `\ncancha: ${mal} problemas` : '\ncancha: bien dibujada')
process.exit(mal ? 1 : 0)
