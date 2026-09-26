# Hooks visuales

[English](README.md) · **Español**

<p align="center"><img src="docs/media/hero.gif" width="540" alt="El mismo clip sin hook y con hook"></p>

**Primeros segundos que frenan el scroll en TikTok, Reels y Shorts.** 20 hooks y efectos animados más subtítulos
automáticos, aplicados a tu propio video en una app local, y exportados en MP4, ProRes 4444 con transparencia o
secuencia PNG. Gratis y de código abierto.

```bash
git clone https://github.com/aetheride25-design/visual_hooks.git && cd visual_hooks
pnpm install
pnpm dev
```

Luego abre http://localhost:3210.

Hecho por [@chitodev](https://x.com/chitodev) · Construido con [Remotion](https://www.remotion.dev)

## Los hooks

| | | |
|---|---|---|
| <img src="docs/media/focus-snap.gif" width="200"><br>`focus-snap`: entra borroso y ampliado, y encaja nítido | <img src="docs/media/punch-zoom.gif" width="200"><br>`punch-zoom`: zoom seco al resultado, con temblor | <img src="docs/media/text-drop.gif" width="200"><br>`text-drop`: palabras gruesas que caen con golpe |
| <img src="docs/media/window-3d.gif" width="200"><br>`window-3d`: tu app salta en perspectiva | <img src="docs/media/arrow-circle.gif" width="200"><br>`arrow-circle`: trazo a mano sobre el dato | <img src="docs/media/before-after-cut.gif" width="200"><br>`before-after-cut`: cambio seco de lo viejo a lo nuevo, con destello |
| <img src="docs/media/glitch.gif" width="200"><br>`glitch`: bandas y RGB separado | <img src="docs/media/notification.gif" width="200"><br>`notification`: un aviso tipo celular baja | <img src="docs/media/red-strike.gif" width="200"><br>`red-strike`: "3 horas" tachado → "10 min" |
| <img src="docs/media/prompt-typing.gif" width="200"><br>`prompt-typing`: un prompt o comando se escribe solo | <img src="docs/media/stopwatch.gif" width="200"><br>`stopwatch`: un reloj corre y frena en "10:00" | |

**Efectos de apoyo**: `floating-window` (tu captura en una tarjeta con etiqueta), `split-screen` (dos tomas de 1080×960),
`before-after-wipe` (una cortina de luz revela el "después"), `big-number` (una cifra que sube), `text-card` (una frase grande),
`end-card` ("Próximo: … →" + tu @usuario), `mystery-cards` (cartas "?" que se voltean) y `no-effect` (tu video tal cual, solo para subtítulos).
**Pieza animada**: `nameless-idea` (bombilla o nube de líneas finas, destellos y "???" que parpadea).

Los ids están en inglés; en la app cada efecto aparece con su nombre en español.

## Requisitos

- **Node.js 22.18 o más nuevo**: el servidor corre `server/index.ts` directo, con el soporte de TypeScript que trae Node.
- **pnpm** (`npm install -g pnpm`).
- **FFmpeg** con `ffprobe` en el `PATH`. Lee tus archivos, convierte los ProRes que subas para que el navegador los
  reproduzca y saca el audio para los subtítulos. Los exports usan el FFmpeg que trae Remotion.
- Probado en **Windows 11**. En otros sistemas debería funcionar, pero las fuentes de la interfaz son las de Windows
  (Segoe UI Variable, Georgia, Cascadia Code), así que en otra PC los efectos pueden verse un poco distintos.
  Las fuentes de los subtítulos (Montserrat y Bangers) vienen dentro del proyecto y se ven igual en todas partes.

## Cómo se usa

1. **Arrastra** tu video, imagen o audio al panel izquierdo. Se copia a `media/`.
   Si es ProRes (Chrome no lo lee), se convierte con tu FFmpeg; tu archivo original no se toca.
2. **Haz clic** en un hook o efecto: se aplica al instante. Cada uno dice con qué funciona (🎬 video, 🖼 imagen,
   🎵 audio, ✨ solo texto); los que no sirven con lo que elegiste se ven apagados, con el motivo.
3. Cambia textos, colores, duración y velocidad a la derecha; la vista previa se actualiza en vivo.
   - Con ◀ ▶ debajo de la vista previa avanzas cuadro por cuadro.
   - En los efectos con punto de zoom, "🎯 Elegir punto" te deja hacer clic sobre el dato.
   - En los textos, lo que va entre `*asteriscos*` sale en serif itálica y color de acento.
   - En **Fondo** eliges el estilo animado (Aurora, Puntos, Gradiente, Rejilla, Grano, Código o Sólido) y sus colores.
4. **Exporta** a 30 o 60 fps. Los archivos quedan en `exports/`:
   - **MP4 (H.264)**: siempre con el fondo, listo para subir.
   - **ProRes 4444 (.mov)**: fondo transparente, para ponerlo encima en DaVinci Resolve o cualquier editor.
   - **Secuencia PNG**: transparente, un PNG por cuadro.

La interfaz está en inglés y español (selector ES/EN arriba; al inicio sigue el idioma de tu navegador).
Todo corre en tu PC: el servidor solo escucha en `127.0.0.1` y tus archivos no se suben a ningún lado.

### Aplicar a mi video o solo el efecto

Con un **video** elegido, en **Tiempo → ¿Qué exportas?** hay dos modos:

- **Aplicar a mi video**: el export dura todo tu video y conserva su audio. El efecto ocupa un tramo: eliges dónde con
  **Empieza en** (o arrastrando el tramo en la barra bajo la vista previa) y cuánto con **Duración del efecto**.
  Los hooks van al inicio, las tarjetas encima de tu video con un velo oscuro y los formatos de todo el video, como Mitad y mitad, duran completo.
- **Solo el efecto**: un clip corto y sin audio para montarlo en tu editor.

Con una **imagen** no hay línea de tiempo: el export dura lo que el efecto. Con un **audio** el export dura lo que el
audio, sobre el fondo elegido; solo sirven las tarjetas, los subtítulos y "Sin efecto".

### Subtítulos automáticos

Los subtítulos son una capa que va encima de **cualquier** efecto.

1. Elige tu video o audio **con voz** y activa los subtítulos en el panel **Subtítulos**.
2. Elige la calidad (Rápido, Bueno o Mejor) y el idioma, y pulsa **🎙 Transcribir**. La primera vez instala
   Whisper (whisper.cpp) y baja el modelo en `.whisper/` (Bueno ≈ 470 MB, Mejor ≈ 1.5 GB). Después funciona sin internet.
3. Corrige lo que Whisper entendió mal (Enter guarda; vacía la borra; dos palabras se reparten el tiempo).
4. Elige el estilo:

| Estilo | Cómo se ve |
|---|---|
| Amarillo grueso | Mayúsculas gruesas (Montserrat) con borde negro; la palabra que dices se pinta de amarillo |
| Cómic | Letra de cómic (Bangers) en itálica; cada palabra salta y la activa brilla en verde |
| Karaoke | La frase entera visible y una caja de color detrás de la palabra que dices |
| Pop | Una sola palabra enorme que rebota |
| Limpio | Minimalista: lo que falta decir va tenue, sin borde |
| Editorial | Las palabras entran desenfocadas y la activa pasa a serif itálica de color |

5. Exporta el MP4 con los subtítulos quemados, ProRes/PNG solo con los subtítulos (usa "Sin efecto"), o descarga **SRT / VTT**.

### Comprobar la transparencia en DaVinci Resolve

Pon tu toma en V1 y el export ProRes (o la carpeta de PNG, que DaVinci lee como un solo clip) en V2.
Si ves negro en vez de tu toma, clic derecho sobre el clip → *Clip Attributes → Video → Alpha Mode* y prueba
*Straight* y luego *Premultiplied*. También puedes comprobarlo con `ffprobe`: el stream debe decir `pix_fmt=yuva444p12le`
(la "a" es el canal alfa).

## Qué no es

- **Un efecto a la vez.** Aplicas un hook o efecto (más subtítulos) por export. Varios efectos en un mismo video
  (hook al inicio, tarjeta a la mitad, cierre al final) significa exportar cada uno y juntarlos en tu editor.
- **No es un editor de video.** No hay línea de tiempo con capas, ni cortes, ni música. Hace las piezas; tu editor las arma.

## Agregar un efecto nuevo

1. Crea `src/effects/hooks/MiEfecto.tsx` (o en `src/effects/support/`). Copia uno parecido como punto de partida.
   Exporta un `EffectDef` con `id`, `name`, `description`, `defaults`, `params` y `component`.
   `name`, `description` y las etiquetas de los parámetros son `{ en, es }`; los textos de ejemplo van en inglés en
   `defaults` y en español en `localized.es`.
2. Anímalo **solo** con el tiempo: `t = timeOf(useCurrentFrame(), fps, speed)`. Nada de `Date.now()`,
   `Math.random()` ni animaciones CSS: así el render cuadro por cuadro es idéntico a la vista previa.
3. Regístralo en `src/registry.tsx`. Aparece solo en la app y en el render.
4. Corre `pnpm test` y `pnpm typecheck`.

¿Quieres una primera contribución? Mira los [good first issues](docs/good-first-issues.md).

## Estructura

```
src/theme.ts            colores Aurora y fuentes
src/lib/                lógica pura (animación, geometría, texto, subtítulos, idiomas) + pruebas
src/components/         fondos, medios, ventana, texto animado, capa de subtítulos
src/effects/            hooks/, support/, pieces/ y "Sin efecto"
src/registry.tsx        lista de efectos + envoltura: fondo, tu video con audio, tramo del efecto y subtítulos
src/remotion/           entrada para el render (una composición por efecto)
app/                    app local (React + Remotion Player)
server/                 servidor local: sube medios, sirve con Range, transcribe con Whisper y exporta con @remotion/renderer
docs/                   guía de hooks con el celular, por qué Remotion, good first issues
scripts/                GIFs del README hechos con la propia app
```

| Comando | Qué hace |
|---|---|
| `pnpm dev` | abre la app en http://localhost:3210 |
| `pnpm test` | pruebas de la lógica pura (`node --test`) |
| `pnpm typecheck` | revisa los tipos con TypeScript |
| `node scripts/readme-media.ts <clip>` | vuelve a generar los GIFs del README con la app abierta |

## Límites conocidos

- **H.264 por CPU**: Remotion no usa GPUs AMD para codificar. Un export de 2–3 s tomó entre 5 y 13 s en la PC de prueba; el primero tarda más porque prepara el paquete.
- **Audio**: "Aplicar a mi video" conserva el audio de tu video; "Solo el efecto" sale en silencio.

## Licencia

El código es [MIT](LICENSE). **Remotion tiene su propia licencia**: es gratis para individuos, empresas de hasta
3 personas y organizaciones sin fines de lucro; las empresas con fines de lucro más grandes necesitan una
[Company License de Remotion](https://www.remotion.dev/license). Las fuentes de los subtítulos tienen la
[SIL Open Font License](assets/fonts/OFL.txt).

Más: [hooks de cámara con el celular](docs/phone-hooks.es.md) · [por qué Remotion](docs/why-remotion.md)
