// Writes motion recipes for 4-frame battle effect sheets (decision 051, motion on the approved drawings).
//   npx tsx scripts/studio/fxMotion.ts [id…]      (no id: every row of MOTIONS)
// Each sheet of 4 drawings D0..D3 becomes 8 frames: frame 2k brings Dk in (Dk moving into place while D(k-1) dissolves
// under it), frame 2k+1 is Dk plain. That is what the battle expects (stripTiming.ts): old frame k = new frames 2k..2k+1,
// a still of old frame k = new frame 2k+1. The recipes are plain text afterwards: tune one by editing its file.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RECIPES } from './recipes.ts';

type Move = { scale?: number; stretch?: [number, number]; rot?: number; shift?: [number, number] };
interface Motion {
  /** where the drawing grows from: the ground, its centre, or the sky */
  anchor: 'bottom' | 'center' | 'top';
  /** how D0 first appears (frame 0) */
  first: Move;
  /** how each next drawing comes in (frames 2, 4, 6) */
  enter: Move;
  sway?: { amp: number; waves: number; speed: number };
  /** degrees added every frame (portals, rune circles) */
  spin?: number;
  notes: string;
}

export const MOTIONS: Record<string, Motion> = {
  fx_pow_star: {
    anchor: 'center',
    first: { scale: 0.5 },
    enter: { scale: 0.85 },
    spin: 4,
    notes: 'Impact star pops out, bursts, sparkles.',
  },
  fx_boom: {
    anchor: 'center',
    first: { scale: 0.45 },
    enter: { scale: 0.85 },
    notes: 'Explosion swells from a spark into smoke and puffs.',
  },
  fx_claw: {
    anchor: 'center',
    first: { scale: 0.8, shift: [0.12, 0.12] },
    enter: { shift: [0.05, 0.05] },
    notes: 'Claw marks rake down from the top right.',
  },
  fx_poof: {
    anchor: 'center',
    first: { scale: 0.5 },
    enter: { scale: 0.88 },
    notes: 'Dust cloud puffs out and thins.',
  },
  fx_ink_splat: {
    anchor: 'center',
    first: { scale: 0.5 },
    enter: { scale: 0.8 },
    notes: 'Ink drop splats open, then specks remain.',
  },
  fx_ice_encase: {
    anchor: 'bottom',
    first: { stretch: [0.9, 0.6] },
    enter: { stretch: [1, 0.85] },
    notes: 'Crystals grow up from the ground into a block.',
  },
  fx_ice_shatter: {
    anchor: 'center',
    first: { scale: 0.95 },
    enter: { scale: 1.06 },
    notes: 'The block cracks and its shards spread outwards.',
  },
  fx_bloom: {
    anchor: 'bottom',
    first: { stretch: [0.8, 0.5] },
    enter: { stretch: [0.95, 0.85] },
    sway: { amp: 0.02, waves: 1, speed: 1.5 },
    notes: 'A bud rises and opens into a flower, swaying.',
  },
  fx_vine_grab: {
    anchor: 'bottom',
    first: { stretch: [0.8, 0.4] },
    enter: { stretch: [0.95, 0.8] },
    sway: { amp: 0.03, waves: 1.2, speed: 1.5 },
    notes: 'Vines shoot up and wind into a ring, swaying.',
  },
  fx_rock_spike: {
    anchor: 'bottom',
    first: { stretch: [1, 0.5] },
    enter: { stretch: [1, 0.7] },
    notes: 'Rocks burst up from the ground and crumble.',
  },
  fx_lava_pop: {
    anchor: 'center',
    first: { scale: 0.6 },
    enter: { scale: 0.85 },
    sway: { amp: 0.015, waves: 1, speed: 2 },
    notes: 'A lava blob pops and splatters.',
  },
  fx_bolt_strike: {
    anchor: 'top',
    first: { stretch: [1, 0.4] },
    enter: { stretch: [1, 0.75] },
    notes: 'The bolt drops from the sky, forks, sparks.',
  },
  fx_light_pillar: {
    anchor: 'bottom',
    first: { stretch: [0.4, 1] },
    enter: { stretch: [0.75, 1] },
    notes: 'The beam opens wide, glitters, narrows.',
  },
  fx_void_portal: {
    anchor: 'center',
    first: { scale: 0.5, rot: -40 },
    enter: { scale: 0.88, rot: -20 },
    spin: -6,
    notes: 'The portal spirals open and collapses into motes.',
  },
  fx_wind_swirl: {
    anchor: 'center',
    first: { scale: 0.9, shift: [-0.15, 0] },
    enter: { shift: [-0.06, 0] },
    sway: { amp: 0.02, waves: 1, speed: 2 },
    notes: 'Wind curls in from the left and streams on.',
  },
  fx_rune_lock: {
    anchor: 'center',
    first: { scale: 1.0, rot: 14 },
    enter: { scale: 1.02, rot: 8 },
    notes: 'Runes circle inwards and close into a seal.',
  },
  fx_bite: {
    anchor: 'center',
    first: { stretch: [1, 1.25] },
    enter: { stretch: [1, 1.12] },
    notes: 'Jaws snap shut, flash, break apart.',
  },
  fx_shield_dome: {
    anchor: 'bottom',
    first: { stretch: [0.6, 0.4] },
    enter: { stretch: [0.95, 0.9] },
    notes: 'Hexagons rise into a dome that settles and fades.',
  },
  fx_ground_crack: {
    anchor: 'bottom',
    first: { stretch: [0.5, 1] },
    enter: { stretch: [0.8, 1] },
    notes: 'The crack runs outwards and breaks open.',
  },
};

