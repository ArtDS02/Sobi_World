// Dev-only API of the admin dashboard (DECISIONS A7-1, AD-1): a Vite plugin, `apply: 'serve'`,
// mounted only by vite.admin.config.ts — never part of the shipped app (no server/port in the build).
// It writes the same files the game imports, so `npm run dev` / the next build plays the edits.
//   GET  /files                              → pig files, manifest pigs[], source inventory, library
//   POST /species        { rows }            → speciesTable.ts, ids.ts, manifest pigs[]
//   POST /import-art     { source, artId, nameVi } → pigs/base/<artId>.png + manifest row
//   POST /upload-art     { artId, nameVi, data }   → same, from an uploaded PNG (base64)
//   POST /register-art   { artId, nameVi }   → manifest row for a file already in pigs/base/
//   POST /day-night      { settings }        → DAY_NIGHT block of config/dayNight.ts (DN)
//   GET  /saves | /saves/read?id=            → desktop save folders (user management)
//   POST /saves/write    { id, json, baseModifiedAt } · POST /saves/archive { id }
//   POST /products       { rows }            → PRODUCTS block of config/products.ts
//   POST /breeding-pairs { rows }            → PAIR_RULES block of config/breedingPairs.ts
//   GET  /layout-default · POST /layout { placements } → manifest layout.placements
import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ViteDevServer } from 'vite';
import { addBreedIdsText, appendPigRowsText, speciesTableText, type SpeciesRowData } from './speciesText';
import type { DayNightSettings } from '../../src/core/config/dayNight';
import { dayNightIssues } from '../../src/core/engine/dayNight';
import { replaceDayNightBlock } from './dayNightText';
import { validateSpecies, type ValidateInput } from './validate';
import { MANIFEST, assetFiles, writeText, filesPayload, importArt, readPigs, registerExisting, uploadArt } from './artFiles';
import { archiveProfile, listProfiles, readProfile, savesRoot, writeProfile } from './saves';
import { pairsBlock, productsBlock, replaceBlock, replacePlacementsText } from './configBlocks';
import { layoutIssues, pairIssues, productIssues, type PairRuleRow, type PlacementRow, type ProductRow } from './rules';

const TABLE = 'src/core/config/speciesTable.ts';
const IDS = 'src/core/config/ids.ts';
const DAY_NIGHT_FILE = 'src/core/config/dayNight.ts';
const PRODUCTS_FILE = 'src/core/config/products.ts';
const PAIRS_FILE = 'src/core/config/breedingPairs.ts';
const LAYOUT_DEFAULT = 'scripts/admin/layoutDefault.json';

type Result = { status: number; body: unknown };
type Mod = Record<string, unknown>;

/** Ids saves may hold: the BREED_ID_VALUES list as written in ids.ts now. */
function savedIds(): string[] {
  const text = readFileSync(IDS, 'utf8');
  const list = text.slice(text.indexOf('BREED_ID_VALUES = ['), text.indexOf('] as const;', text.indexOf('BREED_ID_VALUES')));
  return [...list.matchAll(/'(PIG_[A-Z0-9_]+)'/g)].map((m) => m[1]!);
}

type Rules = Pick<ValidateInput, 'rarities' | 'families' | 'tiers' | 'maxLevel'>;

/**
 * Game modules, loaded through Vite at request time. Importing src/ from this file would make the
 * written config files dependencies of the Vite config and restart the server on every save.
 */
const loader = (server: ViteDevServer) => (p: string) => server.ssrLoadModule(p) as Promise<Mod>;

