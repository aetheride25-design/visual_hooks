// Exporta las imágenes de marca (src/marca/marca.tsx) a PNG en assets/marca/.
// Uso: pnpm marca
import fs from 'node:fs';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'assets', 'marca');
const STILLS: [id: string, file: string][] = [
  ['marca-perfil-a', 'perfil-opcion-a.png'],
  ['marca-perfil-b', 'perfil-opcion-b.png'],
  ['marca-perfil-c', 'perfil-opcion-c.png'],
  ['marca-portada-x', 'portada-x.png'],
];

fs.mkdirSync(OUT, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src', 'remotion', 'index.ts') });
for (const [id, file] of STILLS) {
  const composition = await selectComposition({ serveUrl, id });
  const output = path.join(OUT, file);
  await renderStill({ serveUrl, composition, output, imageFormat: 'png' });
  console.log(`✓ ${path.relative(ROOT, output)} (${composition.width}×${composition.height})`);
}
