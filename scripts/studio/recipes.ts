// Load recipes, resolve `extends` (deep merge), validate. Plan §12.2 / §12.3.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { RecipeSchema, StyleSchema, TemplateSchema, type Recipe, type Style } from './schema.ts';

export const STUDIO = resolve('studio');
export const RECIPES = join(STUDIO, 'Recipes');
export const STYLE_FILE = join(STUDIO, 'Style', 'style.json');

export class StudioError extends Error {}

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

function isObj(v: unknown): v is Record<string, Json> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Objects merge key by key, everything else (arrays included) is replaced by the child. */
export function deepMerge(base: Json, over: Json): Json {
  if (!isObj(base) || !isObj(over)) return over === undefined ? base : over;
  const out: Record<string, Json> = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = k in base ? deepMerge(base[k]!, v) : v;
  return out;
}

function readJson(file: string): Json {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as Json;
  } catch (e) {
    throw new StudioError(`${rel(file)}: invalid JSON (${(e as Error).message})`);
  }
}

export const rel = (file: string) => relative(process.cwd(), file).replace(/\\/g, '/');

function formatIssues(file: string, issues: { path: PropertyKey[]; message: string }[]): string {
  return issues
    .slice(0, 8)
    .map((i) => `${rel(file)}: ${i.path.map(String).join('.') || '(root)'}: ${i.message}`)
    .join('\n');
}

export function loadStyle(file = STYLE_FILE): Style {
  const res = StyleSchema.safeParse(readJson(file));
  if (!res.success) throw new StudioError(formatIssues(file, res.error.issues));
  return res.data;
}

/** All recipe files (templates excluded), keyed by recipe id. */
export function recipeFiles(root = RECIPES): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        if (name === 'schema' || name.startsWith('_')) continue;
        walk(full);
      } else if (name.endsWith('.json')) out.push(full);
    }
  };
  if (existsSync(root)) walk(root);
  return out.sort();
}

export interface Loaded {
  recipe: Recipe;
  file: string;
  /** files the recipe depends on (itself + templates), for hashing */
  chain: string[];
}

export function resolveRecipe(file: string, root = RECIPES): Loaded {
  const chain: string[] = [];
  const load = (f: string, depth: number): Json => {
    if (depth > 8) throw new StudioError(`${rel(file)}: extends chain too deep`);
    if (!existsSync(f)) throw new StudioError(`${rel(file)}: extends target missing: ${rel(f)}`);
    chain.push(f);
    const raw = readJson(f);
    if (!isObj(raw)) throw new StudioError(`${rel(f)}: must be an object`);
    const check = TemplateSchema.safeParse(raw);
    if (!check.success) throw new StudioError(formatIssues(f, check.error.issues));
    const ext = raw.extends;
    if (typeof ext !== 'string') return raw;
    const parent = load(join(root, `${ext}.json`), depth + 1);
    const merged = deepMerge(parent, raw) as Record<string, Json>;
    return merged;
  };
  const merged = load(file, 0) as Record<string, Json>;
  delete merged.extends;
  for (const key of ['parts', 'paints'] as const) {
    const group = merged[key];
    if (isObj(group))
      for (const [name, part] of Object.entries(group))
        if (isObj(part) && part.remove) delete group[name];
  }
  const res = RecipeSchema.safeParse(merged);
  if (!res.success) throw new StudioError(formatIssues(file, res.error.issues));
  return { recipe: res.data, file, chain };
}

export function loadAll(root = RECIPES): Loaded[] {
  const seen = new Map<string, string>();
  const out: Loaded[] = [];
  for (const f of recipeFiles(root)) {
    const l = resolveRecipe(f, root);
    const prev = seen.get(l.recipe.id);
    if (prev)
      throw new StudioError(`${rel(f)}: duplicate recipe id "${l.recipe.id}" (also ${rel(prev)})`);
    seen.set(l.recipe.id, f);
    out.push(l);
  }
  return out;
}

export function sha(...parts: string[]): string {
  const h = createHash('sha256');
  for (const p of parts) h.update(p).update('\0');
  return h.digest('hex').slice(0, 16);
}
