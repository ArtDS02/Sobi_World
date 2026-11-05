// The script of a battle animation (decision 044): what plays, when, on whom, written as a list of timed acts. A skill, a general
// action (an attack, a guard, a hit…), a status or an elemental reaction may each carry one in content/adventure/battle_fx.json.
// Times are ms at normal speed from the start of the beat (after its magic circle, when it has one): the engine squeezes them with the
// beat. Presentation only: nothing here changes a battle.
import { z } from 'zod';
import { color, nonNeg } from '../fields';
import { POSE_ART_VALUES } from './battlePoses';

/**
 * Who an act plays on: the one acting, its first or every target, every unit of its side or of the other side, the middle of its own
 * side or of the other side (one spot where a whole row is: a storm cloud over the enemies), or the screen.
 */
export const WHO_VALUES = ['actor', 'target', 'targets', 'allies', 'foes', 'allyside', 'foeside', 'field'] as const;
/** Where on a unit (or on the screen, for `field`) an act starts. */
export const SPOT_VALUES = ['chest', 'feet', 'head', 'above', 'front', 'behind', 'sky', 'middle', 'center'] as const;
/** Named cast keyframe tracks (ANIM-005, ui/castTracks.ts): one per way of gathering power, by body. */
export const CAST_PRESET_VALUES = [
  'cast_charge', 'cast_raise', 'cast_roar', 'cast_stomp', 'cast_spin', 'cast_hover', 'cast_sprout', 'cast_coil', 'cast_bow', 'cast_wing',
] as const;
export const EASE_VALUES = ['linear', 'outQuad', 'inQuad', 'inOutQuad', 'outBack', 'spring'] as const;
/** Ways a body moves (actor_moves, decision 044). */
export const MOVE_VALUES = [
  ...CAST_PRESET_VALUES,
  'dash', 'dash_through', 'lunge', 'recoil', 'hop', 'jump', 'lift', 'knock', 'spin', 'spin_roll', 'vanish', 'appear', 'exit_top', 'dive',
  'wiggle', 'puff_up', 'squash', 'shake', 'walk_sideways', 'rear', 'sink', 'float', 'tilt', 'look', 'bounce',
] as const;
/** Paths a big object (`fxp_…`) travels (prop_actor). */
export const PROP_PATHS = ['fall', 'rise', 'sweep', 'orbit', 'pop', 'grow', 'throw', 'fly', 'stretch', 'hover'] as const;
export const PROP_EASE_VALUES = ['linear', 'inQuad', 'outQuad', 'inOutSine', 'inBack', 'outBack', 'spring'] as const;
export const DECAL_KINDS = ['puddle', 'scorch', 'crack', 'rune', 'ring'] as const;

/** A colour, or the colour of the beat's look (`$color`) or its glow (`$glow`). */
export const paint = z.union([color, z.enum(['$color', '$glow'])]);
/** A burst of particles or an `fx_…` / `fxs_…` image, or the element's own particle (`$spark`) or impact (`$boom`). */
export const fxRef = z.string().regex(/^(\$spark|\$boom|[a-z][a-z0-9_]*)$/);
const imageOf = (prefix: string) => z.string().regex(new RegExp(`^(${prefix}[a-z0-9_]+|\\$boom)$`));

const base = {
  /** Start (ms from the beat, normal speed). */
  at: nonNeg.default(0),
  who: z.enum(WHO_VALUES).default('actor'),
  /** Between two units of `targets` / `allies` / `foes` (ms), in their order; the skill's own stagger when left out. */
  stagger: nonNeg.optional(),
};
/** How an Ultimate's cut-in sweeps in (ANIM-112): a slanted band, two bands from the sides, a column rising, a ring opening from the user. */
export const CUTIN_STYLES = ['slash', 'bars', 'rise', 'ring'] as const;
export const HIT_STOP_TIERS =['light', 'medium', 'heavy', 'ultimate'] as const;
const lasting = { ...base, dur: nonNeg.max(4000) };

/** The secondary motion of a prop (ANIM-007, ui/propMotion.ts); each path has its defaults, these override them. */
const propMods = z.strictObject({
  ease: z.enum(PROP_EASE_VALUES).optional(),
  /** Rocks by `rot` degrees at `freq` Hz. */
  wobble: z.strictObject({ rot: z.number().finite().min(0).max(45), freq: z.number().finite().positive().max(10) }).optional(),
  /** Breathes in size by `amp` (share) at `freq` Hz. */
  pulse: z.strictObject({ amp: z.number().finite().min(0).max(0.5), freq: z.number().finite().positive().max(10) }).optional(),
  /** Stretched along the way it goes, the faster the more. */
  stretch: z.boolean().optional(),
  /** Bobs up and down by `amp` px at `freq` Hz. */
  bobY: z.strictObject({ amp: z.number().finite().min(0).max(60), freq: z.number().finite().positive().max(10) }).optional(),
  /** Squashes when it lands. */
  squashOnHit: z.boolean().optional(),
  /** Leaves a burst `ref` behind every `every` ms. */
  trail: z.strictObject({ ref: fxRef, every: nonNeg.min(20).max(1000) }).optional(),
  /**
   * prop_displace (decision 049): the picture bends along a travelling wave — `amp` share of its height, `waves` across its width,
   * `speed` waves a second. WebGL only (a Phaser Rope); without it the plain picture is drawn.
   */
  ripple: z
    .strictObject({ amp: z.number().finite().min(0).max(0.3), waves: z.number().finite().min(0.25).max(4), speed: z.number().finite().min(0).max(5) })
    .optional(),
});
export type PropMods = z.output<typeof propMods>;
export type PropEase = (typeof PROP_EASE_VALUES)[number];

