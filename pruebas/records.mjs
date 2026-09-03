/**
 * Récords.
 *
 * La parte delicada no es calcularlos: es cuándo felicitar. Dos errores
 * posibles y los dos silenciosos:
 *
 * · Felicitar de más — abres la app por primera vez con la temporada ya dentro
 *   y te saltan cuatro medallas por cosas que hiciste hace un mes. La primera
 *   vez no puede celebrar nada.
 * · Felicitar de menos — bates tu mejor partido y no pasa nada, que es
 *   exactamente lo que hace que la app deje de sentirse viva.
 */
import { cargar, js, trozo } from './marco.mjs'

const fuente =
  'export let estado = { meta: 3, entrenamientos: [], dias: [], logros: {}, records: null }\n' +
  'export const ponerEstado = (e) => { estado = { logros: {}, records: null, ...e } }\n' +
  'const guardar = () => {}\n' +
  trozo('function iso(', '// ---------- entrenamientos') +
  trozo('function todosLosPartidos', '// ---------- logros') +
  trozo('const LOGROS =', 'function pintarLogros') +
  // `mejorPor` escapa el nombre del rival antes de meterlo en el texto: sin
  // esto la prueba carga una funcion que llama a algo que no existe.
  trozo('  const cuantos =', '  // ---------- la hoja de registro') +
  trozo('  const RECORDS =', '  function pintarRecords') +
  '\nexport { RECORDS, recordsAhora, revisarRecords, iso, desdeIso, cuantos }'

const M = await cargar(fuente)

let ok = 0
let mal = 0
const si = (n, c, d = '') => {
  console.log((c ? '  ok    ' : ' FALLA  ') + n + (d ? ' — ' + d : ''))
  c ? ok++ : mal++
}
const eq = (n, a, b) => si(n, JSON.stringify(a) === JSON.stringify(b), JSON.stringify(a))

const partido = (goles, asistencias = 0, rival = 'A') => ({
  rival, nuestros: 1, suyos: 1, goles, asistencias
})
const conPartidos = (...ps) => [{ fecha: '2026-09-05', torneo: 'Liga', partidos: ps }]

console.log('\n- los récords salen de los datos -')
M.ponerEstado({ meta: 3, entrenamientos: [], dias: conPartidos(partido(1), partido(3), partido(2)) })
eq('el mejor partido son 3 goles', M.recordsAhora()['goles-partido'].valor, 3)
eq('y dice contra quién fue', M.recordsAhora()['goles-partido'].cuando.startsWith('contra A'), true)

M.ponerEstado({ meta: 3, entrenamientos: [], dias: conPartidos(partido(1, 3), partido(2, 0)) })
eq('el mejor aporte suma goles y asistencias', M.recordsAhora()['aporte-partido'].valor, 4)

console.log('\n- sin datos, todo en cero y sin reventar -')
M.ponerEstado({ meta: 3, entrenamientos: [], dias: [] })
eq('mejor partido', M.recordsAhora()['goles-partido'].valor, 0)
eq('mejor semana', M.recordsAhora()['semana'].valor, 0)
eq('racha', M.recordsAhora()['racha'].valor, 0)

console.log('\n- la PRIMERA vez no felicita -')
// Este es el caso real: la app ya tiene una temporada dentro y recién ahora
// aprende a llevar récords.
M.ponerEstado({ meta: 3, entrenamientos: [], dias: conPartidos(partido(3)) })
eq('con datos ya cargados, ningún récord batido', M.revisarRecords().length, 0)
si('pero los deja anotados', M.estado.records['goles-partido'] === 3)

console.log('\n- y a partir de ahí, sí -')
M.estado.dias = conPartidos(partido(3), partido(4, 0, 'B'))
const batidos = M.revisarRecords()
// Dos, y esta bien que sean dos: el aporte incluye los goles, asi que subir de
// 3 a 4 goles bate el mejor partido Y el mejor aporte. Mi expectativa decia uno.
eq('dos records batidos a la vez', batidos.length, 2)
si('uno es el del mejor partido',
  batidos.some((r) => r.nombre.includes('goles en un partido')),
  batidos.map((r) => r.nombre).join(' / '))
si('y el otro el del aporte', batidos.some((r) => r.nombre.includes('aporte')))
si('los dos con la marca nueva', batidos.every((r) => r.marca === '4'))

