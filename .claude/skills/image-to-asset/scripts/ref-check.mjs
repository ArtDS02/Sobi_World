#!/usr/bin/env node
// Reference change detection: hashes asset/reference/* against references/reference-registry.json.
// Exit 0 = style profile is current (do NOT re-analyse images). Exit 1 = NEW/CHANGED/MISSING files
// need workflows/reference-analysis.md (classify CORE / VARIATION / OUTLIER) before any brief uses them.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const REF_DIR = 'asset/reference';
const registry = JSON.parse(
  readFileSync(join(ROOT, '.claude/skills/image-to-asset/references/reference-registry.json'), 'utf8'),
);
const known = new Map(registry.files.map((f) => [f.file, f]));
let dirty = 0;
const seen = new Set();
for (const name of readdirSync(join(ROOT, REF_DIR))) {
  if (!/\.(png|jpe?g|webp)$/i.test(name)) continue;
  const file = `${REF_DIR}/${name}`;
  seen.add(file);
  const sha16 = createHash('sha256').update(readFileSync(join(ROOT, file))).digest('hex').slice(0, 16);
  const k = known.get(file);
  if (!k) (dirty++, console.log(`NEW      ${file} sha16=${sha16}`));
  else if (k.sha16 !== sha16) (dirty++, console.log(`CHANGED  ${file} sha16=${sha16} (was ${k.sha16}, ${k.class})`));
  else console.log(`OK       ${file} [${k.class}]`);
}
for (const f of known.keys()) if (!seen.has(f)) (dirty++, console.log(`MISSING  ${f}`));
console.log(dirty ? `\n${dirty} change(s) → run workflows/reference-analysis.md` : '\nstyle profile current');
process.exit(dirty ? 1 : 0);
