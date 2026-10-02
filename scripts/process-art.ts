// ART post-processing (AI pack §8, art standard §4 / §7.4): raw files in art_inbox/ → public/assets/.
// Images: art_inbox/<stem>.png where <stem> is the target file name of a manifest row
//   (pig_classic, pig_classic_sleep, prop_feed_trough_half, ui_icon_hunger, …).
// Audio:  art_inbox/audio/<id>.ogg|.mp3 plus art_inbox/audio/credits.txt, one line per file:
//   `<id> | <author / source> | <license>` (lines starting with # are ignored).
// A row becomes `production` once every image/audio file it references arrives in the same batch.
// Usage: npm run art:process [-- --dry-run]
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { PNG } from 'pngjs';
import { PIG_FEET_Y } from '../src/core/config/assetIds';
import {
  MANIFEST_SECTIONS,
  parseManifest,
  type AssetManifest,
  type ManifestSection,
} from '../src/core/assets/manifestSchema';
import { rowFiles } from './assets/check';
import { patchRowText } from './assets/manifestText';
import { placeholderSize, type Size } from './assets/sizes';

const INBOX = 'art_inbox';
const AUDIO_INBOX = join(INBOX, 'audio');
const ASSETS_DIR = 'public/assets';
const MANIFEST = join(ASSETS_DIR, 'manifest', 'assets.json');
const OPAQUE = 16;
const PIG_HEIGHT = 0.86; // character height / canvas (AI pack §8.1 step 3)
const FIT = 0.92; // max share of the canvas for centred items (ui, fx)
const BOTTOM_MARGIN = 4; // px under buildings/props (AI pack §8.2)
const BG_TOLERANCE = 48; // RGB distance still counted as background
const HALO_LUMA = 225; // light edge pixel → halo suspect (AI pack §8.3)
const HALO_SHARE = 0.25;

type Row = AssetManifest[ManifestSection][number];
interface Target {
  section: ManifestSection;
  row: Row;
  key: string;
  path: string;
}
interface Img {
  w: number;
  h: number;
  d: Buffer; // RGBA, straight alpha
}

const dryRun = process.argv.includes('--dry-run');
const stemOf = (p: string) =>
  p
    .split('/')
    .pop()!
    .replace(/\.\w+$/, '');

// ---------- raster helpers ----------

const alphaAt = (im: Img, x: number, y: number) => im.d[(y * im.w + x) * 4 + 3]!;

