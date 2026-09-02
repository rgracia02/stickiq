/**
 * El calendario de la temporada.
 *
 * Lo que se rompe en silencio acá:
 *
 * · Que una fecha guardada con el campo viejo no entre a la lista. No revienta:
 *   simplemente su copa desaparece del calendario y él cree que no la anotó.
 * · Que la cuenta regresiva apunte a algo que ya pasó, o que se salte lo de hoy.
 *   El día del torneo es justo el día en que la app tiene que decir «es hoy».
 */
import { cargar, trozo } from './marco.mjs'

const fuente =
  "const localStorage = { getItem: () => globalThis.__crudo, setItem: () => {} }\n" +
  "const CLAVE = 'la-d-v1'\n" +
  trozo('const ESTADO_VACIO', '  function guardar') +
  trozo('function iso(', '// ---------- entrenamientos') +
  trozo('  /* Lo que aún no ha pasado', '  function pintarProximo') +
  '\nexport const ponerEstado = (e) => { estado = e }' +
  '\nexport { leer, loQueViene, iso, estado }'

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

const enDias = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return M.iso(d)
}

console.log('\n- lo guardado con el campo viejo entra a la lista -')
globalThis.__crudo = JSON.stringify({
  meta: 3,
  entrenamientos: [],
  dias: [],
  proximo: { nombre: 'Copa', fecha: '2026-09-14' }
})
eq('una entrada', M.leer().agenda, [{ nombre: 'Copa', fecha: '2026-09-14' }])

console.log('\n- y si ya hay lista, el campo viejo no la pisa -')
globalThis.__crudo = JSON.stringify({
  meta: 3,
  entrenamientos: [],
  dias: [],
  proximo: { nombre: 'Viejo', fecha: '2026-01-01' },
  agenda: [{ nombre: 'Final', fecha: '2026-10-05' }]
})
eq('manda la lista', M.leer().agenda, [{ nombre: 'Final', fecha: '2026-10-05' }])

console.log('\n- la lista se ordena por fecha -')
globalThis.__crudo = JSON.stringify({
  meta: 3, entrenamientos: [], dias: [],
  agenda: [
    { nombre: 'Noviembre', fecha: '2026-11-20' },
    { nombre: 'Copa', fecha: '2026-09-14' },
    { nombre: 'Finales', fecha: '2026-10-05' }
  ]
})
eq('de la más cercana a la más lejana',
  M.leer().agenda.map((x) => x.nombre),
  ['Copa', 'Finales', 'Noviembre'])

console.log('\n- lo incompleto no entra -')
globalThis.__crudo = JSON.stringify({
  meta: 3, entrenamientos: [], dias: [],
  agenda: [{ nombre: 'Buena', fecha: '2026-09-14' }, { nombre: 'Sin fecha' }, { fecha: '2026-10-01' }, null]
})
// Una entrada a medias en el calendario reventaria al dibujarla, y en una app
// que se abre entre partido y partido eso es una pantalla en blanco.
eq('solo la completa', M.leer().agenda.length, 1)

console.log('\n- la cuenta regresiva mira lo que viene -')
M.ponerEstado({
  meta: 3, entrenamientos: [], dias: [],
  agenda: [
    { nombre: 'Pasada', fecha: enDias(-3) },
    { nombre: 'Hoy', fecha: enDias(0) },
    { nombre: 'Pronto', fecha: enDias(5) }
  ]
})
eq('lo de hoy cuenta como pendiente', M.loQueViene()[0].nombre, 'Hoy')
eq('y lo pasado queda fuera', M.loQueViene().length, 2)

M.ponerEstado({
  meta: 3, entrenamientos: [], dias: [],
  agenda: [{ nombre: 'Ayer', fecha: enDias(-1) }]
})
eq('con todo pasado, no hay próximo', M.loQueViene(), [])

M.ponerEstado({ meta: 3, entrenamientos: [], dias: [], agenda: [] })
eq('sin nada, tampoco', M.loQueViene(), [])

console.log('\n- lo pasado NO se borra solo -')
// Se queda en la lista, apagado, hasta que él lo quite. Que algo desaparezca de
// tu calendario sin que lo toques te hace dudar de si lo llegaste a anotar.
M.ponerEstado({
  meta: 3, entrenamientos: [], dias: [],
  agenda: [{ nombre: 'Pasada', fecha: enDias(-3) }, { nombre: 'Pronto', fecha: enDias(5) }]
})
eq('siguen las dos guardadas', M.estado.agenda.length, 2)
eq('pero solo una está pendiente', M.loQueViene().length, 1)

console.log(`\n${ok} ok, ${mal} fallos`)
process.exit(mal ? 1 : 0)
