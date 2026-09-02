/**
 * La geometría de la D.
 *
 * Dos cosas que se rompen sin avisar:
 *
 * 1. El test de «dentro de la D». Si acepta puntos de más, guarda goles desde
 *    donde no se puede marcar; si acepta de menos, rechaza toques legítimos y
 *    parece que la app está rota.
 *
 * 2. La dirección de los arcos del dibujo. Un `sweep-flag` al revés no lanza
 *    ningún error: dibuja la D invertida, curvándose hacia el arco en vez de
 *    hacia la cancha. Se comprueba calculando el centro del arco con la misma
 *    fórmula que usa el navegador: si la dirección está mal, el centro no cae
 *    en el poste.
 */
import { cargar, js, trozo } from './marco.mjs'

const fuente =
  trozo('  const R_D =', '  /* Dónde tocó, en metros de cancha. */') +
  '\nexport { R_D, MEDIO_ARCO, dentroDeLaD, dibujoDeLaD }'

const M = await cargar(fuente)

let ok = 0
let mal = 0
const si = (n, c, d = '') => {
  console.log((c ? '  ok    ' : ' FALLA  ') + n + (d ? ' — ' + d : ''))
  c ? ok++ : mal++
}
const eq = (n, a, b) => si(n, JSON.stringify(a) === JSON.stringify(b), JSON.stringify(a))

console.log('\n- medidas reales del reglamento -')
eq('radio de 14,63 m', M.R_D, 14.63)
eq('medio arco de 1,83 m', M.MEDIO_ARCO, 1.83)

console.log('\n- dentro y fuera de la D -')
si('justo delante del arco', M.dentroDeLaD(0, 1))
si('en el centro de la D', M.dentroDeLaD(0, 7))
si('el borde exacto del semicirculo', M.dentroDeLaD(0, 14.63))
si('un centimetro mas alla, fuera', !M.dentroDeLaD(0, 14.64))
si('pegado al poste izquierdo', M.dentroDeLaD(-1.83, 0.2))
si('el extremo izquierdo de la D', M.dentroDeLaD(-16.4, 0.05))
si('un metro mas a la izquierda, fuera', !M.dentroDeLaD(-17.5, 0.05))
si('detras de la linea de gol, fuera', !M.dentroDeLaD(0, -0.5))

console.log('\n- la esquina: el punto mas lejano en diagonal -')
// A 45 grados del poste, el borde esta a 14,63 m de distancia.
const d45 = 14.63 / Math.SQRT2
si('justo en el borde diagonal', M.dentroDeLaD(-1.83 - d45 + 0.05, d45 - 0.05))
si('y pasado el borde, fuera', !M.dentroDeLaD(-1.83 - d45 - 0.3, d45 + 0.3))

console.log('\n- el dibujo apunta hacia la cancha, no hacia el arco -')
const svg = M.dibujoDeLaD([])

/*
 * La conversion de «extremos + radio + banderas» a centro, tal como la define
 * la especificacion de SVG. Es la unica forma de comprobar la direccion del
 * arco sin abrir un navegador.
 */
function centroDelArco(x1, y1, x2, y2, r, fA, fS) {
  const dx = (x1 - x2) / 2
  const dy = (y1 - y2) / 2
  const suma = dx * dx + dy * dy
  const signo = fA !== fS ? 1 : -1
  const factor = signo * Math.sqrt(Math.max(0, (r * r - suma) / suma))
  return { x: factor * dy + (x1 + x2) / 2, y: -factor * dx + (y1 + y2) / 2 }
}

const arcos = [...svg.matchAll(/A (-?[\d.]+) (-?[\d.]+) 0 (\d) (\d) (-?[\d.]+) (-?[\d.]+)/g)]
si('el dibujo tiene arcos', arcos.length >= 2, arcos.length + ' encontrados')

// Primer arco del contorno: de la esquina izquierda al inicio del tramo recto.
const izq = arcos.find((a) => Number(a[5]) === -M.MEDIO_ARCO)
si('hay un arco que termina en el poste izquierdo', Boolean(izq))
if (izq) {
  const c = centroDelArco(-(M.MEDIO_ARCO + M.R_D), 0, Number(izq[5]), Number(izq[6]),
    Number(izq[1]), Number(izq[3]), Number(izq[4]))
  si('su centro es el poste izquierdo, no el reflejo',
    Math.abs(c.x + M.MEDIO_ARCO) < 0.01 && Math.abs(c.y) < 0.01,
    `centro (${c.x.toFixed(2)}, ${c.y.toFixed(2)}), poste (-1.83, 0)`)
}

const der = arcos.find((a) => Number(a[5]) === M.MEDIO_ARCO + M.R_D)
si('hay un arco que sale hacia la esquina derecha', Boolean(der))
if (der) {
  const c = centroDelArco(M.MEDIO_ARCO, M.R_D, Number(der[5]), Number(der[6]),
    Number(der[1]), Number(der[3]), Number(der[4]))
  si('su centro es el poste derecho',
    Math.abs(c.x - M.MEDIO_ARCO) < 0.01 && Math.abs(c.y) < 0.01,
    `centro (${c.x.toFixed(2)}, ${c.y.toFixed(2)}), poste (1.83, 0)`)
}

console.log('\n- los goles se dibujan donde se pusieron -')
const conGoles = M.dibujoDeLaD([{ x: 0, y: 5 }, { x: -4.2, y: 9 }])
si('dos puntos', (conGoles.match(/class="punto"/g) ?? []).length === 2)
si('con sus coordenadas', conGoles.includes('cx="0" cy="5"') && conGoles.includes('cx="-4.2" cy="9"'))
si('el que se esta poniendo va aparte',
  M.dibujoDeLaD([], { nuevo: { x: 1, y: 3 } }).includes('punto-nuevo'))

console.log(`\n${ok} ok, ${mal} fallos`)
process.exit(mal ? 1 : 0)
