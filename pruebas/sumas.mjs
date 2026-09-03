/**
 * Que las sumas digan la verdad cuando faltan datos.
 *
 * Es el error que más veces apareció en todo el proyecto, en Vida y acá: tratar
 * lo que falta como si fuera cero. «300 minutos» suena exacto, y si dos de los
 * cinco partidos no tienen el dato, no lo es. La cifra no está mal por poco:
 * está afirmando algo que nunca mediste.
 */
import { cargar, js, trozo } from './marco.mjs'

const fuente =
  'export let estado = { meta: 3, entrenamientos: [], dias: [] }\n' +
  'export const ponerEstado = (e) => { estado = e }\n' +
  trozo('function todosLosPartidos', '// ---------- logros') +
  trozo('  const MINIMO_PARA_PROMEDIAR', '  const resultado =') +
  // `totales` cuenta los ganados con `resultado`, que ahora incluye los penales.
  trozo('  const resultado = (p) =>', '  // ---------- pintar ----------') +
  trozo('  const sumaConocida =', '  function pintarGrafico') +
  '\nexport { totales, sumaConocida, todosLosPartidos, promedios, conComa }'

const M = await cargar(fuente)

let ok = 0
let mal = 0
const eq = (n, a, b) => {
  const bien = JSON.stringify(a) === JSON.stringify(b)
  console.log((bien ? '  ok    ' : ' FALLA  ') + n + (bien ? '' : `  esperaba ${JSON.stringify(b)}, obtuve ${JSON.stringify(a)}`))
  bien ? ok++ : mal++
}

console.log('\n- sumar solo lo que existe, y decir cuanto existe -')
const lista = [{ m: 60 }, { m: null }, { m: 45 }, {}, { m: 0 }]
eq('el total ignora los que faltan', M.sumaConocida(lista, 'm').total, 105)
eq('y dice cuantos aportaron', M.sumaConocida(lista, 'm').cuantos, 3)
eq('sobre cuantos habia', M.sumaConocida(lista, 'm').de, 5)

// Un cero explicito NO es un dato que falta: si dijo que no jugo, eso se sabe.
eq('un cero cuenta como dato', M.sumaConocida([{ m: 0 }], 'm').cuantos, 1)
eq('un null no', M.sumaConocida([{ m: null }], 'm').cuantos, 0)
eq('sin nada, el total es cero y no NaN', M.sumaConocida([], 'm'), { total: 0, cuantos: 0, de: 0 })

console.log('\n- lo oficial y lo del entrenamiento, por separado -')
M.ponerEstado({
  meta: 3,
  entrenamientos: [
    { fecha: '2026-09-01', goles: 2, asistencias: 1 },
    { fecha: '2026-09-03' }
  ],
  dias: [
    {
      fecha: '2026-09-05',
      torneo: 'Liga',
      partidos: [
        { rival: 'A', nuestros: 3, suyos: 1, goles: 2, asistencias: 1, minutos: 60 },
        { rival: 'B', nuestros: 0, suyos: 2, goles: 0, asistencias: null, minutos: null }
      ]
    }
  ]
})
const t = M.totales()
eq('entrenamientos', t.entrenamientos, 2)
eq('partidos', t.partidos, 2)
// Antes se sumaban juntos. Ahora no, y esta prueba defiende justamente eso:
// tres goles en un picadito no son tres goles en una final, y si el numero
// grande los mezcla deja de significar algo.
eq('goles: SOLO los de partido', t.goles, 2)
eq('asistencias: solo las de partido, y la desconocida no suma', t.asistencias, 1)
eq('los del entrenamiento van aparte', t.golesEntreno, 2)
eq('y sus asistencias tambien', t.asistEntreno, 1)
eq('minutos: solo los del partido que los tiene', t.minutos, 60)
eq('ganados', t.ganados, 1)

console.log('\n- nueve goles de entrenamiento no inflan lo oficial -')
M.ponerEstado({ meta: 3, entrenamientos: [{ fecha: '2026-09-01', goles: 9 }], dias: [] })
eq('el oficial sigue en cero', M.totales().goles, 0)
eq('pero se cuentan donde corresponde', M.totales().golesEntreno, 9)

console.log('\n- un entrenamiento sin detalles no aporta ceros falsos -')
M.ponerEstado({ meta: 3, entrenamientos: [{ fecha: '2026-09-01' }], dias: [] })
eq('goles en cero, sin reventar', M.totales().goles, 0)
eq('asistencias en cero', M.totales().asistencias, 0)

console.log('\n- los promedios se dividen entre lo que existe -')
/*
  La misma trampa de siempre, en su forma mas facil de colar: dividir la suma
  entre TODOS los partidos. Los que no traen asistencias contarian como cero y
  el promedio saldria mas bajo que el real — justo para quien lleva media
  temporada anotada con la forma vieja.
*/
const p = (goles, asist) => ({ rival: 'X', nuestros: 1, suyos: 0, goles, asistencias: asist })
M.ponerEstado({ meta: 3, entrenamientos: [], dias: [
  { fecha: '2026-03-07', torneo: 'Liga', partidos: [p(2, 1), p(0, null), p(4, 3), p(2, null)] }
] })
const r = M.promedios()
eq('los goles se dividen entre los cuatro', r.goles, { valor: 2, sobre: 4 })
eq('las asistencias, solo entre los dos que las traen', r.asistencias, { valor: 2, sobre: 2 })
eq('y se dice cuantos partidos hay en total', r.partidos, 4)

console.log('\n- un promedio de dos partidos no es un promedio -')
M.ponerEstado({ meta: 3, entrenamientos: [], dias: [
  { fecha: '2026-03-07', torneo: 'Liga', partidos: [p(2, 1), p(0, 0)] }
] })
eq('con dos partidos no se muestra nada', M.promedios(), null)
M.ponerEstado({ meta: 3, entrenamientos: [], dias: [
  { fecha: '2026-03-07', torneo: 'Liga', partidos: [p(2, 1), p(0, 0), p(1, 1)] }
] })
eq('con tres si', M.promedios()?.partidos, 3)

console.log('\n- y si NADIE trae el dato, no se inventa un cero -')
M.ponerEstado({ meta: 3, entrenamientos: [], dias: [
  { fecha: '2026-03-07', torneo: 'Liga', partidos: [p(2, null), p(0, null), p(1, null)] }
] })
eq('sin ninguna asistencia anotada, no hay promedio', M.promedios().asistencias, null)
eq('pero los goles siguen', M.promedios().goles, { valor: 1, sobre: 3 })

console.log('\n- los decimales van con coma -')
eq('cero coma setenta y cinco', M.conComa(0.75), '0,75')
eq('y se redondea a dos', M.conComa(1 / 3), '0,33')

console.log(`\n${ok} ok, ${mal} fallos`)
process.exit(mal ? 1 : 0)
