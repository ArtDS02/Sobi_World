#!/usr/bin/env node
// Technical + measurable style QA for one generated image (workflows/validation.md, gate T + S).
// Usage: node .claude/skills/image-to-asset/scripts/qa.mjs <png> [--kind pig|sleep|fx|icon|prop]
//          [--size WxH] [--compare pig_a,pig_b] [--no-sheet]
// Prints one line per check (PASS / WARN / FAIL) and writes a review sheet to art_inbox/.qa/<stem>.png:
// row 1 = candidate beside the style anchor + compare pigs at 256 px, row 2 = the same at 128 px
// (gameplay size). The agent MUST look at that sheet for the visual gate; numbers alone never accept.
// Exit 1 if any FAIL.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pngjs from 'pngjs';

const { PNG } = pngjs;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const ANCHOR = 'public/assets/pigs/base/pig_classic.png';
const MANIFEST = 'public/assets/manifest/assets.json';
// Tolerances (calibrated on the reference cut-outs, see references/quality-gate.md §S).
const FEET_Y = 420; // 82 % of 512 (art standard §4.1)
const FEET_TOL = 10; // ±2 % (art standard §7.4)
const OPAQUE = 16;
const SOLID = 128;
const ISLAND_MIN = 30; // px; smaller specks are anti-alias noise
const RIM_LUMA_TOL = 45; // outline brightness vs anchor
const TEXTURE_RATIO = [0.55, 1.9]; // painted micro-texture vs anchor
const HEIGHT_RATIO = [0.8, 1.45]; // body+costume height vs anchor (tall hats allowed)
const SIL_IOU_MIN = 0.55; // silhouette overlap with the anchor (pigs only)
const EYE_RATIO_MAX = 0.72; // far/near eye width: reference 0.43–0.59, frontal code-drawn pigs ~0.90

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--') && !/^(pig|sleep|fx|icon|prop)$/.test(a) && !/^\d+x\d+$/.test(a) && !a.includes(','));
const opt = (k) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : undefined;
};
if (!file) {
  console.error('usage: qa.mjs <png> [--kind pig|sleep|fx|icon|prop] [--size WxH] [--compare a,b] [--no-sheet]');
  process.exit(2);
}
const stem = basename(file).replace(/\.png$/i, '');
const kind =
  opt('kind') ??
  (/^pig_.*_sleep$/.test(stem) ? 'sleep' : stem.startsWith('pig_') ? 'pig' : stem.startsWith('fx_') ? 'fx' : stem.startsWith('ui_') ? 'icon' : 'prop');
const isPig = kind === 'pig' || kind === 'sleep';

const load = (p) => {
  const png = PNG.sync.read(readFileSync(p.startsWith('/') || /^[A-Z]:/i.test(p) ? p : join(ROOT, p)));
  return { w: png.width, h: png.height, d: png.data, colorType: png.colorType };
};
const A = (im, x, y) => im.d[(y * im.w + x) * 4 + 3];
const luma = (im, i) => 0.3 * im.d[i] + 0.59 * im.d[i + 1] + 0.11 * im.d[i + 2];

function bbox(im) {
  let x0 = im.w, y0 = im.h, x1 = -1, y1 = -1;
  for (let y = 0; y < im.h; y++)
    for (let x = 0; x < im.w; x++)
      if (A(im, x, y) > OPAQUE) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, bottom: y1 };
}

/** Sizes of 4-connected solid blobs, largest first. */
function islands(im) {
  const n = im.w * im.h, lab = new Int32Array(n).fill(-1), sizes = [];
  for (let s = 0; s < n; s++) {
    if (lab[s] !== -1 || im.d[s * 4 + 3] <= SOLID) continue;
    const st = [s];
    lab[s] = sizes.length;
    let c = 0;
    while (st.length) {
      const i = st.pop();
      c++;
      const x = i % im.w, y = (i / im.w) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < im.w - 1 ? i + 1 : -1, y > 0 ? i - im.w : -1, y < im.h - 1 ? i + im.w : -1])
        if (j >= 0 && lab[j] === -1 && im.d[j * 4 + 3] > SOLID) (lab[j] = sizes.length, st.push(j));
    }
    sizes.push(c);
  }
  return sizes.sort((a, b) => b - a);
}

