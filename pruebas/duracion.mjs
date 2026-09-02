/**
 * Cuánto dura un partido, y cuánto de él jugaste.
 *
 * Este archivo decía «el de 11 son cuatro cuartos de quince: sesenta siempre».
 * Era falso, y lo probó él: jugó una liga de 11 en dos tiempos de veinte. La
 * app no puede deducir el largo de nadie — ni de 7 ni de 11. O está anotado o
 * no se sabe.
 *
 * Antes las fichas guardaban 60/45/30/15 fijos. En un partido de veinte
 * minutos, «Todo» guardaba sesenta: tres veces el número real, sumado al total
 * sin que nada avisara. Esto vigila que no vuelva.
 */
import { cargar, trozo } from './marco.mjs'

const fuente =
  "const localStorage = { getItem: () => globalThis.__crudo, setItem: () => {} }\n" +
  "const CLAVE = 'la-d-v1'\n" +
  trozo('const ESTADO_VACIO', '  function guardar') +
  trozo('  const FORMATOS =', '  const R_D =') +
  trozo('  /* De los minutos guardados', '  const contador =') +
  '\nexport { leer, duracionDe, proporcionDe, aDatoLimpio, PARTES, DURACIONES }'

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

console.log('\n- la duración solo se sabe si está anotada -')
// Ni el formato ni los periodos la insinuan: son datos distintos.
eq('un partido pelado, no se sabe', M.duracionDe({ formato: 11 }), null)
eq('tampoco uno de 7', M.duracionDe({ formato: 7 }), null)
eq('ni con la estructura puesta', M.duracionDe({ formato: 11, periodos: 4 }), null)
eq('con 60 anotados, 60', M.duracionDe({ formato: 11, duracion: 60 }), 60)
eq('un de 11 de dos tiempos de 20 dura 40', M.duracionDe({ formato: 11, periodos: 2, duracion: 40 }), 40)
eq('el de 7 con 12', M.duracionDe({ formato: 7, duracion: 12 }), 12)
eq('cero es un dato, no un vacío', M.duracionDe({ formato: 7, duracion: 0 }), 0)

console.log('\n- de los minutos guardados sale la ficha que estaba puesta -')
eq('60 de 60 es «todo»', M.proporcionDe({ formato: 11, duracion: 60, minutos: 60 }), 1)
eq('30 de 60 es «la mitad»', M.proporcionDe({ formato: 11, duracion: 60, minutos: 30 }), 0.5)
eq('0 es «no jugué»', M.proporcionDe({ formato: 11, duracion: 60, minutos: 0 }), 0)
eq('12 de 12 es «todo» en un partido de 7', M.proporcionDe({ formato: 7, duracion: 12, minutos: 12 }), 1)
eq('6 de 12 es «la mitad»', M.proporcionDe({ formato: 7, duracion: 12, minutos: 6 }), 0.5)
eq('sin minutos, ninguna', M.proporcionDe({ formato: 11, duracion: 60 }), null)
eq('sin duración, tampoco', M.proporcionDe({ formato: 7, minutos: 12 }), null)

console.log('\n- «todo» vale distinto en cada partido -')
// El nucleo del asunto: la misma ficha, tres numeros, porque los partidos duran
// distinto. Antes los tres guardaban 60.
const todo = (x) => Math.round(1 * M.duracionDe(x))
eq('todo en uno de 60', todo({ formato: 11, duracion: 60 }), 60)
eq('todo en la liga de 11 de dos por veinte', todo({ formato: 11, periodos: 2, duracion: 40 }), 40)
eq('todo en uno de 7 de 12', todo({ formato: 7, duracion: 12 }), 12)

console.log('\n- lo guardado con la escala vieja se descarta -')
// Un partido con 60 minutos y sin duracion lleva un numero que puso la app, no
// el. Mantenerlo seria seguir afirmando algo que salio de una premisa falsa —
// y la premisa era falsa en los DOS formatos, no solo en el de 7.
eq('un 7 con 60 minutos inventados queda en «no se sabe»',
  M.aDatoLimpio({ formato: 7, minutos: 60 }).minutos, null)
eq('y un 11 con 60, también',
  M.aDatoLimpio({ formato: 11, minutos: 60 }).minutos, null)
eq('y con 15, igual', M.aDatoLimpio({ formato: 11, minutos: 15 }).minutos, null)
eq('pero si trae duración, se respeta',
  M.aDatoLimpio({ formato: 7, duracion: 20, minutos: 20 }).minutos, 20)
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
        { rival: 'B', nuestros: 2, suyos: 1, goles: 1, formato: 11, minutos: 60 },
        { rival: 'C', nuestros: 0, suyos: 0, goles: 0, formato: 11, duracion: 40, minutos: 20 }
      ]
    }
  ]
})
const leido = M.leer().dias[0].partidos
eq('el de 7 pierde el minutaje inventado', leido[0].minutos, null)
eq('el de 11 también lo pierde', leido[1].minutos, null)
eq('el que traía duración lo conserva', leido[2].minutos, 20)
eq('y el resto del partido sigue intacto', [leido[0].rival, leido[0].nuestros, leido[0].suyos], ['A', 1, 0])

console.log(`\n${ok} ok, ${mal} fallos`)
process.exit(mal ? 1 : 0)
