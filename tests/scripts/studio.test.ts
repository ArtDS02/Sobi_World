// Sobi Studio tooling (decision 051, plan §12.3): recipes validate, the compiler packs what the Unity renderer expects,
// manifest edits keep the hand formatting. Unity itself is not needed here.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  clipTimes,
  compileRecipe,
  expandMirror,
  expandRepeat,
  PAINT_FLOATS,
  particlesAt,
  PRIM_FLOATS,
  sampleClip,
  uvRect,
} from '../../scripts/studio/compile.ts';
import { insertAfterText, manifestCheck, setFramesText } from '../../scripts/studio/manifest.ts';
import { compose, inverseRows, point, xfFrom, type V3 } from '../../scripts/studio/math.ts';
import { deepMerge, loadAll, loadStyle, RECIPES } from '../../scripts/studio/recipes.ts';
import { jsonSchemas, RecipeSchema, type Part } from '../../scripts/studio/schema.ts';

describe('studio recipes', () => {
  it('every recipe resolves, validates, compiles and only writes files the manifest owns', () => {
    const style = loadStyle();
    const all = loadAll();
    expect(all.length).toBeGreaterThan(0);
    for (const { recipe } of all) {
      const jobs = compileRecipe(style, recipe);
      expect(jobs).toHaveLength(recipe.outputs.length);
      for (const job of jobs)
        for (const f of job.frames) {
          expect(f.prims.length % PRIM_FLOATS).toBe(0);
          expect(f.primInfo.length).toBe((f.prims.length / PRIM_FLOATS) * 4);
          expect(f.paints.length % PAINT_FLOATS).toBe(0);
          expect(f.paintInfo.length).toBe((f.paints.length / PAINT_FLOATS) * 4);
          expect(f.prims.every(Number.isFinite)).toBe(true);
        }
      expect(() => manifestCheck(recipe)).not.toThrow();
    }
  });

  it('the JSON Schema copies match the zod schemas (run npm run studio -- schema)', () => {
    for (const [name, schema] of Object.entries(jsonSchemas())) {
      const disk = JSON.parse(readFileSync(join(RECIPES, 'schema', name), 'utf8'));
      expect(disk).toEqual(JSON.parse(JSON.stringify(schema)));
    }
  });

  it('extends merges objects key by key and replaces arrays', () => {
    expect(deepMerge({ a: { x: 1, y: [1, 2] }, b: 1 }, { a: { y: [3] }, c: 2 })).toEqual({
      a: { x: 1, y: [3] },
      b: 1,
      c: 2,
    });
  });

  it('a bad field names the recipe and the field', () => {
    const res = RecipeSchema.safeParse({
      id: 'x',
      kind: 'pig_farm',
      parts: { body: { shape: 'blob' } },
    });
    expect(res.success).toBe(false);
    expect(res.error!.issues[0]!.path.join('.')).toBe('parts.body.shape');
  });
});