export const actSchema = z.discriminatedUnion('do', [
  /** Shows a key pose for a while. */
  z.strictObject({ do: z.literal('pose'), ...lasting, pose: z.enum(POSE_ART_VALUES) }),
  /** Moves the body (x / y px, deg, scale, n repeats: each move reads what it needs). */
  z.strictObject({
    do: z.literal('move'),
    ...lasting,
    move: z.enum(MOVE_VALUES),
    x: z.number().finite().optional(),
    y: z.number().finite().optional(),
    deg: z.number().finite().optional(),
    scale: z.number().finite().positive().optional(),
    n: z.number().finite().positive().optional(),
  }),
  /** Keyframes of the body over `dur` (ANIM-005): t 0..1 ascending, each key an offset (px, deg, scale) eased in from the one before; the last key is rest. */
  z.strictObject({
    do: z.literal('track'),
    ...lasting,
    keys: z
      .array(
        z.strictObject({
          t: z.number().finite().min(0).max(1),
          dx: z.number().finite().optional(),
          dy: z.number().finite().optional(),
          rot: z.number().finite().optional(),
          sx: z.number().finite().positive().optional(),
          sy: z.number().finite().positive().optional(),
          ease: z.enum(EASE_VALUES).optional(),
        }),
      )
      .min(2)
      .max(16),
  }),
  /** Lights the body up in a colour (`tint`: the picture itself is coloured). */
  z.strictObject({ do: z.literal('glow'), ...lasting, color: paint, bright: z.number().finite().min(0).max(3).optional(), tint: z.boolean().optional() }),
  /** A burst of particles (or a sprite `fxs_…` used as one). */
  z.strictObject({ do: z.literal('burst'), ...base, ref: fxRef, spot: z.enum(SPOT_VALUES).optional(), tint: z.array(paint).min(1).optional(), more: z.number().finite().positive().max(10).optional() }),
  /** A 4-frame strip `fx_…` played (or a frame range of it, `hold` keeps the last frame shown that long). */
  z.strictObject({
    do: z.literal('strip'),
    ...base,
    img: imageOf('fx_'),
    spot: z.enum(SPOT_VALUES).optional(),
    /** Size as a share of the unit's width (1.3 when left out). */
    size: z.number().finite().positive().max(8).optional(),
    tint: paint.optional(),
    frames: z.tuple([z.number().int().min(0), z.number().int().min(0)]).optional(),
    dur: nonNeg.max(4000).optional(),
    hold: nonNeg.max(4000).optional(),
    alpha: z.number().finite().min(0).max(1).optional(),
    flip: z.boolean().optional(),
    /** Drawn under the fighters (a splash on the ground). */
    under: z.boolean().optional(),
    y: z.number().finite().optional(),
  }),
  /** A big object `fxp_…` (or a sprite `fxs_…`) travelling along a path (prop_actor). */
  z.strictObject({
    do: z.literal('prop'),
    ...lasting,
    /** A big object, or a sprite (`fxs_…`) thrown on its own. */
    img: imageOf('fx[ps]_'),
    path: z.enum(PROP_PATHS),
    spot: z.enum(SPOT_VALUES).optional(),
    /** Size as a share of the unit's height (a `field` prop: of the screen's height). */
    size: z.number().finite().positive().max(8),
    spin: z.number().finite().optional(),
    arc: z.number().finite().optional(),
    tint: paint.optional(),
    alpha: z.number().finite().min(0).max(1).optional(),
    /** A shadow on the ground grows under it before it lands (shadow_marker). */
    shadow: z.boolean().optional(),
    flip: z.boolean().optional(),
    /** Drawn under the fighters. */
    under: z.boolean().optional(),
    ...propMods.shape,
  }),
  /** A straight beam from the actor to the unit (`through`: on to the edge of the screen). */
  z.strictObject({ do: z.literal('beam'), ...lasting, color: paint, width: nonNeg.max(200).optional(), through: z.boolean().optional() }),
  /** A wave of water or wind sweeping across the stage (ANIM-006): `amp` / `thickness` / `length` as shares of the screen. */
  z.strictObject({
    do: z.literal('ribbon'),
    ...lasting,
    color: paint,
    amp: z.number().finite().min(0).max(0.4).optional(),
    freq: z.number().finite().positive().max(8).optional(),
    speed: z.number().finite().min(0).max(20).optional(),
    thickness: z.number().finite().positive().max(0.5).optional(),
    length: z.number().finite().positive().max(1.2).optional(),
    foam: z.boolean().optional(),
    flip: z.boolean().optional(),
  }),
  /** A wavy line from the actor to the unit, particles running along it. */
  z.strictObject({ do: z.literal('tether'), ...lasting, color: paint, wave: nonNeg.max(60).optional(), ref: fxRef.optional() }),
  /** A cone blown from the actor's mouth over the unit. */
  z.strictObject({ do: z.literal('cone'), ...lasting, color: paint, ref: fxRef.optional(), width: nonNeg.max(400).optional() }),
  /** A mark on the ground under the unit, fading: a puddle, a scorch, a crack, a rune ring, or a frame of an `fx_…` strip. */
  z.strictObject({
    do: z.literal('decal'),
    ...lasting,
    kind: z.enum(DECAL_KINDS).optional(),
    img: imageOf('fx_').optional(),
    frame: z.number().int().min(0).optional(),
    color: paint.optional(),
    size: z.number().finite().positive().max(8).optional(),
  }),
  /** A dark shadow growing on the ground before something lands there. */
  z.strictObject({ do: z.literal('marker'), ...lasting, size: z.number().finite().positive().max(8).optional() }),
  /** Pale copies of the body left behind while it moves fast. */
  z.strictObject({ do: z.literal('trail'), ...lasting, every: nonNeg.min(20).max(400).optional(), color: paint.optional() }),
  /** The backdrop coloured (`focus`: darker away from the unit, a vignette). */
  z.strictObject({ do: z.literal('tint'), ...lasting, color: paint, alpha: z.number().finite().min(0).max(1), fade: nonNeg.optional(), focus: z.boolean().optional() }),
  /** A quick zoom towards the unit and back. */
  z.strictObject({ do: z.literal('punch'), ...lasting, zoom: z.number().finite().min(1).max(1.2) }),
  /** The stage holds still (hit stop); numbers and sounds go on. */
  /** `tier` (light 50 / medium 80 / heavy 120 / ultimate 220 ms, scene/battle/screenFx.ts) replaces `dur` when given. */
  z.strictObject({ do: z.literal('stop'), ...lasting, tier: z.enum(HIT_STOP_TIERS).optional() }),
  /** The colours split for a beat (Void). */
  z.strictObject({ do: z.literal('split'), ...lasting }),
  /** The camera shakes; with `dir` it shakes along that direction and dies away exponentially (otherwise the plain random shake). */
  z.strictObject({ do: z.literal('shake'), ...lasting, amount: nonNeg.max(30), dir: z.tuple([z.number().finite(), z.number().finite()]).optional() }),
  /** Slow motion of the whole stage: speed `scale` (0.1..1) that eases back to normal over `dur` (off for reduced motion). */
  z.strictObject({ do: z.literal('slowmo'), ...lasting, scale: z.number().finite().min(0.1).max(1) }),
  /** Two black bars close in top and bottom (`on`) or open again over `dur`: the cinematic frame of an Ultimate. */
  z.strictObject({ do: z.literal('letterbox'), ...lasting, on: z.boolean() }),
  /** The edges of the screen darken in a colour for `dur`. */
  z.strictObject({ do: z.literal('vignette'), ...lasting, color: paint, alpha: z.number().finite().min(0).max(1) }),
  z.strictObject({ do: z.literal('flash'), ...lasting, color: paint, alpha: z.number().finite().min(0).max(1) }),
  /** A sound of the manifest (`adv_…`; a missing file is silence). Plays with reduced motion too. */
  z.strictObject({ do: z.literal('sound'), ...base, sound: z.string().regex(/^adv_[a-z0-9_]+$/) }),
  /** The opening of an Ultimate: a band in the colour sweeps across, the actor's picture slides in, the rest darkens. */
  z.strictObject({ do: z.literal('cutin'), ...lasting, color: paint, style: z.enum(CUTIN_STYLES).optional() }),
]);

export const scriptSchema = z.array(actSchema).max(60);

export type Act = z.output<typeof actSchema>;
export type ActKind = Act['do'];
export type Who = (typeof WHO_VALUES)[number];
export type Spot = (typeof SPOT_VALUES)[number];
export type Move = (typeof MOVE_VALUES)[number];
export type PropPath = (typeof PROP_PATHS)[number];
export type Paint = z.output<typeof paint>;

/** When the last act of a script is over (ms, normal speed, before any stagger). */
export const scriptEnd = (acts: readonly Act[]) => acts.reduce((end, a) => Math.max(end, a.at + ('dur' in a && a.dur !== undefined ? a.dur : 0) + ('hold' in a && a.hold ? a.hold : 0)), 0);

/** Every image an act names (to load it ahead, and to check it exists). */
export function actImages(a: Act): string[] {
  const out: string[] = [];
  if ('img' in a && a.img && !a.img.startsWith('$')) out.push(a.img);
  if ('ref' in a && a.ref && /^fx(s|p)?_/.test(a.ref)) out.push(a.ref);
  return out;
}
