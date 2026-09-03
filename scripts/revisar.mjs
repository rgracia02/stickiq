/**
 * Revisión estructural de la página.
 *
 * Existe por un error concreto: al reescribir una pantalla corté el archivo por
 * posiciones en vez de por anclas y me llevé cuatro funciones enteras por
 * delante. `node --check` pasó sin quejarse, porque lo que quedaba seguía siendo
 * JavaScript válido.
 *
 * Un archivo que compila no es un archivo correcto. Esto comprueba lo que un
 * analizador de sintaxis no puede: que las piezas sigan estando y sigan
 * conectadas entre sí.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { js, marcado, RAIZ } from '../pruebas/marco.mjs'

let mal = 0

function ok(nombre, cond, detalle = '') {
  console.log((cond ? '  ok    ' : ' FALLA  ') + nombre + (detalle ? ' — ' + detalle : ''))
  if (!cond) mal++
}

// ---------- estilos ----------

const css = marcado.slice(marcado.indexOf('<style>'), marcado.indexOf('</style>'))
const abre = (css.match(/{/g) ?? []).length
const cierra = (css.match(/}/g) ?? []).length
ok('llaves del CSS equilibradas', abre === cierra, `${abre} vs ${cierra}`)

// ---------- etiquetas ----------

/*
  Los comentarios se quitan antes de contar: un comentario que dice «un <button>
  centra su contenido» no es un botón abierto. Contarlo avisaba en falso, y una
  comprobación que grita en falso deja de leerse — peor que no tenerla.
*/
const limpio = marcado.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')

for (const t of ['div', 'section', 'nav', 'button', 'header', 'p']) {
  const a = (limpio.match(new RegExp(`<${t}[\\s>]`, 'g')) ?? []).length
  const c = (limpio.match(new RegExp(`</${t}>`, 'g')) ?? []).length
  ok(`<${t}> abre y cierra igual`, a === c, `${a} vs ${c}`)
}

// ---------- identificadores ----------

const sacar = (texto, re) => new Set([...texto.matchAll(re)].map((m) => m[1]))

const enMarcado = sacar(marcado, /id="([\w-]+)"/g)
const enPlantillas = sacar(js, /id="([\w-]+)"/g)
const buscados = sacar(js, /getElementById\('([\w-]+)'\)/g)

const sinDestino = [...buscados].filter((i) => !enMarcado.has(i) && !enPlantillas.has(i)).sort()
ok(`los ${buscados.size} ids buscados tienen destino`, sinDestino.length === 0, sinDestino.join(', '))

// ---------- funciones ----------

/*
  Las piezas que sostienen la app. Si alguna desaparece, la página sigue
  compilando y deja de funcionar en silencio: un botón que no responde, un
  gráfico que no se dibuja, y ningún error en ninguna parte.
*/
const CLAVE = [
  'leer', 'guardar', 'pintar', 'iso', 'desdeIso', 'lunesDe',
  'entrenoHoy', 'alternarHoy', 'racha', 'totales',
  'pintarNivel', 'pintarMapa', 'pintarLogros', 'pintarRecords', 'pintarGrafico',
  'pintarMapaD', 'pintarDias', 'pintarProximo', 'pintarAvisoCopia',
  'dibujoDeLaD', 'dentroDeLaD', 'puntoDelToque', 'todosLosGoles',
  'graficoAporte', 'graficoMinutos', 'graficoSemanas', 'graficoEntrenos',
  'recordsAhora', 'revisarRecords', 'revisarLogros', 'resumenLogros',
  'abrirPartido', 'abrirEdicion', 'guardarPartido', 'borrarPartido',
  'abrirDetalleEntreno', 'abrirDatos', 'abrirResumen', 'abrirProximo',
  'restaurarDesde', 'irA', 'celebrar', 'cablearHoja', 'cablearD',
  'alternarDia', 'mostrarDia', 'normalizarGoles', 'pintarCuartos', 'todosLosGolesDetallados',
  'porRival', 'pintarRivales', 'unReparto', 'resultado', 'seFueAPenales', 'claveRival', 'rivalesConocidos', 'loQueViene', 'contarLogro', 'duracionDe', 'proporcionDe', 'aDatoLimpio',
  'periodosDe', 'estructuraDe', 'comoSeJuega', 'recortarPeriodos', 'pintarDuracion', 'sugerirComoSeJuega', 'aplicarTema', 'temaDe'
]

const perdidas = CLAVE.filter((f) => !new RegExp(`(function|const)\\s+${f}\\b`).test(js))
ok(`las ${CLAVE.length} funciones principales siguen ahí`, perdidas.length === 0, perdidas.join(', '))

