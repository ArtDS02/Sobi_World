// content/anim/rigs/<rig>.json — a creature's puppet (decision 050): its parts (pictures cut from one layered canvas), the bones that
// carry them (a tree, pivots in that canvas's px, feet at the origin), the face slots whose picture is swapped (eyes, mouth), the
// springs that give its parts overlap, the chains that bend (tails, fins, tentacles, a fish's spine) and its clips (keyframes per bone,
// marks for the moments a battle lines up with). Presentation only: nothing here changes a battle or a save. Shared by every Area.
import { z } from 'zod';

export const BODY_PLAN_VALUES = ['quadruped', 'biped', 'heavy', 'aquatic', 'cephalopod', 'flyer', 'floater', 'small'] as const;
export const EASE_VALUES = ['linear', 'in', 'out', 'inOut', 'outBack', 'outElastic', 'hold'] as const;
export const CHANNEL_VALUES = ['rot', 'x', 'y', 'sx', 'sy'] as const;
/** The moments of an action a battle beat lines its clip up with (ui/battlePose.ts → systems/animation/warp.ts). */
export const MARK_VALUES = ['windup', 'release', 'contact', 'recover'] as const;

const id = z.string().regex(/^[a-z][a-z0-9_]*$/);
const pt = z.tuple([z.number(), z.number()]);

/** A key: [ms, value, ease of the segment that starts here]. */
const key = z.union([z.tuple([z.number().min(0), z.number()]), z.tuple([z.number().min(0), z.number(), z.enum(EASE_VALUES)])]);
const track = z.array(key).min(1);
const channels = z.partialRecord(z.enum(CHANNEL_VALUES), track);

export const clipSchema = z.strictObject({
  len: z.number().positive(),
  loop: z.boolean().default(false),
  /** Crossfade into this clip (ms of real time). */
  fade: z.number().min(0).default(120),
  marks: z.partialRecord(z.enum(MARK_VALUES), z.number().min(0)).default({}),
  /** Per bone (or chain) id: offsets from rest (rot deg, x / y px of the canvas) and scales. On a chain, `rot` turns its root, `sx`
   *  scales its length and `sy` its curl (2 = coiled twice as much). */
  tracks: z.record(id, channels).default({}),
  /** Face slots: [ms, picture name] (held until the next key). */
  faces: z.record(id, z.array(z.tuple([z.number().min(0), id])).min(1)).default({}),
  /** How much of the procedural life plays under this clip (breath, blink, chain waves): 0–1. */
  life: z.number().min(0).max(1).default(1),
  /** The wave of each chain during this clip (overrides the chain's own). */
  waves: z.record(id, z.strictObject({ amp: z.number(), speed: z.number(), phase: z.number().optional(), curl: z.number().optional() })).default({}),
});

const part = z.strictObject({
  /** Manifest id of the picture. */
  img: id,
  /** Where the picture sits in the canvas: [x, y, w, h] px (written by `npm run rig:parts`). */
  box: z.tuple([z.number(), z.number(), z.number().positive(), z.number().positive()]),
});

const bone = z.strictObject({
  id,
  parent: id.nullable(),
  /** The joint, in canvas px (feet at [0, 0], up is negative y). */
  at: pt,
  /** The part this bone carries (a key of `parts`), drawn rotating around `at`. */
  part: id.optional(),
  /** A face slot drawn on this bone: its pictures by name (keys of `parts`). */
  slot: z.strictObject({ name: id, pictures: z.record(id, id), rest: id }).optional(),
  z: z.number().default(0),
});

/** A spring that lags a bone behind its parent's motion (overlap, secondary motion): ears, a tail, a crest, a shell. */
const spring = z.strictObject({
  bone: id,
  /** How hard it pulls back (1/s²) and how fast it calms (1/s). */
  stiff: z.number().positive(),
  damp: z.number().min(0),
  /** Degrees of swing per 1000 px/s² of the bone's acceleration, sideways (`gain`) and up / down (`gainY`). */
  gain: z.number(),
  gainY: z.number().default(0),
  max: z.number().positive().default(35),
});

/** A chain: a part laid on a bendable strip (Phaser Rope), its segments turning one after the other along a travelling wave. */
const chain = z.strictObject({
  id,
  parent: id,
  at: pt,
  /** Picture drawn along the chain, its root at the left edge, its width along the chain. */
  part: id,
  /** Rest direction (deg, 0 = right, 90 = down) and length (px). */
  dir: z.number(),
  len: z.number().positive(),
  segments: z.number().int().min(3).max(24).default(10),
  /** The wave that runs from root to tip at rest: deg at the tip, cycles a second, phase between segments (rad). */
  wave: z.strictObject({ amp: z.number(), speed: z.number(), phase: z.number().default(0.6) }),
  /** A steady bend towards the tip (deg in all, + = clockwise): a tentacle's curl, a tail's hook. */
  curl: z.number().default(0),
  /** How much more the tip bends than the root (1 = the same). */
  taper: z.number().default(1.6),
  z: z.number().default(0),
});

