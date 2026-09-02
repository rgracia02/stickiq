/**
 * Cuánto dura un partido, y cuánto de él jugaste.
 *
 * El de 11 son cuatro cuartos de quince: sesenta siempre. El de 7 dura lo que
 * diga el torneo — a veces veinte minutos, a veces doce — y la app no puede
 * saberlo.
 *
 * Antes las fichas guardaban 60/45/30/15 fijos en los dos formatos. En un
 * partido de 7 de doce minutos, «Todo» guardaba sesenta: cinco veces el número
 * real, sumado al total sin que nada avisara. Esto vigila que no vuelva.
 */
import { cargar, trozo } from './marco.mjs'

const fuente =
  "const localStorage = { getItem: () => globalThis.__crudo, setItem: () => {} }\n" +
  "const CLAVE = 'la-d-v1'\n" +
  trozo('const ESTADO_VACIO', '  function guardar') +
  trozo('  const FORMATOS =', '  const R_D =') +
  trozo('  /* De los minutos guardados', '  const contador =') +
  '\nexport { leer, duracionDe, proporcionDe, aDatoLimpio, PARTES, DURACION_11 }'

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

console.log('\n- la duración sale del formato -')
eq('el de 11 dura siempre 60', M.duracionDe({ formato: 11 }), 60)
eq('y no le afecta lo que diga duracion', M.duracionDe({ formato: 11, duracion: 20 }), 60)
eq('el de 7 sin duración, no se sabe', M.duracionDe({ formato: 7 }), null)
eq('el de 7 con 20', M.duracionDe({ formato: 7, duracion: 20 }), 20)
eq('el de 7 con 12', M.duracionDe({ formato: 7, duracion: 12 }), 12)

console.log('\n- de los minutos guardados sale la ficha que estaba puesta -')
eq('60 de 60 es «todo»', M.proporcionDe({ formato: 11, minutos: 60 }), 1)
eq('30 de 60 es «la mitad»', M.proporcionDe({ formato: 11, minutos: 30 }), 0.5)
eq('0 es «no jugué»', M.proporcionDe({ formato: 11, minutos: 0 }), 0)
eq('12 de 12 es «todo» en un partido de 7', M.proporcionDe({ formato: 7, duracion: 12, minutos: 12 }), 1)
eq('6 de 12 es «la mitad»', M.proporcionDe({ formato: 7, duracion: 12, minutos: 6 }), 0.5)
eq('sin minutos, ninguna', M.proporcionDe({ formato: 11 }), null)
eq('sin duración, tampoco', M.proporcionDe({ formato: 7, minutos: 12 }), null)

console.log('\n- «todo» vale distinto en cada partido -')
// El nucleo del asunto: la misma ficha, dos numeros, porque los partidos duran
// distinto. Antes los dos guardaban 60.
const todo = (x) => Math.round(1 * M.duracionDe(x))
eq('todo en uno de 11', todo({ formato: 11 }), 60)
eq('todo en uno de 7 de 20', todo({ formato: 7, duracion: 20 }), 20)
eq('todo en uno de 7 de 12', todo({ formato: 7, duracion: 12 }), 12)

console.log('\n- lo guardado con la escala vieja se descarta -')
// Un partido de 7 con 60 minutos y sin duracion lleva un numero que puso la app,
// no el. Mantenerlo seria seguir afirmando algo que salio de una premisa falsa.
eq('un 7 con 60 minutos inventados queda en «no se sabe»',
  M.aDatoLimpio({ formato: 7, minutos: 60 }).minutos, null)
eq('y con 15, igual', M.aDatoLimpio({ formato: 7, minutos: 15 }).minutos, null)
eq('pero si trae duración, se respeta',
  M.aDatoLimpio({ formato: 7, duracion: 20, minutos: 20 }).minutos, 20)
eq('y los de 11 no se tocan', M.aDatoLimpio({ formato: 11, minutos: 60 }).minutos, 60)
eq('lo que ya era desconocido sigue igual', M.aDatoLimpio({ formato: 7, minutos: null }).minutos, null)

console.log('\n- y eso pasa al leer, sobre datos de verdad -')
globalThis.__crudo = JSON.stringify({
  meta: 3,
  entrenamientos: [],
  dias: [
    {
      fecha: '2026-03-07',
      torneo: 'Copa',
      partidos: [
        { rival: 'A', nuestros: 1, suyos: 0, goles: 0, formato: 7, minutos: 60 },
        { rival: 'B', nuestros: 2, suyos: 1, goles: 1, formato: 11, minutos: 60 }
      ]
    }
  ]
})
const leido = M.leer().dias[0].partidos
eq('el de 7 pierde el minutaje inventado', leido[0].minutos, null)
eq('el de 11 lo conserva', leido[1].minutos, 60)
eq('y el resto del partido de 7 sigue intacto', [leido[0].rival, leido[0].nuestros, leido[0].suyos], ['A', 1, 0])

console.log(`\n${ok} ok, ${mal} fallos`)
process.exit(mal ? 1 : 0)
