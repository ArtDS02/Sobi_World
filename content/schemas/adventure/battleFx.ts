// content/adventure/battle_fx.json — how a battle looks and moves (decision 042): the pacing of a step, how long each way of delivering an
// action takes, how each body idles, which way each creature's picture looks, the named bursts of particles, the look of each element
// (colours, the shot, what lands, the stroke, flash and shake), the reactions (a hit, a heal, a knock-out…) and the skills that look
// different from their element. Presentation only: nothing here changes a battle. The Admin edits it in "Nội dung game" and plays it in
// "Xưởng animation trận".
import { z } from 'zod';
import { assetId, color, nonNeg, posInt, range, unit } from '../fields';
import { scriptSchema, type Act } from './battleScript';
import { POSE_ART_VALUES } from './battlePoses';
import { ELEMENT_VALUES, statusId } from './combat';

export { POSE_ART_VALUES };

export const PARTICLE_SHAPES = ['glow', 'spark', 'star', 'leaf', 'petal', 'drop', 'rock', 'bubble', 'shard', 'ring', 'smoke', 'plus', 'arrow', 'rune'] as const;
export const DELIVERY_VALUES = ['melee', 'slam', 'projectile', 'burst', 'aura'] as const;
export const STRIKE_VALUES = ['none', 'slash', 'bolt', 'beam', 'swirl', 'vines'] as const;
export const BODY_VALUES = ['quadruped', 'aquatic', 'flyer', 'floater', 'sprout', 'heavy'] as const;
export const FACING_VALUES = ['right', 'left', 'front'] as const;
export const REACTION_FX_VALUES = ['hit', 'heavy', 'heal', 'buff', 'debuff', 'miss', 'ko', 'tears', 'guard', 'stun', 'teleport', 'aura', 'charge', 'slam'] as const;

/**
 * Something drawn: the id of a burst of `particles`, or a manifest image (`fx_…`, played as a strip when its row has frames). An image
 * whose file is still missing draws nothing.
 */
const fxRef = z.string().regex(/^[a-z][a-z0-9_]*$/);

const burst = z.strictObject({
  shape: z.enum(PARTICLE_SHAPES),
  /** A sprite (`fxs_…`) drawn instead of the shape once it is loaded (sprite_particles); tinted only when `tintArt`. */
  art: z.string().regex(/^fxs_[a-z0-9_]+$/).optional(),
  tintArt: z.boolean().optional(),
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
  /** The element's particle and impact (`$spark`, `$boom` in a script; a class skill takes its user's). */
  spark: fxRef.optional(),
  boom: fxRef.optional(),
  /** The shape at the heart of the element's magic circle (ANIM-022): a flame spark, a drop, a leaf… */
  glyph: z.enum(PARTICLE_SHAPES).optional(),
});

const timing = z.strictObject({ release: nonNeg, impact: nonNeg, end: nonNeg }).refine((t) => t.release <= t.impact && t.impact <= t.end, 'timing needs release <= impact <= end');

const skill = look.partial().extend({
  delivery: z.enum(DELIVERY_VALUES).optional(),
  timing: timing.optional(),
  /** What the skill plays, act by act (decision 044); its element's look still fills `$color`, `$spark`… */
  script: scriptSchema.optional(),
  /** Between two targets of an area skill (ms): each is hit, numbered and knocked back a little later than the one before. */
  stagger: nonNeg.max(400).optional(),
  /** The magic circle first (default: on without a script, off with one; the script opens the skill itself). */
  circle: z.boolean().optional(),
  /** How long its magic circle shows before the skill leaves (ms; default: the pacing's `circle.skill` / `circle.ultimate`). Each Ultimate winds up its own way (ANIM-112). */
  circleMs: nonNeg.max(1500).optional(),
});

/** The general actions and reactions that may carry a script (decision 044): played on the unit they are about (`actor`). */
export const ACTION_FX_VALUES = [
  'attack', 'guard', 'stunned', 'frozen', 'item', 'hit', 'heavy', 'miss', 'heal', 'regen', 'buff', 'debuff', 'dot_poison', 'dot_burn',
  'ko', 'revive', 'victory', 'enter_ally', 'enter_enemy', 'boss_phase', 'cleanse', 'resist', 'crit', 'victory_cam', 'turn_start_ally', 'turn_start_enemy',
] as const;

/** A thing that circles a unit for as long as a status lasts (ANIM-003 layers): stars round a dizzy head, a clock over a doomed one. */
const statusLayer = z.strictObject({
  kind: z.literal('orbit'),
  /** A particle shape (`star`, `rune`…) or a manifest picture (`fxs_…` / `fxp_…`); a missing picture is drawn as a star. */
  img: z.string().regex(/^([a-z]+|fx[sp]_[a-z0-9_]+)$/),
  n: z.number().int().min(1).max(6),
  /** The ellipse as shares of the unit's width (0 and 0: the thing stays put). */
  rx: z.number().finite().min(0).max(1.5),
  ry: z.number().finite().min(0).max(1.5),
  /** Radians a second (negative: the other way). */
  speed: z.number().finite().min(-8).max(8),
  spot: z.enum(['head', 'chest', 'feet']),
  /** Size as a share of the unit's width. */
  size: z.number().finite().positive().max(1.5),
  tint: color.optional(),
  alpha: unit.optional(),
  /** Where the first one starts (radians). */
  phase: z.number().finite().optional(),
  /** Beats in size by this share at 1.2 Hz (a clock ticking). */
  pulse: z.number().finite().min(0).max(0.5).optional(),
});