/** Outline (rim) colour, halo share, soft-fringe share, interior micro-texture, mean saturation. */
function stats(im) {
  let rim = 0, rimL = 0, halo = 0, soft = 0, solid = 0, tex = 0, texN = 0, sat = 0;
  for (let y = 1; y < im.h - 1; y++)
    for (let x = 1; x < im.w - 1; x++) {
      const i = (y * im.w + x) * 4, a = im.d[i + 3];
      if (a > OPAQUE && a < 240) soft++;
      if (a <= SOLID) continue;
      solid++;
      const mx = Math.max(im.d[i], im.d[i + 1], im.d[i + 2]), mn = Math.min(im.d[i], im.d[i + 1], im.d[i + 2]);
      sat += mx ? (mx - mn) / mx : 0;
      const nb = [i - 4, i + 4, i - im.w * 4, i + im.w * 4];
      if (nb.some((j) => im.d[j + 3] <= OPAQUE)) {
        rim++;
        const l = luma(im, i);
        rimL += l;
        if (l > 225) halo++;
      } else if (nb.every((j) => im.d[j + 3] > 240)) {
        const d = Math.abs(luma(im, i) - luma(im, i + 4));
        if (d < 24) (tex += d, texN++); // skip real edges (outline, shading steps)
      }
    }
  return { rimLuma: rimL / Math.max(1, rim), halo: halo / Math.max(1, rim), soft: soft / Math.max(1, solid), texture: tex / Math.max(1, texN), sat: sat / Math.max(1, solid) };
}

/**
 * Eyes = compact interior blobs of near-black pixels in the upper 65 % of the bbox, largest two.
 * The reference head is turned 3/4 to the viewer, so the far eye is ~half as wide as the near eye;
 * a frontal face (far ≈ near) is the main "AI chibi / sticker" drift (GAME_ART_DIRECTION §2).
 */
function eyes(im, b) {
  const { w } = im, lab = new Int32Array(im.w * im.h).fill(-1), out = [];
  const dark = (i) => im.d[i * 4 + 3] >= 250 && luma(im, i * 4) < 60;
  for (let s = 0; s < im.w * im.h; s++) {
    if (lab[s] !== -1 || !dark(s)) continue;
    const st = [s];
    lab[s] = 1;
    let n = 0, x0 = w, x1 = 0, y0 = im.h, y1 = 0, edge = false;
    while (st.length) {
      const i = st.pop(), x = i % w, y = (i / w) | 0;
      n++;
      (x0 = Math.min(x0, x), x1 = Math.max(x1, x), y0 = Math.min(y0, y), y1 = Math.max(y1, y));
      for (const j of [i - 1, i + 1, i - w, i + w]) {
        if (im.d[j * 4 + 3] < 250) edge = true;
        else if (lab[j] === -1 && dark(j)) (lab[j] = 1, st.push(j));
      }
    }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    if (!edge && n > 60 && bh / bw > 0.8 && bh / bw < 2.4 && y1 < b.y + b.h * 0.65) out.push({ n, w: bw, h: bh, cx: (x0 + x1) / 2 });
  }
  return out.sort((a, c) => c.n - a.n).slice(0, 2);
}

/** 32x32 mask normalised to the bbox, for silhouette comparison. */
function sil(im, b, mirror = false) {
  const m = new Uint8Array(1024);
  for (let v = 0; v < 32; v++)
    for (let u = 0; u < 32; u++) {
      const x = b.x + Math.floor(((mirror ? 31 - u : u) + 0.5) * b.w / 32), y = b.y + Math.floor((v + 0.5) * b.h / 32);
      m[v * 32 + u] = A(im, x, y) > SOLID ? 1 : 0;
    }
  return m;
}
const iou = (a, b) => {
  let i = 0, u = 0;
  for (let k = 0; k < a.length; k++) (i += a[k] & b[k], u += a[k] | b[k]);
  return u ? i / u : 0;
};

