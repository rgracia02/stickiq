/**
 * Contraste, medido y no estimado.
 *
 * Existe por un fallo concreto y vergonzoso: el archivo llevaba escrito, en un
 * comentario, que el amarillo pelota «tiene 1,59:1 sobre blanco y desaparece» —
 * y a veinte líneas de ahí ese mismo amarillo era el anillo de foco, la marca de
 * la celda tocada y la cifra de goles. Las tres invisibles en tema claro.
 *
 * Un comentario no impide nada. Esto sí.
 *
 * Los colores se leen de los bloques de tema del archivo, no de una copia: si
 * alguien cambia un token, esto se entera.
 */
import { marcado } from '../pruebas/marco.mjs'

/*
  Los comentarios se quitan ANTES de leer los tokens.

  Sin esto, una frase como «la marca de partido: un token con dos trabajos»
  dentro de un comentario se lee como una declaracion, y su valor —que corre
  hasta el primer punto y coma— se traga el token que venga despues. Me paso:
  escribi un comentario y el verificador dejo de ver --rojo-fondo, informando
  que faltaba un color que estaba ahi.

  Un analizador que lee prosa no analiza nada.
*/
const css = marcado
  .slice(marcado.indexOf('<style>'), marcado.indexOf('</style>'))
  .replace(/\/\*[\s\S]*?\*\//g, '')

/** Los tres bloques de tema, tal como estan en el archivo. */
function bloque(desde, hasta) {
  const i = css.indexOf(desde)
  const j = hasta ? css.indexOf(hasta, i) : css.length
  const trozo = css.slice(i, j)
  return Object.fromEntries(
    [...trozo.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
  )
}

const claro = bloque(':root {', '@media (prefers-color-scheme: dark)')
const oscuro = {
  ...claro,
  ...bloque('@media (prefers-color-scheme: dark)', ':root[data-theme="dark"]')
}
// El rosado hereda del claro lo que no redefine, igual que el oscuro.
const rosa = { ...claro, ...bloque(':root[data-theme="rosa"]', '* { box-sizing') }

const aRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const luz = ([r, g, b]) => {
  const f = (c) => {
    c /= 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
/** Un color con alfa, compuesto sobre su fondo: es lo que el ojo ve. */
const sobre = (rgb, alfa, fondo) => rgb.map((c, i) => c * alfa + fondo[i] * (1 - alfa))
const razon = (a, b) => {
  const x = luz(a)
  const y = luz(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

const faltan = new Set()

/*
  Un token que no existe se reporta, no revienta.

  La primera version hacia `aRgb(undefined)` y tiraba una traza de pila: fallaba,
  si, pero sin decir cual era el color ni donde. Una comprobacion que no explica
  lo que encontro obliga a investigar lo que ya sabia.
*/
const color = (tema, nombre) => {
  const v = tema[nombre]
  if (!v || !/^#[0-9a-f]{6}$/i.test(v)) {
    faltan.add(nombre)
    return [128, 128, 128]
  }
  return aRgb(v)
}
const blanco = (alfa, fondo) => sobre([255, 255, 255], alfa, fondo)

/*
  Cada fila es un sitio real de la interfaz, no un par de tokens sueltos.

  El minimo sale del tamaño: 4,5 para texto normal, 3 para texto grande
  (>=24 px o >=18,7 px en negrita) y 3 para lo que no es texto pero informa —
  un anillo de foco, el borde de una celda seleccionada.
*/
const PARES = (t) => [
  ['texto principal sobre el papel', color(t, '--tinta'), color(t, '--papel'), 4.5],
  ['texto principal sobre una tarjeta', color(t, '--tinta'), color(t, '--tarjeta'), 4.5],
  ['texto apagado sobre una tarjeta', color(t, '--tinta-suave'), color(t, '--tarjeta'), 4.5],
  ['la cifra de goles', color(t, '--gol-cifra'), color(t, '--tarjeta'), 3],
  ['el verde del balance', color(t, '--verde-texto'), color(t, '--tarjeta'), 4.5],
  ['el rojo de los errores', color(t, '--rojo'), color(t, '--tarjeta'), 4.5],

  // Marcas de grafico: no son texto, pero distinguen series.
  // El acento decorativo: la cifra del nivel y la del record son texto grande.
  ['la cifra del nivel y del record', color(t, '--acento'), color(t, '--tarjeta'), 3],
  /*
    Lo que no se puede deshacer, medido dos veces.

    El texto blanco sobre el fondo rojo (4,5, es texto), y el boton contra la
    tarjeta donde vive (3, no es texto pero informa: un boton que no se separa
    de su fondo no se ve). «Si, reemplazar» estaba en 3,03 en tema oscuro.
  */
  ['«sí, reemplazar», el texto', [255, 255, 255], color(t, '--rojo-fondo'), 4.5],
  ['«sí, reemplazar», contra la tarjeta', color(t, '--rojo-fondo'), color(t, '--tarjeta'), 3],
  // El boton principal: marron fijo sobre la pelota, en los cuatro temas.
  ['el botón principal, sobre amarillo', [0x3a, 0x2c, 0x00], color(t, '--pelota'), 4.5],
  ['marca de entrenamiento', color(t, '--marca-entreno'), color(t, '--tarjeta'), 3],
  ['marca de partido', color(t, '--marca-partido'), color(t, '--tarjeta'), 3],
  ['marca de asistencia', color(t, '--marca-asist'), color(t, '--tarjeta'), 3],

  // El anillo de foco y la celda tocada: el fallo que motivo este archivo.
  ['anillo de foco sobre el papel', color(t, '--foco'), color(t, '--papel'), 3],
  ['anillo de foco sobre una tarjeta', color(t, '--foco'), color(t, '--tarjeta'), 3],
  ['celda tocada, sobre una tarjeta', color(t, '--foco'), color(t, '--tarjeta'), 3],

  // La cancha no sigue el tema: siempre es azul oscura.
  ['texto blanco sobre la cancha', [255, 255, 255], color(t, '--cancha'), 4.5],
  ['texto apagado de la cancha', blanco(0.76, color(t, '--cancha')), color(t, '--cancha'), 4.5],
  /*
    «Agendar» es una capsula, asi que son DOS medidas: el borde que la dibuja
    contra la cancha (3, no es texto pero informa: sin el no se ve que sea un
    control) y su texto contra su propio relleno, no contra la cancha.
  */
  ['el borde de «agendar»', blanco(0.55, color(t, '--cancha')), color(t, '--cancha'), 3],
  [
    'el texto de «agendar»',
    blanco(0.92, blanco(0.14, color(t, '--cancha'))),
    blanco(0.14, color(t, '--cancha')),
    4.5
  ],
  ['la cuenta regresiva', color(t, '--pelota'), color(t, '--cancha'), 3],
  ['el foco sobre la cancha', color(t, '--pelota'), color(t, '--cancha'), 3],
  ['las ranuras de la semana', color(t, '--pelota'), color(t, '--cancha'), 3]
]

let mal = 0
for (const [nombreTema, tema] of [['claro', claro], ['oscuro', oscuro], ['rosa', rosa]]) {
  console.log(`\n  tema ${nombreTema}`)
  for (const [que, fg, bg, min] of PARES(tema)) {
    const v = razon(fg, bg)
    const bien = v >= min
    if (!bien) mal++
    console.log(
      `  ${bien ? 'ok   ' : 'BAJO '} ${v.toFixed(2).padStart(6)} (min ${min})  ${que}`
    )
  }
}

if (faltan.size) {
  console.log(`\n  FALTAN estos colores en algún tema: ${[...faltan].sort().join(', ')}`)
}

const problemas = mal + faltan.size
console.log(
  problemas
    ? `\ncontraste: ${mal} por debajo del mínimo` +
        (faltan.size ? ` y ${faltan.size} colores que no existen` : '')
    : '\ncontraste: todo pasa'
)
process.exit(problemas ? 1 : 0)
