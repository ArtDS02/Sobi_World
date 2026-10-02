// Dev-only API of the admin dashboard (DECISIONS A7-1): a Vite plugin, `apply: 'serve'`, mounted
// only by vite.admin.config.ts — never part of the shipped app (no server/port in the build).
// It writes the same files the game imports, so `npm run dev` / the next build plays the edits.
//   GET  /__admin/files        → asset files + inventory of asset/animals/asset/
//   POST /__admin/species      { rows }              → speciesTable.ts, ids.ts, manifest pigs[]
//   POST /__admin/import-art   { source, artId }     → copies a source image into pigs/base/
//   POST /__admin/day-night    { settings }          → DAY_NIGHT block of config/dayNight.ts (DN)
import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';
import {
  addBreedIdsText,
  appendPigRowsText,
  speciesTableText,
  type SpeciesRowData,
} from './speciesText';
import type { DayNightSettings } from '../../src/core/config/dayNight';
import { dayNightIssues } from '../../src/core/engine/dayNight';
import { replaceDayNightBlock } from './dayNightText';
import { ART_ID, validateSpecies, type PigArtRow, type ValidateInput } from './validate';

const ASSETS = 'public/assets';
const BASE = join(ASSETS, 'pigs', 'base');
const SOURCE = 'asset/animals/asset';
const MANIFEST = join(ASSETS, 'manifest', 'assets.json');
const TABLE = 'src/core/config/speciesTable.ts';
const IDS = 'src/core/config/ids.ts';
const DAY_NIGHT_FILE = 'src/core/config/dayNight.ts';

const readPigs = () => (JSON.parse(readFileSync(MANIFEST, 'utf8')) as { pigs: PigArtRow[] }).pigs;
const pngs = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.png')).sort() : []);

/** Asset paths relative to public/assets, for every pig file on disk. */
const assetFiles = () => new Set(pngs(BASE).map((f) => `pigs/base/${f}`));

/** Ids saves may hold: the BREED_ID_VALUES list as written in ids.ts now. */
function savedIds(): string[] {
  const text = readFileSync(IDS, 'utf8');
  const list = text.slice(text.indexOf('BREED_ID_VALUES = ['), text.indexOf('] as const;', text.indexOf('BREED_ID_VALUES')));
  return [...list.matchAll(/'(PIG_[A-Z0-9_]+)'/g)].map((m) => m[1]!);
}

/** asset/animals/asset/ files: which concept each is and whether the game already uses it. */
function inventory() {
  return pngs(SOURCE).map((name) => {
    const stem = name.replace(/\.png$/, '');
    const concept = stem.replace(/_v\d+$/, '');
    const target = join(BASE, `${concept}.png`);
    const inGame = existsSync(target);
    const identical = inGame && readFileSync(target).equals(readFileSync(join(SOURCE, name)));
    return { name, stem, concept, version: /_v(\d+)$/.exec(stem)?.[1] ?? null, inGame, identical };
  });
}

type Rules = Pick<ValidateInput, 'rarities' | 'families' | 'tiers' | 'maxLevel'>;

/**
 * Game config rules, loaded through Vite at request time. Importing src/ from this file would make
 * the written species table a dependency of the Vite config and restart the server on every save.
 */
async function loadRules(server: ViteDevServer): Promise<Rules> {
  const load = (p: string) => server.ssrLoadModule(p) as Promise<Record<string, unknown>>;
  const [breeds, rarity, balance] = await Promise.all([
    load('/src/core/config/breeds.ts'),
    load('/src/core/config/rarity.ts'),
    load('/src/core/config/balance.ts'),
  ]);
  return {
    rarities: rarity.RARITY_VALUES as string[],
    families: breeds.FAMILY_VALUES as string[],
    tiers: breeds.RARITY_TIER as Rules['tiers'],
    maxLevel: (balance.BALANCE as { MAX_LEVEL: number }).MAX_LEVEL,
  };
}

function saveSpecies(rows: SpeciesRowData[], rules: Rules) {
  const pigs = readPigs();
  const files = assetFiles();
  const issues = validateSpecies({ rows, pigs, files, savedIds: savedIds(), ...rules }).filter(
    (i) => i.level === 'error',
  );
  if (issues.length > 0) return { status: 400, body: { error: 'invalid', issues } };

  const known = new Set(pigs.map((p) => p.id));
  const newArt = rows
    .filter((r) => !known.has(r.artId))
    .map((r) => ({ id: r.artId, nameVi: r.nameVi, asset: `pigs/base/${r.artId}.png`, tags: ['species', 'new'] }));
  writeFileSync(IDS, addBreedIdsText(readFileSync(IDS, 'utf8'), rows.map((r) => r.id)));
  writeFileSync(MANIFEST, appendPigRowsText(readFileSync(MANIFEST, 'utf8'), newArt));
  writeFileSync(TABLE, speciesTableText(rows));
  return { status: 200, body: { ok: true, rows: rows.length, manifestAdded: newArt.length } };
}

function importArt({ source, artId }: { source: string; artId: string }) {
  if (!/^[a-z0-9_]+\.png$/.test(source) || !existsSync(join(SOURCE, source)))
    return { status: 400, body: { error: `Không có file nguồn ${source}` } };
  if (!ART_ID.test(artId)) return { status: 400, body: { error: `Art id "${artId}" phải dạng pig_ten` } };
  const target = join(BASE, `${artId}.png`);
  // Never overwrite live art: a replacement is a deliberate manual step (user rule A7).
  if (existsSync(target)) return { status: 409, body: { error: `${artId}.png đã tồn tại — không ghi đè` } };
  copyFileSync(join(SOURCE, source), target);
  return { status: 200, body: { ok: true, asset: `pigs/base/${artId}.png` } };
}

/** DN: validated settings → the admin block of dayNight.ts (the game reloads with them). */
function saveDayNight(settings: DayNightSettings) {
  const issues = dayNightIssues(settings);
  if (issues.length > 0) return { status: 400, body: { error: issues.join('\n') } };
  const text = readFileSync(DAY_NIGHT_FILE, 'utf8');
  writeFileSync(DAY_NIGHT_FILE, replaceDayNightBlock(text, settings));
  return { status: 200, body: { ok: true } };
}

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T;
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export function adminApi(): Plugin {
  return {
    name: 'un-in-admin-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__admin', (req, res) => {
        const route = `${req.method} ${req.url?.split('?')[0]}`;
        const run = async () => {
          if (route === 'GET /files') return { status: 200, body: { files: [...assetFiles()], inventory: inventory() } };
          if (route === 'POST /species') {
            const { rows } = await readJson<{ rows: SpeciesRowData[] }>(req);
            return saveSpecies(rows, await loadRules(server));
          }
          if (route === 'POST /import-art') return importArt(await readJson(req));
          if (route === 'POST /day-night') {
            const { settings } = await readJson<{ settings: DayNightSettings }>(req);
            return saveDayNight(settings);
          }
          return { status: 404, body: { error: `unknown route ${route}` } };
        };
        // Write failures surface to the dashboard as a 500 with the message — never swallowed.
        run().then(
          (r) => send(res, r.status, r.body),
          (e: unknown) => send(res, 500, { error: e instanceof Error ? e.message : String(e) }),
        );
      });
    },
  };
}
