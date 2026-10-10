// Dev-only API of the admin dashboard (DECISIONS A7-1, AD-1): a Vite plugin, `apply: 'serve'`,
// mounted only by vite.admin.config.ts — never part of the shipped app (no server/port in the build).
// It writes the same files the game imports, so `npm run dev` / the next build plays the edits.
//   GET  /files                              → pig files, manifest pigs[], source inventory, library
// Content goes to content/*.json, validated by the game's schemas (content/schemas) first.
//   POST /species        { rows }            → farm/species.json, schemas/ids.generated.ts, manifest pigs[]
//   POST /import-art     { source, artId, nameVi } → pigs/base/<artId>.png + manifest row
//   POST /upload-art     { artId, nameVi, data }   → same, from an uploaded PNG (base64)
//   POST /register-art   { artId, nameVi }   → manifest row for a file already in pigs/base/
//   POST /day-night      { settings }        → shared/daynight.json (DN)
//   GET  /saves | /saves/read?id=            → desktop save folders (user management)
//   POST /saves/write    { id, json, baseModifiedAt } · POST /saves/archive { id } · POST /saves/root { path }
//   POST /products       { rows }            → shared/shop.json
//   POST /breeding-pairs { rows }            → farm/breeding.json `pairs`
//   POST /breeding-genetics { genetics, mutations, geneBonuses } → farm/breeding.json (MU-1)
//   POST /season-fx      { tuning }          → farm/season-fx.json (MU-2)
//   GET  /layout-default · POST /layout { placements, target?, plaza? } → farm/layout.json placements, or (target "plaza") plaza/layout.json: placements, walk area, spawn
//   GET  /numbers · POST /numbers { file, value } → the numbers of time / health / valuation / quality / farm balance (only numbers change)
//   GET  /build-info · POST /open-folder { which } → desktop build status + guide data (AM-1)
import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ViteDevServer } from 'vite';
import { appendPigRowsText, type SpeciesRowData } from './speciesText';
import {
  CONTENT_FILE,
  readContent,
  readIds,
  regenerateIds,
  savedBreedIds,
  speciesFileValue,
  writeContent,
  writeIds,
} from './contentFiles';
import type { DayNightSettings } from '../../src/core/config/dayNight';
import { dayNightIssues } from '../../src/core/engine/dayNight';
import { validateSpecies, type ValidateInput } from './validate';
import { MANIFEST, assetFiles, writeText, filesPayload, importArt, readPigs, registerExisting, uploadArt } from './artFiles';
import { buildInfo, openFolder } from './buildInfo';
import { readNumbers, saveNumbers } from './numbers';
import { archiveProfile, listProfiles, readProfile, savesRoot, setSavesRoot, writeProfile } from './saves';
import type { GeneticsRules, Mutation } from '../../src/areas/farm/logic/config/breedingRules';
import type { GeneBonuses } from '../../src/areas/farm/logic/config/genePool';
import type { SeasonFxTuning } from '../../src/areas/farm/scene/config/seasonFx';
import { layoutIssues, pairIssues, productIssues, type PairRuleRow, type PlacementRow, type ProductRow } from './rules';

const LAYOUT_DEFAULT = 'scripts/admin/layoutDefault.json';

type Result = { status: number; body: unknown };
type Mod = Record<string, unknown>;


type Rules = Pick<ValidateInput, 'rarities' | 'families' | 'tiers' | 'maxLevel'>;

/**
 * Game modules, loaded through Vite at request time. Importing src/ from this file would make the
 * written config files dependencies of the Vite config and restart the server on every save.
 */
const loader = (server: ViteDevServer) => (p: string) => server.ssrLoadModule(p) as Promise<Mod>;

async function loadRules(load: (p: string) => Promise<Mod>): Promise<Rules> {
  const [breeds, rarity, progression] = await Promise.all([
    load('/src/core/config/breeds.ts'),
    load('/src/core/config/rarity.ts'),
    load('/src/core/config/progression.ts'),
  ]);
  return {
    rarities: rarity.RARITY_VALUES as string[],
    families: breeds.FAMILY_VALUES as string[],
    tiers: breeds.RARITY_TIER as Rules['tiers'],
    maxLevel: (progression.WORLD_LEVELS as { maxLevel: number }).maxLevel,
  };
}

/** Schema problems as a 400 (null when the file was written). */
const invalid = (problems: string[]): Result | null =>
  problems.length ? { status: 400, body: { error: problems.join('\n') } } : null;

