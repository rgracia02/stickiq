/**
 * Las fechas de La D, que es lo que se rompe sin avisar.
 *
 * El error clásico —toISOString, que convierte a UTC— en Chile te corre el día
 * entero: marcas que entrenaste el martes a las 21:00 y queda anotado el
 * miércoles. No lanza nada. Solo tienes la semana mal para siempre.
 */
import { js, trozo } from './marco.mjs'

// Se toman las funciones puras del archivo real, no una copia: una copia se
// desincroniza y la prueba pasa a comprobar algo que ya no existe.
const fuente = trozo('function iso(', '// ---------- entrenamientos')
const { iso, desdeIso, lunesDe } = await import(
  'data:text/javascript,' + encodeURIComponent(fuente + '\nexport { iso, desdeIso, lunesDe }')
)

let ok = 0
let mal = 0
const eq = (nombre, a, b) => {
  const bien = JSON.stringify(a) === JSON.stringify(b)
  console.log((bien ? '  ok    ' : ' FALLA  ') + nombre + (bien ? '' : `  esperaba ${JSON.stringify(b)}, obtuve ${JSON.stringify(a)}`))
  bien ? ok++ : mal++
}

console.log('\n- la fecha local no se corre a UTC -')
// 21:00 en Chile ya es el día siguiente en UTC. Este es EL caso.
eq('un martes a las 21:00 sigue siendo martes', iso(new Date(2026, 8, 1, 21, 0)), '2026-09-01')
eq('a las 23:59 tambien', iso(new Date(2026, 8, 1, 23, 59)), '2026-09-01')
eq('y a las 00:01 ya es el otro dia', iso(new Date(2026, 8, 2, 0, 1)), '2026-09-02')
eq('un dia de un digito se rellena', iso(new Date(2026, 0, 5)), '2026-01-05')

console.log('\n- la semana empieza el lunes -')
eq('el lunes es su propio lunes', lunesDe(new Date(2026, 8, 7)), '2026-09-07')
eq('el martes mira al lunes', lunesDe(new Date(2026, 8, 8)), '2026-09-07')
eq('el domingo mira al lunes anterior, no al siguiente', lunesDe(new Date(2026, 8, 13)), '2026-09-07')
eq('el lunes siguiente ya es otra semana', lunesDe(new Date(2026, 8, 14)), '2026-09-14')

console.log('\n- la semana cruza de mes y de anno -')
eq('un miercoles 1 de julio', lunesDe(new Date(2026, 6, 1)), '2026-06-29')
eq('el 1 de enero de 2027 es viernes', lunesDe(new Date(2027, 0, 1)), '2026-12-28')

console.log('\n- ida y vuelta -')
for (const d of ['2026-09-14', '2026-01-01', '2026-12-31']) {
  eq('vuelve igual: ' + d, iso(desdeIso(d)), d)
}

console.log(`\n${ok} ok, ${mal} fallos`)
process.exit(mal ? 1 : 0)
