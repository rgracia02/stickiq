/**
 * Arma `docs/`, que es lo que sirve GitHub Pages.
 *
 * `la-d.html` es un fragmento: no trae doctype ni cabeza, porque dentro de un
 * Artifact esa parte la pone claude.ai. Fuera de ahí hay que ponerla, y de paso
 * es donde vive todo lo que convierte la página en una app del teléfono: la
 * pantalla completa sin barra, el icono y el nombre.
 *
 * Se GENERA, no se copia a mano. Una copia se desincroniza —ya me pasó en este
 * mismo proyecto— y termina probando una cosa mientras se publica otra.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dibujar } from './icono.mjs'
import { worker, registro, estilo } from './sw.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const DESTINO = join(RAIZ, 'docs')

const app = readFileSync(join(RAIZ, 'la-d.html'), 'utf8')

/*
  El fondo detrás de la pagina, en los dos temas.

  Son los mismos --papel de la app, no un color parecido: esto es lo que asoma
  al hacer rebote de scroll en el iPhone y lo que pinta la barra de estado. Un
  tono distinto ahi se lee como un borde que la app no dibujo.
*/
const PAPEL = '#edf1f4'
const PAPEL_OSCURO = '#0a1319'

const cabeza = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<!-- viewport-fit=cover: sin esto queda una franja blanca bajo el notch. -->
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Tu temporada de hockey césped: partidos, entrenamientos, dónde y cuándo marcas.">

<!-- Anclada a la pantalla de inicio, se abre sin barra de navegador. -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="StickIQ">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="${PAPEL}">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${PAPEL_OSCURO}">

<link rel="apple-touch-icon" href="icono-180.png">
<link rel="icon" type="image/png" sizes="192x192" href="icono-192.png">
<link rel="manifest" href="manifest.webmanifest">

<style>
  /*
    El único hueco que dejaba el envoltorio del Artifact. La app trae sus
    propios estilos; acá solo va lo que el navegador necesita antes de leerlos.
  */
  html { background: ${PAPEL}; }
  @media (prefers-color-scheme: dark) { html { background: ${PAPEL_OSCURO}; } }
  :root[data-theme="dark"] { background: ${PAPEL_OSCURO}; }
  :root[data-theme="light"] { background: ${PAPEL}; }
  /* Lo unico que el envoltorio del Artifact aportaba y la app no repite. El
     area segura del iPhone no va aca: .barra-abajo ya la respeta sola. */
  [hidden] { display: none !important; }
${estilo}
</style>
</head>
<body>
${registro}
`

mkdirSync(DESTINO, { recursive: true })

/*
  El script del envoltorio tambien tiene que parsear.

  `revisar.mjs` comprueba el script de la app, pero este vive aca y no pasaba
  por ningun lado. Un error de sintaxis en el registro del service worker se
  habria publicado sin que nada chistara, y el sintoma —«la app no se actualiza
  nunca»— es dificilisimo de atribuir a su causa.
*/
const guion = registro.slice(registro.indexOf('<script>') + 8, registro.lastIndexOf('</script>'))
const temporal = join(tmpdir(), 'stickiq-envoltorio.mjs')
writeFileSync(temporal, guion)
try {
  execFileSync(process.execPath, ['--check', temporal], { stdio: 'pipe' })
} catch (e) {
  console.error('el script del envoltorio no parsea:')
  console.error(String(e.stderr ?? e.message).split(/\r?\n/).slice(0, 4).join('\n'))
  process.exit(1)
}

const pagina = cabeza + app + '\n</body>\n</html>\n'
writeFileSync(join(DESTINO, 'index.html'), pagina)

/*
  La version del cache es el hash de la pagina.

  Con un numero puesto a mano se olvida subirlo y el telefono se queda con la
  version vieja para siempre, sin que nada avise. Con el hash, cada cambio real
  crea un cache nuevo y el anterior se borra solo.
*/
const version = createHash('sha256').update(pagina).digest('hex').slice(0, 12)
writeFileSync(join(DESTINO, 'sw.js'), worker(version))

writeFileSync(
  join(DESTINO, 'manifest.webmanifest'),
  JSON.stringify(
    {
      name: 'StickIQ — tu temporada de hockey',
      short_name: 'StickIQ',
      description: 'Tu temporada de hockey césped: partidos, entrenamientos, dónde y cuándo marcas.',
      start_url: './',
      scope: './',
      display: 'standalone',
      orientation: 'portrait',
      lang: 'es-CL',
      background_color: PAPEL_OSCURO,
      theme_color: PAPEL_OSCURO,
      icons: [
        { src: 'icono-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icono-512.png', sizes: '512x512', type: 'image/png' },
        { src: 'icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
      ]
    },
    null,
    2
  ) + '\n'
)

// Sin esto GitHub Pages pasa la carpeta por Jekyll, que se come lo que empieza
// con guion bajo y tarda de más. La página es un archivo: no hay nada que
// procesar.
writeFileSync(join(DESTINO, '.nojekyll'), '')

for (const lado of [180, 192, 512]) {
  writeFileSync(join(DESTINO, `icono-${lado}.png`), dibujar(lado))
}

console.log(
  `docs/ listo — index.html (${Math.round(pagina.length / 1024)} KB), ` +
    `sw.js (${version}), manifiesto y 3 iconos`
)