// ---------- checks ----------
const out = [];
const res = (lvl, id, msg) => out.push([lvl, id, msg]);
const im = load(file);
const want = opt('size') ? opt('size').split('x').map(Number) : isPig ? [512, 512] : kind === 'icon' ? [128, 128] : kind === 'fx' ? null : null;
if (want) res(im.w === want[0] && im.h === want[1] ? 'PASS' : 'FAIL', 'T1 canvas', `${im.w}x${im.h} (want ${want.join('x')})`);
else if (kind === 'fx') res([256, 64].includes(im.w) && im.w === im.h ? 'PASS' : 'FAIL', 'T1 canvas', `${im.w}x${im.h} (want 256² or 64², or frames)`);
else res('WARN', 'T1 canvas', `${im.w}x${im.h} — check ENVIRONMENT_CATALOGUE size (pass --size)`);
res([4, 6].includes(im.colorType) ? 'PASS' : 'FAIL', 'T2 alpha', `colorType ${im.colorType} (PNG-32 = 6)`);
const corners = [[0, 0], [im.w - 1, 0], [0, im.h - 1], [im.w - 1, im.h - 1]].every(([x, y]) => A(im, x, y) <= OPAQUE);
if (kind !== 'prop') res(corners ? 'PASS' : 'FAIL', 'T3 transparent corners', corners ? 'ok' : 'background left in a corner');
const b = bbox(im);
if (!b) {
  res('FAIL', 'T0 empty', 'no opaque pixel');
} else {
  const touches = b.x === 0 || b.y === 0 || b.x + b.w === im.w || b.bottom === im.h - 1;
  res(touches && kind !== 'prop' ? 'FAIL' : 'PASS', 'T4 not cropped', `bbox x${b.x} y${b.y} ${b.w}x${b.h}${touches ? ' touches the canvas edge' : ''}`);
  if (isPig) res(Math.abs(b.bottom - FEET_Y) <= FEET_TOL ? 'PASS' : 'FAIL', 'T5 feet line', `lowest pixel y=${b.bottom} (want ${FEET_Y}±${FEET_TOL})`);
  const isl = islands(im).filter((s) => s >= ISLAND_MIN);
  res(isl.length <= 1 || kind === 'fx' ? 'PASS' : 'WARN', 'T6 single body', isl.length <= 1 ? 'one connected subject' : `${isl.length - 1} detached part(s): ${isl.slice(1, 6).join(', ')} px — floating accessory / sparkle / artifact?`);
  const s = stats(im);
  res(s.halo <= 0.25 ? 'PASS' : 'FAIL', 'T7 halo', `${Math.round(s.halo * 100)}% of rim pixels very light`);
  res(s.soft <= 0.12 ? 'PASS' : 'WARN', 'T8 soft fringe', `${Math.round(s.soft * 100)}% semi-transparent (glow / blur / leftover bg?)`);
  if (isPig && existsSync(join(ROOT, ANCHOR)) && !file.replace(/\\/g, '/').endsWith(ANCHOR)) {
    const an = load(ANCHOR), ab = bbox(an), as = stats(an);
    const hr = b.h / ab.h;
    const sizeOk = kind === 'sleep' ? hr >= 0.5 && hr <= 1.1 : hr >= HEIGHT_RATIO[0] && hr <= HEIGHT_RATIO[1];
    res(sizeOk ? 'PASS' : 'FAIL', 'S1 scale', `height ${b.h}px = ${hr.toFixed(2)}x anchor (${kind === 'sleep' ? '0.50–1.10' : HEIGHT_RATIO.join('–')}); width ${(b.w / ab.w).toFixed(2)}x`);
    const dl = s.rimLuma - as.rimLuma;
    // S2/S3 are WARN only: dark coats (pig_black) and busy costumes move them legitimately.
    res(Math.abs(dl) <= RIM_LUMA_TOL ? 'PASS' : 'WARN', 'S2 outline tone', `rim luma ${s.rimLuma.toFixed(0)} vs anchor ${as.rimLuma.toFixed(0)} (Δ${dl.toFixed(0)}, tol ±${RIM_LUMA_TOL}; dark coat → expected)`);
    const tr = s.texture / Math.max(0.01, as.texture);
    res(tr >= TEXTURE_RATIO[0] && tr <= TEXTURE_RATIO[1] ? 'PASS' : 'WARN', 'S3 rendering texture', `${tr.toFixed(2)}x anchor (${TEXTURE_RATIO.join('–')}; low = flat vector, high = noisy/painterly)`);
    if (kind === 'pig') {
      const e = eyes(im, b);
      if (e.length < 2) res('WARN', 'S7 head turn 3/4', `${e.length} eye(s) detected (glasses/mask/dark coat?) — judge on the sheet`);
      else {
        const [near, far] = e[0].w >= e[1].w ? e : [e[1], e[0]];
        const r = far.w / near.w;
        res(r <= EYE_RATIO_MAX ? 'PASS' : 'FAIL', 'S7 head turn 3/4', `far/near eye width ${r.toFixed(2)} (≤${EYE_RATIO_MAX}; ≈1 = frontal sticker face, off-style)${r <= EYE_RATIO_MAX && near.cx > far.cx ? ' — near eye right of far eye: facing LEFT?' : ''}`);
      }
      const m = sil(im, b), d = iou(m, sil(an, ab)), r = iou(m, sil(an, ab, true));
      res(r > d + 0.04 ? 'FAIL' : 'PASS', 'S4 facing', `silhouette IoU right=${d.toFixed(2)} mirrored=${r.toFixed(2)}${r > d + 0.04 ? ' → looks like it faces LEFT' : ''}`);
      res(d >= SIL_IOU_MIN ? 'PASS' : 'WARN', 'S5 silhouette', `IoU with anchor ${d.toFixed(2)} (≥${SIL_IOU_MIN}; low = costume ate the pig or proportions off)`);
    }
    res('INFO', 'S6 saturation', `mean ${s.sat.toFixed(2)} vs anchor ${as.sat.toFixed(2)} (colour identity may differ; judge on the sheet)`);
  }
}

