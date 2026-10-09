// The effects shown on the landing. To add one: drop `media/effects/<id>.mp4` (+ `<id>.jpg` poster)
// and add a line here. `group` is 'hook', 'support', 'piece' or 'mod'. Regenerate the clips with
// `node site/scripts/render-media.ts` while the app is running (see site/README.md).
window.EFFECTS = [
  { id: 'focus-snap', group: 'hook', en: 'Focus snap', es: 'Enfoque seco', den: 'Starts zoomed in and blurry, snaps into focus.', des: 'Entra borroso y ampliado, y encaja nítido.' },
  { id: 'punch-zoom', group: 'hook', en: 'Punch zoom', es: 'Zoom de golpe', den: 'Hard zoom onto the result, with shake.', des: 'Zoom seco al resultado, con temblor.' },
  { id: 'text-drop', group: 'hook', en: 'Text drop', es: 'Texto que cae', den: 'Heavy words that slam in.', des: 'Palabras gruesas que caen con golpe.' },
  { id: 'window-3d', group: 'hook', en: '3D window', es: 'Ventana 3D', den: 'Your app pops out in perspective.', des: 'Tu app salta en perspectiva.' },
  { id: 'arrow-circle', group: 'hook', en: 'Arrow & circle', es: 'Flecha y círculo', den: 'A hand-drawn stroke on the key detail.', des: 'Un trazo a mano sobre el dato clave.' },
  { id: 'before-after-cut', group: 'hook', en: 'Before / after cut', es: 'Corte antes / después', den: 'Hard cut from old to new, with a flash.', des: 'Cambio seco de lo viejo a lo nuevo, con destello.' },
  { id: 'glitch', group: 'hook', en: 'Glitch', es: 'Glitch', den: 'Bands and split RGB.', des: 'Bandas y RGB separado.' },
  { id: 'notification', group: 'hook', en: 'Notification', es: 'Notificación', den: 'A phone-style alert slides down.', des: 'Un aviso tipo celular baja.' },
  { id: 'red-strike', group: 'hook', en: 'Red strike', es: 'Tachado rojo', den: '"3 hours" crossed out, "10 min" lands.', des: '"3 horas" tachado, cae "10 min".' },
  { id: 'prompt-typing', group: 'hook', en: 'Prompt typing', es: 'Prompt que se escribe', den: 'A prompt or command types itself.', des: 'Un prompt o comando se escribe solo.' },
  { id: 'stopwatch', group: 'hook', en: 'Stopwatch', es: 'Cronómetro', den: 'A clock races and stops on your time.', des: 'Un reloj corre y frena en tu tiempo.' },
  { id: 'floating-window', group: 'support', en: 'Floating window', es: 'Ventana flotante', den: 'Your capture in a card with a label.', des: 'Tu captura en una tarjeta con etiqueta.' },
  { id: 'split-screen', group: 'support', en: 'Split screen', es: 'Pantalla dividida', den: 'Two shots, one on top of the other.', des: 'Dos tomas, una sobre otra.' },
  { id: 'before-after-wipe', group: 'support', en: 'Before / after wipe', es: 'Cortina antes / después', den: 'A light curtain reveals the "after".', des: 'Una cortina de luz revela el "después".' },
  { id: 'big-number', group: 'support', en: 'Big number', es: 'Cifra grande', den: 'A number that counts up.', des: 'Una cifra que sube.' },
  { id: 'text-card', group: 'support', en: 'Text card', es: 'Tarjeta de texto', den: 'One big phrase, nothing else.', des: 'Una frase grande, nada más.' },
  { id: 'end-card', group: 'support', en: 'End card', es: 'Tarjeta final', den: '"Next: …" plus your @handle.', des: '"Próximo: …" más tu @usuario.' },
  { id: 'mystery-cards', group: 'support', en: 'Mystery cards', es: 'Cartas misterio', den: '"?" cards that flip.', des: 'Cartas "?" que se voltean.' },
  { id: 'nameless-idea', group: 'piece', en: 'Nameless idea', es: 'Idea sin nombre', den: 'A thin-line bulb with sparks and a blinking "???".', des: 'Una bombilla de líneas finas con destellos y "???".' },
];
