// npx tsx scripts/content/nameArrivals.ts: gives every unnamed arrival of content/adventure/maps.json a named spawn in the area it
// lands in (decision 047, Map Builder GĐ3) — same tile, same facing, so nothing changes in play — and its English name in
// content/i18n/en.json ("From <area>"). Safe to run again: named exits and names already there are left alone. Works on the files as
// written (no schema defaults added).
import { readFileSync, writeFileSync } from 'node:fs';
import type { AreaMap } from '../../src/areas/adventure/logic/config/content';
import type { ContentTexts } from '../../src/i18n/contentText';
import { nameArrivals } from '../../tools/admin/mapModel';
import { contentJson } from './format';

const FILE = 'content/adventure/maps.json';
const EN = 'content/i18n/en.json';
const file = JSON.parse(readFileSync(FILE, 'utf8')) as { maps: AreaMap[] };
const en = JSON.parse(readFileSync(EN, 'utf8')) as ContentTexts;
const texts = (en[FILE.replace('content/', '')] ??= {});

const maps = nameArrivals(file.maps);
const added = maps.reduce((n, m, i) => n + (m.spawns?.length ?? 0) - (file.maps[i]!.spawns?.length ?? 0), 0);
let named = 0;
for (const src of maps)
  for (const e of src.exits) {
    const key = `maps/${e.to}/spawns/${e.arrive}/nameVi`;
    const from = texts[`maps/${src.id}/nameVi`];
    if (!e.arrive?.startsWith(`spawn_from_${src.id.replace(/^map_/, '')}`) || texts[key] || !from) continue;
    texts[key] = `From ${from}`;
    named += 1;
  }
writeFileSync(FILE, contentJson({ ...file, maps }));
writeFileSync(EN, contentJson(en));
console.log(`${added} spawns named in ${FILE}, ${named} English names in ${EN}`);