// ---------- review sheet ----------
if (!args.includes('--no-sheet') && isPig) {
  const manifest = JSON.parse(readFileSync(join(ROOT, MANIFEST), 'utf8'));
  const path = (id) => {
    const r = manifest.pigs.find((p) => p.id === id);
    return r ? `public/assets/${r.asset}` : null;
  };
  const cmp = (opt('compare') ?? '').split(',').filter(Boolean).map(path).filter((p) => p && existsSync(join(ROOT, p)));
  const items = [im, ...[ANCHOR, ...cmp].filter((p) => existsSync(join(ROOT, p))).map(load)];
  const big = 256, small = 128, W = items.length * big, H = big + small;
  const o = new PNG({ width: W, height: H });
  for (let i = 0; i < W * H; i++) o.data.set([196, 224, 160, 255], i * 4);
  const blit = (src, ox, oy, size) => {
    const k = src.w / size;
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        let r = 0, g = 0, bl = 0, a = 0, n = 0;
        for (let v = Math.floor(y * k); v < Math.floor((y + 1) * k); v++)
          for (let u = Math.floor(x * k); u < Math.floor((x + 1) * k); u++) {
            const i = (v * src.w + u) * 4, al = src.d[i + 3] / 255;
            (r += src.d[i] * al, g += src.d[i + 1] * al, bl += src.d[i + 2] * al, a += al, n++);
          }
        if (!a) continue;
        const d = ((oy + y) * W + ox + x) * 4, al = a / n;
        o.data[d] = Math.round(r / a * al + o.data[d] * (1 - al));
        o.data[d + 1] = Math.round(g / a * al + o.data[d + 1] * (1 - al));
        o.data[d + 2] = Math.round(bl / a * al + o.data[d + 2] * (1 - al));
      }
    // feet line marker for pigs
    const fy = oy + Math.round(FEET_Y / src.h * size);
    for (let x = ox; x < ox + size; x += 4) o.data.set([200, 60, 60, 255], (fy * W + x) * 4);
  };
  items.forEach((it, k) => {
    blit(it, k * big, 0, big);
    blit(it, k * big + (big - small) / 2, big, small);
  });
  const dir = join(ROOT, 'art_inbox', '.qa');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${stem}.png`), PNG.sync.write(o));
  res('INFO', 'V sheet', `art_inbox/.qa/${stem}.png (candidate | pig_classic${cmp.length ? ' | ' + cmp.map((p) => basename(p, '.png')).join(' | ') : ''}; row 2 = 128 px)`);
}

for (const [l, id, m] of out) console.log(`${l.padEnd(4)} ${id.padEnd(24)} ${m}`);
const fails = out.filter(([l]) => l === 'FAIL').length;
console.log(fails ? `\nGATE T/S: FAIL (${fails})` : '\nGATE T/S: PASS — now do the visual gate on the sheet');
process.exit(fails ? 1 : 0);