const PLACE = {
  bottom: { at: [0, 0, 0], offset: [0, 0.5, 0] },
  center: { at: [0, 0.5, 0], offset: [0, 0, 0] },
  top: { at: [0, 1, 0], offset: [0, -0.5, 0] },
} as const;

function delta(m: Move, spinRot: number) {
  const d: Record<string, unknown> = { show: true };
  if (m.scale !== undefined) d.scale = m.scale;
  if (m.stretch) d.stretch = m.stretch;
  const rot = (m.rot ?? 0) + spinRot;
  if (rot) d.rot = [0, 0, rot];
  if (m.shift) d.at = [m.shift[0], m.shift[1], 0];
  return d;
}

export function motionRecipe(id: string, m: Motion): Record<string, unknown> {
  const parts: Record<string, unknown> = {};
  for (let k = 0; k < 4; k++)
    parts[`d${k}`] = {
      shape: 'image',
      size: [1, 1],
      src: { frame: k },
      ...PLACE[m.anchor],
      hide: true,
      dissolve: { amount: 0, soft: 0.035, freq: 8 },
      ...(m.sway ? { sway: m.sway } : {}),
    };
  const poses: Record<string, Record<string, unknown>> = {};
  for (let f = 0; f < 8; f++) {
    const k = Math.floor(f / 2);
    const spin = (m.spin ?? 0) * f;
    const pose: Record<string, unknown> = {};
    if (f % 2 === 0) {
      if (k > 0)
        pose[`d${k - 1}`] = { show: true, dissolve: 0.55, ...(spin ? { rot: [0, 0, spin] } : {}) };
      pose[`d${k}`] = delta(k === 0 ? m.first : m.enter, spin);
    } else pose[`d${k}`] = { show: true, ...(spin ? { rot: [0, 0, spin] } : {}) };
    poses[`f${f}`] = pose;
  }
  return {
    $schema: '../schema/recipe.schema.json',
    extends: '_templates/fx_anim',
    id,
    notes: `${m.notes} Generated by scripts/studio/fxMotion.ts (frame 2k brings drawing k in, frame 2k+1 holds it); edit freely.`,
    source: { file: `fx/battle/${id}.png`, ref: 'pre-unity-studio', frame: [256, 256] },
    parts,
    poses,
    clips: {
      burst: {
        frames: 8,
        ms: 340,
        keys: Array.from({ length: 8 }, (_, i) => ({ t: i / 7, pose: `f${i}`, ease: 'linear' })),
      },
    },
    outputs: [{ asset: id, file: `fx/battle/${id}.png`, clip: 'burst', fps: 24 }],
  };
}

const isMain = process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/studio/fxMotion.ts');
if (isMain) {
  const ids = process.argv.slice(2);
  for (const [id, m] of Object.entries(MOTIONS)) {
    if (ids.length && !ids.includes(id)) continue;
    writeFileSync(
      join(RECIPES, 'fx', `${id}.json`),
      `${JSON.stringify(motionRecipe(id, m), null, 2)}\n`,
    );
    console.log(`[fxMotion] ${id}`);
  }
}
