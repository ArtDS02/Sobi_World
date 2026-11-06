// npm run rig:parts [rig…] — cuts a puppet's parts (decision 050) out of its layered canvas and wires them into the game.
// Source: asset/rigs/<rig>/<rig>.svg (one <g id="part-NAME"> per part, 512×512 canvas, ground at y=470, centre x=256), and/or painted
// layers asset/rigs/<rig>/layers/<NAME>.png (the same canvas at 1024×1024, one part per full-canvas transparent layer) which win over
// the SVG part of the same name. Each part is rendered at ×2, trimmed to its pixels, written to public/assets/props/rig/<rig>/, given a
// manifest row (`rig_<rig>_<name>`, status `placeholder` while it comes from the SVG proof, `production` from a painted layer) and its box
// in the canvas written into content/anim/rigs/<rig>.json → parts (bones, clips and the rest of that file are left as they are).
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import { patchRowText } from '../assets/manifestText';
import { rigText } from './rigText';

const RES = 2;
const ORIGIN = { x: 256, y: 470 };
const PAD = 3;
const root = process.cwd();
const manifestPath = join(root, 'public/assets/manifest/assets.json');

interface Cut {
  png: Buffer;
  box: [number, number, number, number];
}

/** Trims a full-canvas RGBA image to its visible pixels (+ a little padding). */
function trim(img: PNG): Cut | null {
  let x0 = img.width, y0 = img.height, x1 = -1, y1 = -1;
  for (let y = 0; y < img.height; y++)
    for (let x = 0; x < img.width; x++)
      if (img.data[(y * img.width + x) * 4 + 3]! > 6) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return null;
  x0 = Math.max(0, x0 - PAD);
  y0 = Math.max(0, y0 - PAD);
  x1 = Math.min(img.width - 1, x1 + PAD);
  y1 = Math.min(img.height - 1, y1 + PAD);
  const out = new PNG({ width: x1 - x0 + 1, height: y1 - y0 + 1 });
  PNG.bitblt(img, out, x0, y0, out.width, out.height, 0, 0);
  const r = (v: number) => Math.round(v * 100) / 100;
  return { png: PNG.sync.write(out), box: [r(x0 / RES - ORIGIN.x), r(y0 / RES - ORIGIN.y), r(out.width / RES), r(out.height / RES)] };
}