export const rigSchema = z.strictObject({
  id,
  plan: z.enum(BODY_PLAN_VALUES),
  /** Height of the creature in canvas px (the battle fits this into the unit's box). */
  height: z.number().positive(),
  /** Texture px per canvas px of the part pictures (`npm run rig:parts` renders at ×2). */
  res: z.number().positive().default(2),
  /** Its feel: tempo (clips play faster > 1), weight 0–1 (heavier: smaller hops, longer settles), breath and blink. */
  feel: z.strictObject({
    tempo: z.number().positive().default(1),
    weight: z.number().min(0).max(1).default(0.5),
    breath: z.strictObject({ ms: z.number().positive(), bone: id, sy: z.number(), y: z.number().default(0) }),
    blink: z.strictObject({ slot: id, closed: id, half: id.optional(), every: pt }).optional(),
    /** How much of the battle's whole-body tween (turn, squash) still applies on top of the rig: the body does the rest. */
    root: z.strictObject({ rot: z.number().min(0).max(1).default(0.35), squash: z.number().min(0).max(1).default(0.3) }).default({ rot: 0.35, squash: 0.3 }),
  }),
  parts: z.record(id, part),
  bones: z.array(bone).min(1),
  chains: z.array(chain).default([]),
  springs: z.array(spring).default([]),
  clips: z.record(id, clipSchema),
});

export type RigData = z.infer<typeof rigSchema>;
export type ClipData = z.infer<typeof clipSchema>;
export type BoneData = z.infer<typeof bone>;
export type ChainData = z.infer<typeof chain>;
export type Ease = (typeof EASE_VALUES)[number];
export type Channel = (typeof CHANNEL_VALUES)[number];
export type Mark = (typeof MARK_VALUES)[number];
export type BodyPlan = (typeof BODY_PLAN_VALUES)[number];

/** The clips every rig must have (the prototype bar of decision 050: idle, locomotion, attack, cast, hurt, a show of joy). */
export const REQUIRED_CLIPS = ['idle', 'move', 'attack', 'cast', 'hurt', 'victory'] as const;

/** Checks what zod cannot: one root, parents exist and come first, parts / slots / chains name what exists, required clips present. */
export function rigProblems(r: RigData): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const roots = r.bones.filter((b) => b.parent === null);
  if (roots.length !== 1) out.push(`${r.id}: needs exactly one root bone (has ${roots.length})`);
  for (const b of r.bones) {
    if (seen.has(b.id)) out.push(`${r.id}: bone ${b.id} twice`);
    if (b.parent !== null && !seen.has(b.parent)) out.push(`${r.id}: bone ${b.id} parent ${b.parent} missing or after it`);
    seen.add(b.id);
    if (b.part && !r.parts[b.part]) out.push(`${r.id}: bone ${b.id} part ${b.part} missing`);
    if (b.slot) {
      for (const p of Object.values(b.slot.pictures)) if (!r.parts[p]) out.push(`${r.id}: slot ${b.slot.name} picture ${p} missing`);
      if (!b.slot.pictures[b.slot.rest]) out.push(`${r.id}: slot ${b.slot.name} rest ${b.slot.rest} missing`);
    }
  }
  const slots = new Map(r.bones.filter((b) => b.slot).map((b) => [b.slot!.name, b.slot!]));
  const chainsBefore = new Set<string>();
  for (const c of r.chains) {
    // A chain hangs from a bone, or from the tip of a chain before it (a betta's tail fin at the end of its spine).
    if (!seen.has(c.parent) && !chainsBefore.has(c.parent)) out.push(`${r.id}: chain ${c.id} parent ${c.parent} missing`);
    chainsBefore.add(c.id);
    if (!r.parts[c.part]) out.push(`${r.id}: chain ${c.id} part ${c.part} missing`);
    if (seen.has(c.id)) out.push(`${r.id}: chain ${c.id} shares a bone id`);
  }
  const targets = new Set([...seen, ...r.chains.map((c) => c.id)]);
  for (const s of r.springs) if (!seen.has(s.bone)) out.push(`${r.id}: spring on missing bone ${s.bone}`);
  for (const name of REQUIRED_CLIPS) if (!r.clips[name]) out.push(`${r.id}: clip ${name} missing`);
  for (const [name, c] of Object.entries(r.clips)) {
    for (const t of Object.keys(c.tracks)) if (!targets.has(t)) out.push(`${r.id}: clip ${name} animates missing ${t}`);
    for (const [slot, keys] of Object.entries(c.faces)) {
      const s = slots.get(slot);
      if (!s) out.push(`${r.id}: clip ${name} face slot ${slot} missing`);
      else for (const [, pic] of keys) if (!s.pictures[pic]) out.push(`${r.id}: clip ${name} face ${slot}.${pic} missing`);
    }
    for (const w of Object.keys(c.waves)) if (!r.chains.some((ch) => ch.id === w)) out.push(`${r.id}: clip ${name} waves missing chain ${w}`);
    for (const [m, at] of Object.entries(c.marks)) if (at > c.len) out.push(`${r.id}: clip ${name} mark ${m} after its end`);
    const order = MARK_VALUES.map((m) => c.marks[m]).filter((v): v is number => v !== undefined);
    if (order.some((v, i) => i > 0 && v < order[i - 1]!)) out.push(`${r.id}: clip ${name} marks out of order`);
  }
  if (r.feel.blink && !slots.get(r.feel.blink.slot)) out.push(`${r.id}: blink slot ${r.feel.blink.slot} missing`);
  if (!seen.has(r.feel.breath.bone)) out.push(`${r.id}: breath bone ${r.feel.breath.bone} missing`);
  return out;
}
