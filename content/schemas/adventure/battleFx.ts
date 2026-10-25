// content/adventure/battle_fx.json — how a battle looks and moves (decision 042): the pacing of a step, how long each way of delivering an
// action takes, how each body idles, which way each creature's picture looks, the named bursts of particles, the look of each element
// (colours, the shot, what lands, the stroke, flash and shake), the reactions (a hit, a heal, a knock-out…) and the skills that look
// different from their element. Presentation only: nothing here changes a battle. The Admin edits it in "Nội dung game" and plays it in
// "Xưởng animation trận".
import { z } from 'zod';
import { assetId, color, nonNeg, posInt, range, unit } from '../fields';
import { ELEMENT_VALUES } from './combat';

export const PARTICLE_SHAPES = ['glow', 'spark', 'star', 'leaf', 'petal', 'drop', 'rock', 'bubble', 'shard', 'ring', 'smoke', 'plus', 'arrow', 'rune'] as const;
export const DELIVERY_VALUES = ['melee', 'slam', 'projectile', 'burst', 'aura'] as const;
export const STRIKE_VALUES = ['none', 'slash', 'bolt', 'beam', 'swirl', 'vines'] as const;
export const BODY_VALUES = ['quadruped', 'aquatic', 'flyer', 'floater', 'sprout', 'heavy'] as const;
export const FACING_VALUES = ['right', 'left', 'front'] as const;
export const REACTION_FX_VALUES = ['hit', 'heavy', 'heal', 'buff', 'debuff', 'miss', 'ko', 'tears', 'guard', 'stun', 'teleport', 'aura', 'charge', 'slam'] as const;
/** Key poses a creature may have (`cb_<art>_<pose>` in the manifest); `idle` is the picture itself when it has none. */
export const POSE_ART_VALUES = ['idle', 'attack', 'cast', 'hurt', 'ko', 'victory'] as const;

/**
 * Something drawn: the id of a burst of `particles`, or a manifest image (`fx_…`, played as a strip when its row has frames). An image
 * whose file is still missing draws nothing.
 */
const fxRef = z.string().regex(/^[a-z][a-z0-9_]*$/);

const burst = z.strictObject({
  shape: z.enum(PARTICLE_SHAPES),
  colors: z.array(color).min(1),
  /** Opacity at birth (fades out by its end). */
  alpha: unit.optional(),
  count: posInt.max(120),
  /** Spread of the spawn point (px), and on y as a share of it (the ground seen from the side). */
  spread: nonNeg.optional(),
  flat: unit.optional(),
  /** Speed (px/s), direction (degrees: 0 right, -90 up) and the half width of the cone around it (180 = every way). */
  speed: range,
  angle: z.number().finite().optional(),
  cone: z.number().finite().min(0).max(180).optional(),
  /** Life (ms) and size at birth (px); size at death as a share of it. */
  life: range,
  size: range,
  shrink: nonNeg.optional(),
  /** Gravity (px/s², negative rises) and spin (turns per second, either way). */
  gravity: z.number().finite().optional(),
  spin: nonNeg.optional(),
  /** Drawn as light added on top (default) or painted over. */
  add: z.boolean().optional(),
  /** Where it starts on the unit it is played on. */
  at: z.enum(['chest', 'feet', 'head']).optional(),
  /** Delay before it shows (ms). */
  wait: nonNeg.optional(),
});

const projectile = z.strictObject({
  /** A particle shape, or a manifest image id. */
  core: fxRef,
  size: z.number().finite().positive(),
  trail: fxRef.nullable(),
  /** How high the shot arcs (px). */
  arc: nonNeg,
});

const look = z.strictObject({
  color,
  glow: color,
  projectile,
  /** What lands on each target. */
  impact: z.array(fxRef),
  /** A stroke drawn where it lands. */
  strike: z.enum(STRIKE_VALUES),
  /** A ring spreading on the ground under the target (null: none), a full-screen flash (null: none), the shake (px). */
  ring: color.nullable(),
  flash: color.nullable(),
  shake: nonNeg.max(30),
});

