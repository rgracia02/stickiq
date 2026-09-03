/**
 * Un PNG escrito a mano, para no traer una dependencia por tres iconos.
 *
 * Formato: firma, IHDR, IDAT (zlib de las filas, cada una con su byte de
 * filtro en 0) e IEND. Cada trozo lleva su CRC32, que hay que calcular acá
 * porque `zlib.crc32` no existe en todas las versiones de Node y esto tiene
 * que correr en la suya sin que averigüemos cuál es.
 */
import { deflateSync } from 'node:zlib'

const TABLA = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = TABLA[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const trozo = (tipo, datos) => {
  const largo = Buffer.alloc(4)
  largo.writeUInt32BE(datos.length)
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(cuerpo))
  return Buffer.concat([largo, cuerpo, crc])
}

/** `pixeles` son RGB, tres bytes por punto, de arriba a abajo. */
export function png(ancho, alto, pixeles) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(ancho, 0)
  ihdr.writeUInt32BE(alto, 4)
  ihdr[8] = 8 // bits por canal
  ihdr[9] = 2 // color verdadero, sin alfa: el iPhone recorta el icono él mismo
  const filas = Buffer.alloc(alto * (1 + ancho * 3))
  for (let y = 0; y < alto; y++) {
    const desde = y * (1 + ancho * 3)
    filas[desde] = 0
    pixeles.copy(filas, desde + 1, y * ancho * 3, (y + 1) * ancho * 3)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo('IHDR', ihdr),
    trozo('IDAT', deflateSync(filas, { level: 9 })),
    trozo('IEND', Buffer.alloc(0))
  ])
}
