# Hooks visuales · chitodev

Biblioteca de **hooks visuales** (primer segundo) y **efectos de apoyo** para TikTok, Reels y Shorts
(1080×1920), con una mini app local para probarlos sobre tus videos e imágenes y exportarlos.

- La vista previa y el export usan **el mismo componente**: lo que ves es lo que se exporta, cuadro por cuadro.
- Todo corre en tu PC: el servidor solo escucha en `127.0.0.1` y tus archivos no se suben a ningún lado.
- Construido con [Remotion](https://www.remotion.dev) 4.0.527 (React). Es gratis para individuos:
  https://www.remotion.dev/license

## Usarlo

```bash
pnpm install
```

```bash
pnpm dev
```

Abre http://localhost:3210.

1. **Arrastra** tu video, imagen o audio (mp3, wav, m4a…) al panel izquierdo. Se copia a `media/` y en la lista
   ves su tipo y duración.
   Si es ProRes (Chrome no lo lee), se convierte solo con tu FFmpeg: con transparencia pasa a WebM VP9 con alfa y,
   sin transparencia, a MP4. Tu archivo original no se toca.
2. **Haz clic** en un hook o efecto: se aplica al instante. Cada uno dice con qué funciona (🎬 video, 🖼 imagen,
   🎵 audio, ✨ solo texto) y los que no sirven con lo que elegiste se ven apagados, con el motivo.
3. Cambia los textos, colores, duración y velocidad a la derecha; la vista previa se actualiza en vivo.
   - Con ◀ ▶ debajo de la vista previa avanzas cuadro por cuadro.
   - En los efectos con punto de zoom, "🎯 Elegir punto" te deja hacer clic sobre el dato.
   - En los textos, lo que va entre `*asteriscos*` sale en serif itálica y color de acento.
   - En **Fondo** eliges el estilo animado (Aurora, Puntos, Gradiente, Rejilla, Grano, Código o Sólido) y sus
     colores: los de la marca, uno solo, o **Personalizado** (color base y tres luces a tu gusto). Vale para todos los efectos.
4. **Exporta** (30 o 60 fps). Los archivos quedan en `exports/`:
   - **MP4 (H.264)**: siempre con el fondo elegido, para subir directo. H.264 no guarda transparencia, así que el
     interruptor "Fondo transparente" solo afecta la vista previa y a los otros dos formatos.
   - **ProRes 4444 (.mov)**: con fondo transparente, para ponerlo encima en DaVinci.
   - **Secuencia PNG**: transparente, un PNG por cuadro. Úsala si el ProRes te da problemas.

La primera exportación tarda más porque prepara el paquete. Cada export de 2–3 s tomó entre 5 y 13 s en esta PC.

## Aplicar a mi video o solo el efecto

Con un **video** elegido, en **Tiempo → ¿Qué exportas?** hay dos modos:

- **Aplicar a mi video** (el de entrada): el export dura todo tu video y conserva su audio. El efecto ocupa solo un
  tramo: eliges dónde con **Empieza en** (o arrastrando el tramo en la barra bajo la vista previa) y cuánto con
  **Duración del efecto**. Antes y después sigue tu video normal; al terminar, el efecto se desvanece en 0.3 s.
  Dentro del efecto tu video sigue en el segundo en que va, sin volver a empezar.
- **Solo el efecto (DaVinci)**: el clip corto de siempre, con los primeros segundos de tu video y sin audio.

Qué hace cada tipo de efecto sobre un video largo:

| Tipo | Efectos | Qué pasa |
|---|---|---|
| Hook de un momento | Enfoque, Zoom, Texto que cae, Ventana 3D, Flecha, Glitch, Notificación, Tachón, Prompt, Cronómetro, Ventana flotante | Va en su tramo (de entrada, al inicio) y vuelve tu video limpio |
| Dos medios | Antes/ahora de golpe, Antes/después | Tu video es el "ahora" y corre completo; el "antes" solo aparece en el tramo |
| Todo el video | Mitad y mitad, Sin efecto | Dura todo tu video, con su audio |
| Tarjeta | Número grande, Tarjeta de texto, Tarjeta de cierre, Lista misteriosa | Va encima de tu video, con un velo oscuro, en el segundo que elijas (la de cierre, al final) |
| Pieza suelta | Una idea sin nombre | No va sobre un video: el export dura lo que la pieza |

- Con una **imagen** no hay línea de tiempo: el export dura lo que el efecto.
- Con un **audio** el export dura lo que el audio, sobre el fondo elegido. Solo sirven **Sin efecto**, las tarjetas y los subtítulos.
- En este modo, **ProRes y PNG** salen sin tu video ni tu audio: solo el efecto y los subtítulos, transparentes y en su
  segundo exacto, para ponerlos encima de tu video en DaVinci.

## Comprobar la transparencia en DaVinci Resolve

1. Crea un proyecto con línea de tiempo de **1080×1920** y los mismos fps del export: *File → Project Settings → Master Settings*.
2. Importa uno de estos al *Media Pool*:
   - `exports/tarjeta-cierre-…-prores.mov` (ProRes 4444, 60 fps, solo tarjeta y texto).
   - La carpeta `exports/numero-grande-…-png`: DaVinci la reconoce como un solo clip numerado.
3. Pon cualquier video tuyo en **V1** y el clip exportado en **V2**, encima.
4. **Si la transparencia funciona**, ves tu video de V1 alrededor de la tarjeta y a través de las sombras suaves.
   Si ves un fondo negro, clic derecho sobre el clip → *Clip Attributes → Video → Alpha Mode* y prueba
   *Straight* y luego *Premultiplied*. Los archivos traen alfa sin premultiplicar (el nombre exacto del menú en
   español no lo verifiqué).
5. También puedes comprobarlo sin DaVinci. Este comando debe mostrar `pix_fmt=yuva444p12le` (la "a" es el canal alfa):

```bash
ffprobe -v error -show_entries stream=codec_name,profile,pix_fmt -of compact exports/tarjeta-cierre-20260923-210020-prores.mov
```

## Qué trae la biblioteca

| A. Hooks (0–2 s) | B. Efectos de apoyo |
|---|---|
| `enfoque-golpe`: entra borroso y encaja nítido | `ventana-flotante`: tu captura en una tarjeta con etiqueta |
| `zoom-brusco`: zoom al resultado con temblor y rótulo | `mitad-y-mitad`: dos tomas de 1080×960, animación transparente arriba y tu video completo abajo |
| `texto-cae`: palabras que caen con golpe | `antes-despues`: cortina de luz que revela el "ahora" |
| `ventana-3d`: la app salta en perspectiva | `numero-grande`: cifra que sube ("60 fps", "S/ 20") |
| `flecha-circulo`: trazo a mano sobre el dato | `tarjeta-texto`: frase grande con fuerza |
| `antes-despues-golpe`: cambio seco con destello | `tarjeta-cierre`: "Próximo: … →" + @chito.dev |
| `glitch`: bandas y RGB separado | `lista-misterio`: cartas "?" que se voltean |
| `notificacion`: aviso tipo celular que baja | `sin-efecto`: tu video tal cual (para ponerle solo subtítulos) |
| `tachon-rojo`: "3 horas" tachado en rojo → "10 min" | |
| `prompt-escribe`: prompt o comando que se escribe solo | |
| `cronometro`: reloj que corre rápido y frena en "10:00" | |

## Subtítulos automáticos

Los subtítulos son una capa que va encima de **cualquier** efecto (o de "Sin efecto").

1. Elige tu video o audio **con voz** y, en el bloque **Subtítulos** de la derecha, activa
   "Poner subtítulos de tu voz encima". Hasta que transcribas ves una frase de ejemplo.
2. Elige la calidad (Rápido, Bueno o Mejor) y el idioma, y pulsa **🎙 Transcribir mi video** (o **mi audio**).
   Cada archivo guarda su transcripción: si cambias de video y vuelves, sigue ahí.
   - La primera vez instala Whisper (whisper.cpp) y baja el modelo en `.whisper/`: Bueno pesa ~470 MB y Mejor ~1.5 GB.
     Después ya no descarga nada y todo corre en tu PC.
   - La transcripción se guarda junto al video en `media/`, así que volver a pedirla es instantáneo.
3. Corrige las palabras que Whisper entendió mal (le pasa con "Claude Code", "pnpm", nombres…).
   Enter guarda; vacía la borra; escribir dos palabras las reparte en el mismo tiempo. Clic en el tiempo te lleva ahí.
4. Elige el estilo:

| Estilo | Cómo se ve |
|---|---|
| Hormozi | Mayúsculas gruesas (Montserrat) con borde negro; la palabra que dices se pinta de amarillo |
| MrBeast | Letra de cómic (Bangers) en itálica; cada palabra salta al decirla y la activa brilla en verde |
| Karaoke | La frase entera visible y una caja de color detrás de la palabra que dices |
| Pop | Una sola palabra enorme que rebota |
| Limpio | Minimalista: lo que falta decir va tenue, sin borde |
| Editorial | Como Baena: las palabras entran desenfocadas y la activa pasa a serif itálica de color |

5. Ajusta palabras a la vez, color, altura y tamaño. Si ves los subtítulos adelantados o atrasados, muévelos con
   "Adelantar / atrasar".
6. Exporta:
   - **MP4**: tu video con tu voz, el efecto y los subtítulos quemados, listo para subir. Dura lo mismo que tu video.
   - **ProRes o PNG**: con "Sin efecto", solo los subtítulos con fondo transparente, para ponerlos encima en DaVinci.
   - **⬇ SRT / ⬇ VTT**: la transcripción como archivo de subtítulos (CapCut, DaVinci, Premiere, YouTube).

**C. Piezas animadas** (van solas, no sobre un video):
- `idea-sin-nombre`: bombilla o nube de líneas finas, destellos que no forman nada y "???" que parpadea.
  - Ocupa los ~800 px de arriba, para usarla en mitad y mitad con tu grabación abajo.
  - "Bajar el dibujo" viene en 80 px para que no la tapen las pestañas de TikTok.
  - Lienzo "1080×960 (centrada)": solo la mitad de arriba, con el dibujo centrado y 15 % más grande.
  - Exports listos en `assets/video 1/`: vertical (MP4 y ProRes) y `idea-sin-nombre-1080x960-transparente.mov`.

La investigación, el catálogo completo y la comparación de herramientas están en [docs/investigacion.md](docs/investigacion.md).
La guía de hooks con el celular está en [docs/guia-celular.md](docs/guia-celular.md).

## Agregar un efecto nuevo

1. Crea `src/effects/hooks/MiEfecto.tsx` o `src/effects/apoyo/MiEfecto.tsx`. Toma uno parecido como modelo.
   Exporta un `EffectDef` con `id`, `defaults`, `params` y `component`.
2. Anímalo **solo** con el tiempo `t = timeOf(useCurrentFrame(), fps, speed)`. Nada de `Date.now()`,
   `Math.random()` ni animaciones CSS: así el render cuadro por cuadro es idéntico a la vista previa.
3. Regístralo en `src/registry.tsx`. Aparece solo en la app y en el render.

## Estructura

```
src/brand.ts            colores Aurora y fuentes
src/lib/                matemática pura (animación, geometría, texto) + pruebas
src/components/         fondos, tarjeta, ventana, texto animado, capa de subtítulos
src/effects/            hooks, efectos de apoyo y "Sin efecto"
src/registry.tsx        lista de efectos + envoltura: fondo, tu video con audio, tramo del efecto y subtítulos
src/remotion/           entrada para el render (una composición por efecto)
app/                    mini app (React + Remotion Player)
server/                 servidor local: sube medios, sirve con Range, transcribe con Whisper y exporta con @remotion/renderer
```

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | abre la app en http://localhost:3210 |
| `pnpm test` | pruebas de la lógica pura (`node --test`) |
| `pnpm typecheck` | revisa los tipos con TypeScript |
| `pnpm marca` | exporta las imágenes de marca (perfil y portada de X) a `assets/marca/` |

## Límites conocidos
- **Audio**: en "Aplicar a mi video" el MP4 lleva el audio de tu video. En "Solo el efecto", el clip sale en silencio.
- **Un efecto por video**: por ahora se aplica un efecto (más los subtítulos). Varios efectos en un mismo video
  (hook al inicio, tarjeta a la mitad, cierre al final) necesitan una línea de tiempo con capas.
- **H.264 por CPU**: Remotion no usa tu GPU AMD para codificar.
- **Fuentes**: se usan las de Windows (Segoe UI Variable, Georgia, Cascadia Code). En otra PC podrían verse distintas.
  Las de los subtítulos (Montserrat y Bangers) van dentro del proyecto en `assets/fonts/`.