async function loadRules(load: (p: string) => Promise<Mod>): Promise<Rules> {
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

function saveSpecies(rows: SpeciesRowData[], rules: Rules): Result {
  const pigs = readPigs();
  const issues = validateSpecies({ rows, pigs, files: assetFiles(), savedIds: savedIds(), ...rules }).filter(
    (i) => i.level === 'error',
  );
  if (issues.length > 0) return { status: 400, body: { error: 'invalid', issues } };
  const known = new Set(pigs.map((p) => p.id));
  const newArt = rows
    .filter((r) => !known.has(r.artId))
    .map((r) => ({ id: r.artId, nameVi: r.nameVi, asset: `pigs/base/${r.artId}.png`, tags: ['species', 'new'] }));
  writeText(IDS, addBreedIdsText(readFileSync(IDS, 'utf8'), rows.map((r) => r.id)));
  writeText(MANIFEST, appendPigRowsText(readFileSync(MANIFEST, 'utf8'), newArt));
  writeText(TABLE, speciesTableText(rows));
  return { status: 200, body: { ok: true, rows: rows.length, manifestAdded: newArt.length } };
}

/** DN: validated settings → the admin block of dayNight.ts (the game reloads with them). */
function saveDayNight(settings: DayNightSettings): Result {
  const issues = dayNightIssues(settings);
  if (issues.length > 0) return { status: 400, body: { error: issues.join('\n') } };
  writeText(DAY_NIGHT_FILE, replaceDayNightBlock(readFileSync(DAY_NIGHT_FILE, 'utf8'), settings));
  return { status: 200, body: { ok: true } };
}

/** Manifest ids of every non-pig row (what products and placements may point at). */
function artIds(): Set<string> {
  const m = JSON.parse(readFileSync(MANIFEST, 'utf8')) as Record<string, unknown>;
  const ids = new Set<string>();
  for (const [k, v] of Object.entries(m)) {
    if (Array.isArray(v) && k !== 'pigs') for (const r of v as { id: string }[]) ids.add(r.id);
  }
  return ids;
}

const refuse = (issues: { level: string }[]): Result | null => {
  const errors = issues.filter((i) => i.level === 'error');
  return errors.length ? { status: 400, body: { error: 'invalid', issues: errors } } : null;
};

async function saveProducts(rows: ProductRow[], load: (p: string) => Promise<Mod>): Promise<Result> {
  const [products, ids] = await Promise.all([load('/src/core/config/products.ts'), load('/src/core/config/ids.ts')]);
  const shipped = (products.PRODUCTS as { id: string }[]).map((p) => p.id);
  const bad = refuse(
    productIssues(rows, {
      itemIds: ids.ITEM_ID_VALUES as string[],
      categories: products.PRODUCT_CATEGORY_VALUES as string[],
      currencies: products.CURRENCY_VALUES as string[],
      assetIds: artIds(),
      shippedIds: shipped,
    }),
  );
  if (bad) return bad;
  writeText(PRODUCTS_FILE, replaceBlock(readFileSync(PRODUCTS_FILE, 'utf8'), 'products', productsBlock(rows as never)));
  return { status: 200, body: { ok: true, rows: rows.length } };
}

async function savePairs(rows: PairRuleRow[], load: (p: string) => Promise<Mod>): Promise<Result> {
  const [breeds, pairs] = await Promise.all([load('/src/core/config/breeds.ts'), load('/src/core/config/breedingPairs.ts')]);
  const bad = refuse(
    pairIssues(rows, {
      breeds: breeds.BREEDS as Record<string, { breedable: boolean; enabled: boolean }>,
      epsilon: pairs.PAIR_PERCENT_EPSILON as number,
    }),
  );
  if (bad) return bad;
  writeText(PAIRS_FILE, replaceBlock(readFileSync(PAIRS_FILE, 'utf8'), 'breedingPairs', pairsBlock(rows as never)));
  return { status: 200, body: { ok: true, rows: rows.length } };
}

async function saveLayout(placements: PlacementRow[], load: (p: string) => Promise<Mod>): Promise<Result> {
  const [schema, assetIds] = await Promise.all([load('/src/core/assets/manifestSchema.ts'), load('/src/core/config/assetIds.ts')]);
  const parse = schema.placementSchema as { safeParse: (v: unknown) => { success: boolean; error?: { message: string } } };
  for (const [i, p] of placements.entries()) {
    const r = parse.safeParse(p);
    if (!r.success) return { status: 400, body: { error: `Vị trí #${i + 1} (${p.id}) sai định dạng: ${r.error?.message}` } };
  }
  const bad = refuse(layoutIssues(placements, { assetIds: artIds(), troughId: assetIds.TROUGH_PROP_ID as string }));
  if (bad) return bad;
  writeText(MANIFEST, replacePlacementsText(readFileSync(MANIFEST, 'utf8'), placements));
  return { status: 200, body: { ok: true, placements: placements.length } };
}

/** Core's own parser (migrate + schema + invariants): the admin can only write what the game reads. */
async function saveValidator(load: (p: string) => Promise<Mod>) {
  const migrate = await load('/src/core/save/migrate.ts');
  const parseSave = migrate.parseSave as (json: string) => { ok: boolean; error?: string };
  return (json: string) => {
    const r = parseSave(json);
    return r.ok ? null : (r.error ?? 'SAVE_CORRUPT');
  };
}

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T;
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function route(server: ViteDevServer, req: IncomingMessage): Promise<Result> {
  const url = new URL(req.url ?? '/', 'http://admin');
  const r = `${req.method} ${url.pathname}`;
  const load = loader(server);
  const body = <T>() => readJson<T>(req);
  switch (r) {
    case 'GET /files':
      return { status: 200, body: filesPayload() };
    case 'POST /species':
      return saveSpecies((await body<{ rows: SpeciesRowData[] }>()).rows, await loadRules(load));
    case 'POST /import-art':
      return importArt(await body());
    case 'POST /upload-art':
      return uploadArt(await body());
    case 'POST /register-art':
      return registerExisting(await body());
    case 'POST /day-night':
      return saveDayNight((await body<{ settings: DayNightSettings }>()).settings);
    case 'GET /saves':
      return { status: 200, body: { root: savesRoot(), profiles: listProfiles() } };
    case 'GET /saves/read':
      return readProfile(url.searchParams.get('id') ?? '');
    case 'POST /saves/write':
      return writeProfile(await body(), await saveValidator(load));
    case 'POST /saves/archive':
      return archiveProfile((await body<{ id: string }>()).id);
    case 'POST /products':
      return saveProducts((await body<{ rows: ProductRow[] }>()).rows, load);
    case 'POST /breeding-pairs':
      return savePairs((await body<{ rows: PairRuleRow[] }>()).rows, load);
    case 'GET /layout-default':
      return { status: 200, body: { placements: JSON.parse(readFileSync(LAYOUT_DEFAULT, 'utf8')) } };
    case 'POST /layout':
      return saveLayout((await body<{ placements: PlacementRow[] }>()).placements, load);
    default:
      return { status: 404, body: { error: `unknown route ${r}` } };
  }
}

export function adminApi(): Plugin {
  return {
    name: 'un-in-admin-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__admin', (req, res) => {
        // Write failures surface to the dashboard as a 500 with the message — never swallowed.
        route(server, req).then(
          (r) => send(res, r.status, r.body),
          (e: unknown) => send(res, 500, { error: e instanceof Error ? e.message : String(e) }),
        );
      });
    },
  };
}