// Definida y nunca llamada es código muerto, o una conexión que se soltó.
const sueltas = CLAVE.filter((f) => (js.match(new RegExp(`\\b${f}\\b`, 'g')) ?? []).length < 2)
ok('ninguna quedó definida sin usar', sueltas.length === 0, sueltas.join(', '))

// ---------- escuchas que se acumulan ----------

/*
  `cablearD` cuelga escuchas sobre elementos que NO se reemplazan al redibujar.
  Llamarla dos veces sobre la misma hoja duplica el interruptor de los periodos:
  tocar una ficha lo ejecuta dos veces —lo pone y lo quita— y no pasa nada, sin
  ningun error en consola. Ya ocurrio dos veces; la segunda la encontro el, no
  yo, y solo porque uso la app.

  Asi que la guarda no es un comentario: se revisa que exista.
*/
const cuerpoD = js.slice(js.indexOf('function cablearD'), js.indexOf('// ---------- mis datos'))
const hayGuarda = /dataset[.]cableado/.test(cuerpoD)
const hayMarca = /campo[.]dataset[.]cableado/.test(cuerpoD)
ok(
  'cablearD no puede cablear dos veces la misma hoja',
  hayGuarda,
  hayGuarda ? '' : 'falta la guarda antes de addEventListener'
)
ok(
  'y la marca vive en un elemento que la hoja vuelve a crear',
  hayMarca,
  hayMarca ? '' : 'la marca tiene que ir en #campo-d, no en algo permanente'
)

// ---------- el sitio publicado ----------

/*
  `docs/index.html` es lo que sirve GitHub Pages, y se genera desde `la-d.html`.
  Si alguien toca la app y no reconstruye, el telefono sigue mostrando la
  version vieja mientras las pruebas pasan sobre la nueva: verde en la consola
  y mentira en la mano.

  Se compara el archivo ENTERO, no `marcado`: ese es solo la mitad de arriba
  del <script>, y con el bastaria dejar el codigo viejo para pasar la revision.
*/
const sitio = join(RAIZ, 'docs', 'index.html')
if (!existsSync(sitio)) {
  ok('docs/ esta construido', false, 'corre: npm run construir')
} else {
  const fuente = readFileSync(join(RAIZ, 'la-d.html'), 'utf8')
  const alDia = readFileSync(sitio, 'utf8').includes(fuente)
  ok(
    'docs/index.html trae exactamente la app de ahora',
    alDia,
    alDia ? '' : 'docs/ quedo atras — corre: npm run construir'
  )
}

// ---------- el que guarda la copia ----------

/*
  `docs/sw.js` es lo que hace que la app abra sin señal, y su nombre de cache
  es el hash de la pagina. Si los dos no coinciden, el telefono se queda
  sirviendo una copia vieja para siempre y desde afuera se ve como una app que
  dejo de actualizarse. No avisa nadie: por eso se compara.
*/
const sw = join(RAIZ, 'docs', 'sw.js')
if (existsSync(sitio) && existsSync(sw)) {
  const hash = createHash('sha256').update(readFileSync(sitio, 'utf8')).digest('hex').slice(0, 12)
  const dice = readFileSync(sw, 'utf8').match(/stickiq-([0-9a-f]{12})/)?.[1]
  ok(
    'el cache del service worker apunta a la pagina de ahora',
    dice === hash,
    dice === hash ? '' : `sw.js dice ${dice}, la pagina es ${hash} — corre: npm run construir`
  )
} else {
  ok('docs/sw.js existe', false, 'corre: npm run construir')
}

// ---------- quien tapa a quien ----------

