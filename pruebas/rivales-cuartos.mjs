/**
 * La ficha por rival y el cuarto de cada gol.
 *
 * Lo que se puede romper en silencio acá:
 *
 * · Que un gol pierda su sitio o su cuarto al cambiar la cuenta. Cada gol pasó
 *   a ser una entrada propia, y esa normalización se ejecuta cada vez que tocas
 *   el contador. Si recorta de más, borras un dato que costó un toque poner.
 * · Que el balance contra un rival sume mal. Un 2–0–1 equivocado no revienta:
 *   simplemente te dice que le ganas a alguien a quien no.
 */
import { cargar, js, trozo } from './marco.mjs'

const fuente =
  'export let estado = { meta: 3, entrenamientos: [], dias: [] }\n' +
  'export let borrador = {}\n' +
  'export const ponerEstado = (e) => { estado = e }\n' +
  'export const ponerBorrador = (b) => { borrador = b }\n' +
  trozo('function todosLosPartidos', '  function pintarGrafico') +
  trozo('  function porRival()', '  function pintarRivales') +
  trozo('  function normalizarGoles()', '  function cablearD') +
  '\nexport { porRival, normalizarGoles, todosLosPartidos }'

const M = await cargar(fuente)

let ok = 0
let mal = 0
const eq = (n, a, b) => {
  const bien = JSON.stringify(a) === JSON.stringify(b)
  console.log(
    (bien ? '  ok    ' : ' FALLA  ') +
      n +
      (bien ? '' : `  esperaba ${JSON.stringify(b)}, obtuve ${JSON.stringify(a)}`)
  )
  bien ? ok++ : mal++
}
const si = (n, c, d = '') => {
  console.log((c ? '  ok    ' : ' FALLA  ') + n + (d ? ' — ' + d : ''))
  c ? ok++ : mal++
}

const p = (rival, nuestros, suyos, goles = 0) => ({ rival, nuestros, suyos, goles })
const dia = (fecha, ...partidos) => ({ fecha, torneo: 'Liga', partidos })

console.log('\n- el balance contra cada rival -')
M.ponerEstado({
  meta: 3,
  entrenamientos: [],
  dias: [
    dia('2026-03-07', p('Manquehue', 3, 1, 2), p('Prince', 0, 2, 0)),
    dia('2026-03-14', p('Manquehue', 1, 1, 1), p('Manquehue', 0, 4, 0))
  ]
})
const r = M.porRival()
eq('dos rivales', r.length, 2)
eq('el más jugado va primero', r[0].rival, 'Manquehue')
eq('tres partidos contra él', r[0].jugados, 3)
eq('uno ganado', r[0].g, 1)
eq('uno empatado', r[0].e, 1)
eq('uno perdido', r[0].p, 1)
eq('tres goles tuyos', r[0].goles, 3)
eq('y el otro rival, un partido perdido', [r[1].jugados, r[1].p], [1, 1])

console.log('\n- el mismo rival escrito con espacios es el mismo rival -')
M.ponerEstado({
  meta: 3,
  entrenamientos: [],
  dias: [dia('2026-03-07', p('Prince ', 1, 0), p(' Prince', 2, 0))]
})
eq('se junta en una sola ficha', M.porRival().length, 1)
eq('con dos partidos', M.porRival()[0].jugados, 2)

console.log('\n- el orden no cambia entre aperturas -')
M.ponerEstado({
  meta: 3,
  entrenamientos: [],
  dias: [dia('2026-03-07', p('Zeta', 1, 0), p('Alfa', 1, 0))]
})
// A igualdad de partidos jugados manda el nombre: sin ese desempate el orden
// dependeria del recorrido y pareceria que se mueven solos.
eq('a igualdad, alfabético', M.porRival().map((x) => x.rival), ['Alfa', 'Zeta'])

console.log('\n- sin partidos, la ficha no existe -')
M.ponerEstado({ meta: 3, entrenamientos: [], dias: [] })
eq('lista vacía', M.porRival(), [])

console.log('\n- una entrada por gol, ni más ni menos -')
M.ponerBorrador({ goles: 3, posiciones: [] })
M.normalizarGoles()
eq('tres goles, tres entradas', M.borrador.posiciones.length, 3)
si('todas vacías', M.borrador.posiciones.every((g) => Object.keys(g).length === 0))

console.log('\n- subir la cuenta conserva lo ya puesto -')
M.ponerBorrador({ goles: 3, posiciones: [{ x: 1, y: 5, cuarto: 2 }] })
M.normalizarGoles()
eq('tres entradas', M.borrador.posiciones.length, 3)
eq('la primera intacta', M.borrador.posiciones[0], { x: 1, y: 5, cuarto: 2 })

console.log('\n- bajarla recorta por el final -')
M.ponerBorrador({
  goles: 1,
  posiciones: [{ x: 1, y: 5, cuarto: 1 }, { x: 2, y: 6 }, { cuarto: 4 }]
})
M.normalizarGoles()
eq('queda una', M.borrador.posiciones.length, 1)
eq('y es la primera, no otra', M.borrador.posiciones[0], { x: 1, y: 5, cuarto: 1 })

console.log('\n- cero goles deja la lista vacía -')
M.ponerBorrador({ goles: 0, posiciones: [{ x: 1, y: 5 }] })
M.normalizarGoles()
eq('sin entradas', M.borrador.posiciones, [])

console.log('\n- un gol puede tener cuarto sin sitio, y al revés -')
M.ponerBorrador({ goles: 2, posiciones: [{ cuarto: 3 }, { x: 4, y: 7 }] })
M.normalizarGoles()
eq('los dos sobreviven', M.borrador.posiciones.length, 2)
eq('el del cuarto sin sitio', M.borrador.posiciones[0], { cuarto: 3 })
eq('y el del sitio sin cuarto', M.borrador.posiciones[1], { x: 4, y: 7 })

console.log(`\n${ok} ok, ${mal} fallos`)
process.exit(mal ? 1 : 0)
