# Fase 1: investigación de hooks visuales y efectos

Fecha: 23-09-2026. Nicho: programación, IA y "construyo en público", en español e inglés.
Todo lo vi en modo solo lectura: no inicié sesión, no di like, no seguí cuentas ni comenté.

**Cómo leer la evidencia**
- **[CUADROS]**: abrí el video público, lo pausé en tiempos exactos y describí lo que se ve.
- **[TEXTO]**: solo lo verifiqué por la descripción pública del post. No vi los cuadros.
- **[ARTÍCULO]**: viene de un tutorial o blog, no lo vi en un creador de programación.
- **(no verificado)**: es una inferencia o no encontré prueba.

> Nota: TikTok me mostró un CAPTCHA al abrir un video y me detuve, porque no los resuelvo. Los mismos
> videos de Baena están en su YouTube Shorts público, y ahí los vi cuadro por cuadro.

---

## 1. Miguel Baena (referencia principal)

- **Perfil**: https://www.tiktok.com/@migue.baena. Al 23-09 tenía 256.2K seguidores y 3.8M de "me gusta". El mismo contenido está en https://www.youtube.com/@MigueBaenaIA/shorts.
- **HyperFrames [TEXTO]**: el video https://www.tiktok.com/@migue.baena/video/7680594935229304086 (243K vistas) dice en su descripción "Con Claude + HyperFrames de HeyGen puedes describir lo que quieres…".
  **Ojo**: ahí *recomienda* la herramienta. No encontré una declaración pública de que *edite sus propios videos* con HyperFrames. Eso queda **(no verificado)**.

