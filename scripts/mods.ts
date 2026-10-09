// pnpm mods            → rewrites mods/index.generated.ts from the folders in mods/
// pnpm new-mod "name"  → creates mods/<name>/index.tsx from the template, ready to edit
import path from 'node:path';
import { scaffoldMod, writeModsIndex } from '../server/mods.ts';

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'new') {
  try {
    const file = scaffoldMod(rest.join(' '));
    console.log(`Created ${path.relative(process.cwd(), file)}. Run pnpm dev: it shows up in the app under Mods.`);
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
} else {
  writeModsIndex();
}
