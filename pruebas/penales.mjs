/**
 * Ganar o perder por penales.
 *
 * Una eliminatoria empatada se define por penales, y ese partido no es un
 * empate. Con el marcador solo, una final ganada 2–2 contaba como empatada —
 * y eso falseaba justo los partidos que más importan.
 *
 * El riesgo ahora es el contrario: que un 3–1 se lea como definido por penales
 * porque quedó un dato viejo colgando, o que la lista diga una cosa y la ficha
 * del rival otra.
 */
import { cargar, trozo } from './marco.mjs'

const fuente =
  'export let estado = { meta: 3, entrenamientos: [], dias: [] }\n' +
  'export const ponerEstado = (e) => { estado = e }\n' +
  trozo('function todosLosPartidos', '// ---------- logros') +
  trozo('  function totales()', '  const resultado =') +
  trozo('  const resultado = (p) =>', '  // ---------- pintar ----------') +
  trozo('  function porRival()', '  function pintarRivales') +
  '\nexport { resultado, seFueAPenales, totales, porRival }'

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

const par = (nuestros, suyos, penales = null) => ({
  rival: 'A', nuestros, suyos, goles: 0, penales
})
const dia = (...partidos) => ({ fecha: '2026-03-07', torneo: 'Copa', partidos })

console.log('\n- sin penales, manda el marcador -')
eq('3–1 es ganado', M.resultado(par(3, 1)), 'g')
eq('0–2 es perdido', M.resultado(par(0, 2)), 'p')
eq('2–2 sin penales es empate', M.resultado(par(2, 2)), 'e')

console.log('\n- con penales, el empate se resuelve -')
eq('2–2 ganado en penales cuenta como ganado', M.resultado(par(2, 2, 'g')), 'g')
eq('2–2 perdido en penales cuenta como perdido', M.resultado(par(2, 2, 'p')), 'p')

console.log('\n- pero no pueden dar vuelta un marcador -')
// Un dato viejo colgando no puede convertir una goleada en una derrota.
eq('3–1 con penales «p» sigue ganado', M.resultado(par(3, 1, 'p')), 'g')
eq('0–3 con penales «g» sigue perdido', M.resultado(par(0, 3, 'g')), 'p')

console.log('\n- la marca solo aparece donde tiene sentido -')
eq('2–2 con penales, sí', M.seFueAPenales(par(2, 2, 'g')), true)
eq('2–2 sin penales, no', M.seFueAPenales(par(2, 2)), false)
eq('3–1 con penales colgando, tampoco', M.seFueAPenales(par(3, 1, 'g')), false)

console.log('\n- los totales cuentan la final ganada -')
M.ponerEstado({
  meta: 3,
  entrenamientos: [],
  dias: [dia(par(2, 2, 'g'), par(1, 1, 'p'), par(0, 0))]
})
eq('un ganado', M.totales().ganados, 1)
eq('tres partidos', M.totales().partidos, 3)

console.log('\n- y la ficha del rival dice lo mismo -')
const r = M.porRival()[0]
eq('mismo rival, tres partidos', r.jugados, 3)
eq('uno ganado', r.g, 1)
eq('uno perdido', r.p, 1)
eq('uno empatado de verdad', r.e, 1)
// Los dos sitios tienen que contar igual: si la lista dice ganado y la ficha
// dice empatado, uno de los dos miente y no hay forma de saber cuál.
eq('la suma cuadra con los partidos', r.g + r.e + r.p, r.jugados)

console.log(`\n${ok} ok, ${mal} fallos`)
process.exit(mal ? 1 : 0)
