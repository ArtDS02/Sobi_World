#!/usr/bin/env node
// Resolves one asset request to a compact spec resolution (YAML) so the agent never has to read the
// 1300-line catalogue: catalogue row + pack prompt + manifest row + reference match + output contract.
// Usage:
//   node .claude/skills/image-to-asset/scripts/resolve.mjs "#42" | pig_pilot | "Heo Phi Công" | pilot
//   node .claude/skills/image-to-asset/scripts/resolve.mjs --list [filter]
// Pig numbering (#NN) = order of first appearance in PIG_CATALOGUE.md §3–§13 (stable while the
// catalogue tables are only appended to).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const CATALOGUE = 'asset/animals/PIG_CATALOGUE.md';
const PACK = 'asset/AI_ASSET_GENERATION_PACK.md';
const MANIFEST = 'public/assets/manifest/assets.json';
const REGISTRY = '.claude/skills/image-to-asset/references/reference-registry.json';
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

// Catalogue section → collection folder (art standard §7.3).
const SECTION_COLLECTION = {
  3: 'base', 4: 'vietnam', 5: 'jobs', 6: 'adventure', 7: 'robot', 8: 'fantasy',
  9: 'mythology', 10: 'horror', 11: 'seasonal', 12: 'food', 13: 'funny',
};
const PRICE = { P1: 2000, P2: 6000, P3: 15000, P4: 40000, P5: null }; // pack §9 price ladder
const P0 = ['pig_classic', 'pig_watermelon', 'pig_superhero', 'pig_thienlong'];

function cataloguePigs() {
  const pigs = [];
  const seen = new Set();
  let section = 0;
  read(CATALOGUE).split(/\r?\n/).forEach((line, i) => {
    const h = /^# (\d+)\./.exec(line);
    if (h) section = Number(h[1]);
    if (section < 3 || section > 13) return;
    const m = /^\|\s*`(pig_\w+)`\s*\|(.*)\|\s*$/.exec(line) ?? /^-\s*`(pig_\w+)`\s*$/.exec(line);
    if (!m || seen.has(m[1])) return;
    seen.add(m[1]);
    const cells = (m[2] ?? '').split('|').map((s) => s.trim());
    const priority = cells.find((c) => /P[0-5]/.test(c)) ?? null;
    pigs.push({
      no: pigs.length + 1,
      id: m[1],
      nameVi: cells[0] || null,
      concept: cells.length >= 3 ? cells[1] : null,
      priority: priority ? /P[0-5]/.exec(priority)[0] : null,
      section,
      line: i + 1,
    });
  });
  return pigs;
}

function packConcepts() {
  const out = new Map();
  read(PACK).split(/\r?\n/).forEach((line, i) => {
    const m = /^\|\s*`((?:pig|fx|prop|ui|acc)_\w+)`\s*\|.*`([^`]+)`\s*\|\s*$/.exec(line);
    if (m) out.set(m[1], { concept: m[2], line: i + 1 });
  });
  return out;
}

const pigs = cataloguePigs();
const args = process.argv.slice(2);

if (args[0] === '--list') {
  const f = (args[1] ?? '').toLowerCase();
  for (const p of pigs)
    if (!f || JSON.stringify(p).toLowerCase().includes(f))
      console.log(`#${String(p.no).padStart(3, '0')} ${p.id.padEnd(20)} ${p.priority ?? '--'} ${p.nameVi ?? ''}`);
  process.exit(0);
}

const q = (args.join(' ') || '').trim().toLowerCase();
if (!q) {
  console.error('usage: resolve.mjs <#NN | pig_id | name | keyword> | --list [filter]');
  process.exit(2);
}
const num = /^#?(\d+)$/.exec(q);
const strip = (s) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();
let hits = num
  ? pigs.filter((p) => p.no === Number(num[1]))
  : pigs.filter((p) => p.id === q || p.id === `pig_${q}`);
if (!hits.length) hits = pigs.filter((p) => strip(p.nameVi) === strip(q));
if (!hits.length)
  hits = pigs.filter((p) => [p.id, p.nameVi, p.concept].some((s) => strip(s).includes(strip(q))));

