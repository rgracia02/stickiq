/**
 * Mete las tipografías DENTRO de la página, y las saca de Google.
 *
 * Antes la página pedía las fuentes a fonts.googleapis.com, así que Google veía
 * la IP del teléfono cada vez que Rodrigo la abría. Para una app que solo guarda
 * datos en su propio teléfono, esa era la única conexión que salía a internet.
 *
 * Los .woff2 viven en `fuentes/`, y esto los convierte en un bloque @font-face
 * con data: URIs. Se ejecuta a mano cuando cambien las fuentes —o sea, casi
 * nunca— y el resultado queda dentro de `la-d.html`, que sigue siendo un solo
 * archivo que funciona igual como Artifact y como sitio propio.
 *
 *   node scripts/fuentes.mjs
 *
 * Solo el subconjunto `latin`. Cubre el alfabeto español completo, la ñ, los
 * acentos, ¿ ¡ « » º y el guion largo del marcador (3–1). Los subconjuntos
 * vietnamita y latin-ext pesaban lo mismo y no se usan.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')

// El rango que Google declara para `latin`. Se copia tal cual: recortarlo a
// ojo deja letras sin dibujar en un nombre de rival que todavía no existe.
const RANGO =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, ' +
  'U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, ' +
  'U+2193, U+2212, U+2215, U+FEFF, U+FFFD'

const CARAS = [
  ['Barlow', 400, 'barlow-400.woff2'],
  ['Barlow', 500, 'barlow-500.woff2'],
  ['Barlow', 600, 'barlow-600.woff2'],
  ['Barlow Condensed', 500, 'barlow-condensed-500.woff2'],
  ['Barlow Condensed', 600, 'barlow-condensed-600.woff2'],
  ['Barlow Condensed', 700, 'barlow-condensed-700.woff2']
]

const enDisco = new Set(readdirSync(join(RAIZ, 'fuentes')))
const faltan = CARAS.filter(([, , f]) => !enDisco.has(f)).map(([, , f]) => f)
if (faltan.length) {
  console.error('faltan en fuentes/: ' + faltan.join(', '))
  process.exit(1)
}

let bytes = 0
const reglas = CARAS.map(([familia, peso, archivo]) => {
  const datos = readFileSync(join(RAIZ, 'fuentes', archivo))
  bytes += datos.length
  return (
    `@font-face{font-family:'${familia}';font-style:normal;font-weight:${peso};` +
    `font-display:swap;` +
    `src:url(data:font/woff2;base64,${datos.toString('base64')}) format('woff2');` +
    `unicode-range:${RANGO}}`
  )
})

const BLOQUE =
  '<style id="fuentes">\n' +
  '/* Generado por scripts/fuentes.mjs — no editar a mano.\n' +
  '   Las tipografías van acá dentro para que la página no le pida nada a\n' +
  '   Google: cero conexiones a internet, y por lo tanto cero rastro. */\n' +
  reglas.join('\n') +
  '\n</style>'

const p = join(RAIZ, 'la-d.html')
let s = readFileSync(p, 'utf8')

const INICIO = '<style id="fuentes">'
const FIN = '</style>'
if (s.includes(INICIO)) {
  const i = s.indexOf(INICIO)
  const j = s.indexOf(FIN, i) + FIN.length
  s = s.slice(0, i) + BLOQUE + s.slice(j)
} else {
  // La primera vez: reemplaza los tres <link> a Google por el bloque.
  const enlaces = [
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&display=swap">'
  ]
  /*
    Se quitan uno por uno, no como un bloque pegado.

    La primera version buscaba los tres unidos por saltos de linea, y el archivo
    usa CRLF: no calzo nada, `replace` devolvio el mismo texto sin quejarse y el
    script informo exito sobre un archivo que no habia tocado. Un reemplazo que
    no encuentra su ancla tiene que gritar, no seguir de largo.
  */
  for (const e of enlaces) {
    if (!s.includes(e)) {
      console.error('no encuentro este enlace, se movio:\n  ' + e)
      process.exit(1)
    }
    s = s.replace(e, '')
  }
  /*
    El bloque va DESPUES del <style> principal, no antes.

    `revisar.mjs` y `verificar-contraste.mjs` recortan el CSS entre el primer
    <style> y el primer </style>. Puesto delante, los dos se quedaban con un
    trozo vacio y denunciaban que faltaban trece colores que estaban ahi. En
    CSS da igual el orden —@font-face puede ir despues de quien la usa—, asi
    que se pone donde no le miente a nadie.
  */
  const FIN_ESTILOS = '</style>'
  const i = s.indexOf(FIN_ESTILOS) + FIN_ESTILOS.length
  s = s.slice(0, i) + '\n\n' + BLOQUE + s.slice(i)
}

// Y se comprueba, en vez de confiar: es justo lo que fallo la primera vez.
if (!s.includes(INICIO)) {
  console.error('el bloque no quedo en la pagina: no se escribe nada')
  process.exit(1)
}
writeFileSync(p, s)
console.log(
  `${CARAS.length} caras incrustadas — ${Math.round(bytes / 1024)} KB de fuente, ` +
    `${Math.round((BLOQUE.length / 1024))} KB en la pagina`
)
