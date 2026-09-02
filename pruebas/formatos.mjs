/**
 * Los dos formatos: de 11 en cuatro cuartos, de 7 en dos tiempos.
 *
 * Lo que se rompe en silencio si esto sale mal:
 *
 * · Un «3er cuarto» contado dentro de un partido de dos tiempos. No revienta:
 *   sale una barra en una casilla que no existe, y el resumen afirma algo
 *   imposible con toda la cara.
 * · Un partido guardado antes de que el formato existiera leído como de 7, que
 *   convertiría sus cuartos 3 y 4 en períodos fuera de rango.
 */
import { cargar, trozo } from './marco.mjs'

// `estado` no se declara acá: lo declara el propio trozo con `let estado =
// leer()`. Declararlo también arriba daba «Identifier 'estado' has already been
// declared», que es el precio de cargar código real en vez de una copia — y
// vale la pena, porque una copia se desincroniza y deja de probar lo que corre.
const fuente =
  "const localStorage = { getItem: () => globalThis.__crudo, setItem: () => {} }\n" +
  "const CLAVE = 'la-d-v1'\n" +
  trozo('const ESTADO_VACIO', '  function guardar') +
  trozo('function todosLosPartidos', '  function pintarGrafico') +
  trozo('  const FORMATOS =', '  const R_D =') +
  trozo('  function unReparto(formato)', '\n  function pintarMapaD') +
  '\nexport const ponerEstado = (e) => { estado = e }' +
  '\nexport { FORMATOS, formatoDe, unReparto, leer, estado }'

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

const gol = (cuarto) => ({ x: 0, y: 5, cuarto })
const partido = (formato, ...cuartos) => ({
  rival: 'X', nuestros: 1, suyos: 1, goles: cuartos.length,
  formato, posiciones: cuartos.map(gol)
})
const dia = (...partidos) => ({ fecha: '2026-03-07', torneo: 'Liga', partidos })

console.log('\n- la tabla de formatos -')
eq('el de 11 son cuatro cuartos', M.FORMATOS[11].periodos, 4)
eq('el de 7 son dos tiempos', M.FORMATOS[7].periodos, 2)
si('y se nombran distinto', M.FORMATOS[11].como(2) !== M.FORMATOS[7].como(2),
  `${M.FORMATOS[11].como(2)} vs ${M.FORMATOS[7].como(2)}`)

console.log('\n- un partido sin formato se lee como de 11 -')
eq('sin formato', M.formatoDe({}).periodos, 4)
eq('con formato 7', M.formatoDe({ formato: 7 }).periodos, 2)
eq('con basura', M.formatoDe({ formato: 99 }).periodos, 4)
eq('sin partido', M.formatoDe(undefined).periodos, 4)

console.log('\n- cada reparto cuenta SOLO los suyos -')
M.ponerEstado({
  meta: 3, entrenamientos: [],
  dias: [dia(partido(11, 1, 3, 3), partido(7, 2, 2))]
})
const once = M.unReparto(11)
const siete = M.unReparto(7)
si('el de 11 dice «4 cuartos»', once.includes('4 cuartos'))
si('y cuenta tres goles', once.includes('de 3 goles'), once.match(/de \d+ goles/)?.[0])
si('el de 7 dice «2 tiempos»', siete.includes('2 tiempos'))
si('y cuenta dos', siete.includes('de 2 goles'), siete.match(/de \d+ goles/)?.[0])

console.log('\n- el de 7 no dibuja cuatro casillas -')
eq('dos columnas en la rejilla', (siete.match(/repeat\(2,1fr\)/g) ?? []).length, 2)
eq('el de 11, cuatro', (once.match(/repeat\(4,1fr\)/g) ?? []).length, 2)
si('y sus etiquetas son tiempos, no cuartos', siete.includes('1º t.') && !siete.includes('3º'))

console.log('\n- un formato sin goles no dibuja nada -')
M.ponerEstado({ meta: 3, entrenamientos: [], dias: [dia(partido(11, 1))] })
si('el de 11 existe', M.unReparto(11) !== null)
eq('el de 7 no', M.unReparto(7), null)

console.log('\n- los partidos viejos entran como de 11 -')
// Cuando se anotaron, las fichas solo ofrecian cuatro cuartos: leerlos como de
// 7 convertiria sus cuartos 3 y 4 en periodos que no existen.
globalThis.__crudo = JSON.stringify({
  meta: 3,
  entrenamientos: [],
  dias: [{ fecha: '2026-03-07', torneo: 'Liga', partidos: [{ rival: 'A', nuestros: 1, suyos: 0, goles: 1 }] }]
})
eq('el formato se rellena con 11', M.leer().dias[0].partidos[0].formato, 11)

globalThis.__crudo = JSON.stringify({
  meta: 3,
  entrenamientos: [],
  dias: [{ fecha: '2026-03-07', torneo: 'Liga', partidos: [{ rival: 'A', nuestros: 1, suyos: 0, goles: 1, formato: 7 }] }]
})
eq('y uno que ya lo traía se respeta', M.leer().dias[0].partidos[0].formato, 7)

console.log(`\n${ok} ok, ${mal} fallos`)
process.exit(mal ? 1 : 0)
