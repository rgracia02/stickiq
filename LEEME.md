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

## Cómo está hecha

Un archivo: estilos arriba, marcado en medio, código abajo. Sin librerías, sin
compilación, sin dependencias. Los datos viven en `localStorage` bajo la clave
`la-d-v1`, y se leen con migración en cada arranque: los entrenamientos fueron
fechas sueltas antes de ser objetos, y una copia antigua tiene que seguir
entrando.

Lo que se guarda como `null` significa **no se sabe** y nunca se cuenta como
cero. Un partido viejo sin minutos no jugó cero minutos: no se le preguntó.