async function saveSpecies(
  rows: SpeciesRowData[],
  rules: Rules,
  load: (p: string) => Promise<Mod>,
  /** Drops Vite's cached modules: the schema must see the regenerated ids. */
  invalidate: () => void,
): Promise<Result> {
  const pigs = readPigs();
  const issues = validateSpecies({ rows, pigs, files: assetFiles(), savedIds: savedBreedIds(), ...rules }).filter(
    (i) => i.level === 'error',
  );
  if (issues.length > 0) return { status: 400, body: { error: 'invalid', issues } };
  const known = new Set(pigs.map((p) => p.id));
  const newArt = rows
    .filter((r) => !known.has(r.artId))
    .map((r) => ({ id: r.artId, nameVi: r.nameVi, asset: `pigs/base/${r.artId}.png`, tags: ['species', 'new'] }));
  const value = speciesFileValue(rows, readContent(CONTENT_FILE.species));
  const before = { species: readFileSync(`content/${CONTENT_FILE.species}`, 'utf8'), ids: readIds() };
  // The schema checks ids against ids.generated.ts: append the new ids first, restore both on failure.
  writeText(`content/${CONTENT_FILE.species}`, JSON.stringify(value));
  regenerateIds();
  invalidate();
  const bad = invalid(await writeContent(load, CONTENT_FILE.species, '/content/schemas/farm/species.ts', 'speciesFileSchema', value));
  if (bad) {
    writeText(`content/${CONTENT_FILE.species}`, before.species);
    writeIds(before.ids);
    return bad;
  }
  writeText(MANIFEST, appendPigRowsText(readFileSync(MANIFEST, 'utf8'), newArt));
  return { status: 200, body: { ok: true, rows: rows.length, manifestAdded: newArt.length } };
}

/** DN: validated settings → content/shared/daynight.json (the game reloads with them). */
async function saveDayNight(settings: DayNightSettings, load: (p: string) => Promise<Mod>): Promise<Result> {
  const issues = dayNightIssues(settings);
  if (issues.length > 0) return { status: 400, body: { error: issues.join('\n') } };
  const written = await writeContent(load, CONTENT_FILE.dayNight, '/content/schemas/shared/dayNight.ts', 'dayNightFileSchema', settings);
  return invalid(written) ?? { status: 200, body: { ok: true } };
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
  const written = await writeContent(load, CONTENT_FILE.shop, '/content/schemas/shared/shop.ts', 'shopFileSchema', { products: rows });
  return invalid(written) ?? { status: 200, body: { ok: true, rows: rows.length } };
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
  const breeding = { ...readContent(CONTENT_FILE.breeding), pairs: rows };
  const written = await writeContent(load, CONTENT_FILE.breeding, '/content/schemas/farm/breeding.ts', 'breedingFileSchema', breeding);
  return invalid(written) ?? { status: 200, body: { ok: true, rows: rows.length } };
}

interface GeneticsBody {
  genetics: GeneticsRules;
  mutations: Mutation[];
  geneBonuses: GeneBonuses;
}

/** MU-1: random-genetics percents, special recipes and gene bonuses, validated by the engine itself. */
async function saveGenetics(b: GeneticsBody, load: (p: string) => Promise<Mod>): Promise<Result> {
  const [odds, breeds] = await Promise.all([load('/src/core/engine/breedingOdds.ts'), load('/src/core/config/breeds.ts')]);
  const known = breeds.BREEDS as Record<string, { breedable: boolean } | undefined>;
  const issues = [
    ...(odds.geneticsIssues as (g: GeneticsRules) => string[])(b.genetics),
    ...(odds.recipeIssues as (m: Mutation[]) => string[])(b.mutations),
    ...b.mutations.flatMap((m) =>
      [...m.parents, m.result].filter((id) => !known[id]).map((id) => `công thức: loài ${id} không tồn tại`),
    ),
    ...b.mutations.flatMap((m) =>
      m.parents.filter((id) => known[id] && !known[id]!.breedable).map((id) => `công thức: ${id} không phối giống được`),
    ),
  ];
  const g = b.geneBonuses;
  if (!(g.base > 0) || [g.sameTheme, g.relatedTheme, g.perGeneTag, g.geneTagCap].some((v) => !(v >= 0)))
    issues.push('gene pool: base > 0, các điểm cộng ≥ 0');
  if (issues.length) return { status: 400, body: { error: issues.join('\n') } };
  const breeding = { ...readContent(CONTENT_FILE.breeding), genetics: b.genetics, mutations: b.mutations, geneBonuses: g };
  const written = await writeContent(load, CONTENT_FILE.breeding, '/content/schemas/farm/breeding.ts', 'breedingFileSchema', breeding);
  return invalid(written) ?? { status: 200, body: { ok: true, recipes: b.mutations.length } };
}

/** MU-2: seasonal FX tuning (on / off, density, spawn rate), validated by the engine. */
async function saveSeasonFx(tuning: SeasonFxTuning, load: (p: string) => Promise<Mod>): Promise<Result> {
  const fx = await load('/src/core/engine/seasonFx.ts');
  const issues = (fx.seasonFxIssues as (t: SeasonFxTuning) => string[])(tuning);
  if (issues.length) return { status: 400, body: { error: issues.join('; ') } };
  const written = await writeContent(load, CONTENT_FILE.seasonFx, '/content/schemas/farm/seasonFx.ts', 'seasonFxFileSchema', tuning);
  return invalid(written) ?? { status: 200, body: { ok: true } };
}

