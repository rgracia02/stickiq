/**
 * Goles y asistencias de entrenamiento.
 *
 * En un entrenamiento no hay marcador de equipo (no existe «nuestros»).
 * Al sumar goles, el borrador no puede calcular Math.min con undefined ni
 * devolver NaN, y cualquier entrada debe tratarse como entero.
 */
import { trozo, cargar } from './marco.mjs'

const fuente =
  'export let borrador = {}\n' +
  'export const ponerBorrador = (b) => { borrador = b }\n' +
  trozo('  const contador =', '  function cablearHoja()') +
  '\n' +
  trozo('  function cablearContadores()', '  function cablearSensacion()') +
  '\nexport { contador, cablearContadores }'

// Simulamos el DOM necesario para probar contador y cablearContadores
const elementos = []
globalThis.document = {
  querySelectorAll: (sel) => {
    if (sel === '.contador') return elementos
    if (sel === '#sensacion button') return []
    return []
  },
  querySelector: (sel) => {
    return elementos.find((e) => sel.includes(e.dataset.campo)) || null
  },
  getElementById: (id) => null
}

const M = await cargar(fuente)

let ok = 0
let mal = 0
const eq = (n, a, b) => {
  const bien = JSON.stringify(a) === JSON.stringify(b)
  console.log((bien ? '  ok    ' : ' FALLA  ') + n + (bien ? '' : `  esperaba ${JSON.stringify(b)}, obtuve ${JSON.stringify(a)}`))
  bien ? ok++ : mal++
}

console.log('\n- el contador formatea enteros y nunca NaN -')
const html0 = M.contador('goles', undefined)
eq('sin valor inicial muestra 0', html0.includes('<output>0</output>'), true)
const htmlNaN = M.contador('goles', NaN)
eq('con NaN muestra 0', htmlNaN.includes('<output>0</output>'), true)
const htmlNum = M.contador('goles', 3)
eq('con numero muestra el numero', htmlNum.includes('<output>3</output>'), true)

console.log('\n- sumar goles en entrenamiento nunca resulta en NaN -')
// En un entrenamiento borrador no tiene "nuestros"
const borradorEntreno = {
  goles: 0,
  asistencias: 0,
  sensacion: 0,
  entreno: true
}
M.ponerBorrador(borradorEntreno)

// Creamos un contador de goles simulado en el DOM
const outputGoles = { textContent: '0' }
const btnSumar = {
  dataset: { paso: '1' },
  listeners: {},
  addEventListener(tipo, fn) { this.listeners[tipo] = fn },
  click() { if (this.listeners['click']) this.listeners['click']() }
}
const btnRestar = {
  dataset: { paso: '-1' },
  listeners: {},
  addEventListener(tipo, fn) { this.listeners[tipo] = fn },
  click() { if (this.listeners['click']) this.listeners['click']() }
}
const contGoles = {
  dataset: { campo: 'goles' },
  querySelectorAll: (sel) => sel === 'button' ? [btnRestar, btnSumar] : [],
  querySelector: (sel) => sel === 'output' ? outputGoles : (sel.includes('1') ? btnSumar : btnRestar)
}
elementos.push(contGoles)

M.cablearContadores()

// Al hacer clic en sumar goles:
btnSumar.click()
eq('primer gol suma 1 y no es NaN', M.borrador.goles, 1)
eq('el output muestra 1', outputGoles.textContent, 1)

btnSumar.click()
eq('segundo gol suma 2', M.borrador.goles, 2)
eq('el output muestra 2', outputGoles.textContent, 2)

btnRestar.click()
eq('restar gol deja en 1', M.borrador.goles, 1)
eq('el output muestra 1', outputGoles.textContent, 1)

btnRestar.click()
btnRestar.click()
eq('no baja de cero', M.borrador.goles, 0)
eq('el output muestra 0', outputGoles.textContent, 0)

console.log(`\n${ok} ok, ${mal} fallos`)
process.exit(mal ? 1 : 0)
