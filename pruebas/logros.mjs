/**
 * Logros.
 *
 * Se equivocan de la peor forma: en silencio y hacia abajo. Un logro que no
 * salta cuando toca no lanza nada — simplemente no pasa nada, y tú no sabes que
 * te lo debían.
 *
 * La sospecha concreta: la racha compara semanas en milisegundos, y en Chile el
 * horario de verano empieza la primera semana de septiembre. Esa semana tiene
 * 167 horas, no 168.
 */
import { cargar, js, trozo } from './marco.mjs'

const fuente =
  'export let estado = { meta: 3, entrenamientos: [], dias: [], logros: {} }\n' +
  'export const ponerEstado = (e) => { estado = { logros: {}, ...e } }\n' +
  'const guardar = () => {}\n' +
  trozo('function iso(', '// ---------- entrenamientos') +
  trozo('function todosLosPartidos', '// ---------- logros') +
  trozo('const LOGROS =', 'function pintarLogros') +
  '\nexport { LOGROS, resumenLogros, revisarLogros, iso, desdeIso, lunesDe }'

const M = await cargar(fuente)

let ok = 0
let mal = 0
const eq = (n, a, b) => {
  const bien = JSON.stringify(a) === JSON.stringify(b)
  console.log((bien ? '  ok    ' : ' FALLA  ') + n + (bien ? '' : `  esperaba ${JSON.stringify(b)}, obtuve ${JSON.stringify(a)}`))
  bien ? ok++ : mal++
}
const si = (n, c, d = '') => {
  console.log((c ? '  ok    ' : ' FALLA  ') + n + (d ? ' — ' + d : ''))
  c ? ok++ : mal++
}

// Por defecto 1-1: un 1-0 es valla invicta, y con ese default cada prueba
// arrastraba un logro que no venia a comprobar.
const partido = (goles, nuestros = 1, suyos = 1) => ({ rival: 'X', nuestros, suyos, goles })
const dia = (fecha, ...partidos) => ({ fecha, torneo: 'Liga', partidos })

const conseguidos = (e) => {
  M.ponerEstado(e)
  M.revisarLogros()
  return Object.keys(M.estado.logros).sort()
}

console.log('\n- la lista esta sana -')
si('no hay ids repetidos', new Set(M.LOGROS.map((l) => l.id)).size === M.LOGROS.length)
si('todos tienen nombre, marca y pista', M.LOGROS.every((l) => l.nombre && l.marca && l.pista))
si('hay al menos tres secretos', M.LOGROS.filter((l) => l.oculto).length >= 3)

console.log('\n- de cero no se gana nada -')
eq('sin datos, ningun logro', conseguidos({ meta: 3, entrenamientos: [], dias: [] }), [])

console.log('\n- cada uno salta cuando toca, no antes -')
eq('un entrenamiento da el primer toque',
  conseguidos({ meta: 3, entrenamientos: [{ fecha: '2026-03-02' }], dias: [] }), ['primer-toque'])

eq('un partido sin goles da debut, no «anotaste»',
  conseguidos({ meta: 3, entrenamientos: [], dias: [dia('2026-03-07', partido(0))] }), ['debut'])

eq('un gol da tambien «anotaste»',
  conseguidos({ meta: 3, entrenamientos: [], dias: [dia('2026-03-07', partido(1))] }).sort(),
  ['anotaste', 'debut'])

si('con 2 goles cae el doblete pero no el hat-trick',
  conseguidos({ meta: 3, entrenamientos: [], dias: [dia('2026-03-07', partido(2))] }).includes('doblete'))
si('y el hat-trick sigue bloqueado',
  !conseguidos({ meta: 3, entrenamientos: [], dias: [dia('2026-03-07', partido(2))] }).includes('hat-trick'))
si('con 3 goles si cae el hat-trick',
  conseguidos({ meta: 3, entrenamientos: [], dias: [dia('2026-03-07', partido(3))] }).includes('hat-trick'))

si('tres partidos el mismo dia dan «fecha completa»',
  conseguidos({ meta: 3, entrenamientos: [],
    dias: [dia('2026-03-07', partido(0), partido(0), partido(0))] }).includes('fecha-completa'))
si('dos el mismo dia todavia no',
  !conseguidos({ meta: 3, entrenamientos: [],
    dias: [dia('2026-03-07', partido(0), partido(0))] }).includes('fecha-completa'))

si('ganar 2-0 da valla invicta',
  conseguidos({ meta: 3, entrenamientos: [], dias: [dia('2026-03-07', partido(1, 2, 0))] }).includes('valla-invicta'))
si('empatar 0-0 no la da',
  !conseguidos({ meta: 3, entrenamientos: [], dias: [dia('2026-03-07', partido(0, 0, 0))] }).includes('valla-invicta'))

console.log('\n- un logro ganado no se pierde -')
M.ponerEstado({ meta: 3, entrenamientos: [], dias: [dia('2026-03-07', partido(3))] })
M.revisarLogros()
const antes = Object.keys(M.estado.logros).length
M.revisarLogros()
eq('revisar dos veces no agrega ni quita', Object.keys(M.estado.logros).length, antes)

console.log('\n- solo devuelve los NUEVOS -')
M.ponerEstado({ meta: 3, entrenamientos: [{ fecha: '2026-03-02' }], dias: [] })
eq('la primera vez devuelve uno', M.revisarLogros().length, 1)
eq('la segunda, ninguno', M.revisarLogros().length, 0)

console.log('\n- la racha mas larga, no la actual -')
// Tres semanas seguidas y despues un hueco: el logro ya se gano y no se
// devuelve. Un premio que se quita al cortarse la racha es un castigo diferido.
const semanaDe = (lunesIso, n) =>
  Array.from({ length: n }, (_, i) => {
    const d = M.desdeIso(lunesIso)
    d.setDate(d.getDate() + i)
    return { fecha: M.iso(d) }
  })

const tresSeguidas = [
  ...semanaDe('2026-03-02', 3),
  ...semanaDe('2026-03-09', 3),
  ...semanaDe('2026-03-16', 3)
]
si('tres semanas al hilo dan el logro',
  conseguidos({ meta: 3, entrenamientos: tresSeguidas, dias: [] }).includes('tres-seguidas'))
si('con un hueco en medio, no',
  !conseguidos({ meta: 3,
    entrenamientos: [...semanaDe('2026-03-02', 3), ...semanaDe('2026-03-16', 3)], dias: [] })
    .includes('tres-seguidas'))

console.log('\n- y ahora el horario de verano -')
// En Chile los relojes se adelantan la primera semana de septiembre. La semana
// que la cruza dura 167 horas. Si la racha compara milisegundos, esa semana
// deja de parecer consecutiva y el logro no cae — sin ningun error.
const cruzandoDST = [
  ...semanaDe('2026-08-24', 3),
  ...semanaDe('2026-08-31', 3),
  ...semanaDe('2026-09-07', 3)
]
si('tres semanas al hilo cruzando el cambio de hora',
  conseguidos({ meta: 3, entrenamientos: cruzandoDST, dias: [] }).includes('tres-seguidas'),
  'zona: ' + Intl.DateTimeFormat().resolvedOptions().timeZone)

console.log(`\n${ok} ok, ${mal} fallos`)
process.exit(mal ? 1 : 0)
