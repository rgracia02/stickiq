# StickIQ

Registro de temporada de hockey césped. Una sola página web, pensada para el
celular, que se publica como artefacto de Claude. Antes se llamaba La D.

**Publicada en:** `https://claude.ai/code/artifact/e892aeef-d43a-46f3-b540-d92d99157827`

## Correr las pruebas

```bash
npm test              revisión estructural + las 187 comprobaciones
npm test logros       solo las que coincidan
npm run revisar       solo la revisión estructural
node pruebas/d.mjs    una sola, con todo su detalle
```

## Por qué hay dos cosas distintas

**Las pruebas** comprueban la lógica: fechas, niveles, rachas, la geometría de
la D, la migración de datos, las sumas. Cargan trozos del archivo real —no una
copia— y los ejecutan.

**La revisión** comprueba lo que un analizador de sintaxis no puede: que las 44
funciones principales sigan existiendo y se sigan usando, que todo `id` que el
código busque exista, que las etiquetas cierren y que cada color esté definido
en los tres estados del tema.

Existe por un error concreto: un corte por posiciones se llevó cuatro funciones
enteras y `node --check` pasó sin quejarse, porque lo que quedaba seguía siendo
JavaScript válido. **Un archivo que compila no es un archivo correcto.**

La primera vez que la revisión corrió completa encontró un fallo real: el color
de las asistencias estaba duplicado en un bloque de tema y ausente en otro.

## Publicar

`la-d.html` es la única fuente. Se publica en dos sitios y de dos maneras:

**Como Artifact.** El archivo va tal cual: es un fragmento sin `doctype` ni
cabeza, porque eso lo pone claude.ai. Cómodo, pero la página queda dentro del
marco de claude.ai — con su barra arriba — y eso no se puede quitar.

**Como sitio propio (GitHub Pages).** `npm run construir` genera `docs/`:
`index.html` (la cabeza que falta más el archivo), el manifiesto, y tres iconos
dibujados con la geometría real de la D. Ahí sí se ancla al iPhone a pantalla
completa, con su icono y su nombre.

`docs/` se **genera, nunca se copia a mano**, y `revisar.mjs` compara el
archivo entero contra lo publicado: si tocas la app y no reconstruyes, las
pruebas fallan antes de que el teléfono muestre una versión vieja.

Ojo: cada dirección tiene su propio `localStorage`. Pasar de una a otra no
lleva los datos — hay que sacar la copia desde «Datos» y pegarla en la otra.

**No declarar capacidades del sistema** (`db`, `downloads`). La página está
compartida públicamente porque Rodrigo la abre en un teléfono sin sesión de
Claude; con `db` la publicación falla, y sin sesión `claude.use()` devuelve
`null` de todas formas. El respaldo es manual, copiar y pegar desde «Datos».

## Temas

Cuatro: **como el teléfono**, claro, oscuro y rosado. Se eligen en «Mis datos»
y la elección viaja con la copia de respaldo.

`auto` **quita** el atributo `data-theme` en vez de escribir uno. Es la
diferencia entre «no tengo preferencia» y «quiero el claro»: con el atributo
puesto, el CSS del sistema deja de aplicar y la app se queda clavada aunque el
teléfono cambie al anochecer.

El rosado no es el azul con el tono cambiado: la cancha pasa a frambuesa y los
neutros se van al cálido. Lo que **no** cambia es la pelota (es la pelota), el
verde y el rojo (dicen ganado y perdido) y las tres marcas de gráfico, que
pasaron el validador de daltonismo. Los 19 pares de contraste de los cuatro
temas los mide `verificar-contraste.mjs`, no el ojo.

`--acento` existe porque `--marca-partido` hacía dos trabajos: color de dato
validado y adorno. No se nota hasta que aparece un tema que quiere cambiar uno
y no el otro.

## Sin señal

`docs/sw.js` guarda la app en el teléfono y la sirve aunque no haya red. La
versión del caché es el hash de la página, así que cada publicación crea uno
nuevo y borra el anterior. Cuando hay versión nueva la página avisa con un
botón para recargar: sin eso, la actualización llegaría en la **segunda**
apertura y se vería igual que una app rota.

Vive solo en `docs/`. Dentro de un Artifact la página corre en un marco ajeno
donde esto no aplica.

## Tipografías

Van **dentro** del archivo, en un `<style id="fuentes">` generado por
`scripts/fuentes.mjs` desde los `.woff2` de `fuentes/`. Antes se pedían a
Google, así que Google veía la IP del teléfono en cada apertura: era la única
conexión que salía a internet, en una app cuyos datos no salen del teléfono.
Ahora son cero.

Solo el subconjunto `latin` — cubre el alfabeto español, la ñ, los acentos,
¿ ¡ « » º y el guion largo del marcador. Cuesta unos 176 KB en la página, casi
los mismos bytes que antes bajaba de Google.

El bloque va **después** del `<style>` principal: los verificadores recortan el
CSS entre el primer `<style>` y el primer `</style>`, y ponerlo delante los
dejaba leyendo un trozo vacío.

## Cómo está hecha

Un archivo: estilos arriba, marcado en medio, código abajo. Sin librerías, sin
compilación, sin dependencias. Los datos viven en `localStorage` bajo la clave
`la-d-v1`, y se leen con migración en cada arranque: los entrenamientos fueron
fechas sueltas antes de ser objetos, y una copia antigua tiene que seguir
entrando.

Lo que se guarda como `null` significa **no se sabe** y nunca se cuenta como
cero. Un partido viejo sin minutos no jugó cero minutos: no se le preguntó.