describe('studio compiler', () => {
  it('mirror makes the _r twin across z and renames a mirrored parent', () => {
    const parts: Record<string, Part> = {
      ear_root_l: { at: [1, 2, 3], rot: [10, 20, 30], mirror: true },
      ear_l: { shape: 'sphere', size: [1], parent: 'ear_root_l', mirror: true },
    };
    const out = Object.fromEntries(expandMirror(parts));
    expect(out.ear_root_r!.at).toEqual([1, 2, -3]);
    expect(out.ear_root_r!.rot).toEqual([-10, -20, 30]);
    expect(out.ear_r!.parent).toBe('ear_root_r');
  });

  it('repeat lays copies on a staggered grid and turns them step by step', () => {
    const out = expandRepeat<Part>({
      tile: {
        shape: 'box',
        size: [1, 1, 1, 0],
        at: [0, 0, 0],
        repeat: {
          n: 3,
          step: [1, 0, 0],
          turn: [0, 0, 0],
          n2: 2,
          step2: [0, 0, 1],
          stagger: [0.5, 0, 0],
        },
      },
      petal: {
        shape: 'sphere',
        size: [1],
        repeat: {
          n: 4,
          step: [0, 0, 0],
          turn: [0, 0, 90],
          n2: 1,
          step2: [0, 0, 0],
          stagger: [0, 0, 0],
        },
      },
    });
    expect(Object.keys(out).filter((k) => k.startsWith('tile#'))).toHaveLength(6);
    expect(out['tile#2_1']!.at).toEqual([2.5, 0, 1]);
    expect(out['petal#3']!.rot).toEqual([0, 0, 270]);
  });

  it('clips sample their keys: loops stop short of the end, one-shots land on it', () => {
    expect(clipTimes({ frames: 4, keys: [{ t: 0, pose: {} }], loop: true, ms: 340 })).toEqual([
      0, 0.25, 0.5, 0.75,
    ]);
    expect(clipTimes({ frames: 3, keys: [{ t: 0, pose: {} }], loop: false, ms: 340 })).toEqual([
      0, 0.5, 1,
    ]);
    const style = loadStyle();
    const recipe = loadAll().find((l) => l.recipe.clips.swim)!.recipe;
    const clip = recipe.clips.swim!;
    const mid = sampleClip(recipe, 'swim', clip, 0.25);
    const a = sampleClip(recipe, 'swim', clip, 0)['tail_root']!.rot![1];
    const b = sampleClip(recipe, 'swim', clip, 0.5)['tail_root']?.rot?.[1] ?? 0;
    const m = mid['tail_root']!.rot![1];
    expect(m).toBeGreaterThan(Math.min(a, b));
    expect(m).toBeLessThan(Math.max(a, b));
    void style;
  });

  it('a stroke packs as shape 7 with its taper in ext.w', () => {
    const style = loadStyle();
    const recipe = RecipeSchema.parse({
      id: 'probe',
      kind: 'fx_battle',
      parts: { blade: { shape: 'stroke', size: [0.5, 0.3, 1, 0.1], taper: -0.7, color: 'white' } },
      outputs: [{ asset: 'fx_slash_arc', file: 'fx/battle/fx_slash_arc.png' }],
    });
    const frame = compileRecipe(style, recipe)[0]!.frames[0]!;
    expect(frame.primInfo[0]).toBe(7);
    expect(frame.prims[27]).toBe(-0.7);
  });

  it('motion recipes read their approved source art and pack image layers (shape 8) with uv inside the sheet', () => {
    const style = loadStyle();
    for (const id of ['fx_flame_burst', 'fx_splash', 'fx_slash_arc']) {
      const recipe = loadAll().find((l) => l.recipe.id === id)!.recipe;
      expect(recipe.source?.ref).toBe('pre-unity-studio');
      const job = compileRecipe(style, recipe)[0]!;
      expect(job.frames).toHaveLength(8);
      for (const f of job.frames) {
        const n = f.primInfo.length / 4;
        for (let i = 0; i < n; i++) {
          expect(f.primInfo[i * 4]).toBe(8);
          const uv = f.prims.slice(i * PRIM_FLOATS + 12, i * PRIM_FLOATS + 16);
          for (const v of uv) expect(v >= 0 && v <= 1).toBe(true);
        }
      }
    }
  });

  it('uv rects: frame index walks the sheet, v = 0 is the bottom row, outside pieces are refused', () => {
    const size = { width: 1024, height: 256 };
    const uv = uvRect({ frame: 2 }, size, [256, 256], 'probe');
    expect(uv[0]).toBeCloseTo(512.5 / 1024);
    expect(uv[1]).toBeCloseTo(1 - 0.5 / 256);
    expect(uv[3]).toBeCloseTo(0.5 / 256);
    expect(() => uvRect({ rect: [1000, 0, 40, 10] }, size, [256, 256], 'probe')).toThrow(/outside/);
  });

  it('particles are the same every build and follow their life window', () => {
    const e = {
      src: { frame: 0 },
      count: 5,
      seed: 7,
      at: [0, 0.5] as [number, number],
      box: [0.2, 0.2] as [number, number],
      vel: [0, 1] as [number, number],
      jitter: [0.5, 0.5] as [number, number],
      gravity: 2,
      size: [0.1, 0.1] as [number, number],
      life: [0.2, 0.5, 1] as [number, number, number],
      spin: 0,
      shrink: 0.4,
    };
    expect(particlesAt(e, 0.1, 340)).toHaveLength(0);
    expect(particlesAt(e, 0.8, 340)).toEqual(particlesAt(e, 0.8, 340));
    expect(particlesAt(e, 0.8, 340).length).toBeGreaterThan(0);
    for (const p of particlesAt(e, 0.99, 340)) expect(p.opacity).toBeLessThan(0.2);
  });

  it('world -> local rows undo the part transform (rotation, scale, hierarchy)', () => {
    const parent = xfFrom([1, 2, 3], [10, 40, -20], 1.5);
    const child = compose(parent, xfFrom([0.3, -0.2, 0.5], [70, 0, 15], 0.8));
    const local: V3 = [0.2, -0.4, 0.9];
    const world = point(child, local);
    const r = inverseRows(child);
    const back = [0, 1, 2].map(
      (i) =>
        r[i * 4]! * world[0] + r[i * 4 + 1]! * world[1] + r[i * 4 + 2]! * world[2] + r[i * 4 + 3]!,
    );
    back.forEach((v, i) => expect(v).toBeCloseTo(local[i]!, 9));
  });
});

