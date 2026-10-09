// Mods: effects that live in the mods/ folder instead of src/effects/. The app and the render load them the same way.
// This file checks what each mod exports, so one broken mod can't break the app. Pure logic, no React.
import type { EffectDef } from './types.ts';

/** What scripts/mods.ts finds: each mods/<folder>/index.tsx and everything it exports. */
export type ModModule = { folder: string; module: Record<string, unknown> };

/** A mod that couldn't be loaded and why (shown in the app and in the server log). */
export type ModProblem = { folder: string; message: string };

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const GROUPS = ['hook', 'support', 'piece'];

const isText = (v: unknown) =>
  typeof v === 'object' && v !== null && typeof (v as any).en === 'string' && typeof (v as any).es === 'string';

/** Does it look like an effect at all? (So helpers or constants a mod exports are ignored, not errors.) */
const looksLikeEffect = (v: unknown): v is EffectDef =>
  typeof v === 'object' && v !== null && 'id' in v && 'component' in v;

/** Why `def` can't be used as an effect, or null if it's fine. */
export const effectProblem = (def: EffectDef, takenIds: ReadonlySet<string>): string | null => {
  if (typeof def.id !== 'string' || !ID.test(def.id)) return `id "${String(def.id)}" must be lowercase letters, digits and dashes`;
  if (takenIds.has(def.id)) return `id "${def.id}" is already used by another effect`;
  if (typeof def.component !== 'function' && typeof def.component !== 'object') return `${def.id}: component must be a React component`;
  if (!isText(def.name)) return `${def.id}: name needs { en, es }`;
  if (!isText(def.description)) return `${def.id}: description needs { en, es }`;
  if (!GROUPS.includes(def.group)) return `${def.id}: group must be "hook", "support" or "piece"`;
  if (!(def.defaultDurationSec > 0 && def.defaultDurationSec <= 60)) return `${def.id}: defaultDurationSec must be between 0 and 60`;
  if (typeof def.defaults !== 'object' || def.defaults === null) return `${def.id}: defaults must be an object`;
  if (!Array.isArray(def.params)) return `${def.id}: params must be a list`;
  const missing = def.params.find((p) => !(p.key in def.defaults) && p.type !== 'media');
  if (missing) return `${def.id}: param "${missing.key}" has no default value`;
  return null;
};

/**
 * Every effect the mods export (default export, named exports or arrays of them), checked one by one.
 * Effects that pass are marked as mods; the rest come back as problems.
 */
export const collectMods = (
  modules: ModModule[],
  coreIds: Iterable<string>,
): { effects: EffectDef<any>[]; problems: ModProblem[] } => {
  const taken = new Set(coreIds);
  const effects: EffectDef<any>[] = [];
  const problems: ModProblem[] = [];
  for (const { folder, module } of modules) {
    const found = Object.values(module).flatMap((v) => (Array.isArray(v) ? v : [v])).filter(looksLikeEffect);
    // The same effect exported twice (named and default) counts once.
    const unique = [...new Set(found)];
    if (unique.length === 0) {
      problems.push({ folder, message: 'exports no effect (export an EffectDef from index.tsx)' });
      continue;
    }
    for (const def of unique) {
      const problem = effectProblem(def, taken);
      if (problem) {
        problems.push({ folder, message: problem });
        continue;
      }
      taken.add(def.id);
      effects.push({ ...def, source: 'mod' });
    }
  }
  return { effects, problems };
};