**Lo que vi [CUADROS]** en "4 plugins que mejoran Claude Code" (https://www.youtube.com/shorts/o9ZzSxCjouo, 190K en TikTok) y "Claude + Obsidian" (https://www.youtube.com/shorts/2fzYgf0HR3I, 216.9K):

| Tiempo | Qué se ve |
|---|---|
| 0.0–0.3 s | El cuadro arranca **ampliado y borroso** y encaja nítido. En el de Obsidian está casi blanco, con partículas. |
| 0–1.6 s | **Toma partida**: arriba, la mascota pixel de Claude con casco y una X roja; abajo, su cara en una tarjeta redondeada. En medio, **subtítulo palabra por palabra**: la palabra entra borrosa y se aclara. |
| 0.7–1.5 s | **Ecuación de logos** "✳ + Obsidian": cada logo entra con pop y desenfoque de movimiento. |
| 2.5–4 s | **Cartas misteriosas** "Plugin 1–4 ?" sobre fondo terracota, y "**4 plugins.**" gigante en serif itálica. |
| 3 s | Personaje de **cubitos** naranja detrás de un monitor retro con código. Es pixel-art con volumen; no sé si es voxel 3D real (no verificado). |
| 10 s | Título con **tipografía mezclada**: "a más" en sans y "*modelos*" en serif itálica de color. |
| 12 s | Captura oscurecida con una **carpeta 3D "VAULT"** que salta al centro. |
| 22 s | Captura de una web con una **cifra gigante "31 %"** encima. |
| 32 s | Zoom a una web con un **óvalo dibujado a mano** alrededor de "90+ free". |
| 45 s | Carta "Plugin 4" que entra con desenfoque de movimiento: **lista que se revela**. |

---

## 2. Otros creadores que vi cuadro por cuadro

| Creador | Video | Qué hace |
|---|---|---|
| midudev | https://www.tiktok.com/@midudev/video/7682815321408818454 | Resultado en pantalla desde el cuadro 0, **flecha roja dibujada** y subtítulos con la palabra activa en amarillo. |
| MoureDev | https://www.tiktok.com/@mouredev/video/7688017619307400471 | **3 íconos de archivo** en fila como gancho, luego toma partida (editor arriba, cara abajo) y **zoom al código** a los 22 s. |
| Fireship | https://www.youtube.com/shorts/gGWQfV1FCis | **Transición glitch de bloques** a los 0 s, **títulos pixel gigantes** y lista numerada por colores. |
| DotCSV | https://www.tiktok.com/@dotcsv/video/7688387020800019734 | **Tarjeta "versus"** con íconos 3D, texto grande a los 0 s y tarjeta final "vídeo completo en YouTube". |
| Coding with Lewis | https://www.youtube.com/shorts/g35VnTUNQic · https://www.youtube.com/shorts/HRaGvoRa-IU | **Objeto que entra hacia el lente**, tomas macro del monitor y **monitor filmado en ángulo** con una cifra gigante de cierre. |
| ThePrimeTime | https://www.youtube.com/shorts/7vBb4VvYX7g | **Una palabra a la vez** en la costura de la toma partida. |
| Marc Lou | https://www.youtube.com/shorts/IUAPTubsvGo | Toma **sobre el hombro** con la laptop, cámara en mano. |

No revisé a Matt Wolfe, Pieter Levels, Tibo, CodeWithHarry, Código Facilito ni Carlos Azaustre.

---

## 3. Catálogo

**Tipo**: 📱 = truco de cámara que haces tú con el celular · 🧩 = efecto de la biblioteca (el id es el nombre en la app).

### A. Hooks visuales (0–2 s)

| Nombre | Cómo se ve | Duración | Momento | Quién lo usa | Dificultad | Tipo |
|---|---|---|---|---|---|---|
| **Enfoque de golpe** | Todo el cuadro arranca ampliado ~130 % y borroso, y encaja nítido | 0.2–0.35 s | gancho | Baena en los 3 videos vistos [CUADROS] | baja | 🧩 `enfoque-golpe` |
| **Zoom brusco al resultado** | Corte seco a 150–250 % sobre el resultado, con desenfoque de movimiento y temblor | 0.15–0.3 s | gancho / giro | MoureDev (zoom al código, 22 s) [CUADROS] | baja | 🧩 `zoom-brusco` |
| **Texto que cae** | 2–4 palabras muy gruesas que entran de 130 % a 100 % con temblor | 0.2 s por palabra | gancho | Fireship, DotCSV [CUADROS] | baja | 🧩 `texto-cae` |
| **Flecha o círculo a mano** | El resultado desde el cuadro 0 y un trazo que se dibuja señalando el dato | 0.3–0.5 s | gancho | midudev, Baena, Fireship [CUADROS] | baja | 🧩 `flecha-circulo` |
| **Ventana que salta en 3D** | La ventana sale del fondo en perspectiva (10–20°), con rebote y sombra | 0.4–0.7 s | gancho / giro | (no verificado en creadores; Baena usa ventanas planas) | media | 🧩 `ventana-3d` |
| **Antes / ahora de golpe** | El estado viejo cambia al nuevo en el golpe, con destello y sellos | 0.5–1 s cada estado | giro | (no verificado en los videos vistos) [ARTÍCULO] | baja | 🧩 `antes-despues-golpe` |
| **Glitch** | La imagen se rompe en bandas, los canales RGB se separan y se recompone | 0.1–0.4 s | gancho / giro | Fireship a 0 s [CUADROS] | baja | 🧩 `glitch` |
| **Notificación** | Un aviso tipo celular baja desde arriba ("Deploy exitoso", "Nuevo pago") | 0.4 s de entrada | gancho | (no verificado en creadores dev) [ARTÍCULO] | baja | 🧩 `notificacion` |
| **Prompt que se escribe** | Una frase o comando aparece letra por letra con cursor ▌; se "envía" y sale el resultado | 1–2 s | gancho | Coding with Lewis ("AI for doctors▌"), Baena ("Claud_") [CUADROS] | baja | 🧩 `prompt-escribe` |
| **Tachón rojo** | Lo viejo ("3 horas") se tacha con una línea roja y lo nuevo ("10 min") cae debajo | 1–1.5 s | gancho | idea propia, no vista en creadores (no verificado) | baja | 🧩 `tachon-rojo` |
| **Cronómetro** | Un reloj corre rápido sobre la captura y frena en el tiempo final ("lo hice en 10:00") | 1.5–2 s | gancho | idea propia, no vista en creadores (no verificado) | baja | 🧩 `cronometro` |
| Empujón al monitor | La cámara avanza recto desde ~60 cm hasta que el resultado llena el cuadro | 0.6–1.2 s | gancho | (no verificado en dev) [ARTÍCULO] | baja | 📱 |
| Objeto hacia el lente | Un objeto (laptop, celular con tu app) entra movido y queda nítido | 0.2–0.5 s | gancho | Coding with Lewis [CUADROS] | baja | 📱 |
| Monitor en ángulo | El monitor filmado inclinado 15–25°, de cerca, con la cifra en pantalla | 1–2 s | gancho / cierre | Coding with Lewis [CUADROS] | baja | 📱 |
| Barrido brusco (whip pan) | Giro rápido con desenfoque de movimiento que une dos tomas | 0.15–0.3 s | giro | tutorial [TEXTO]; en dev (no verificado) | media | 📱 |
| Tapar y destapar el lente | La mano cubre el lente, 2–4 cuadros en negro, y al destapar ya está el resultado | 0.3–0.6 s | giro | (no verificado en dev) [TEXTO] | baja | 📱 |
| Foco selectivo (rack focus) | El foco pasa del teclado a una línea del monitor | 0.8–1.5 s | gancho | Lewis usa macros [CUADROS]; el cambio de foco no lo vi | media | 📱 |
| Sobre el hombro | Teclado y pantalla desde atrás, cámara en mano | 1–2 s | gancho | Marc Lou [CUADROS] | baja | 📱 |

### B. Efectos de apoyo (el resto del video)

| Nombre | Cómo se ve | Duración | Momento | Quién lo usa | Dificultad | Tipo |
|---|---|---|---|---|---|---|
| **Ventana flotante** | Tarjeta redondeada con sombra; adentro, tu captura | 2–5 s | giro / demo | Baena [CUADROS] | baja | 🧩 `ventana-flotante` |
| **Mitad y mitad** | Animación o título arriba, pantalla abajo, subtítulos en la costura | todo el video | todo | Baena, midudev, MoureDev, Prime, DotCSV [CUADROS] | baja | 🧩 `mitad-y-mitad` |
| **Antes / después (cortina)** | Una línea recorre la pantalla y revela el "ahora" | 0.6–1 s | giro | (no verificado) | baja | 🧩 `antes-despues` |
| **Número grande** | Una cifra enorme que sube, con su etiqueta | 1–2 s | gancho / giro | Baena ("31 %"), Lewis [CUADROS]; no vi el conteo animado | baja | 🧩 `numero-grande` |
| **Tarjeta de texto** | Una frase grande a pantalla completa, con la palabra clave en serif itálica | 1–2 s | giro | Baena [CUADROS] | baja | 🧩 `tarjeta-texto` |
| **Tarjeta de cierre** | "Próximo: … →" y tu @usuario | 2–3 s | cierre | DotCSV (versión "vídeo completo") [CUADROS] | baja | 🧩 `tarjeta-cierre` |
| **Lista misteriosa** | Cartas con "?" que se voltean una por una | 1 s + 0.5 s por carta | gancho / giro | Baena ("Plugin 1–4 ?") [CUADROS] | media | 🧩 `lista-misterio` |
| Subtítulos palabra por palabra | 1–3 palabras; la clave cambia de color o pasa a serif itálica | cada 0.25–0.5 s | todo | Baena, midudev, Prime, Marc Lou [CUADROS] | media | pendiente (ver README) |

---

## 4. Con qué construirlos: comparación con evidencia

Consulté el registro de npm (`npm view`, sin instalar), el código fuente y los `.d.ts` publicados, y la documentación oficial.

| | HyperFrames 0.8.69 | **Remotion 4.0.527** | GSAP o Three.js + render propio |
|---|---|---|---|
| Vista previa con barra de tiempo | `<hyperframes-player controls>` + `seek()` | `<Player controls>` + `seekTo(frame)` | la tienes que construir |
| Parámetros en vivo en una app propia | vía `setRuntimeData` (solo documentado en el código) o recargando | **nativo**: `inputProps` enlazado al estado | la tienes que construir |
| Mismo código en vista previa y render | sí | sí | depende de ti |
| Video de entrada exacto al cuadro | extrae los cuadros con FFmpeg | `<Video>` de `@remotion/media` | lo resuelves tú |
| ProRes 4444 con alfa | `--format mov` | `codec:'prores'`, `proResProfile:'4444'`, `pixelFormat:'yuva444p10le'` | a mano con `prores_ks` |
| Secuencia PNG | `--format png-sequence` | `renderFrames({imageFormat:'png'})` | a mano |
| Codificación por GPU AMD | sí (`--gpu`, AMF) | no (solo NVIDIA o Mac); H.264 por CPU | sí (`h264_amf`) |
| Licencia | Apache-2.0 | gratis para individuos y empresas de hasta 3 personas | GSAP gratis (restricción: no competir con Webflow) |
| Madurez | antes de 1.0, publica casi a diario, telemetría activa por defecto | v4 madura y muy documentada | todo lo mantienes tú |
| Descargas | Chrome headless ~114 MB | Chrome headless ~113 MB | Chrome (o el tuyo) |

**Elegí Remotion** porque tu pedido central es la mini app: parámetros en vivo más barra de tiempo, con el mismo código para exportar, y eso Remotion lo trae de fábrica.
- HyperFrames sigue siendo una buena opción si algún día prefieres escribir en HTML + GSAP o usar su Studio. Hoy es más inestable y cuesta más conectarlo a una app propia.
- No usé la nube de HeyGen. Su precio por render para HyperFrames no está publicado: heygen.com/pricing muestra el plan Free de "3 videos al mes", pero no dice si aplica a HyperFrames.

**Qué descubrí durante la construcción [probado aquí]**: `<OffthreadVideo>` falló de forma intermitente al exportar ProRes y PNG ("No frame found at position…"). La guía oficial del error (https://www.remotion.dev/docs/troubleshooting/no-frame-found-at-position) recomienda `<Video>` de `@remotion/media` para proyectos nuevos. Con ese cambio salieron bien 6 exports seguidos y los 15 efectos.

---

## 5. Fuentes

- Hooks y retención (las cifras de estos blogs no citan una fuente primaria; tómalas como orientativas):
  - https://www.capcut.com/create/short-form-video-hooks-first-3-second-patterns
  - https://www.opus.pro/blog/youtube-shorts-hook-formulas
  - https://www.stackmatix.com/blog/tiktok-hook-first-3-seconds
- HyperFrames:
  - https://github.com/heygen-com/hyperframes
  - https://hyperframes.heygen.com/catalog
- Remotion:
  - https://www.remotion.dev/docs/transparent-videos
  - https://www.remotion.dev/docs/player
  - https://www.remotion.dev/license
