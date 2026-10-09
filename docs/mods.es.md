# Mods: crea tus propios efectos

*[Read in English](mods.md)*

Un mod es un efecto que vive en su propia carpeta dentro de `mods/`. La app lo encuentra sola: no hace falta tocar el
código de la app ni `src/registry.ts`. Aparece en la galería con la etiqueta **MOD** (filtro **Mods**), con sus ajustes
a la derecha, y se exporta a MP4, ProRes o PNG como cualquier efecto incluido.

## Crea uno en un minuto

```sh
pnpm new-mod "mi efecto"
pnpm dev
```

Eso crea `mods/mi-efecto/index.tsx` desde una plantilla que ya funciona (una palabra que aparece de golpe sobre tu
video). Abre la app, elige **Mods** y edita el archivo: la vista previa se actualiza al guardar.

También puedes copiar el ejemplo, [`mods/sticker-slap/`](../mods/sticker-slap/index.tsx).

## Cómo es un mod

```
mods/
  mi-efecto/
    index.tsx      ← exporta un EffectDef (export default o con nombre; también varios efectos en un archivo)
    otros-archivos.ts, imágenes…  (opcional, importados desde index.tsx)
```

`index.tsx` exporta un `EffectDef`: la misma forma que usan los efectos incluidos.

| Campo | Qué es |
|---|---|
| `id` | único, minúsculas, números y guiones (`mi-efecto`) |
| `name`, `description` | `{ en, es }` |
| `group` | `'hook'` (primeros segundos), `'support'` (tarjetas, formatos) o `'piece'` (clip suelto) |
| `usesMedia` | `true` si dibuja tu video o imagen |
| `defaultDurationSec` | cuánto dura por defecto |
| `defaults` | un valor para cada ajuste; textos de ejemplo en inglés, en español en `localized.es` |
| `params` | los controles de la derecha: `text`, `color`, `number`, `select`, `boolean`, `media` |
| `component` | el componente de React que dibuja un cuadro |
| `author` | opcional, sale en su tarjeta (por ejemplo `@tu.usuario`) |

Todo lo que necesita un mod sale de **[`src/sdk.ts`](../src/sdk.ts)**: tipos, ayudas de animación (`timeOf`,
`progress`, `lerp`, curvas, `shake`…), la paleta y las fuentes, y piezas como `MediaBackdrop`, `MediaAt`,
`KineticText`, `cardStyle` y `AppWindow`.

```tsx
import { timeOf, progress, MediaBackdrop, type BaseProps, type EffectDef } from '../../src/sdk.ts';
```

## La única regla: anima desde el tiempo

Calcula todo desde `t = timeOf(useCurrentFrame(), p.fps, p.speed)`, el tiempo del efecto en segundos.
Nada de `Date.now()`, `Math.random()`, `setTimeout` ni animaciones CSS: el export se renderiza cuadro por cuadro, y
solo las cuentas basadas en el tiempo se ven igual en la vista previa y en el archivo. Para azar que siempre sale
igual, usa `hash01(n)`.

## Si algo falla

Un mod que no carga (`id` incorrecto, un valor por defecto que falta, un nombre sin `es`…) no rompe la app: sale en
rojo debajo de la galería con el motivo, y los demás efectos siguen funcionando. Arréglalo y guarda.

Las carpetas que empiezan con `_` (por ejemplo `mods/_borrador/`) se saltan, útil para borradores.

## Compartir un mod

Un mod es solo una carpeta: compártelo como repo de GitHub o gist, y otros lo sueltan en su `mods/`.
**Los mods ejecutan código en tu computadora**, como cualquier paquete de npm: agrega solo mods de gente en quien
confíes, y léelos antes.

¿Hiciste algo bueno? Abre un pull request que agregue tu carpeta a `mods/`, o, si debería ser un efecto incluido,
muévelo a `src/effects/` y regístralo en `src/registry.ts` (mira [CONTRIBUTING](../CONTRIBUTING.es.md)).
