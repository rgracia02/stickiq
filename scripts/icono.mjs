/**
 * El icono: la D, dibujada con la misma geometría que usa la app.
 *
 * No es un dibujo «parecido a» una cancha. Un punto está dentro del semicírculo
 * de tiro si su distancia al poste más cercano no pasa el radio — la misma regla
 * que verifica `verificar-cancha.mjs` sobre el SVG. Así el icono no puede
 * mentir sobre la forma: sale de la misma fórmula.
 *
 * Sin transparencia y sin esquinas redondeadas a propósito: iOS recorta el
 * icono con su propia máscara, y si uno se le adelanta quedan dos redondeos.
 */
import { png } from './png.mjs'

const R_D = 14.63
const MEDIO_ARCO = 1.83

const CANCHA = [0x0e, 0x5c, 0x86]
const HONDA = [0x07, 0x38, 0x53]
const LINEA = [0xff, 0xff, 0xff]
const PELOTA = [0xf5, 0xc5, 0x18]

const mezclar = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))

/*
  Distancia con signo al borde de la D: negativa dentro, positiva fuera.

  Dos regiones. Entre los postes, el borde es la recta de arriba y la distancia
  es vertical. Por fuera de los postes, el borde es el arco centrado en el poste
  y la distancia es radial. Es la definición del semicírculo de tiro, no una
  aproximación.
*/
function distanciaAlBorde(x, y) {
  const dx = Math.abs(x) - MEDIO_ARCO
  return dx <= 0 ? y - R_D : Math.hypot(dx, y) - R_D
}

export function dibujar(lado) {
  // Se dibuja al cuádruple y se promedia: es antialias por fuerza bruta, que
  // para tres iconos sale más barato que un rasterizador.
  const M = 4
  const n = lado * M
  const crudo = new Float64Array(n * n * 3)

  // La D ocupa 2·(medio arco + radio) de ancho por radio de alto. Se centra
  // dejando aire arriba para la línea de fondo y abajo para que respire.
  /*
    La D mide 32,9 por 14,6: es más del doble de ancha que de alta, así que en
    un cuadrado o queda diminuta o se sale. Se sale: los brazos se van por los
    lados y lo que queda es la curva cruzando el icono de borde a borde, que es
    la forma con la que uno reconoce una cancha de hockey.
  */
  const anchoD = 2 * (MEDIO_ARCO + R_D)
  const escala = (n * 1.14) / anchoD
  const cx = n / 2
  const cy = n * 0.2 // dónde cae la línea de fondo, en píxeles

  const grosor = n * 0.03
  const rPelota = n * 0.082
  /*
    La pelota va DENTRO del semicírculo, no encima de la línea.

    No es gusto: un gol desde fuera del área no es gol. El icono de una app que
    cuenta goles no puede dibujar uno que no vale.
  */
  const pelota = { x: -n * 0.115, y: n * 0.335 }

  for (let py = 0; py < n; py++) {
    for (let px = 0; px < n; px++) {
      const x = (px + 0.5 - cx) / escala
      const y = (py + 0.5 - cy) / escala

      // El fondo se aclara hacia arriba: la cancha tiene luz, no es un plano.
      let color = mezclar(HONDA, CANCHA, Math.min(1, 0.35 + (1 - py / n) * 0.75))

      const d = distanciaAlBorde(x, y)
      // Dentro de la D el azul sube un punto, como en el mapa de la app.
      if (d < 0 && y > 0) color = mezclar(color, LINEA, 0.1)

      const enBorde = Math.abs(d) * escala < grosor / 2 && y > -grosor / escala
      const enFondo = Math.abs(y) * escala < grosor / 2
      if (enBorde || enFondo) color = LINEA

      // El arco: una caja detrás de la línea de fondo, no un bulto encima. Es
      // lo único de una cancha que se reconoce a sesenta píxeles.
      const alturaArco = grosor * 2.6
      if (Math.abs(x) < MEDIO_ARCO && y * escala < 0 && y * escala > -alturaArco) color = LINEA

      const dp = Math.hypot(px + 0.5 - (cx + pelota.x), py + 0.5 - (cy + pelota.y))
      if (dp < rPelota) color = PELOTA

      const i = (py * n + px) * 3
      crudo[i] = color[0]
      crudo[i + 1] = color[1]
      crudo[i + 2] = color[2]
    }
  }

  const salida = Buffer.alloc(lado * lado * 3)
  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) {
      for (let c = 0; c < 3; c++) {
        let suma = 0
        for (let sy = 0; sy < M; sy++) {
          for (let sx = 0; sx < M; sx++) {
            suma += crudo[((y * M + sy) * n + (x * M + sx)) * 3 + c]
          }
        }
        salida[(y * lado + x) * 3 + c] = Math.round(suma / (M * M))
      }
    }
  }
  return png(lado, lado, salida)
}
