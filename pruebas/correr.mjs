/**
 * Corre la revisión estructural y todas las pruebas.
 *
 *   npm test
 *   npm test logros      (solo las que coincidan)
 *
 * La revisión va primero y a propósito: si el archivo perdió una función o un
 * identificador quedó sin destino, eso invalida todo lo demás y no tiene sentido
 * mirar los resultados de las pruebas antes de saberlo.
 *
 * Cada prueba se lanza como proceso aparte: una que revienta no arrastra al
 * resto, y cada archivo se sigue pudiendo correr solo mientras lo arreglas.
 */
import { spawn } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const AQUI = dirname(fileURLToPath(import.meta.url))
const RAIZ = join(AQUI, '..')
const PROPIOS = ['marco.mjs', 'correr.mjs']

const filtro = process.argv[2]

function correr(archivo, etiqueta) {
  return new Promise((listo) => {
    const hijo = spawn(process.execPath, [archivo])
    let salida = ''
    hijo.stdout.on('data', (d) => (salida += d))
    hijo.stderr.on('data', (d) => (salida += d))
    hijo.on('close', (codigo) => {
      const resumen = salida.match(/(\d+) ok, (\d+) fallos/)
      listo({
        etiqueta,
        codigo,
        salida,
        ok: resumen ? Number(resumen[1]) : 0,
        fallos: resumen ? Number(resumen[2]) : 0,
        mudo: !resumen
      })
    })
  })
}

const t0 = Date.now()
const resultados = []

// La revisión no imprime «N ok, M fallos», así que se juzga por su código de
// salida y se muestra entera cuando falla.
if (!filtro) {
  const r = await correr(join(RAIZ, 'scripts', 'revisar.mjs'), 'revisión')
  if (r.codigo !== 0) {
    console.log(r.salida.trimEnd())
    console.log('\nLa revisión estructural falló. Nada más tiene sentido hasta arreglarla.')
    process.exit(1)
  }
  console.log('  ok    revisión estructural')
}

const archivos = readdirSync(AQUI)
  .filter((f) => f.endsWith('.mjs') && !PROPIOS.includes(f))
  .filter((f) => !filtro || f.includes(filtro))
  .sort()

if (archivos.length === 0) {
  console.error(filtro ? `Ninguna prueba coincide con «${filtro}».` : 'No hay pruebas.')
  process.exit(1)
}

for (const a of archivos) resultados.push(await correr(join(AQUI, a), a.replace('.mjs', '')))

let ok = 0
let fallos = 0

for (const r of resultados) {
  ok += r.ok
  fallos += r.fallos
  const roto = r.fallos > 0 || r.mudo
  console.log(
    `${roto ? 'FALLA' : '  ok '}  ${r.etiqueta.padEnd(12)} ` +
      (r.mudo ? 'sin resumen' : `${r.ok} ok${r.fallos ? `, ${r.fallos} fallos` : ''}`)
  )
  // El detalle solo de lo que falló, y solo el final, que es donde está.
  if (roto) {
    console.log(
      r.salida.trimEnd().split('\n').slice(-22).map((l) => '       │ ' + l).join('\n')
    )
  }
}

const sinResumen = resultados.filter((r) => r.mudo).length
const conFallos = resultados.filter((r) => r.fallos > 0).length
const segundos = ((Date.now() - t0) / 1000).toFixed(1)

// Nunca «0 fallos» cuando un archivo ni llegó a terminar: eso convierte una
// ausencia en un hecho, que es el error que esta app persigue en todas partes.
const partes = []
if (conFallos) partes.push(`${fallos} fallaron en ${conFallos} archivo${conFallos === 1 ? '' : 's'}`)
if (sinResumen)
  partes.push(
    sinResumen === 1 ? 'un archivo no llegó a terminar' : `${sinResumen} archivos no terminaron`
  )

console.log(
  `\n${ok} comprobaciones en ${archivos.length} archivos, ${segundos}s — ` +
    (partes.length ? partes.join(' y ') : 'todo bien')
)
process.exit(fallos || sinResumen ? 1 : 0)
