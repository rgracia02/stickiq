/**
 * Tres datos que no van atados: cuántos juegan, cómo se parte, cuánto dura.
 *
 * Los tuve atados y estaba mal. La app daba por hecho que un partido de 11 son
 * cuatro cuartos y uno de 7 dos tiempos, y Rodrigo jugó una liga de 11 en dos
 * tiempos de veinte. El formato dice cuántos juegan; la estructura y la
 * duración las decide el torneo.
 *
 * Lo que se rompe en silencio si esto sale mal:
 *
 * · Un «3er cuarto» contado dentro de un partido de dos tiempos. No revienta:
 *   sale una barra en una casilla que no existe, y el resumen afirma algo
 *   imposible con toda la cara.
 * · Un partido guardado antes de que existieran los períodos, leído con la
 *   estructura que no era.
 * · Que la app vuelva a deducir la estructura del formato, que es justo el
 *   error que este archivo existe para impedir.
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
  trozo('  const claveRival =', '  /** Los rivales ya jugados') +
  trozo('  const FORMATOS =', '  const R_D =') +
  trozo('  function unReparto(periodos)', '\n  function pintarMapaD') +
  '\nexport const ponerEstado = (e) => { estado = e }' +
  '\nexport { FORMATOS, ESTRUCTURAS, periodosDe, estructuraDe, comoSeJuega, unReparto, leer, estado }'

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
const partido = (periodos, ...cuartos) => ({
  rival: 'X', nuestros: 1, suyos: 1, goles: cuartos.length,
  formato: 11, periodos, posiciones: cuartos.map(gol)
})
const dia = (...partidos) => ({ fecha: '2026-03-07', torneo: 'Liga', partidos })

console.log('\n- cuántos juegan es solo un nombre -')
// FORMATOS ya no lleva periodos ni duracion. Si alguien se los vuelve a colgar,
// la app puede volver a deducir la estructura del formato sin que nadie avise.
eq('el de 11 se llama así', M.FORMATOS[11], 'De 11')
eq('el de 7 también', M.FORMATOS[7], 'De 7')
si('y no traen períodos pegados', M.FORMATOS[11].periodos === undefined)

console.log('\n- la estructura es su propio dato -')
eq('dos períodos son dos tiempos', M.ESTRUCTURAS[2].nombre, '2 tiempos')
eq('cuatro son cuartos', M.ESTRUCTURAS[4].nombre, '4 cuartos')
si('y se nombran distinto', M.ESTRUCTURAS[2].como(2) !== M.ESTRUCTURAS[4].como(2),
  `${M.ESTRUCTURAS[2].como(2)} vs ${M.ESTRUCTURAS[4].como(2)}`)

console.log('\n- los períodos no salen del formato -')
eq('sin nada, cuatro', M.periodosDe({}), 4)
eq('dos si lo dice el partido', M.periodosDe({ periodos: 2 }), 2)
// El caso que rompió el modelo viejo: once jugadores, dos tiempos.
eq('once jugadores en dos tiempos', M.periodosDe({ formato: 11, periodos: 2 }), 2)
eq('y siete en cuatro cuartos', M.periodosDe({ formato: 7, periodos: 4 }), 4)
eq('con basura, cuatro', M.periodosDe({ periodos: 99 }), 4)
eq('sin partido', M.periodosDe(undefined), 4)
eq('la estructura sigue a los períodos', M.estructuraDe({ periodos: 2 }).nombre, '2 tiempos')

console.log('\n- cada reparto cuenta SOLO los suyos -')
M.ponerEstado({
  meta: 3, entrenamientos: [],
  dias: [dia(partido(4, 1, 3, 3), partido(2, 2, 2))]
})
const cuatro = M.unReparto(4)
const dos = M.unReparto(2)
si('el de cuatro dice «4 cuartos»', cuatro.includes('4 cuartos'))
si('y cuenta tres goles', cuatro.includes('de 3 goles'), cuatro.match(/de \d+ goles/)?.[0])
si('el de dos dice «2 tiempos»', dos.includes('2 tiempos'))
si('y cuenta dos', dos.includes('de 2 goles'), dos.match(/de \d+ goles/)?.[0])

console.log('\n- dos tiempos no dibujan cuatro casillas -')
eq('dos columnas en la rejilla', (dos.match(/repeat\(2,1fr\)/g) ?? []).length, 2)
eq('cuatro cuartos, cuatro', (cuatro.match(/repeat\(4,1fr\)/g) ?? []).length, 2)
si('y sus etiquetas son tiempos, no cuartos', dos.includes('1º t.') && !dos.includes('3º'))

console.log('\n- se agrupa por estructura, no por formato -')
// Dos partidos de 11 jugados distinto van a repartos distintos. Con el modelo
// viejo caían los dos en el mismo y los cuartos se sumaban entre sí.
M.ponerEstado({
  meta: 3, entrenamientos: [],
  dias: [dia(
    { rival: 'A', nuestros: 1, suyos: 0, goles: 1, formato: 11, periodos: 4, posiciones: [gol(4)] },
    { rival: 'B', nuestros: 1, suyos: 0, goles: 1, formato: 11, periodos: 2, posiciones: [gol(2)] }
  )]
})
si('el de cuatro solo ve su gol', M.unReparto(4).includes('de 1 gol.'))
si('el de dos, el suyo', M.unReparto(2).includes('de 1 gol.'))
si('y ninguno inventa un 4º tiempo', !M.unReparto(2).includes('4º t.'))

console.log('\n- una estructura sin goles no dibuja nada -')
M.ponerEstado({ meta: 3, entrenamientos: [], dias: [dia(partido(4, 1))] })
si('la de cuatro existe', M.unReparto(4) !== null)
eq('la de dos no', M.unReparto(2), null)

console.log('\n- cómo se jugó ese torneo la última vez -')
// Para no preguntar tres cosas en cada partido: el torneo se acuerda.
M.ponerEstado({
  meta: 3, entrenamientos: [],
  dias: [
    { fecha: '2026-03-07', torneo: 'Liga', partidos: [
      { rival: 'A', nuestros: 1, suyos: 0, goles: 0, formato: 11, periodos: 2, duracion: 40 }
    ] },
    { fecha: '2026-03-14', torneo: 'Copa', partidos: [
      { rival: 'B', nuestros: 1, suyos: 0, goles: 0, formato: 7, periodos: 2, duracion: 12 }
    ] }
  ]
})
eq('la Liga de 11 se jugó en dos tiempos de 40',
  M.comoSeJuega('Liga', 11), { periodos: 2, duracion: 40 })
eq('y no le contagia nada a la Copa de 7',
  M.comoSeJuega('Copa', 7), { periodos: 2, duracion: 12 })
eq('la Liga de 7 nunca se jugó: no se inventa duración',
  M.comoSeJuega('Liga', 7), { periodos: 2, duracion: null })
eq('un torneo nuevo de 11 parte en cuartos y sin duración',
  M.comoSeJuega('Nacional', 11), { periodos: 4, duracion: null })
eq('y el nombre se normaliza como el del rival',
  M.comoSeJuega('  liga ', 11), { periodos: 2, duracion: 40 })

console.log('\n- los partidos viejos entran con la estructura que tenían -')
// Cuando se anotaron, las fichas ofrecían cuatro cuartos en los de 11 y dos
// tiempos en los de 7: eso es lo que significaban, y es lo que hay que leer.
globalThis.__crudo = JSON.stringify({
  meta: 3,
  entrenamientos: [],
  dias: [{ fecha: '2026-03-07', torneo: 'Liga', partidos: [
    { rival: 'A', nuestros: 1, suyos: 0, goles: 1 },
    { rival: 'B', nuestros: 1, suyos: 0, goles: 1, formato: 7 },
    { rival: 'C', nuestros: 1, suyos: 0, goles: 1, formato: 11, periodos: 2 }
  ] }]
})
const leidos = M.leer().dias[0].partidos
eq('el formato se rellena con 11', leidos[0].formato, 11)
eq('y sus períodos con cuatro', leidos[0].periodos, 4)
eq('uno de 7 se lee en dos tiempos', leidos[1].periodos, 2)
eq('y uno que ya traía períodos se respeta', leidos[2].periodos, 2)

console.log(`\n${ok} ok, ${mal} fallos`)
process.exit(mal ? 1 : 0)
