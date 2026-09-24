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

1. **Arrastra** tu video o imagen al panel izquierdo. Se copia a `media/`.
   Si es ProRes (Chrome no lo lee), se convierte solo con tu FFmpeg: con transparencia pasa a WebM VP9 con alfa y,
   sin transparencia, a MP4. Tu archivo original no se toca.
2. **Haz clic** en un hook o efecto: se aplica al instante.
3. Cambia los textos, colores, duración y velocidad a la derecha; la vista previa se actualiza en vivo.
   - Con ◀ ▶ debajo de la vista previa avanzas cuadro por cuadro.
   - En los efectos con punto de zoom, "🎯 Elegir punto" te deja hacer clic sobre el dato.
   - En los textos, lo que va entre `*asteriscos*` sale en serif itálica y color de acento.
4. **Exporta** (30 o 60 fps). Los archivos quedan en `exports/`:
   - **MP4 (H.264)**: siempre con fondo de marca, para subir directo. H.264 no guarda transparencia, así que el
     interruptor "Fondo transparente" solo afecta la vista previa y a los otros dos formatos.
   - **ProRes 4444 (.mov)**: con fondo transparente, para ponerlo encima en DaVinci.
   - **Secuencia PNG**: transparente, un PNG por cuadro. Úsala si el ProRes te da problemas.

La primera exportación tarda más porque prepara el paquete. Cada export de 2–3 s tomó entre 5 y 13 s en esta PC.

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
| `notificacion`: aviso tipo celular que baja | |
| `tachon-rojo`: "3 horas" tachado en rojo → "10 min" | |
| `prompt-escribe`: prompt o comando que se escribe solo | |
| `cronometro`: reloj que corre rápido y frena en "10:00" | |

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
src/components/         fondo Aurora, tarjeta, ventana, texto animado
src/effects/            hooks y efectos de apoyo
src/registry.tsx        lista de efectos + envoltura con el fondo de marca
src/remotion/           entrada para el render (una composición por efecto)
app/                    mini app (React + Remotion Player)
server/                 servidor local: sube medios, sirve con Range y exporta con @remotion/renderer
```

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | abre la app en http://localhost:3210 |
| `pnpm test` | pruebas de la lógica pura (`node --test`) |
| `pnpm typecheck` | revisa los tipos con TypeScript |
| `pnpm marca` | exporta las imágenes de marca (perfil y portada de X) a `assets/marca/` |

## Límites conocidos
- **Audio**: los videos se usan en silencio. Tu voz va en DaVinci.
- **H.264 por CPU**: Remotion no usa tu GPU AMD para codificar.
- **Fuentes**: se usan las de Windows (Segoe UI Variable, Georgia, Cascadia Code). En otra PC podrían verse distintas.
- **Subtítulos palabra por palabra**: aún no están. Necesitan transcribir tu voz, y Whisper pide Python o descargar
  un binario, así que queda para cuando lo autorices.