/*
  Nada flotante puede quedar por encima de la hoja abierta.

  La barra de pestañas estaba en z-index 30 y la hoja en 20: la barra tapaba el
  final de la hoja, o sea el torneo, la fecha y el boton de guardar. Se podia
  llenar un partido entero y no poder guardarlo.

  Lo encontro Rodrigo usandola. Ninguna prueba lo veia —ninguna mira si un
  elemento tapa a otro— y a mi se me paso mirando capturas con la hoja cerrada.
  Asi que se revisa el numero, que es lo unico que se puede revisar sin pintar.

  La fiesta SI va encima: es una celebracion a pantalla completa y se cierra
  sola.
*/
const zDe = (sel) => {
  const i = css.indexOf(sel)
  if (i === -1) return null
  const n = css.slice(i, css.indexOf('}', i)).match(/z-index:\s*(\d+)/)
  return n ? Number(n[1]) : null
}
const zHoja = zDe('.telon {')
const zBarra = zDe('.barra-abajo {')
ok(
  'la hoja abierta queda por encima de la barra de pestañas',
  zHoja !== null && zBarra !== null && zHoja > zBarra,
  zHoja !== null && zBarra !== null && zHoja > zBarra ? '' : `hoja ${zHoja}, barra ${zBarra}`
)
ok(
  'y la barra ademas se esconde con la hoja abierta',
  /body:has\(\.telon:not\(\[hidden\]\)\)[^{]*\.barra-abajo/.test(css),
  ''
)

// ---------- texto de fuera ----------

/*
  Todo nombre escrito por una persona se pinta escapado.

  «Restaurar» acepta una copia pegada, asi que el rival y el torneo pueden
  venir de otro. Un nombre sin escapar dentro de un innerHTML es codigo
  corriendo en la pagina que guarda toda la temporada. Ya habia uno asi en los
  records, y no lo vio ninguna prueba: por eso se revisa la forma, no el caso.
*/
/*
  Solo dos formas de nombrar a alguien son seguras dentro de un `${...}`:
  escaparlo, o no pintarlo. Cualquier otra cosa se denuncia.
*/
const SEGURAS = [
  // Lo pinta, pero escapado. Es la forma correcta.
  /escapar\(/,
  // No pinta el nombre: compara dos claves y sale un booleano.
  /===|!==/
]
const sinEscapar = [...js.matchAll(/\$\{[^}]*\.(?:rival|torneo)[^}]*\}/g)]
  .map((m) => m[0])
  .filter((t) => !SEGURAS.some((r) => r.test(t)))
  .map((t) => t.replace(/\s+/g, ' '))
ok(
  'ningun nombre de rival o torneo se pinta sin escapar',
  sinEscapar.length === 0,
  sinEscapar.join('  |  ')
)

// ---------- temas ----------

/*
  Todo token de color tiene que estar definido en los CUATRO estados del tema:
  claro, oscuro por sistema, oscuro por eleccion y rosado. Uno que falte en un
  bloque no rompe nada — simplemente ese color no se aplica, y la pagina se ve
  con el texto de un tema sobre el fondo del otro.

  Los limites se calculan, no se escriben: cuando entro el rosado, el bloque
  «eleccion» se comio los dos y un color que faltara en cualquiera de ellos
  habria pasado desapercibido.
*/
const finClaro = css.indexOf('@media (prefers-color-scheme: dark)')
const finMedia = css.indexOf(':root[data-theme="dark"]')
const finOscuro = css.indexOf(':root[data-theme="rosa"]')
const bloques = {
  claro: css.slice(css.indexOf(':root {'), finClaro),
  sistema: css.slice(finClaro, finMedia),
  eleccion: css.slice(finMedia, finOscuro),
  rosa: css.slice(finOscuro, css.indexOf('* { box-sizing'))
}

/*
  La lista sale de la UNIÓN de los tres bloques, no de uno.

  La primera versión la sacaba del bloque del tema oscuro por elección, y por
  eso no servía: al borrar un color de ahí, desaparecía también de la lista de
  cosas que buscar, y la comprobación pasaba tan contenta. Una comprobación que
  deduce lo que espera de lo mismo que está revisando no revisa nada.
*/
const todos = new Set(
  Object.values(bloques).flatMap((b) => [...b.matchAll(/(--[\w-]+):/g)].map((m) => m[1]))
)
const incompletos = [...todos]
  .filter((t) => !Object.values(bloques).every((b) => b.includes(t + ':')))
  .sort()

/*
  Lo que a propósito no cambia con el tema.

  · Las medidas no son colores.
  · La cancha no sigue al tema del sistema: es azul de dia y de noche, porque
    esa tarjeta es una superficie comprometida. El rosado si la cambia, y por
    eso es otro mundo y no el mismo con un acento distinto — pero sigue siendo
    una eleccion explicita, no algo que deba estar en todos los bloques.

  La lista es corta y explícita para que siga sirviendo: cualquier color NUEVO
  que no esté en los tres bloques salta, que es justo lo que hace falta.
*/
const A_PROPOSITO = ['--paso', '--radio', '--cancha', '--cancha-honda', '--pelota', '--linea']
const deColor = incompletos.filter((t) => !A_PROPOSITO.includes(t))
ok(
  `los ${todos.size - A_PROPOSITO.length} colores existen en los cuatro temas`,
  deColor.length === 0,
  deColor.join(', ')
)

console.log(mal ? `\nrevisión: ${mal} problemas` : '\nrevisión: todo bien')
process.exit(mal ? 1 : 0)