describe('studio manifest edits', () => {
  const text = `{
  "fx": [
    {
      "id": "fx_a",
      "status": "production",
      "asset": "fx/a.png",
      "frames": { "width": 256, "height": 256, "count": 4, "fps": 12 }
    },
    {
      "id": "fx_b",
      "status": "production",
      "asset": "fx/b.png"
    }
  ]
}
`;
  it('frames are replaced or added inline, nothing else moves', () => {
    const a = setFramesText(text, 'fx_a', 'fx/a.png', {
      width: 128,
      height: 128,
      count: 6,
      fps: 10,
    });
    expect(a).toContain('"frames": { "width": 128, "height": 128, "count": 6, "fps": 10 }');
    expect(a.split('\n')).toHaveLength(text.split('\n').length);
    const b = setFramesText(text, 'fx_b', 'fx/b.png', { width: 64, height: 64, count: 2, fps: 8 });
    expect(JSON.parse(b).fx[1].frames).toEqual({ width: 64, height: 64, count: 2, fps: 8 });
    expect(() =>
      setFramesText(text, 'fx_b', 'fx/a.png', { width: 1, height: 1, count: 1, fps: 1 }),
    ).toThrow(/does not own/);
  });

  it('rows are inserted after an entry in the same layout', () => {
    const out = insertAfterText(text, 'fx_a', [
      { id: 'fx_a2', status: 'production', asset: 'fx/a2.png' },
    ]);
    const parsed = JSON.parse(out);
    expect(parsed.fx.map((e: { id: string }) => e.id)).toEqual(['fx_a', 'fx_a2', 'fx_b']);
    expect(out).toContain('    {\n      "id": "fx_a2",');
  });
});

describe('fx motion recipes (scripts/studio/fxMotion.ts)', () => {
  it('odd frames hold drawing k plainly, even frames bring it in over the previous one', async () => {
    const { MOTIONS, motionRecipe } = await import('../../scripts/studio/fxMotion.ts');
    for (const [id, m] of Object.entries(MOTIONS)) {
      const r = motionRecipe(id, m) as {
        poses: Record<string, Record<string, Record<string, unknown>>>;
      };
      for (let k = 0; k < 4; k++) {
        const hold = r.poses[`f${2 * k + 1}`]!;
        expect(Object.keys(hold)).toEqual([`d${k}`]);
        expect(hold[`d${k}`]!.scale ?? 1).toBe(1);
        expect(hold[`d${k}`]!.stretch).toBeUndefined();
        const enter = r.poses[`f${2 * k}`]!;
        expect(Object.keys(enter)).toEqual(k === 0 ? ['d0'] : [`d${k - 1}`, `d${k}`]);
      }
    }
  });
});
