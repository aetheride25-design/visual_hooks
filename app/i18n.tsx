// App UI strings in both languages, plus the language context and the ES/EN switch.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { detectLang, fill, LANGS, type Lang, type Text } from '../src/lib/i18n.ts';
import { setApiLang } from './api.ts';

const strings = {
  // Header
  brand: { en: 'Visual Hooks', es: 'Hooks visuales' },
  language: { en: 'Language', es: 'Idioma' },

  // Media panel
  mediaTitle: { en: 'Your video, image or audio', es: 'Tu video, imagen o audio' },
  uploading: { en: 'Copying (and converting if it’s ProRes)…', es: 'Copiando (y convirtiendo si es ProRes)…' },
  dropHere: { en: 'Drop here or click', es: 'Arrastra aquí o haz clic' },
  savedIn: { en: 'Saved in this project’s media/ folder', es: 'Se guarda en la carpeta media/ de este proyecto' },
  sampleScreen: { en: 'Sample screen', es: 'Pantalla de ejemplo' },
  kindVideo: { en: '🎬 Video', es: '🎬 Video' },
  kindAudio: { en: '🎵 Audio', es: '🎵 Audio' },
  kindImage: { en: '🖼 Image', es: '🖼 Imagen' },

  // Effect list
  groupHooks: { en: 'Visual hooks · 0–2 s', es: 'Hooks visuales · 0–2 s' },
  groupHooksHint: { en: 'They go on a span of your video (at the start, up front).', es: 'Van en un tramo de tu video (al inicio, de entrada).' },
  groupSupport: { en: 'Support effects', es: 'Efectos de apoyo' },
  groupSupportHint: {
    en: 'Cards over your video at the second you pick, or formats that last the whole video.',
    es: 'Tarjetas encima de tu video en el segundo que elijas, o formatos que duran todo el video.',
  },
  groupPieces: { en: 'Animated pieces', es: 'Piezas animadas' },
  groupPiecesHint: { en: 'Standalone clips: they don’t go over a video.', es: 'Clips sueltos: no van sobre un video.' },

  // Preview
  pickHere: { en: 'Click on the key detail', es: 'Haz clic sobre el dato clave' },
  picking: { en: 'Click on the preview…', es: 'Haz clic en la vista previa…' },
  pickPoint: { en: '🎯 Pick a point on the preview', es: '🎯 Elegir punto sobre la vista previa' },
  toStart: { en: 'To start', es: 'Al inicio' },
  prevFrame: { en: 'Previous frame', es: 'Cuadro anterior' },
  nextFrame: { en: 'Next frame', es: 'Cuadro siguiente' },
  frame: { en: 'frame', es: 'cuadro' },
  dragSpan: { en: 'Drag it to move the effect', es: 'Arrástralo para mover el efecto' },
  yourVideoLength: { en: 'your video · {d} s', es: 'tu video · {d} s' },

  // Time panel
  time: { en: 'Time', es: 'Tiempo' },
  whatExport: { en: 'What are you exporting?', es: '¿Qué exportas?' },
  modeVideo: { en: 'Apply to my video', es: 'Aplicar a mi video' },
  modeClip: { en: 'Effect only (DaVinci)', es: 'Solo el efecto (DaVinci)' },
  timedFull: { en: 'Lasts your whole {kind} ({d} s), with its audio.', es: 'Dura todo tu {kind} ({d} s), con su audio.' },
  timedMoment: {
    en: 'Your {kind} lasts {d} s and keeps its audio. The effect runs from {from} to {to} s; before and after, your {kind} plays as is. Drag the span in the bar below the preview.',
    es: 'Tu {kind} dura {d} s y conserva su audio. El efecto va de {from} a {to} s; antes y después sigue tu {kind} normal. Arrastra el tramo en la barra de abajo de la vista previa.',
  },
  startsAt: { en: 'Starts at (s)', es: 'Empieza en (s)' },
  effectDuration: { en: 'Effect duration (s)', es: 'Duración del efecto (s)' },
  untimedPiece: {
    en: 'Standalone piece: it doesn’t go over a video. The export lasts as long as the piece.',
    es: 'Pieza suelta: no va sobre un video. El export dura lo que la pieza.',
  },
  untimedImage: {
    en: 'An image has no timeline: the export lasts as long as the effect.',
    es: 'Con una imagen no hay línea de tiempo: el export dura lo que el efecto.',
  },
  untimedClip: {
    en: 'Effect only: a short clip with the first seconds of your video and no audio, to edit in DaVinci.',
    es: 'Solo el efecto: un clip corto con los primeros segundos de tu video y sin audio, para montarlo en DaVinci.',
  },
  untimedNone: {
    en: 'Upload or pick a video to apply the effect to. Meanwhile you see a sample screen.',
    es: 'Sube o elige un video para aplicarle el efecto. Mientras tanto ves una pantalla de ejemplo.',
  },
  duration: { en: 'Duration (s)', es: 'Duración (s)' },
  speed: { en: 'Animation speed', es: 'Velocidad de la animación' },
  fps: { en: 'Frames per second', es: 'Cuadros por segundo' },
  hideVideo: {
    en: 'View without your video (effect and captions only, as in ProRes)',
    es: 'Ver sin tu video (solo efecto y subtítulos, como sale en ProRes)',
  },
  transparentBg: { en: 'Transparent background (for DaVinci)', es: 'Fondo transparente (para DaVinci)' },

  // Captions
  captions: { en: 'Captions', es: 'Subtítulos' },
  captionsOn: { en: 'Add captions of your voice on top', es: 'Poner subtítulos de tu voz encima' },
  captionsNeedVoice: {
    en: 'Pick a video or audio with your voice to caption it. Works with any effect.',
    es: 'Elige un video o un audio con tu voz para ponerle subtítulos. Funcionan con cualquier efecto.',
  },
  transcript: { en: 'Transcript', es: 'Transcripción' },
  modelFast: { en: 'Fast', es: 'Rápido' },
  modelGood: { en: 'Good', es: 'Bueno' },
  modelBest: { en: 'Best', es: 'Mejor' },
  whisperModel: { en: 'Whisper {v} model', es: 'Modelo {v} de Whisper' },
  langEs: { en: 'Spanish', es: 'Español' },
  langEn: { en: 'English', es: 'Inglés' },
  langAuto: { en: 'Detect', es: 'Detectar' },
  transcribing: { en: 'Transcribing…', es: 'Transcribiendo…' },
  transcribeAgain: { en: '🎙 Transcribe again', es: '🎙 Transcribir de nuevo' },
  transcribeMine: { en: '🎙 Transcribe my {kind}', es: '🎙 Transcribir mi {kind}' },
  pickVoice: {
    en: 'Pick your video or audio with voice in the left panel. Meanwhile you see a sample phrase.',
    es: 'Elige tu video o audio con voz en el panel izquierdo. Mientras tanto ves una frase de ejemplo.',
  },
  otherFile: { en: 'These words are from another file ({file}). Transcribe this one.', es: 'Estas palabras son de otro archivo ({file}). Transcribe este.' },
  srtHint: { en: 'For CapCut, DaVinci or Premiere', es: 'Para CapCut, DaVinci o Premiere' },
  vttHint: { en: 'For YouTube or the web', es: 'Para YouTube o la web' },
  editHint: {
    en: 'Fix a word and press Enter. Empty = deleted. Two words = they split the time. Click the time to jump there.',
    es: 'Corrige una palabra y pulsa Enter. Vacía = se borra. Dos palabras = se reparten el tiempo. Clic en el tiempo para ir ahí.',
  },
  trInstalling: { en: 'Installing Whisper (first time only)…', es: 'Instalando Whisper (solo la primera vez)…' },
  trDownloading: { en: 'Downloading the model (first time only)', es: 'Bajando el modelo (solo la primera vez)' },
  trTranscribing: { en: 'Listening to your video', es: 'Escuchando tu video' },
  done: { en: 'Done!', es: '¡Listo!' },
  error: { en: 'Error', es: 'Error' },

  // Background
  background: { en: 'Background', es: 'Fondo' },
  bgHidden: {
    en: 'With "Transparent background" on it isn’t drawn; the MP4 does include it.',
    es: 'Con "Fondo transparente" activo no se dibuja; el MP4 sí lo lleva.',
  },
  style: { en: 'Style', es: 'Estilo' },
  colors: { en: 'Colors', es: 'Colores' },
  base: { en: 'Base', es: 'Base' },
  light: { en: 'Light {n}', es: 'Luz {n}' },

  // Export
  exportTitle: { en: 'Export {w}×{h}', es: 'Exportar {w}×{h}' },
  mp4Label: { en: 'MP4', es: 'MP4' },
  mp4Hint: { en: 'With background, ready to upload', es: 'Con fondo, para subir directo' },
  mp4Timed: { en: 'Your full video with the effect and its audio', es: 'Tu video completo con el efecto y su audio' },
  proresLabel: { en: 'ProRes 4444', es: 'ProRes 4444' },
  proresHint: { en: 'Transparent, for DaVinci', es: 'Transparente, para DaVinci' },
  proresTimed: {
    en: 'Without your video: effect and captions, transparent, at their exact second',
    es: 'Sin tu video: efecto y subtítulos transparentes, en su segundo exacto',
  },
  pngLabel: { en: 'PNG sequence', es: 'Secuencia PNG' },
  pngHint: { en: 'Transparent, one PNG per frame', es: 'Transparente, un PNG por cuadro' },
  pngTimed: { en: 'Same as ProRes, one PNG per frame', es: 'Igual que ProRes, un PNG por cuadro' },
  cancel: { en: 'Cancel', es: 'Cancelar' },
  exportAt: { en: 'Export at {fps} fps', es: 'Exportar a {fps} fps' },
  preparing: { en: 'Preparing (takes longer the first time)…', es: 'Preparando (la primera vez tarda más)…' },
  rendering: { en: 'Rendering frame by frame… {p} %', es: 'Renderizando cuadro por cuadro… {p} %' },
  cancelled: { en: 'Cancelled', es: 'Cancelado' },
  openExports: { en: 'Open exports folder', es: 'Abrir carpeta de exports' },
} satisfies Record<string, Text>;