/** The SVG's parts, each as a document of its own (the defs and the shared stroke group around it). */
function svgParts(svg: string): Map<string, string> {
  const out = new Map<string, string>();
  const first = svg.search(/<g id="part-/);
  if (first < 0) return out;
  const prefix = svg.slice(0, first);
  for (const m of svg.matchAll(/<g id="part-([a-z0-9_]+)">/g)) {
    // The part's group ends at its matching </g> (a part may hold groups of its own, e.g. a turned chain picture).
    const tags = /<g[\s>]|<\/g>/g;
    tags.lastIndex = m.index;
    let depth = 0;
    let end = -1;
    for (let t = tags.exec(svg); t; t = tags.exec(svg)) {
      depth += t[0] === '</g>' ? -1 : 1;
      if (depth === 0) {
        end = t.index + 4;
        break;
      }
    }
    if (end < 0) throw new Error(`part ${m[1]} is not closed`);
    out.set(m[1]!, `${prefix}${svg.slice(m.index, end)}\n</g>\n</svg>`);
  }
  return out;
}

/** Appends a row at the end of the manifest's `props` array, formatted like the rows around it (no reflow of the file). */
function addPropRow(text: string, row: Record<string, string>): string {
  const start = text.indexOf('"props": [');
  if (start < 0) throw new Error('manifest: no props section');
  let depth = 0;
  for (let i = start + '"props": '.length; i < text.length; i++) {
    if (text[i] === '[') depth++;
    else if (text[i] === ']' && --depth === 0) {
      const nl = String.fromCharCode(10);
      const body = Object.entries(row).map(([k, v]) => `      ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(`,${nl}`);
      const before = text.slice(0, i).replace(/\s+$/, '');
      return `${before},${nl}    {${nl}${body}${nl}    }${nl}  ${text.slice(i)}`;
    }
  }
  throw new Error('manifest: props section not closed');
}

/** Removes the row with `id` (and the comma before it) from the manifest text. */
function removeRow(text: string, id: string): string {
  const at = text.indexOf(`"id": ${JSON.stringify(id)}`);
  if (at < 0) return text;
  const start = text.lastIndexOf('{', at);
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) {
      const comma = text.lastIndexOf(',', start);
      return text.slice(0, comma) + text.slice(i + 1);
    }
  }
  throw new Error(`manifest: row ${id} not closed`);
}

/** The pictures a rig draws: bone parts, slot pictures, chain parts, its skin. Null for a rig file that has no bones yet. */
function referenced(data: Record<string, unknown>): Set<string> | null {
  const bones = data.bones as { part?: string; slot?: { pictures: Record<string, string> } }[] | undefined;
  if (!bones) return null;
  const out = new Set<string>();
  for (const b of bones) {
    if (b.part) out.add(b.part);
    for (const p of Object.values(b.slot?.pictures ?? {})) out.add(p);
  }
  for (const c of (data.chains as { part?: string }[] | undefined) ?? []) if (c.part) out.add(c.part);
  const skin = data.skin as { part: string } | undefined;
  if (skin) out.add(skin.part);
  return out;
}

function buildRig(rig: string) {
  const dir = join(root, 'asset/rigs', rig);
  const svgFile = join(dir, `${rig}.svg`);
  const parts = new Map<string, { img: PNG; painted: boolean }>();
  if (existsSync(svgFile)) {
    for (const [name, doc] of svgParts(readFileSync(svgFile, 'utf8'))) {
      const rendered = new Resvg(doc, { fitTo: { mode: 'zoom', value: RES } }).render();
      parts.set(name, { img: PNG.sync.read(rendered.asPng()), painted: false });
    }
  }
  const layers = join(dir, 'layers');
  if (existsSync(layers)) {
    for (const f of readdirSync(layers).filter((n) => n.endsWith('.png'))) {
      const img = PNG.sync.read(readFileSync(join(layers, f)));
      if (img.width !== 512 * RES || img.height !== 512 * RES) throw new Error(`${rig}/layers/${f}: must be ${512 * RES}×${512 * RES} (is ${img.width}×${img.height})`);
      parts.set(f.replace(/\.png$/, ''), { img, painted: true });
    }
  }
  if (parts.size === 0) throw new Error(`${rig}: no parts in ${svgFile} or ${layers}`);
  const outDir = join(root, 'public/assets/props/rig', rig);
  mkdirSync(outDir, { recursive: true });
  const rigPath = join(root, 'content/anim/rigs', `${rig}.json`);
  const data = existsSync(rigPath) ? (JSON.parse(readFileSync(rigPath, 'utf8')) as Record<string, unknown>) : { id: rig };
  const boxes: Record<string, { img: string; box: [number, number, number, number] }> = {};
  let manifest = readFileSync(manifestPath, 'utf8');
  // Only what the rig draws: a skinned rig leaves its old cut parts out (their pictures and manifest rows go).
  const used = referenced(data);
  if (used) {
    for (const name of [...parts.keys()]) if (!used.has(name)) parts.delete(name);
    for (const name of Object.keys((data.parts as Record<string, unknown> | undefined) ?? {})) {
      if (used.has(name)) continue;
      const id = `rig_${rig}_${name}`;
      manifest = removeRow(manifest, id);
      rmSync(join(outDir, `${id}.png`), { force: true });
    }
  }
  for (const [name, { img, painted }] of parts) {
    const cut = trim(img);
    if (!cut) throw new Error(`${rig}: part ${name} is empty`);
    const id = `rig_${rig}_${name}`;
    writeFileSync(join(outDir, `${id}.png`), cut.png);
    boxes[name] = { img: id, box: cut.box };
    const fields = { status: painted ? 'production' : 'placeholder', asset: `props/rig/${rig}/${id}.png` };
    manifest = manifest.includes(`"id": ${JSON.stringify(id)}`) ? patchRowText(manifest, id, fields) : addPropRow(manifest, { id, ...fields });
  }
  data.parts = boxes;
  mkdirSync(join(root, 'content/anim/rigs'), { recursive: true });
  writeFileSync(rigPath, rigText(data));
  writeFileSync(manifestPath, manifest);
  console.log(`${rig}: ${parts.size} parts → ${outDir}`);
}

const wanted = process.argv.slice(2);
const all = readdirSync(join(root, 'asset/rigs'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
for (const rig of wanted.length > 0 ? wanted : all) buildRig(rig);
