/**
 * Niveles y racha.
 *
 * Los dos se equivocan en silencio y de la peor forma: un nivel que salta uno
 * de más se ve perfectamente creíble, y una racha que se rompe sola un
 * miércoles te dice que fallaste una semana que todavía puedes cumplir.
 *
 * Se cargan las funciones del archivo real, no una copia.
 */
import { cargar, js, trozo } from './marco.mjs'


const fuente =
  'export let estado = { meta: 3, entrenamientos: [], dias: [] }\n' +
  'export const ponerEstado = (e) => { estado = e }\n' +
  trozo('function iso(', '// ---------- entrenamientos') +
  trozo('const umbral =', 'function pintarNivel') +
  '\nexport { iso, desdeIso, lunesDe, umbral, nivelDe, sesiones, racha }'

const M = await cargar(fuente)

let ok = 0
let mal = 0
const eq = (nombre, a, b) => {
  const bien = JSON.stringify(a) === JSON.stringify(b)
  console.log(
    (bien ? '  ok    ' : ' FALLA  ') +
      nombre +
      (bien ? '' : `  esperaba ${JSON.stringify(b)}, obtuve ${JSON.stringify(a)}`)
  )
  bien ? ok++ : mal++
}

console.log('\n- los umbrales de nivel -')
eq('el nivel 1 empieza en cero', M.umbral(1), 0)
eq('el 2 a las 3 sesiones (una semana)', M.umbral(2), 3)
eq('el 3 a las 9', M.umbral(3), 9)
eq('el 4 a las 18', M.umbral(4), 18)
eq('el 5 a las 30', M.umbral(5), 30)

console.log('\n- el nivel no se adelanta ni se atrasa -')
eq('con 0 sesiones, nivel 1', M.nivelDe(0), 1)
eq('con 2, todavia 1', M.nivelDe(2), 1)
eq('con 3 justas, ya es 2', M.nivelDe(3), 2)
eq('con 8, sigue 2', M.nivelDe(8), 2)
eq('con 9 justas, es 3', M.nivelDe(9), 3)
eq('con 100, es 8', M.nivelDe(100), 8)

console.log('\n- las sesiones suman entrenamientos y partidos -')
M.ponerEstado({
  meta: 3,
  entrenamientos: [{ fecha: '2026-09-01' }, { fecha: '2026-09-03' }],
  dias: [{ fecha: '2026-09-05', torneo: 'Liga', partidos: [{}, {}, {}] }]
})
eq('dos entrenamientos mas tres partidos', M.sesiones(), 5)

console.log('\n- la racha cuenta semanas cumplidas -')
// Las semanas se cuentan hacia atras desde hoy, asi que las de prueba tienen
// que estar en el pasado. La primera version las puso en el futuro y esperaba
// que sumaran: una semana que todavia no ocurre no puede contar.
const lunesHace = (n) => {
  const d = M.desdeIso(M.lunesDe(new Date()))
  d.setDate(d.getDate() - n * 7)
  return d
}
const nDeEsa = (lunes, cuantos) =>
  Array.from({ length: cuantos }, (_, k) => {
    const d = new Date(lunes)
    d.setDate(d.getDate() + k)
    return { fecha: M.iso(d) }
  })

M.ponerEstado({ meta: 3, entrenamientos: [], dias: [] })
eq('sin nada, racha 0', M.racha(), 0)

M.ponerEstado({ meta: 3, entrenamientos: nDeEsa(lunesHace(1), 2), dias: [] })
eq('una semana a medias no cuenta', M.racha(), 0)

M.ponerEstado({
  meta: 3,
  entrenamientos: [...nDeEsa(lunesHace(2), 3), ...nDeEsa(lunesHace(1), 3)],
  dias: []
})
eq('dos semanas seguidas cumplidas', M.racha(), 2)

M.ponerEstado({
  meta: 3,
  entrenamientos: [
    ...nDeEsa(lunesHace(3), 3),
    ...nDeEsa(lunesHace(2), 1),
    ...nDeEsa(lunesHace(1), 3)
  ],
  dias: []
})
eq('una semana rota corta la racha', M.racha(), 1)

console.log('\n- la semana en curso no rompe la racha antes de tiempo -')
// La clave: si esta semana va a medias, la racha mira a la semana pasada en vez
// de decir cero. Romperla un miercoles seria mentir: todavia puede cumplirse.
const hoyReal = new Date()
const lunesEsta = M.desdeIso(M.lunesDe(hoyReal))
const lunesPasada = new Date(lunesEsta)
lunesPasada.setDate(lunesPasada.getDate() - 7)
const tresDeEsa = (lunes) =>
  [0, 1, 2].map((i) => {
    const d = new Date(lunes)
    d.setDate(d.getDate() + i)
    return { fecha: M.iso(d) }
  })

M.ponerEstado({ meta: 3, entrenamientos: tresDeEsa(lunesPasada), dias: [] })
eq('la semana pasada cumplida y esta vacia: la racha vale 1', M.racha(), 1)

M.ponerEstado({
  meta: 3,
  entrenamientos: [...tresDeEsa(lunesPasada), { fecha: M.iso(lunesEsta) }],
  dias: []
})
eq('esta semana con uno solo: sigue valiendo 1, no 0', M.racha(), 1)

M.ponerEstado({ meta: 3, entrenamientos: [...tresDeEsa(lunesPasada), ...tresDeEsa(lunesEsta)], dias: [] })
eq('esta semana ya cumplida: vale 2', M.racha(), 2)

console.log(`\n${ok} ok, ${mal} fallos`)
process.exit(mal ? 1 : 0)
