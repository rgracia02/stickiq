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
  trozo('  function totales()', '  const resultado =') +
  // `totales` cuenta los ganados con `resultado`, que ahora incluye los penales.
  trozo('  const resultado = (p) =>', '  // ---------- pintar ----------') +
  trozo('  const sumaConocida =', '  function pintarGrafico') +
  '\nexport { totales, sumaConocida, todosLosPartidos }'

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

console.log(`\n${ok} ok, ${mal} fallos`)
process.exit(mal ? 1 : 0)