console.log('\n- igualar no es batir -')
M.estado.dias = conPartidos(partido(3), partido(4, 0, 'B'), partido(4, 0, 'C'))
eq('empatar el récord no felicita', M.revisarRecords().length, 0)
eq('y el récord sigue siendo 4', M.estado.records['goles-partido'], 4)

console.log('\n- borrar un partido no inventa un récord nuevo -')
// Al quitar el mejor partido el récord baja. Eso no puede leerse como logro.
M.estado.dias = conPartidos(partido(1))
eq('bajar no felicita', M.revisarRecords().length, 0)
eq('y el récord guardado baja con los datos', M.estado.records['goles-partido'], 1)

console.log('\n- dos récords a la vez se anuncian los dos -')
M.ponerEstado({ meta: 3, entrenamientos: [], dias: conPartidos(partido(1, 0)) })
M.revisarRecords()
M.estado.dias = conPartidos(partido(1, 0), partido(5, 4, 'B'))
const dos = M.revisarRecords()
eq('mejor partido y mejor aporte', dos.length, 2)

console.log('\n- la semana más cargada -')
const dias = (lunesIso, n) =>
  Array.from({ length: n }, (_, i) => {
    const d = M.desdeIso(lunesIso)
    d.setDate(d.getDate() + i)
    return { fecha: M.iso(d) }
  })
M.ponerEstado({
  meta: 3,
  entrenamientos: [...dias('2026-03-02', 2), ...dias('2026-03-09', 4)],
  dias: []
})
eq('cuenta la mejor, no la última', M.recordsAhora()['semana'].valor, 4)
si('y dice cuál semana fue', M.recordsAhora()['semana'].cuando.includes('semana del'))

console.log('\n- un nombre de rival no puede traer codigo -')
/*
  Este es el unico camino por el que entra texto que Rodrigo no escribio:
  Restaurar acepta una copia pegada, y esa copia se la pudo mandar cualquiera.
  El texto de `cuando` termina en dos innerHTML, asi que un rival llamado
  <img onerror=...> corria codigo en la pagina que guarda toda la temporada.
*/
const MALO = '<img src=x onerror=alert(1)>'
M.ponerEstado({
  meta: 3,
  entrenamientos: [],
  dias: [{ fecha: '2026-03-07', torneo: 'Liga', partidos: [
    { rival: MALO, nuestros: 3, suyos: 0, goles: 3, asistencias: 0, formato: 11, periodos: 4 }
  ] }]
})
const texto = Object.values(M.recordsAhora()).map((v) => v.cuando ?? '').join(' ')
si('el nombre del rival llega al record', texto.includes('img'))
si('pero sin < que abra una etiqueta', !texto.includes('<'), texto.slice(0, 70))
si('y sin > que la cierre', !texto.includes('>'))
si('viene escapado', texto.includes('&lt;img'), texto.slice(0, 70))

console.log('\n- uno no lleva plural -')
/*
  «1 goles» no lo escribe nadie, pero lo escribia la app — y justo en la
  lamina, la unica pantalla hecha para que la vean otros. Habia treinta
  ternarios de plural repartidos por el archivo y a cinco sitios no llegaron.

  En español no basta con la palabra: son «1 semana seguida» y «3 semanas
  seguidas». El adjetivo tambien concuerda.
*/
eq('uno va en singular', M.cuantos(1, 'gol', 'goles'), '1 gol')
eq('dos en plural', M.cuantos(2, 'gol', 'goles'), '2 goles')
eq('cero en plural', M.cuantos(0, 'gol', 'goles'), '0 goles')
eq('y el adjetivo concuerda con el',
  M.cuantos(1, 'semana seguida', 'semanas seguidas'), '1 semana seguida')
eq('igual que en plural',
  M.cuantos(3, 'semana seguida', 'semanas seguidas'), '3 semanas seguidas')

const racha = M.RECORDS.find((r) => r.id === 'racha')
eq('el record de racha usa el singular', racha.unidad(1), '1 semana seguida')
eq('y el plural', racha.unidad(4), '4 semanas seguidas')

console.log(`\n${ok} ok, ${mal} fallos`)
process.exit(mal ? 1 : 0)