const timing = z.strictObject({ release: nonNeg, impact: nonNeg, end: nonNeg }).refine((t) => t.release <= t.impact && t.impact <= t.end, 'timing needs release <= impact <= end');

const skill = look.partial().extend({
  delivery: z.enum(DELIVERY_VALUES).optional(),
  timing: timing.optional(),
});

export const battleFxFileSchema = z
  .strictObject({
    /** Particle sizes and speeds are drawn × this next to the fighters on screen. */
    scale: z.number().finite().positive(),
    pacing: z.strictObject({
      /** How long the magic circle shows before a skill leaves (ms). */
      circle: z.strictObject({ skill: nonNeg, ultimate: nonNeg }),
      /** A beat with no action, the gap between two beats, the longest step (squeezed under it), the share of time at x2. */
      quiet: nonNeg,
      gap: nonNeg,
      stepMax: posInt,
      fast: z.number().finite().positive().max(1),
    }),
    deliveries: z.strictObject({ melee: timing, slam: timing, projectile: timing, burst: timing, aura: timing, ultimate: timing }),
    bodies: z.record(z.enum(BODY_VALUES), z.strictObject({ idleMs: posInt, lunge: nonNeg, bob: nonNeg, breathe: nonNeg })),
    /** Creatures whose picture breaks the convention (it looks right) or that move in another way; the key is the art id. */
    creatures: z.record(assetId, z.strictObject({ facing: z.enum(FACING_VALUES).optional(), body: z.enum(BODY_VALUES).optional() })),
    particles: z.record(fxRef, burst),
    elements: z.record(z.enum([...ELEMENT_VALUES, 'NEUTRAL']), look),
    reactions: z.record(z.enum(REACTION_FX_VALUES), z.array(fxRef)),
    /** Skills that look different from their element (the key is the skill id). */
    skills: z.record(z.string().regex(/^skill_[a-z0-9_]+$/), skill),
  })
  .superRefine((f, ctx) => {
    const known = (ref: string) => ref in f.particles || (PARTICLE_SHAPES as readonly string[]).includes(ref) || ref.startsWith('fx_');
    const check = (refs: readonly (string | null | undefined)[], where: string) => {
      for (const r of refs) if (r && !known(r)) ctx.addIssue({ code: 'custom', message: `${where}: "${r}" is neither a burst of particles nor an fx_ image` });
    };
    for (const [id, l] of Object.entries(f.elements)) check([...l.impact, l.projectile.core, l.projectile.trail], `elements.${id}`);
    for (const [id, refs] of Object.entries(f.reactions)) check(refs, `reactions.${id}`);
    for (const [id, s] of Object.entries(f.skills)) check([...(s.impact ?? []), s.projectile?.core, s.projectile?.trail], `skills.${id}`);
    for (const e of [...ELEMENT_VALUES, 'NEUTRAL'] as const) if (!f.elements[e]) ctx.addIssue({ code: 'custom', message: `elements.${e} is missing` });
    for (const r of REACTION_FX_VALUES) if (!f.reactions[r]) ctx.addIssue({ code: 'custom', message: `reactions.${r} is missing` });
    for (const b of BODY_VALUES) if (!f.bodies[b]) ctx.addIssue({ code: 'custom', message: `bodies.${b} is missing` });
  });

export type BattleFxFile = z.output<typeof battleFxFileSchema>;
export type BattleBurst = z.output<typeof burst>;
export type BattleLook = z.output<typeof look>;
export type ParticleShape = (typeof PARTICLE_SHAPES)[number];
export type Delivery = (typeof DELIVERY_VALUES)[number];
export type Strike = (typeof STRIKE_VALUES)[number];
export type BodyPlan = (typeof BODY_VALUES)[number];
export type Facing = (typeof FACING_VALUES)[number];
export type ReactionFx = (typeof REACTION_FX_VALUES)[number];
export type PoseArt = (typeof POSE_ART_VALUES)[number];
