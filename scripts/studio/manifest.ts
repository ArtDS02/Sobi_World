// Manifest access for the studio: outputs must be files the manifest already lists (ids never change).
// Writes are text edits of one entry so the file's hand formatting stays as it is.
import { readFileSync, writeFileSync } from 'node:fs';
import { StudioError } from './recipes.ts';
import type { Recipe } from './schema.ts';

export const MANIFEST = 'public/assets/manifest/assets.json';

type Entry = Record<string, unknown> & { id: string };
type Manifest = Record<string, unknown>;

export function readManifest(file = MANIFEST): Manifest {
  return JSON.parse(readFileSync(file, 'utf8')) as Manifest;
}

export function entries(m: Manifest): Entry[] {
  const out: Entry[] = [];
  for (const v of Object.values(m))
    if (Array.isArray(v))
      for (const e of v) if (e && typeof e === 'object' && 'id' in e) out.push(e as Entry);
  return out;
}

/** Every .png path referenced anywhere inside an entry (asset, sleepAsset, seasons…). */
export function filesOf(e: unknown): string[] {
  if (typeof e === 'string') return e.endsWith('.png') ? [e] : [];
  if (Array.isArray(e)) return e.flatMap(filesOf);
  if (e && typeof e === 'object') return Object.values(e).flatMap(filesOf);
  return [];
}

export function manifestCheck(recipe: Recipe, m: Manifest = readManifest()): void {
  const byId = new Map(entries(m).map((e) => [e.id, e]));
  for (const o of recipe.outputs) {
    const e = byId.get(o.asset);
    if (!e)
      throw new StudioError(`${recipe.id}: output ${o.file}: manifest has no id "${o.asset}"`);
    if (!filesOf(e).includes(o.file))
      throw new StudioError(
        `${recipe.id}: output ${o.file}: not a file of manifest id "${o.asset}"`,
      );
    if (o.fps && e.asset !== o.file)
      throw new StudioError(`${recipe.id}: output ${o.file}: fps only for the main sheet`);
  }
}

/** Text span [start, end) of the manifest entry with this id. */
export function entrySpan(text: string, id: string): [number, number] {
  const key = `"id": ${JSON.stringify(id)}`;
  const at = text.indexOf(key);
  if (at < 0) throw new StudioError(`manifest: no id ${id}`);
  const start = text.lastIndexOf('{', at);
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) return [start, i + 1];
  }
  throw new StudioError(`manifest: unterminated entry ${id}`);
}

const FRAMES_RE = /"frames": \{[^}]*\}/;

export function setFramesText(
  text: string,
  id: string,
  file: string,
  frames: { width: number; height: number; count: number; fps: number },
): string {
  const [a, b] = entrySpan(text, id);
  const entry = text.slice(a, b);
  if (!entry.includes(`"asset": ${JSON.stringify(file)}`))
    throw new StudioError(`manifest: ${id} does not own ${file}`);
  const inline = `"frames": { "width": ${frames.width}, "height": ${frames.height}, "count": ${frames.count}, "fps": ${frames.fps} }`;
  let next: string;
  if (FRAMES_RE.test(entry)) next = entry.replace(FRAMES_RE, inline);
  else {
    const close = entry.lastIndexOf('\n');
    const indent = /^\s*/.exec(entry.slice(close + 1))![0];
    next = `${entry.slice(0, close).replace(/\s*$/, '')},\n${indent}  ${inline}${entry.slice(close)}`;
  }
  return text.slice(0, a) + next + text.slice(b);
}

export function setFrames(
  id: string,
  file: string,
  frames: { width: number; height: number; count: number; fps: number },
) {
  writeFileSync(MANIFEST, setFramesText(readFileSync(MANIFEST, 'utf8'), id, file, frames));
}

/** Adds rows right after an existing entry, in the file's style. */
export function insertAfterText(text: string, id: string, rows: Record<string, unknown>[]): string {
  const [a, b] = entrySpan(text, id);
  const lineStart = text.lastIndexOf('\n', a) + 1;
  const indent = text.slice(lineStart, a);
  const body = rows
    .map((r) => {
      const fields = Object.entries(r).map(
        ([k, v]) => `${indent}  ${JSON.stringify(k)}: ${JSON.stringify(v)}`,
      );
      return `${indent}{\n${fields.join(',\n')}\n${indent}}`;
    })
    .join(',\n');
  return `${text.slice(0, b)},\n${body}${text.slice(b)}`;
}

export function insertAfter(id: string, rows: Record<string, unknown>[]) {
  writeFileSync(MANIFEST, insertAfterText(readFileSync(MANIFEST, 'utf8'), id, rows));
}