const status = z.strictObject({
  /** The badge shown by the head while the status lasts (`st_…`). */
  icon: z.string().regex(/^(st|ui_icon_status)_[a-z0-9_]+$/),
  /** Played when it is put on. */
  apply: scriptSchema.optional(),
  /** Played again and again while it lasts (every `every` ms). */
  loop: z.strictObject({ every: z.number().int().min(300).max(10000), script: scriptSchema }).optional(),
  /** The body is coloured while it lasts (alpha 0..1). */
  tint: z.strictObject({ color, alpha: unit }).optional(),
  /** A frame of an `fx_…` strip laid over the body while it lasts (the ice of Freeze). */
  cover: z.strictObject({ img: z.string().regex(/^fx_[a-z0-9_]+$/), frame: z.number().int().min(0), alpha: unit }).optional(),
  /** Things that circle the unit while it lasts (at most 3). */
  layers: z.array(statusLayer).max(3).optional(),
  /** The body sways like a dizzy one: no breathing, a slow lurch side to side (Stun). */
  sway: z.boolean().optional(),
  /** Played once when it is gone (ran out, cleansed or broken); the stage finds out by comparing frames (ui/statusDelta.ts). */
  expire: scriptSchema.optional(),
  /** Played each time it does its damage (poison, burn…) instead of the generic damage-over-time action. */
  tick: scriptSchema.optional(),
  /** The body is held perfectly still while it lasts: no breathing, no bobbing (Freeze). */
  freezeBody: z.boolean().optional(),
  /** When several statuses colour the body, the highest wins (default 0; the later one wins a tie). */
  priority: z.number().int().min(0).max(100).optional(),
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
    /** Scripts of the general actions (decision 044), played besides `reactions`. */
    actions: z.partialRecord(z.enum(ACTION_FX_VALUES), scriptSchema).default({}),
    /** How each status looks (decision 044): its badge, what plays when it lands and while it lasts. */
    statuses: z.partialRecord(statusId, status).default({}),
    /** The elemental reactions (`reaction_shock`…): played on the unit when one goes off. */
    elementReactions: z.record(z.string().regex(/^reaction_[a-z]+$/), scriptSchema).default({}),
  })
  .superRefine((f, ctx) => {
    const known = (ref: string) => ref in f.particles || (PARTICLE_SHAPES as readonly string[]).includes(ref) || ref.startsWith('fx_');
    const check = (refs: readonly (string | null | undefined)[], where: string) => {
      for (const r of refs) if (r && !known(r)) ctx.addIssue({ code: 'custom', message: `${where}: "${r}" is neither a burst of particles nor an fx_ image` });
    };
    for (const [id, l] of Object.entries(f.elements)) check([...l.impact, l.projectile.core, l.projectile.trail], `elements.${id}`);
    for (const [id, refs] of Object.entries(f.reactions)) check(refs, `reactions.${id}`);
    for (const [id, s] of Object.entries(f.skills)) check([...(s.impact ?? []), s.projectile?.core, s.projectile?.trail], `skills.${id}`);
    const isRef = (r: string) => r.startsWith('$') || known(r) || r.startsWith('fxs_') || r.startsWith('fxp_');
    const checkScript = (acts: readonly Act[] | undefined, where: string) => {
      for (const [i, a] of (acts ?? []).entries()) if ('ref' in a && a.ref && !isRef(a.ref)) ctx.addIssue({ code: 'custom', message: `${where}[${i}]: "${a.ref}" is neither a burst of particles nor an image` });
    };
    for (const [id, s] of Object.entries(f.skills)) checkScript(s.script, `skills.${id}.script`);
    for (const [id, acts] of Object.entries(f.actions)) checkScript(acts, `actions.${id}`);
    for (const [id, st] of Object.entries(f.statuses)) {
      checkScript(st.apply, `statuses.${id}.apply`);
      checkScript(st.loop?.script, `statuses.${id}.loop`);
      checkScript(st.expire, `statuses.${id}.expire`);
      checkScript(st.tick, `statuses.${id}.tick`);
    }
    for (const [id, acts] of Object.entries(f.elementReactions)) checkScript(acts, `elementReactions.${id}`);
    for (const [id, l] of Object.entries(f.elements)) check([l.spark, l.boom], `elements.${id}`);
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
export type ActionFx = (typeof ACTION_FX_VALUES)[number];
export type BattleSkillFx = z.output<typeof skill>;
export type BattleStatusFx = z.output<typeof status>;
