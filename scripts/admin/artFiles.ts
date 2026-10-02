// Pig art files of the admin dashboard (DECISIONS A7-1, AD-1). An asset is only usable once it is
// both a file in pigs/base/ AND a manifest `pigs[]` row: every route that adds a file registers it
// in the same request, so a freshly imported/uploaded image is immediately selectable for a pig.
import { copyFileSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { appendPigRowsText } from './speciesText';
import { ART_ID, type PigArtRow } from './validate';

export const ASSETS = 'public/assets';
export const BASE = join(ASSETS, 'pigs', 'base');
export const SOURCE = 'asset/animals/asset';
export const MANIFEST = join(ASSETS, 'manifest', 'assets.json');
/** Uploads above this are refused (a 512² art PNG is ~300 KB). */
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

type Result = { status: number; body: unknown };

/**
 * Text files the dashboard rewrites are saved with LF endings: the repo stores LF and a Windows
 * checkout (autocrlf) may hold CRLF, so a mixed file would show as a whole-file diff.
 */
export const writeText = (path: string, text: string) => writeFileSync(path, text.replace(/\r\n/g, '\n'));

export const readPigs = () => (JSON.parse(readFileSync(MANIFEST, 'utf8')) as { pigs: PigArtRow[] }).pigs;
const pngs = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.png')).sort() : []);
const md5 = (path: string) => createHash('md5').update(readFileSync(path)).digest('hex');

/** Asset paths relative to public/assets, for every pig file on disk. */
export const assetFiles = () => new Set(pngs(BASE).map((f) => `pigs/base/${f}`));

/** Width × height from the IHDR chunk; null when the file is not a PNG. */
export function pngSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 24 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** Every pig image in pigs/base/: size, date and whether the manifest knows it. */
export function library() {
  const pigs = readPigs();
  return pngs(BASE).map((name) => {
    const path = join(BASE, name);
    const st = statSync(path);
    const file = `pigs/base/${name}`;
    const frames = (p: (typeof pigs)[number]) => [p.asset, p.sleepAsset, p.wakeAsset];
    const row = pigs.find((p) => frames(p).includes(file)) ?? null;
    return {
      file,
      artId: name.replace(/\.png$/, ''),
      rowId: row?.id ?? null,
      sleep: !!row && row.asset !== file, // sleep or wake frame (PS-1)
      bytes: st.size,
      modifiedAt: st.mtimeMs,
      size: pngSize(readFileSync(path)),
    };
  });
}

/** asset/animals/asset/ files: concept, whether the game uses it, and the game files it became. */
export function inventory() {
  const baseHashes = new Map<string, string[]>();
  for (const f of pngs(BASE)) {
    const h = md5(join(BASE, f));
    baseHashes.set(h, [...(baseHashes.get(h) ?? []), f.replace(/\.png$/, '')]);
  }
  return pngs(SOURCE).map((name) => {
    const stem = name.replace(/\.png$/, '');
    const concept = stem.replace(/_v\d+$/, '');
    const target = join(BASE, `${concept}.png`);
    const inGame = existsSync(target);
    const importedAs = baseHashes.get(md5(join(SOURCE, name))) ?? [];
    const identical = importedAs.includes(concept);
    return { name, stem, concept, version: /_v(\d+)$/.exec(stem)?.[1] ?? null, inGame, identical, importedAs };
  });
}

/** Adds the manifest row of a pig image (no-op when a row already points at the file). */
export function registerArt(artId: string, nameVi: string): boolean {
  const asset = `pigs/base/${artId}.png`;
  if (readPigs().some((p) => p.id === artId || p.asset === asset)) return false;
  const text = readFileSync(MANIFEST, 'utf8');
  writeText(MANIFEST, appendPigRowsText(text, [{ id: artId, nameVi, asset, tags: ['species', 'new'] }]));
  return true;
}

function checkTarget(artId: string, nameVi: string): Result | null {
  if (!ART_ID.test(artId)) return { status: 400, body: { error: `Art id "${artId}" phải dạng pig_ten (chữ thường, số, _)` } };
  if (!nameVi.trim()) return { status: 400, body: { error: 'Cần tên hiển thị của ảnh' } };
  // Never overwrite live art: a replacement is a deliberate manual step (user rule A7).
  if (existsSync(join(BASE, `${artId}.png`))) return { status: 409, body: { error: `${artId}.png đã tồn tại — không ghi đè` } };
  if (readPigs().some((p) => p.id === artId)) return { status: 409, body: { error: `Manifest đã có dòng ${artId}` } };
  return null;
}

/** Source image → pigs/base/<artId>.png + manifest row. */
export function importArt({ source, artId, nameVi }: { source: string; artId: string; nameVi: string }): Result {
  if (!/^[a-z0-9_]+\.png$/.test(source) || !existsSync(join(SOURCE, source)))
    return { status: 400, body: { error: `Không có file nguồn ${source}` } };
  const bad = checkTarget(artId, nameVi);
  if (bad) return bad;
  copyFileSync(join(SOURCE, source), join(BASE, `${artId}.png`));
  registerArt(artId, nameVi.trim());
  return { status: 200, body: { ok: true, artId, asset: `pigs/base/${artId}.png` } };
}

/** Uploaded PNG (base64) → pigs/base/<artId>.png + manifest row. */
export function uploadArt({ artId, nameVi, data }: { artId: string; nameVi: string; data: string }): Result {
  const bad = checkTarget(artId, nameVi);
  if (bad) return bad;
  const buf = Buffer.from(data, 'base64');
  if (buf.length > MAX_UPLOAD_BYTES) return { status: 400, body: { error: 'Ảnh quá lớn (tối đa 8 MB)' } };
  const size = pngSize(buf);
  if (!size) return { status: 400, body: { error: 'File không phải PNG' } };
  if (size.width !== size.height) return { status: 400, body: { error: `Ảnh heo phải vuông (đang ${size.width}×${size.height})` } };
  writeFileSync(join(BASE, `${artId}.png`), buf);
  registerArt(artId, nameVi.trim());
  return { status: 200, body: { ok: true, artId, asset: `pigs/base/${artId}.png`, size } };
}

/** Manifest row for a file already in pigs/base/ (fixes files copied in before AD-1). */
export function registerExisting({ artId, nameVi }: { artId: string; nameVi: string }): Result {
  if (!ART_ID.test(artId)) return { status: 400, body: { error: `Art id "${artId}" không hợp lệ` } };
  if (!existsSync(join(BASE, `${artId}.png`))) return { status: 404, body: { error: `Không có file ${artId}.png` } };
  if (!nameVi.trim()) return { status: 400, body: { error: 'Cần tên hiển thị của ảnh' } };
  if (!registerArt(artId, nameVi.trim())) return { status: 409, body: { error: `${artId} đã có trong manifest` } };
  return { status: 200, body: { ok: true, artId } };
}

/** Everything the dashboard needs about pig files, read fresh from disk on every call. */
export const filesPayload = () => ({
  files: [...assetFiles()],
  pigs: readPigs(),
  inventory: inventory(),
  library: library(),
});
