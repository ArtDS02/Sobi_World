// Sleep + wake frames for every species art (DECISIONS PS-1): `<id>_sleep.png` (lids closed) and
// `<id>_wake.png` (heavy half lids) derived from the accepted idle, so each keeps its own identity.
// Writes next to the idle in public/assets/pigs/base/ and sets `sleepAsset` / `wakeAsset` on the
// manifest row. QA sheets (idle | wake | sleep face crops) go to art_inbox/.qa/sleep_<n>.png.
// Re-run after any idle changes (art:cut / art:process): npm run art:sleep [-- --qa-only] [-- id…]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { SPECIES_ROWS } from '../src/areas/farm/logic/config/speciesTable';
import {
  closeEye,
  detectEyes,
  droopEye,
  eyeGeometry,
  type EyeGeometry,
  type EyeSpec,
} from './assets/eyelids';
import { EYE_OVERRIDES } from './assets/eyes';
import { patchRowText } from './assets/manifestText';

const ASSETS = 'public/assets';
const MANIFEST = join(ASSETS, 'manifest', 'assets.json');
const QA_DIR = 'art_inbox/.qa';
const CROP = { w: 200, h: 140 };
const PER_SHEET = 18;

const inside = (x: number, y: number, b: readonly number[]) =>
  x >= b[0]! && x <= b[2]! && y >= b[1]! && y <= b[3]!;

function eyesFor(id: string, idle: PNG): EyeSpec[] {
  const o = EYE_OVERRIDES[id];
  if (o?.eyes) return [...o.eyes];
  const found = detectEyes(idle).filter(
    (e) => !o?.drop?.some((b) => inside(e.box[0], e.box[1], b)),
  );
  return [...found, ...(o?.extra ?? [])];
}

function frames(id: string, idle: PNG) {
  const copy = () => PNG.sync.read(PNG.sync.write(idle));
  if (EYE_OVERRIDES[id]?.closedInIdle)
    return { sleep: copy(), wake: copy(), center: [340, 230] as const, count: 0 };
  const eyes = eyesFor(id, idle)
    .map((e) => eyeGeometry(idle, e))
    .filter((g): g is EyeGeometry => g !== null);
  if (eyes.length === 0)
    throw new Error(`${id}: no eyes found — add a box to scripts/assets/eyes.ts`);
  const sleep = copy(),
    wake = copy();
  for (const g of eyes) closeEye(sleep, idle.data, g);
  if (!EYE_OVERRIDES[id]?.wakeIsIdle) for (const g of eyes) droopEye(wake, idle.data, g);
  const cx = eyes.reduce((s, g) => s + (g.x0 + g.x1) / 2, 0) / eyes.length;
  const cy = eyes.reduce((s, g) => s + (g.y0 + g.y1) / 2, 0) / eyes.length;
  return { sleep, wake, center: [cx, cy] as const, count: eyes.length };
}

function blit(dst: PNG, src: PNG, cx: number, cy: number, ox: number, oy: number) {
  const sx0 = Math.round(cx - CROP.w / 2),
    sy0 = Math.round(cy - CROP.h / 2);
  for (let y = 0; y < CROP.h; y++)
    for (let x = 0; x < CROP.w; x++) {
      const sx = sx0 + x,
        sy = sy0 + y,
        q = ((oy + y) * dst.width + ox + x) * 4;
      const ok = sx >= 0 && sy >= 0 && sx < src.width && sy < src.height;
      const k = (sy * src.width + sx) * 4;
      const a = ok ? src.data[k + 3]! / 255 : 0;
      for (let c = 0; c < 3; c++) dst.data[q + c] = (ok ? src.data[k + c]! * a : 0) + 225 * (1 - a);
      dst.data[q + 3] = 255;
    }
}

function main() {
  const args = process.argv.slice(2);
  const qaOnly = args.includes('--qa-only');
  const only = args.filter((a) => !a.startsWith('--'));
  const artIds = [...new Set(SPECIES_ROWS.map((r) => r.artId))].filter(
    (id) => only.length === 0 || only.includes(id),
  );
  let text = readFileSync(MANIFEST, 'utf8');
  const rows = (JSON.parse(text) as { pigs: { id: string; asset: string }[] }).pigs;
  mkdirSync(QA_DIR, { recursive: true });
  const cols = 3;
  let sheet: PNG | null = null;
  artIds.forEach((id, n) => {
    const row = rows.find((r) => r.id === id);
    if (!row) throw new Error(`${id}: no manifest row`);
    const idle = PNG.sync.read(readFileSync(join(ASSETS, row.asset)));
    const f = frames(id, idle);
    if (!qaOnly) {
      const base = row.asset.replace(/\.png$/, '');
      writeFileSync(join(ASSETS, `${base}_sleep.png`), PNG.sync.write(f.sleep));
      writeFileSync(join(ASSETS, `${base}_wake.png`), PNG.sync.write(f.wake));
      text = patchRowText(text, id, {
        sleepAsset: `${base}_sleep.png`,
        wakeAsset: `${base}_wake.png`,
      });
    }
    const slot = n % PER_SHEET;
    if (slot === 0)
      sheet = new PNG({ width: cols * CROP.w * 3, height: Math.ceil(PER_SHEET / cols) * CROP.h });
    const ox = (slot % cols) * CROP.w * 3,
      oy = Math.floor(slot / cols) * CROP.h;
    [idle, f.wake, f.sleep].forEach((img, i) =>
      blit(sheet!, img, f.center[0], f.center[1], ox + i * CROP.w, oy),
    );
    console.log(`${id.padEnd(18)} eyes ${f.count}`);
    if (slot === PER_SHEET - 1 || n === artIds.length - 1)
      writeFileSync(join(QA_DIR, `sleep_${Math.floor(n / PER_SHEET)}.png`), PNG.sync.write(sheet!));
  });
  if (!qaOnly) writeFileSync(MANIFEST, text);
}

main();