if (hits.length !== 1) {
  console.log(`status: ${hits.length ? 'AMBIGUOUS' : 'NOT_IN_CATALOGUE'}`);
  console.log(`query: ${JSON.stringify(q)}`);
  for (const p of hits) console.log(`  - "#${p.no} ${p.id} ${p.nameVi ?? ''}"`);
  if (!hits.length) console.log('note: not a catalogue pig — check ENVIRONMENT_CATALOGUE / pack §4–§7 (references/spec-map.md)');
  process.exit(1);
}

const p = hits[0];
const pack = packConcepts().get(p.id);
const manifest = JSON.parse(read(MANIFEST));
const row = manifest.pigs.find((r) => r.id === p.id) ?? null;
const registry = JSON.parse(read(REGISTRY));
const refHits = registry.cells.filter((c) => c.ids?.includes(p.id));
const rarity = P0.includes(p.id) ? 'P0' : (row?.rarity ?? p.priority); // manifest wins (spec-map §2)
const collection = row?.collection ?? SECTION_COLLECTION[p.section];
const dir = collection === 'base' ? 'pigs/base' : `pigs/skins/${collection}`;
// Sleep frame: P0 + P1 only (art standard §3.2); reference cut-outs have no sleep pose (DECISIONS Q5).
const wantsSleep = rarity === 'P0' || rarity === 'P1';

const y = (k, v, ind = '') => console.log(`${ind}${k}: ${v === null || v === undefined ? 'null' : JSON.stringify(v)}`);
console.log('status: RESOLVED');
y('asset_no', p.no);
y('asset_id', p.id);
y('asset_name', p.nameVi);
y('category', 'pig_skin');
y('rarity', rarity);
y('collection', collection);
console.log('primary_spec:');
y('file', `${CATALOGUE}:${p.line}`, '  ');
y('concept', p.concept, '  ');
console.log('secondary_specs:');
y('pack_concept', pack ? pack.concept : null, '  ');
y('pack_line', pack ? `${PACK}:${pack.line}` : null, '  ');
y('pack_template', `${PACK} §3 (master), §3.3 (sleep), §1.3 (negative)`, '  ');
console.log('constraints:');
y('format', 'asset/ASSET_PRODUCTION_STANDARD_v1.md §2, §4.1, §4.5, §5, §7', '  ');
y('art_direction', 'asset/GAME_ART_DIRECTION.md', '  ');
if (rarity === 'P4' || rarity === 'P5') y('legendary_rule', `${CATALOGUE} §22`, '  ');
console.log('required_views: ["side_right"]   # standard §2: left = runtime flip, no front/back');
console.log(`required_states: ${JSON.stringify(wantsSleep ? ['idle', 'sleep'] : ['idle'])}   # other 6 states = code + fx (standard §3)`);
console.log('technical_requirements:');
y('canvas', '512x512 PNG-32, transparent, feet line y=420 (82%), no shadow/ground/text', '  ');
y('outputs', [`art_inbox/${p.id}.png`, ...(wantsSleep ? [`art_inbox/${p.id}_sleep.png`] : [])], '  ');
y('final_paths', [`${dir}/${p.id}.png`, ...(wantsSleep ? [`${dir}/${p.id}_sleep.png`] : [])], '  ');
console.log('manifest:');
y('row', row ? `exists (status: ${row.status})` : 'MISSING — new shop skin, register proposed_row + flag it in DONE (spec-map §4)', '  ');
if (!row)
  y('proposed_row', { id: p.id, status: 'placeholder', nameVi: p.nameVi, collection, rarity, priceGold: PRICE[rarity] ?? null, allowedBreeds: 'ALL', asset: `${dir}/${p.id}.png`, ...(wantsSleep ? { sleepAsset: `${dir}/${p.id}_sleep.png` } : {}), tags: [collection] }, '  ');
console.log('reference_set:');
y('style_anchor', 'public/assets/pigs/base/pig_classic.png (+ asset/reference/style_reference_pigs.png)', '  ');
if (refHits.length) {
  console.log('  concept_cells:');
  for (const c of refHits)
    console.log(`    - ${JSON.stringify(`${c.sheet} ${c.cell} ${c.match}${c.cuttable ? ' cuttable' : ''}: ${c.note}`)}`);
} else console.log('  concept_cells: []   # no reference cell → new design, style from CORE cells only (backend X)');
