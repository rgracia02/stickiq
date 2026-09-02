# La D

Registro de temporada de hockey césped. Una sola página web, pensada para el
celular, que se publica como artefacto de Claude.

**Publicada en:** `https://claude.ai/code/artifact/e892aeef-d43a-46f3-b540-d92d99157827`

## Correr las pruebas

```bash
npm test              revisión estructural + las 130 comprobaciones
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

El archivo `la-d.html` es lo que se publica, tal cual. No hay compilación.

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
