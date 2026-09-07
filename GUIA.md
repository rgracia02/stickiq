# Guía práctica

Esto es para retomar StickIQ sin acordarse de nada. Lo técnico y el porqué de
cada decisión están en [LEEME.md](LEEME.md); acá está **dónde vive todo y qué
hacer**.

Última actualización: 7 de septiembre de 2026.

---

## Dónde vive

| Qué | Dónde |
|---|---|
| La app que usa Rodrigo | `https://rgracia02.github.io/stickiq/` |
| El código | `https://github.com/rgracia02/stickiq` |
| Copia local | `C:\dev\la-d` (la carpeta conserva el nombre viejo) |
| El artefacto | `https://claude.ai/code/artifact/e892aeef-d43a-46f3-b540-d92d99157827` |

**Un solo archivo manda: `la-d.html`.** Todo lo demás se genera o lo prueba.
`docs/` es lo que sirve GitHub Pages y **nunca se edita a mano**.

---

## Publicar un cambio

Los cuatro pasos, en orden. Saltarse el segundo publica una versión vieja.

```bash
npm test
npm run construir
git add -A && git commit -m "lo que hiciste"
git push
```

Y si quieres que el artefacto también quede al día, hay que republicarlo
aparte desde Claude. Son dos sitios: publicar en uno no publica en el otro.

En un par de minutos GitHub sirve la versión nueva, y la app avisa sola con un
botón **«Actualizar»** abajo.

---

## Las pruebas

```bash
npm test
```

Corre 289 comprobaciones más tres revisiones que no son pruebas normales:

- **`revisar.mjs`** — que el código parsee, que no haya ids repetidos, que
  nada tape la hoja abierta, que `docs/` no se haya quedado atrás.
- **`verificar-cancha.mjs`** — que los arcos de la D caigan en los postes,
  con la fórmula del reglamento.
- **`verificar-contraste.mjs`** — mide cada par de colores de la interfaz en
  los cuatro temas. Es más estricto que la mayoría: pide 3:1 donde el estándar
  pide 2:1.

**Si `npm test` falla, no publiques.** Las tres revisiones existen porque cada
una atrapó algo que ya había pasado.

---

## Si trabajas en esto desde otra herramienta

Pasó el 5 de septiembre y salió bien, pero conviene saber la regla: **`docs/`
no se edita a mano, ni siquiera un poquito.**

Ese día se añadieron unas etiquetas a `docs/index.html` directamente. La página
quedó bien, pero `docs/sw.js` guardó el hash de la versión anterior — y como
ese hash es lo que decide si hay algo nuevo, **la app nunca se habría
actualizado en el teléfono**. Sin ningún error a la vista.

Lo atrapó `revisar.mjs`. Por eso:

1. Toca `la-d.html`, nunca `docs/`.
2. `npm run construir` regenera `docs/` entero y coherente.
3. `npm test` antes de subir.

Y si vuelves acá después de haber trabajado desde otro lado, lo primero es
`git pull`. Si no, el push se rechaza — que es lo correcto: git prefiere
molestarte a perder trabajo.

---

## Si algo se rompe

**Perdiste datos en el teléfono.** Restaura desde la última copia:
⚙️ → *Restaurar* → pegas el texto → *Revisar*. Te dice qué trae antes de tocar
nada.

**La app abre vacía.** Antes de anotar nada, mira si aparece un aviso arriba
que diga que no pudo leer tus datos. Si aparece, **la app no va a escribir
encima**: cierra y vuelve a abrir. Si sigue igual, tus datos están intactos en
el teléfono y hay que arreglar el código, no borrar nada.

**Volver a una versión anterior:**

```bash
git log --oneline
git revert <el-código-de-la-que-rompió>
npm run construir && git push
```

---

## Sacar copia

⚙️ → **«Guardar una copia»**. En el sitio de GitHub abre la hoja de compartir
de iOS y queda un archivo `.json` de verdad: mándalo a Archivos o a WhatsApp
contigo mismo, que eso lo respalda iCloud.

**En el artefacto no funciona** — el visor bloquea las descargas — y ahí cae al
portapapeles.

Safari le concedió almacenamiento persistente por estar anclada, así que el
sistema **no** borra la temporada por falta de espacio. Se pierde solo si
borras la app del inicio, cambias de teléfono, o borras los datos del sitio.

Con eso, una copia al mes basta. Y antes de cambiar de teléfono.

---

## Lo que quedó decidido y no conviene deshacer

- **`null` significa «no se sabe», nunca cero.** Un partido viejo sin
  asistencias no dio cero: no se preguntaron. Los promedios se dividen entre
  los partidos donde el dato existe, y la app dice sobre cuántos.
- **Los minutos sin duración anotada se descartan.** Los ponía la app
  suponiendo el largo del partido, y esa suposición resultó falsa.
- **Para distinguir dos series, cambiar la forma y no el color.** Todos los
  tonos ya significan algo acá. Está medido en LEEME.
- **Nada de capacidades del sistema en el artefacto.** Sin sesión de Claude en
  el teléfono no funcionan, publique lo que publique.

---

## Lo que quedó pendiente

Nada bloqueante. De la crítica de diseño quedó todo cerrado; lo único abierto
es lo que salga de usarla.

**Del otro proyecto:** Vida está en `C:\dev\vida-app`, con su propio README,
PRODUCT.md y DESIGN.md. Ahí quedó pendiente **reconectar Google Calendar**, y
desinstalar Ollama si quiere recuperar unos 3 GB:

```bash
winget uninstall Ollama.Ollama
```

---

## Lo que mejor funcionó

Los errores más graves de todo el proyecto los encontró Rodrigo **usando la
app**, no yo leyendo el código: la barra de pestañas que tapaba el botón de
guardar, el aviso de actualización que no salía, y los dos azules del gráfico
que se parecían demasiado.

Lo que yo cubro es lo que se puede medir —contraste, tamaños de toque,
desbordes, que el código parsee—. Lo que solo aparece con el teléfono en la
mano lo cubre él. Conviene seguir así.