/** The `portalInPlaza` of every Area manifest (built or planned): the plaza must hold one door for each. */
const portalIds = (): string[] =>
  ['farm', 'garden', 'aquarium', 'cloud', 'adventure'].map((d) => readContent<{ portalInPlaza: string }>(`${d}/area.json`).portalInPlaza);

interface PlazaMeta {
  walkArea?: Record<string, number>;
  spawn?: Record<string, number>;
  portalReach?: number;
}

async function saveLayout(body: { placements: PlacementRow[]; target?: string; plaza?: PlazaMeta }, load: (p: string) => Promise<Mod>): Promise<Result> {
  const { placements } = body;
  const plaza = body.target === 'plaza';
  const [schema, assetIds] = await Promise.all([
    load(plaza ? '/content/schemas/plaza/layout.ts' : '/content/schemas/farm/layout.ts'),
    load('/src/core/config/assetIds.ts'),
  ]);
  const parse = (plaza ? schema.plazaPlacementSchema : schema.placementSchema) as { safeParse: (v: unknown) => { success: boolean; error?: { message: string } } };
  for (const [i, p] of placements.entries()) {
    const r = parse.safeParse(p);
    if (!r.success) return { status: 400, body: { error: `Vị trí #${i + 1} (${p.id}) sai định dạng: ${r.error?.message}` } };
  }
  const bad = refuse(layoutIssues(placements, { assetIds: artIds(), troughId: assetIds.TROUGH_PROP_ID as string, ...(plaza ? { plaza: { portals: portalIds() } } : {}) }));
  if (bad) return bad;
  if (plaza) {
    const next = { ...readContent(CONTENT_FILE.plazaLayout), ...body.plaza, placements };
    const done = await writeContent(load, CONTENT_FILE.plazaLayout, '/content/schemas/plaza/layout.ts', 'plazaLayoutSchema', next);
    return invalid(done) ?? { status: 200, body: { ok: true, placements: placements.length } };
  }
  const layout = { ...readContent(CONTENT_FILE.layout), placements };
  const written = await writeContent(load, CONTENT_FILE.layout, '/content/schemas/farm/layout.ts', 'layoutFileSchema', layout);
  return invalid(written) ?? { status: 200, body: { ok: true, placements: placements.length } };
}

/** The game's own parser (migrate + world and Area schemas): the admin can only write what the game reads. */
async function saveValidator(load: (p: string) => Promise<Mod>) {
  const codec = await load('/src/app/saveCodec.ts');
  const parseSave = codec.parseWorldSave as (json: string) => { ok: boolean; error?: string };
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
      return saveSpecies((await body<{ rows: SpeciesRowData[] }>()).rows, await loadRules(load), load, () =>
        server.moduleGraph.invalidateAll(),
      );
    case 'POST /import-art':
      return importArt(await body());
    case 'POST /upload-art':
      return uploadArt(await body());
    case 'POST /register-art':
      return registerExisting(await body());
    case 'POST /day-night':
      return saveDayNight((await body<{ settings: DayNightSettings }>()).settings, load);
    case 'GET /saves':
      return { status: 200, body: { root: savesRoot(), profiles: listProfiles() } };
    case 'GET /saves/read':
      return readProfile(url.searchParams.get('id') ?? '');
    case 'POST /saves/write':
      return writeProfile(await body(), await saveValidator(load));
    case 'POST /saves/root':
      return setSavesRoot((await body<{ path: string }>()).path);
    case 'POST /saves/archive':
      return archiveProfile((await body<{ id: string }>()).id);
    case 'POST /products':
      return saveProducts((await body<{ rows: ProductRow[] }>()).rows, load);
    case 'POST /breeding-pairs':
      return savePairs((await body<{ rows: PairRuleRow[] }>()).rows, load);
    case 'POST /breeding-genetics':
      return saveGenetics(await body<GeneticsBody>(), load);
    case 'POST /season-fx':
      return saveSeasonFx((await body<{ tuning: SeasonFxTuning }>()).tuning, load);
    case 'GET /layout-default':
      return { status: 200, body: { placements: JSON.parse(readFileSync(LAYOUT_DEFAULT, 'utf8')) } };
    case 'POST /layout':
      return saveLayout(await body<{ placements: PlacementRow[]; target?: string; plaza?: PlazaMeta }>(), load);
    case 'GET /numbers':
      return { status: 200, body: { files: readNumbers() } };
    case 'POST /numbers':
      return saveNumbers(await body<{ file: string; value: unknown }>(), load);
    case 'GET /build-info':
      return buildInfo();
    case 'POST /open-folder':
      return openFolder((await body<{ which: string }>()).which);
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
