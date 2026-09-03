/**
 * Que los datos que ya están guardados sobrevivan al cambio de forma.
 *
 * Los entrenamientos eran una lista de fechas y ahora son objetos. Si la
 * conversión falla, no revienta nada: la app abre vacía, como recién instalada,
 * y una temporada entera desaparece sin un solo error en pantalla. Es el peor
 * fallo posible de esta app y por eso es el que más pruebas tiene.
 */
import { cargar, js, trozo } from './marco.mjs'

// `leer` habla con localStorage, así que se le da uno de mentira.
const almacen = { valor: null }
const fuente =
  'const localStorage = { getItem: () => globalThis.__crudo, setItem: () => {} }\n' +
  "const CLAVE = 'la-d-v1'\n" +
  js.slice(js.indexOf('const ESTADO_VACIO'), js.indexOf('function guardar')) +
  '\nexport { leer, ESTADO_VACIO }'

const M = await cargar(fuente)

let ok = 0
let mal = 0
const eq = (n, a, b) => {
  const bien = JSON.stringify(a) === JSON.stringify(b)
  console.log((bien ? '  ok    ' : ' FALLA  ') + n + (bien ? '' : `\n         esperaba ${JSON.stringify(b)}\n         obtuve   ${JSON.stringify(a)}`))
  bien ? ok++ : mal++
}
const si = (n, c, d = '') => {
  console.log((c ? '  ok    ' : ' FALLA  ') + n + (d ? ' — ' + d : ''))
  c ? ok++ : mal++
}

const leyendo = (obj) => {
  globalThis.__crudo = obj === undefined ? undefined : JSON.stringify(obj)
  return M.leer()
}

console.log('\n- una temporada guardada con la forma VIEJA -')
// Esto es exactamente lo que hay hoy en su teléfono.
const viejo = {
  meta: 3,
  entrenamientos: ['2026-09-01', '2026-09-02'],
  dias: [
    {
      fecha: '2026-09-02',
      torneo: 'Liga',
      partidos: [{ rival: 'Manquehue', nuestros: 3, suyos: 1, goles: 2, sensacion: 4 }]
    }
  ],
  logros: { 'primer-toque': '2026-09-01' },
  proximo: { nombre: 'Copa', fecha: '2026-09-14' }
}
const r = leyendo(viejo)

eq('no se pierde ningún entrenamiento', r.entrenamientos.length, 2)
eq('las fechas quedan intactas', r.entrenamientos.map((e) => e.fecha), ['2026-09-01', '2026-09-02'])
si('y ahora son objetos', r.entrenamientos.every((e) => typeof e === 'object'))

eq('el partido sigue ahí', r.dias[0].partidos.length, 1)
eq('con su rival', r.dias[0].partidos[0].rival, 'Manquehue')
eq('su marcador', [r.dias[0].partidos[0].nuestros, r.dias[0].partidos[0].suyos], [3, 1])
eq('y sus goles', r.dias[0].partidos[0].goles, 2)
eq('la sensación tampoco se pierde', r.dias[0].partidos[0].sensacion, 4)

console.log('\n- lo que no se sabía NO se inventa como cero -')
// Un partido viejo no tiene asistencias porque nunca se preguntaron. Ponerle
// cero sería afirmar que no dio ninguna, y eso es un dato falso, no un vacío.
eq('asistencias desconocidas', r.dias[0].partidos[0].asistencias, null)
eq('minutos desconocidos', r.dias[0].partidos[0].minutos, null)

eq('los logros se conservan', r.logros, { 'primer-toque': '2026-09-01' })
// `proximo` guardaba un solo compromiso y pasó a ser una lista. Lo que estaba
// guardado tiene que entrar a esa lista, no evaporarse: es la fecha de su copa.
eq('el compromiso guardado entra al calendario', r.agenda, [
  { nombre: 'Copa', fecha: '2026-09-14' }
])

console.log('\n- la forma NUEVA se lee tal cual -')
const nuevo = leyendo({
  meta: 3,
  entrenamientos: [{ fecha: '2026-09-01', goles: 2, asistencias: 1 }],
  dias: [
    {
      fecha: '2026-09-05',
      torneo: 'Copa',
      partidos: [
        { rival: 'Prince', nuestros: 2, suyos: 2, goles: 1, asistencias: 1, duracion: 60, minutos: 50 },
        { rival: 'Manquehue', nuestros: 1, suyos: 1, goles: 0, minutos: 60 }
      ]
    }
  ]
})
eq('los goles del entrenamiento se mantienen', nuevo.entrenamientos[0].goles, 2)
eq('y sus asistencias', nuevo.entrenamientos[0].asistencias, 1)
eq('las asistencias del partido no se pisan con null', nuevo.dias[0].partidos[0].asistencias, 1)
eq('ni los minutos, si viene la duracion detras', nuevo.dias[0].partidos[0].minutos, 50)
// Los minutos sin duracion los puso la app, no el: salieron de suponer que un
// partido de 11 dura sesenta, y esa suposicion resulto falsa. Se descartan.
eq('y sin ella se descartan, aunque sea de 11', nuevo.dias[0].partidos[1].minutos, null)

console.log('\n- mezcla de las dos formas -')
const mixto = leyendo({
  meta: 3,
  entrenamientos: ['2026-09-01', { fecha: '2026-09-03', goles: 1 }],
  dias: []
})
eq('convive lo viejo con lo nuevo', mixto.entrenamientos.map((e) => e.fecha), ['2026-09-01', '2026-09-03'])
eq('y el que traía goles los conserva', mixto.entrenamientos[1].goles, 1)

console.log('\n- basura y vacíos no rompen nada -')
eq('sin nada guardado, arranca vacía', leyendo(undefined).entrenamientos, [])
eq('un asistencias en cero SÍ es cero, no desconocido',
  leyendo({ dias: [{ fecha: '2026-09-05', torneo: 'x', partidos: [{ asistencias: 0 }] }] })
    .dias[0].partidos[0].asistencias,
  0)

globalThis.__crudo = 'esto no es json'
si('un texto corrupto no tumba la app', Array.isArray(M.leer().entrenamientos))

console.log('\n- el tema elegido sobrevive a la lectura -')
/*
  `leer` reconstruye el estado campo a campo en vez de copiarlo. Es a proposito
  —asi una copia antigua entra con los campos nuevos rellenos—, pero tiene un
  filo: un campo que no se nombre ahi se guarda bien y desaparece en la lectura
  siguiente. Eso le paso al tema, y no lo vio ninguna prueba: lo vi al usarlo.
*/
globalThis.__crudo = JSON.stringify({ meta: 3, entrenamientos: [], dias: [], tema: 'rosa' })
eq('el rosado vuelve', M.leer().tema, 'rosa')
globalThis.__crudo = JSON.stringify({ meta: 3, entrenamientos: [], dias: [] })
eq('sin nada elegido, sigue al telefono', M.leer().tema, 'auto')
globalThis.__crudo = JSON.stringify({ meta: 3, entrenamientos: [], dias: [], tema: 'dark' })
eq('y el oscuro tambien', M.leer().tema, 'dark')

console.log(`\n${ok} ok, ${mal} fallos`)
process.exit(mal ? 1 : 0)
