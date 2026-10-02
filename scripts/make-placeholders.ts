// Wave 0 (art standard §10): generates a placeholder file for every `placeholder` row of the
// manifest. Rows already promoted to production/final are never touched.
// Usage: npm run assets:placeholders
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { PIG_FEET_Y } from '../src/core/config/assetIds';
import { BREEDS } from '../src/core/config/breeds';
import {
  MANIFEST_SECTIONS,
  parseManifest,
  type AssetManifest,
  type ManifestSection,
} from '../src/core/assets/manifestSchema';
import { colourFor, Raster, shade, type Rgba } from './assets/raster';
import { placeholderSize } from './assets/sizes';

export const ASSETS_DIR = 'public/assets';
const CLEAR: Rgba = [0, 0, 0, 0];

/** Species artwork keeps the species colour (breeds.ts) so the farm reads at a glance. */
const PIG_COLOURS: Record<string, Rgba> = Object.fromEntries(
  Object.values(BREEDS).map((b): [string, Rgba] => [
    b.artId,
    [(b.color >> 16) & 255, (b.color >> 8) & 255, b.color & 255, 255],
  ]),
);

/** Side view facing right; the lowest opaque row is the 82 % feet line (art standard §4.1). */
function drawPig(r: Raster, colour: Rgba, sleeping: boolean) {
  const feet = Math.round(r.height * PIG_FEET_Y); // first transparent row
  const dark = shade(colour, 0.75);
  if (sleeping) {
    r.roundRect(70, feet - 110, 360, 110, 50, colour); // lying down, belly on the ground
    r.ellipse(420, feet - 60, 60, 50, colour);
    r.ellipse(470, feet - 55, 22, 18, dark);
    return;
  }
  const legTop = feet - 70;
  for (const x of [120, 175, 300, 355]) r.roundRect(x, legTop, 36, 70, 10, dark);
  r.roundRect(90, feet - 230, 330, 180, 70, colour);
  r.ellipse(420, feet - 190, 72, 66, colour); // head on the right
  r.ellipse(478, feet - 180, 26, 22, dark); // snout
  r.ellipse(400, feet - 250, 22, 28, dark); // ear
}

function drawFx(r: Raster, colour: Rgba, frames: number) {
  const w = r.width / frames;
  for (let i = 0; i < frames; i++) {
    const rad = (w / 2) * (0.35 + (0.4 * (i + 1)) / frames);
    r.ellipse(w * i + w / 2, r.height / 2, rad, rad, colour);
  }
}

function drawStructure(r: Raster, colour: Rgba) {
  const ground: Rgba = [120, 176, 90, 255];
  r.ellipse(r.width / 2, r.height * 0.88, r.width * 0.48, r.height * 0.1, ground); // grass base
  r.roundRect(r.width * 0.12, r.height * 0.15, r.width * 0.76, r.height * 0.72, 16, colour);
}

function drawEnvironment(r: Raster, id: string) {
  if (id === 'env_sky') return r.gradient([168, 214, 240, 255], [255, 244, 222, 255]);
  if (id === 'env_ground_grass') return r.rect(0, 0, r.width, r.height, [132, 190, 96, 255]);
  if (id.startsWith('env_cloud')) {
    r.ellipse(
      r.width * 0.35,
      r.height * 0.6,
      r.width * 0.25,
      r.height * 0.32,
      [255, 255, 255, 230],
    );
    r.ellipse(r.width * 0.6, r.height * 0.5, r.width * 0.3, r.height * 0.4, [255, 255, 255, 230]);
    return;
  }
  const colour: Rgba = id === 'env_hills_far' ? [150, 190, 140, 255] : [80, 140, 80, 255];
  const bumps = id === 'env_hills_far' ? 4 : 14;
  const bw = r.width / bumps;
  for (let i = 0; i <= bumps; i++)
    r.ellipse(i * bw, r.height * 0.7, bw * 0.75, r.height * 0.6, colour);
  r.rect(0, r.height * 0.7, r.width, r.height * 0.3, colour); // transparent top, solid bottom
}

function drawUi(r: Raster, colour: Rgba) {
  r.roundRect(8, 8, r.width - 16, r.height - 16, 28, colour);
  r.ellipse(r.width / 2, r.height / 2, r.width * 0.22, r.height * 0.22, shade(colour, 0.7));
}

/** Silent MPEG-1 Layer III, mono 44.1 kHz 128 kbps: zeroed side info decodes as silence. */
export function silentMp3(frames = 10): Buffer {
  const frame = Buffer.alloc(417);
  frame.set([0xff, 0xfb, 0x90, 0xc0]);
  return Buffer.concat(Array.from({ length: frames }, () => frame));
}

function render(
  section: ManifestSection,
  id: string,
  key: string,
  size: { width: number; height: number },
  frames: number,
): Buffer {
  const r = new Raster(size.width, size.height);
  r.rect(0, 0, r.width, r.height, CLEAR);
  const colour = PIG_COLOURS[id] ?? colourFor(id);
  if (section === 'pigs') drawPig(r, colour, key === 'sleep');
  else if (section === 'fx') drawFx(r, colour, frames);
  else if (section === 'environment') drawEnvironment(r, id);
  else if (section === 'ui') drawUi(r, colour);
  else if (key === 'shadow')
    r.ellipse(r.width / 2, r.height * 0.9, r.width * 0.45, r.height * 0.08, [0, 0, 0, 80]);
  else
    drawStructure(
      r,
      section === 'props' && key !== 'asset'
        ? shade(colour, { empty: 0.6, half: 0.8 }[key] ?? 1)
        : colour,
    );
  return r.toPng();
}

export function makePlaceholders(manifest: AssetManifest, root = ASSETS_DIR): string[] {
  const written: string[] = [];
  for (const section of MANIFEST_SECTIONS) {
    for (const row of manifest[section]) {
      if (row.status !== 'placeholder') continue;
      const r = row as Record<string, unknown>;
      const files: [string, string][] = [];
      if (typeof r.asset === 'string') files.push(['asset', r.asset]);
      if (typeof r.sleepAsset === 'string') files.push(['sleep', r.sleepAsset]);
      if (typeof r.wakeAsset === 'string') files.push(['wake', r.wakeAsset]);
      if (typeof r.shadow === 'string') files.push(['shadow', r.shadow]);
      if (typeof r.assetFlip === 'string') files.push(['flip', r.assetFlip]);
      if (r.states && typeof r.states === 'object')
        files.push(...(Object.entries(r.states) as [string, string][]));
      for (const [key, path] of files) {
        const out = join(root, path);
        mkdirSync(dirname(out), { recursive: true });
        if (path.endsWith('.mp3')) {
          writeFileSync(out, silentMp3());
        } else if (path.endsWith('.png')) {
          const frames =
            section === 'fx' ? ((row as AssetManifest['fx'][number]).frames?.count ?? 1) : 1;
          writeFileSync(
            out,
            render(section, row.id, key, placeholderSize(section, row, key, path), frames),
          );
        } else {
          continue; // .ogg/.json placeholders are not generated; assets:check reports them
        }
        written.push(path);
      }
    }
  }
  return written;
}

const isMain = process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/make-placeholders.ts');
if (isMain) {
  const parsed = parseManifest(
    JSON.parse(readFileSync(join(ASSETS_DIR, 'manifest/assets.json'), 'utf8')),
  );
  if (!parsed.ok) {
    console.error(parsed.message);
    process.exit(1);
  }
  console.log(`${makePlaceholders(parsed.manifest).length} placeholder files written`);
}
