// The decoration library of the Map Builder on the dev API (decision 047, GĐ6b): content/adventure/scenery.json, one row per asset
// shared by every area (an area only says where one stands). Saving checks the game's own schema, that the picture is in the
// manifest and that the asset has an English name (content/i18n/en.json); an upload adds the PNG under props/adventure_decor/ and its
// manifest row first; an asset still placed on an area (published or in a draft) is never deleted.
//   GET  /adventure/assets          → { use: { <asset id>: [area ids] } }
//   POST /adventure/assets/save   { asset, nameEn }
//   POST /adventure/assets/upload { asset, nameEn, data }   (asset.art = the new picture's id)
//   POST /adventure/assets/delete { id }
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { contentJson } from '../content/format';
import { MANIFEST, pngSize, writeText } from './artFiles';
import { readContent, schemaProblems } from './contentFiles';
import { MAP_DATA_DIR, readDrafts } from './mapDrafts';

type Mod = Record<string, unknown>;
type Result = { status: number; body: unknown };
type Asset = { id: string; nameVi: string; art: string } & Record<string, unknown>;

const FILE = 'content/adventure/scenery.json';
const EN = 'content/i18n/en.json';
const DIR = 'public/assets/props/adventure_decor';
const MAX_BYTES = 8 * 1024 * 1024;
const refuse = (error: string): Result => ({ status: 400, body: { error } });

const manifestIds = (): Set<string> => {
  const m = JSON.parse(readFileSync(MANIFEST, 'utf8')) as Record<string, unknown>;
  return new Set(Object.values(m).flatMap((v) => (Array.isArray(v) ? (v as { id?: string }[]).map((r) => r.id ?? '') : [])));
};

/** The manifest text with a picture row appended to its `props` list, in the file's own layout (one field per line). */
export function appendPropRow(text: string, row: { id: string; asset: string }): string {
  const start = text.indexOf('\n  "props": [');
  if (start < 0) throw new Error('manifest has no props list');
  const end = text.indexOf('\n  ]', start);
  const body = text.slice(start, end);
  const sep = body.trimEnd().endsWith('[') ? '' : ',';
  const block = `${sep}\n    {\n      "id": ${JSON.stringify(row.id)},\n      "status": "production",\n      "asset": ${JSON.stringify(row.asset)}\n    }`;
  return text.slice(0, end) + block + text.slice(end);
}

/** Where each asset is placed: area ids (published and drafts). */
export function assetUse(dir = MAP_DATA_DIR): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const note = (mapId: string, scenery: unknown) => {
    for (const d of (scenery ?? []) as { asset: string }[]) {
      const list = (out[d.asset] ??= []);
      if (!list.includes(mapId)) list.push(mapId);
    }
  };
  for (const m of (readContent('adventure/maps.json') as { maps: { id: string; scenery?: unknown }[] }).maps) note(m.id, m.scenery);
  for (const d of Object.values(readDrafts(dir))) note(d.map.id, d.map.scenery);
  return out;
}

const readEn = () => JSON.parse(readFileSync(EN, 'utf8')) as Record<string, Record<string, string>>;

/** POST /adventure/assets/save: a new or changed asset of the library, with its English name. */
export async function saveAsset(body: { asset: Asset; nameEn: string }, load: (p: string) => Promise<Mod>): Promise<Result> {
  const { asset } = body;
  const nameEn = String(body.nameEn ?? '').trim();
  if (!nameEn) return refuse('Cần tên tiếng Anh (game có bản tiếng Anh)');
  const schema = await load('/content/schemas/adventure/scenery.ts');
  const shape = schemaProblems(schema.sceneryAssetSchema, asset);
  if (shape.length) return refuse(shape.join('\n'));
  if (!manifestIds().has(asset.art)) return refuse(`Ảnh ${asset.art} chưa có trong manifest`);
  const file = readContent('adventure/scenery.json') as { assets: Asset[] };
  const assets = file.assets.some((a) => a.id === asset.id) ? file.assets.map((a) => (a.id === asset.id ? asset : a)) : [...file.assets, asset];
  writeText(FILE, contentJson({ assets }));
  const en = readEn();
  en['adventure/scenery.json'] = { ...en['adventure/scenery.json'], [`assets/${asset.id}/nameVi`]: nameEn };
  writeText(EN, contentJson(en));
  return { status: 200, body: { ok: true, id: asset.id } };
}

/** POST /adventure/assets/upload: a new picture (PNG with a see-through background) and its library row. */
export async function uploadAsset(body: { asset: Asset; nameEn: string; data: string }, load: (p: string) => Promise<Mod>): Promise<Result> {
  const art = String(body.asset?.art ?? '');
  if (!/^adv_decor_[a-z0-9_]+$/.test(art)) return refuse('Id ảnh phải dạng adv_decor_ten');
  if (manifestIds().has(art)) return refuse(`Ảnh ${art} đã có trong manifest`);
  const buf = Buffer.from(String(body.data ?? ''), 'base64');
  if (buf.length > MAX_BYTES) return refuse('Ảnh quá lớn (tối đa 8 MB)');
  if (!pngSize(buf)) return refuse('File không phải PNG');
  const manifestBefore = readFileSync(MANIFEST, 'utf8');
  mkdirSync(DIR, { recursive: true });
  const path = `${DIR}/${art}.png`;
  writeFileSync(path, buf);
  writeText(MANIFEST, appendPropRow(manifestBefore, { id: art, asset: `props/adventure_decor/${art}.png` }));
  const saved = await saveAsset(body, load);
  if (saved.status !== 200) {
    // Nothing half-done: the picture and its manifest row go again.
    writeText(MANIFEST, manifestBefore);
    rmSync(path, { force: true });
  }
  return saved;
}

/** POST /adventure/assets/delete: an asset placed nowhere leaves the library (its picture stays in the manifest). */
export function deleteAsset(body: { id: string }, dir = MAP_DATA_DIR): Result {
  const used = assetUse(dir)[body.id] ?? [];
  if (used.length) return refuse(`Asset đang đặt trên: ${used.join(', ')}`);
  const file = readContent('adventure/scenery.json') as { assets: Asset[] };
  if (!file.assets.some((a) => a.id === body.id)) return refuse(`Không có asset ${body.id}`);
  writeText(FILE, contentJson({ assets: file.assets.filter((a) => a.id !== body.id) }));
  const en = readEn();
  if (en['adventure/scenery.json']) delete en['adventure/scenery.json'][`assets/${body.id}/nameVi`];
  writeText(EN, contentJson(en));
  return { status: 200, body: { ok: true } };
}
