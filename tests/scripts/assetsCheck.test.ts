import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { checkAssets } from '../../scripts/assets/check';
import { makePlaceholders, silentMp3 } from '../../scripts/make-placeholders';
import { parseManifest } from '../../src/core/assets/manifestSchema';

let root: string;
const manifestPath = () => join(root, 'manifest', 'assets.json');
type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const readManifest = (): Json => JSON.parse(readFileSync(manifestPath(), 'utf8'));
const writeManifest = (m: Json) => writeFileSync(manifestPath(), JSON.stringify(m));
const blankPng = (w: number, h: number) => PNG.sync.write(new PNG({ width: w, height: h }));

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'unin-assets-'));
  cpSync('public/assets', root, { recursive: true });
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('assets:check (art standard §7.4)', () => {
  it('the shipped assets pass', () => {
    expect(checkAssets('public/assets')).toEqual([]);
  });

  it('placeholders regenerate exactly the files the manifest lists', () => {
    const parsed = parseManifest(readManifest());
    if (!parsed.ok) throw new Error(parsed.message);
    rmSync(join(root, 'pigs'), { recursive: true });
    makePlaceholders(parsed.manifest, root);
    expect(checkAssets(root)).toEqual([]);
  });

  it('schema failure is reported with its path', () => {
    const m = readManifest();
    m.fx[0].id = 'FX Sick';
    writeManifest(m);
    expect(checkAssets(root).join('\n')).toMatch(/schema: fx\.0\.id/);
  });

  it('missing required ids: breed default, audio key, trough state, layout id', () => {
    const m = readManifest();
    m.pigs = m.pigs.filter((p: Json) => p.id !== 'pig_superhero');
    m.audio = m.audio.filter((a: Json) => a.id !== 'notify');
    delete m.props[0].states.half;
    m.layout.placements.push({ id: 'env_rainbow', layer: 0, x: 0.5, y: 0.1 });
    writeManifest(m);
    const errors = checkAssets(root).join('\n');
    expect(errors).toContain('pig_superhero: missing pigs row');
    expect(errors).toContain('notify: missing audio row');
    expect(errors).toContain('prop_feed_trough: missing state "half"');
    expect(errors).toContain('layout: placement "env_rainbow" has no manifest row');
  });

  it('duplicate id, missing file and orphan file', () => {
    const m = readManifest();
    m.ui.push({ ...m.ui[0] });
    writeManifest(m);
    rmSync(join(root, 'fx', 'fx_coin.png'));
    writeFileSync(join(root, 'ui', 'ui_icon_unused.png'), blankPng(128, 128));
    const errors = checkAssets(root).join('\n');
    expect(errors).toContain('ui_icon_hunger: duplicate id');
    expect(errors).toContain('fx_coin: missing file fx/fx_coin.png');
    expect(errors).toContain('orphan file: ui/ui_icon_unused.png');
  });

  it('wrong canvas size and pig feet line', () => {
    writeFileSync(join(root, 'ui', 'ui_icon_gold.png'), blankPng(100, 128));
    const tall = new PNG({ width: 512, height: 512 });
    for (let y = 0; y < 300; y++)
      for (let x = 100; x < 200; x++) tall.data[(y * 512 + x) * 4 + 3] = 255;
    writeFileSync(join(root, 'pigs', 'base', 'pig_classic.png'), PNG.sync.write(tall));
    const errors = checkAssets(root).join('\n');
    expect(errors).toContain('ui_icon_gold: ui/ui_icon_gold.png is 100x128, expected 128x128');
    expect(errors).toMatch(/pig_classic: .* feet line at 59%/);
  });

  it('fx sheet size follows frames; particles are 64 px', () => {
    writeFileSync(join(root, 'fx', 'fx_zzz.png'), blankPng(256, 256));
    writeFileSync(join(root, 'fx', 'fx_heart.png'), blankPng(256, 256));
    const errors = checkAssets(root).join('\n');
    expect(errors).toContain('fx_zzz: fx/fx_zzz.png is 256x256, expected 768x256');
    expect(errors).toContain('fx_heart: fx/fx_heart.png is 256x256, expected 64x64');
  });

  it('production rows: audio needs credit + license, pig corners transparent', () => {
    const m = readManifest();
    m.audio[0].status = 'production';
    m.pigs[0].status = 'production';
    writeManifest(m);
    const solid = new PNG({ width: 512, height: 512 });
    solid.data.fill(255, 0, 512 * 420 * 4); // opaque down to the feet line, corners painted
    writeFileSync(join(root, 'pigs', 'base', 'pig_classic.png'), PNG.sync.write(solid));
    writeFileSync(join(root, 'audio', 'music_farm.mp3'), silentMp3());
    const errors = checkAssets(root).join('\n');
    expect(errors).toContain('music_farm: production audio needs credit and license');
    expect(errors).toContain('pig_classic: pigs/base/pig_classic.png corners are not transparent');
  });

  it('file names must be lowercase snake_case', () => {
    const m = readManifest();
    m.ui[0].asset = 'ui/UI-Icon.png';
    writeManifest(m);
    expect(checkAssets(root).join('\n')).toMatch(/schema: ui\.0\.asset/);
  });
});