function bbox(im: Img): { x: number; y: number; w: number; h: number } | null {
  let x0 = im.w,
    y0 = im.h,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < im.h; y++) {
    for (let x = 0; x < im.w; x++) {
      if (alphaAt(im, x, y) > OPAQUE) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

function crop(im: Img, x: number, y: number, w: number, h: number): Img {
  const d = Buffer.alloc(w * h * 4);
  for (let row = 0; row < h; row++) {
    im.d.copy(d, row * w * 4, ((y + row) * im.w + x) * 4, ((y + row) * im.w + x + w) * 4);
  }
  return { w, h, d };
}

/** Area-average resample with premultiplied alpha (bilinear-like when upscaling). */
function resize(im: Img, w: number, h: number): Img {
  const d = Buffer.alloc(w * h * 4);
  const sx = im.w / w,
    sy = im.h / h;
  for (let y = 0; y < h; y++) {
    const fy0 = y * sy,
      fy1 = Math.max(fy0 + 1e-6, (y + 1) * sy);
    for (let x = 0; x < w; x++) {
      const fx0 = x * sx,
        fx1 = Math.max(fx0 + 1e-6, (x + 1) * sx);
      let r = 0,
        g = 0,
        b = 0,
        a = 0,
        area = 0;
      for (let py = Math.floor(fy0); py < Math.min(im.h, Math.ceil(fy1)); py++) {
        const wy = Math.min(fy1, py + 1) - Math.max(fy0, py);
        for (let px = Math.floor(fx0); px < Math.min(im.w, Math.ceil(fx1)); px++) {
          const wgt = wy * (Math.min(fx1, px + 1) - Math.max(fx0, px));
          const i = (py * im.w + px) * 4;
          const al = im.d[i + 3]! * wgt;
          r += im.d[i]! * al;
          g += im.d[i + 1]! * al;
          b += im.d[i + 2]! * al;
          a += al;
          area += wgt;
        }
      }
      const o = (y * w + x) * 4;
      if (a > 0) {
        d[o] = Math.round(r / a);
        d[o + 1] = Math.round(g / a);
        d[o + 2] = Math.round(b / a);
        d[o + 3] = Math.round(a / area);
      }
    }
  }
  return { w, h, d };
}

/** Pastes `im` onto a transparent canvas at (x, y). */
function place(canvas: Size, im: Img, x: number, y: number): Img {
  const out: Img = {
    w: canvas.width,
    h: canvas.height,
    d: Buffer.alloc(canvas.width * canvas.height * 4),
  };
  for (let row = 0; row < im.h; row++) {
    const ty = y + row;
    if (ty < 0 || ty >= out.h) continue;
    for (let col = 0; col < im.w; col++) {
      const tx = x + col;
      if (tx < 0 || tx >= out.w) continue;
      im.d.copy(out.d, (ty * out.w + tx) * 4, (row * im.w + col) * 4, (row * im.w + col + 1) * 4);
    }
  }
  return out;
}

const cornerIdx = (im: Img) => [0, im.w - 1, (im.h - 1) * im.w, im.h * im.w - 1];
const dist = (d: Buffer, i: number, c: number[]) =>
  Math.hypot(d[i * 4]! - c[0]!, d[i * 4 + 1]! - c[1]!, d[i * 4 + 2]! - c[2]!);

/**
 * Makes the background transparent. Already-transparent corners pass untouched; otherwise the four
 * corners must share one flat colour, which is flood-filled from the border (soft edge on the rim).
 * Returns an error string when the background cannot be separated.
 */
function removeBackground(im: Img): { note?: string; error?: string } {
  const corners = cornerIdx(im);
  // Already cut out (a tileable strip may touch the bottom corners, e.g. a fence on grass).
  if (corners.filter((i) => im.d[i * 4 + 3]! <= OPAQUE).length >= 2) return {};
  const bg = [0, 1, 2].map((k) => corners.reduce((s, i) => s + im.d[i * 4 + k]!, 0) / 4);
  if (corners.some((i) => dist(im.d, i, bg) > BG_TOLERANCE)) {
    return { error: 'nền không trong suốt và 4 góc không cùng một màu — không tách tự động được' };
  }
  const seen = new Uint8Array(im.w * im.h);
  const stack: number[] = [];
  for (let x = 0; x < im.w; x++) stack.push(x, (im.h - 1) * im.w + x);
  for (let y = 0; y < im.h; y++) stack.push(y * im.w, y * im.w + im.w - 1);
  while (stack.length > 0) {
    const i = stack.pop()!;
    if (seen[i] || dist(im.d, i, bg) > BG_TOLERANCE) continue;
    seen[i] = 1;
    im.d[i * 4 + 3] = 0;
    const x = i % im.w;
    if (x > 0) stack.push(i - 1);
    if (x < im.w - 1) stack.push(i + 1);
    if (i >= im.w) stack.push(i - im.w);
    if (i < (im.h - 1) * im.w) stack.push(i + im.w);
  }
  // Soften the rim: kept pixels touching the removed area fade by their closeness to the background.
  for (let i = 0; i < im.w * im.h; i++) {
    if (seen[i]) continue;
    const x = i % im.w;
    const touches =
      (x > 0 && seen[i - 1]) ||
      (x < im.w - 1 && seen[i + 1]) ||
      (i >= im.w && seen[i - im.w]) ||
      (i < (im.h - 1) * im.w && seen[i + im.w]);
    if (!touches) continue;
    const t = Math.min(1, (dist(im.d, i, bg) - BG_TOLERANCE) / BG_TOLERANCE);
    im.d[i * 4 + 3] = Math.round(im.d[i * 4 + 3]! * Math.max(0.25, t));
  }
  return { note: `đã tách nền màu rgb(${bg.map(Math.round).join(',')})` };
}

/** Share of rim pixels (opaque, next to transparency) that are very light — a halo suspect. */
function haloShare(im: Img): number {
  let rim = 0,
    light = 0;
  for (let y = 1; y < im.h - 1; y++) {
    for (let x = 1; x < im.w - 1; x++) {
      const i = y * im.w + x;
      if (im.d[i * 4 + 3]! <= OPAQUE) continue;
      const edge = [i - 1, i + 1, i - im.w, i + im.w].some((n) => im.d[n * 4 + 3]! <= OPAQUE);
      if (!edge) continue;
      rim++;
      const luma = 0.299 * im.d[i * 4]! + 0.587 * im.d[i * 4 + 1]! + 0.114 * im.d[i * 4 + 2]!;
      if (luma > HALO_LUMA) light++;
    }
  }
  return rim === 0 ? 0 : light / rim;
}

// ---------- per-category layout ----------

const isFullBleed = (t: Target) =>
  t.section === 'environment' ||
  (t.section === 'fx' && Boolean((t.row as AssetManifest['fx'][number]).frames));

/** Trims, scales and positions the image on the canvas its category requires. */
function layout(t: Target, src: Img, size: Size): { img: Img; upscaled: boolean } {
  if (src.w === size.width && src.h === size.height) {
    // Already authored on the final canvas (scripts/generate-art.ts): keep the scale so every pig
    // shares one body size; pigs are only moved onto the ground line.
    if (t.section !== 'pigs') return { img: src, upscaled: false };
    const b = bbox(src)!;
    const dy = Math.round(size.height * PIG_FEET_Y) - (b.y + b.h);
    return { img: dy === 0 ? src : place(size, src, 0, dy), upscaled: false };
  }
  if (isFullBleed(t)) {
    // Environment layers and sprite sheets: cover-fit the whole frame, no trim.
    const s = Math.max(size.width / src.w, size.height / src.h);
    const w = Math.round(src.w * s),
      h = Math.round(src.h * s);
    const scaled = resize(src, w, h);
    return {
      img: crop(scaled, (w - size.width) >> 1, (h - size.height) >> 1, size.width, size.height),
      upscaled: s > 1,
    };
  }
  const box = bbox(src)!;
  const trimmed = crop(src, box.x, box.y, box.w, box.h);
  let maxW: number, maxH: number;
  if (t.section === 'pigs') {
    maxW = size.width * 0.96;
    maxH = Math.min(size.height * PIG_HEIGHT, size.height * PIG_FEET_Y);
  } else if (t.section === 'buildings' || t.section === 'props') {
    maxW = size.width * 0.96;
    maxH = size.height - BOTTOM_MARGIN * 2;
  } else {
    maxW = size.width * FIT;
    maxH = size.height * FIT;
  }
  const s = Math.min(maxW / trimmed.w, maxH / trimmed.h);
  const w = Math.max(1, Math.round(trimmed.w * s)),
    h = Math.max(1, Math.round(trimmed.h * s));
  const scaled = resize(trimmed, w, h);
  const x = (size.width - w) >> 1;
  let y: number;
  if (t.section === 'pigs') {
    // Lowest opaque row lands on the 82 % ground line (row index feet - 1).
    const feet = Math.round(size.height * PIG_FEET_Y);
    const sb = bbox(scaled)!;
    y = feet - (sb.y + sb.h);
  } else if (t.section === 'buildings' || t.section === 'props') {
    y = size.height - BOTTOM_MARGIN - h;
  } else {
    y = (size.height - h) >> 1;
  }
  return { img: place(size, scaled, x, y), upscaled: s > 1 };
}

// ---------- audio credits ----------

function readCredits(): Map<string, { credit: string; license: string }> {
  const out = new Map<string, { credit: string; license: string }>();
  const file = join(AUDIO_INBOX, 'credits.txt');
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const [id, credit, license] = line.split('|').map((s) => s.trim());
    if (id && credit && license) out.set(id, { credit, license });
  }
  return out;
}

// ---------- main ----------

async function main() {
  const rawText = readFileSync(MANIFEST, 'utf8');
  const parsed = parseManifest(JSON.parse(rawText));
  if (!parsed.ok) throw new Error(`manifest invalid:\n${parsed.message}`);
  const manifest = parsed.manifest;

  const byStem = new Map<string, Target>();
  for (const section of MANIFEST_SECTIONS) {
    for (const row of manifest[section]) {
      for (const [key, path] of rowFiles(row)) {
        if (!path.endsWith('.json')) byStem.set(stemOf(path), { section, row, key, path });
      }
    }
  }

  const accepted: string[] = [];
  const rejected: string[] = [];
  const notes: string[] = [];
  const delivered = new Set<string>(); // asset paths replaced in this batch
  const credits = readCredits();
  const patches = new Map<string, Record<string, string>>();
  const patch = (id: string, fields: Record<string, string>) =>
    patches.set(id, { ...patches.get(id), ...fields });

  const images = existsSync(INBOX)
    ? readdirSync(INBOX).filter((f) => !f.startsWith('.') && f !== 'audio')
    : [];
  for (const file of images) {
    const stem = stemOf(file).toLowerCase();
    const t = byStem.get(stem);
    if (!t || t.section === 'audio') {
      rejected.push(
        `${file}: không khớp file ảnh nào trong manifest (tên phải là <id> hoặc <id>_sleep / trạng thái)`,
      );
      continue;
    }
    if (!/\.png$/i.test(file)) {
      rejected.push(`${file}: chỉ nhận PNG`);
      continue;
    }
    let png: PNG;
    try {
      png = PNG.sync.read(readFileSync(join(INBOX, file)));
    } catch (e) {
      rejected.push(`${file}: PNG lỗi (${(e as Error).message})`);
      continue;
    }
    const src: Img = { w: png.width, h: png.height, d: Buffer.from(png.data) };
    if (!isFullBleed(t) || t.section === 'fx') {
      const bg = removeBackground(src);
      if (bg.error) {
        rejected.push(`${file}: ${bg.error}`);
        continue;
      }
      if (bg.note) notes.push(`${file}: ${bg.note}`);
    }
    if (!bbox(src)) {
      rejected.push(`${file}: ảnh rỗng sau khi tách nền`);
      continue;
    }
    const size = placeholderSize(t.section, t.row, t.key, t.path);
    const { img, upscaled } = layout(t, src, size);
    if (upscaled) notes.push(`${file}: ảnh nguồn nhỏ hơn đích, đã phóng to — có thể mờ`);
    if (!isFullBleed(t)) {
      const halo = haloShare(img);
      if (halo > HALO_SHARE)
        notes.push(
          `${file}: nghi halo sáng ở viền (${Math.round(halo * 100)}% điểm viền rất sáng)`,
        );
    }
    const out = new PNG({ width: img.w, height: img.h });
    img.d.copy(out.data);
    if (!dryRun) {
      // A new collection folder (e.g. pigs/base/) may not exist yet.
      mkdirSync(dirname(join(ASSETS_DIR, t.path)), { recursive: true });
      writeFileSync(join(ASSETS_DIR, t.path), PNG.sync.write(out));
    }
    delivered.add(t.path);
    accepted.push(`${file} → ${t.path}`);
  }

  const audioFiles = existsSync(AUDIO_INBOX)
    ? readdirSync(AUDIO_INBOX).filter((f) => !f.startsWith('.') && f !== 'credits.txt')
    : [];
  for (const file of audioFiles) {
    const id = stemOf(file).toLowerCase();
    const row = manifest.audio.find((r) => r.id === id);
    const ext = file.split('.').pop()!.toLowerCase();
    if (!row) {
      rejected.push(`audio/${file}: không phải key âm thanh §12`);
      continue;
    }
    if (ext !== 'ogg' && ext !== 'mp3') {
      rejected.push(`audio/${file}: chỉ nhận .ogg/.mp3 (máy không có ffmpeg để chuyển định dạng)`);
      continue;
    }
    const credit = credits.get(id);
    if (!credit) {
      rejected.push(
        `audio/${file}: thiếu dòng "${id} | tác giả | license" trong audio/credits.txt`,
      );
      continue;
    }
    const target = `audio/${id}.${ext}`;
    if (!dryRun) {
      if (target !== row.asset) rmSync(join(ASSETS_DIR, row.asset), { force: true });
      writeFileSync(join(ASSETS_DIR, target), readFileSync(join(AUDIO_INBOX, file)));
    }
    row.asset = target;
    row.credit = credit.credit;
    row.license = credit.license;
    patch(row.id, { asset: target, credit: credit.credit, license: credit.license });
    delivered.add(target);
    accepted.push(`audio/${file} → ${target}`);
  }
  if (audioFiles.length > 0)
    notes.push(
      'audio: không chuẩn hoá âm lượng (không có ffmpeg) — cân bằng bằng "volume" trong manifest',
    );

  // Promote rows whose every image/audio file arrived in this batch.
  const promoted: string[] = [];
  const partial: string[] = [];
  for (const section of MANIFEST_SECTIONS) {
    for (const row of manifest[section]) {
      const files = rowFiles(row)
        .map(([, p]) => p)
        .filter((p) => !p.endsWith('.json'));
      const got = files.filter((p) => delivered.has(p));
      if (got.length === 0) continue;
      if (got.length === files.length) {
        if (row.status === 'placeholder') {
          row.status = 'production';
          patch(row.id, { status: 'production' });
        }
        promoted.push(row.id);
        if (section === 'pigs' && rowFiles(row).some(([k]) => k === 'anchors'))
          notes.push(`${row.id}: anchors.json vẫn là số của placeholder — đo lại khi xem gallery`);
      } else {
        partial.push(`${row.id} (thiếu ${files.filter((p) => !delivered.has(p)).join(', ')})`);
      }
    }
  }
  if (!dryRun && delivered.size > 0) {
    let text = rawText;
    for (const [id, fields] of patches) text = patchRowText(text, id, fields);
    writeFileSync(MANIFEST, text);
  }

  const list = (title: string, items: string[]) =>
    console.log(`${title} (${items.length})${items.map((s) => `\n  ${s}`).join('')}`);
  list('Đã nhận', accepted);
  list('Bị loại', rejected);
  list('Lên production', promoted);
  list('Chưa đủ file, giữ placeholder', partial);
  list('Ghi chú', notes);
  if (dryRun) console.log('\n--dry-run: không ghi file nào');
}

await main();
