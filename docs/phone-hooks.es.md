# Guía corta: hooks de cámara con el celular (sin cara, sin casa)

[English](phone-hooks.md)

## Antes de grabar (siempre)
1. **Privacidad**: cierra correo, notificaciones y pestañas personales. Oculta tu usuario en la terminal y cualquier ruta con tu nombre, y nunca muestres el `.env`.
2. **Reflejos**: un monitor oscuro funciona como espejo. Apaga la luz detrás de ti, viste de oscuro y filma un poco de costado. Revisa la toma cuadro a cuadro por si aparece tu cara o tu cuarto.
3. **Encuadre cerrado**: solo monitor, teclado y escritorio. Sin ventanas, fotos ni puertas.
4. **Legibilidad**: sube el zoom del editor o la terminal a 150–200 % y usa tema oscuro.
5. **Truco**: graba tu pantalla primero y reprodúcela en el monitor mientras filmas. Así repites la toma sin volver a escribir.

## Ajustes del celular
- **60 fps**, en 4K si puedes: te da margen para cámara lenta y para reencuadrar a 1080×1920.
- **Bloquea exposición y foco**: mantén presionado sobre el monitor en la app de Cámara y baja un poco la exposición.
- **Parpadeo o bandas en la pantalla**: ajusta la obturación a la red eléctrica. Con red de 60 Hz (casi toda América) usa 1/60 (a 30 fps) o 1/120 (a 60 fps); con 50 Hz (España y gran parte del mundo), 1/50 o 1/100. La Cámara nativa no deja fijarla: necesitas una app con control manual (confirma cuál hay para tu modelo). Si tu monitor va a 144 o 165 Hz y ves bandas, bájalo a 60 o 120 Hz mientras filmas.
- **Moiré** (ondas raras en la pantalla): aléjate y usa el lente 2x o 3x en vez de acercarte con el 1x.

## Los 6 hooks

| Hook | Ángulo | Distancia | Velocidad | Luz | Consejo |
|---|---|---|---|---|---|
| **Empujón al monitor** | frontal, levemente de costado | de 60 cm a 20 cm | constante, 1 s | cuarto a media luz, monitor al 60 % | Codos pegados al cuerpo; avanza con el torso, no con los brazos. Termina con el resultado llenando el cuadro. |
| **Objeto hacia el lente** | celular fijo (apoyado) | el objeto viaja de 1 m a 25 cm | rápido, 0.3 s | la del monitor | Muestra tu app en otro celular o laptop. Si el foco no llega, deja que el objeto frene un instante. |
| **Monitor en ángulo** | 15–25° de costado y un poco inclinado | 30–40 cm | quieto o con un paneo lento | fondo oscuro | Ideal para una cifra grande en pantalla. Úsalo como cierre. |
| **Barrido brusco** | a la altura del monitor | 50 cm | muy rápido, 0.2 s | la misma en las dos tomas | Toma A termina girando a la derecha y toma B empieza girando igual. Únelas en DaVinci en el punto de más desenfoque. |
| **Tapar y destapar** | frontal | 40 cm | la mano entra y sale en ~0.4 s | la misma en las dos tomas | Toma A con el bug: tapa el lente con la palma. Toma B con el fix: destapa. En DaVinci corta en el cuadro negro. |
| **Sobre el hombro** | detrás y encima del hombro, apuntando al teclado y la pantalla | 50–70 cm | cámara en mano, con un movimiento leve | lámpara de escritorio encendida | Encuadra desde el hombro hacia abajo para que tu cabeza no entre. |

## En tu editor (DaVinci Resolve, CapCut…)
- **Empujón y barrido**: acelera 2–4× en *Retime* y frena en seco sobre el resultado. Suma un *whoosh*.
- **Encima de estas tomas** puedes montar cualquier efecto de la biblioteca exportado con fondo transparente, por ejemplo `text-drop` o `big-number`.