export type StringKey = keyof typeof strings;
type Vars = Record<string, string | number>;

const STORAGE_KEY = 'lang';

const savedLang = (): Lang | null => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return (LANGS as string[]).includes(v ?? '') ? (v as Lang) : null;
  } catch {
    return null;
  }
};

const saveLang = (lang: Lang) => {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Private mode or blocked storage: the choice just isn't remembered.
  }
};

const initialLang = (): Lang => savedLang() ?? detectLang(navigator.languages ?? [navigator.language]);

type LangContext = { lang: Lang; setLang: (lang: Lang) => void; t: (key: StringKey, vars?: Vars) => string };

const Ctx = createContext<LangContext | null>(null);

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const l = initialLang();
    // Set before any child effect fetches, so the first requests already carry it.
    setApiLang(l);
    return l;
  });
  const setLang = useCallback((l: Lang) => {
    setApiLang(l);
    saveLang(l);
    setLangState(l);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const value = useMemo<LangContext>(
    () => ({ lang, setLang, t: (key, vars) => (vars ? fill(strings[key][lang], vars) : strings[key][lang]) }),
    [lang, setLang],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useLang = (): LangContext => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useLang outside LangProvider');
  return c;
};

/** ES/EN switch for the header. */
export const LangSwitch: React.FC = () => {
  const { lang, setLang, t } = useLang();
  return (
    <div className="segmented lang" role="group" aria-label={t('language')} title={t('language')}>
      {LANGS.map((l) => (
        <button key={l} className={lang === l ? 'on' : ''} aria-pressed={lang === l} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
};
