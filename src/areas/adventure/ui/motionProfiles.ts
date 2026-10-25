// What the battle's motion reads (decision 042), all of it from content/adventure/battle_fx.json so the look of a battle is edited
// without code: the pacing of a step, the timing of each way of delivering an action, how each body idles, which way each picture
// looks, the look of each element and of the skills that differ from theirs. Presentation only: nothing here changes a battle. Pure.
import type { BattleLook, BodyPlan, Delivery, Facing, PoseArt } from '../../../../content/schemas/adventure/battleFx';
import type { Element } from '../../../systems/combat/types';
import { BATTLE_FX } from '../logic/config/content';

export type { BodyPlan, Delivery, Facing };

export interface BodyProfile {
  /** One idle loop (ms); the units start at different points of it so a team never breathes as one. */
  idleMs: number;
  /** How far the body travels on a melee lunge (rem), how far it bobs (px), how much it breathes (share of its height). */
  lunge: number;
  bob: number;
  breathe: number;
}

export const BODY: Readonly<Record<BodyPlan, BodyProfile>> = BATTLE_FX.bodies as Record<BodyPlan, BodyProfile>;

/**
 * The art convention of the battle (docs/animation/COMBAT_ART_GUIDE.md): every creature is drawn looking to the right. Our team stands
 * on the left and looks right as drawn; an enemy stands on the right and is mirrored to look left. A picture that breaks the convention
 * says so in `creatures` of battle_fx.json (remove its `facing` when the new art lands); a front-facing picture is never mirrored.
 */
export const artFacing = (art: string): Facing => BATTLE_FX.creatures[art]?.facing ?? 'right';

/** The picture is mirrored on the field so the unit looks at the other side (ours look right, theirs left). */
export function mirrored(art: string, side: 'ally' | 'enemy'): boolean {
  const f = artFacing(art);
  return side === 'ally' ? f === 'left' : f === 'right';
}

/** The manifest ids a pose of `art` is drawn from, best first (the hurt face of decision 041 is `<art>_hurt`). */
export function poseArts(art: string, pose: PoseArt): string[] {
  const idle = [`cb_${art}_idle`, art];
  if (pose === 'idle') return idle;
  if (pose === 'hurt') return [`cb_${art}_hurt`, `${art}_hurt`, ...idle];
  return [`cb_${art}_${pose}`, ...idle];
}

/** How a creature's body moves, by its picture: as battle_fx.json says, else a fish swims and the rest walk on four legs. */
export const bodyOf = (art: string): BodyPlan => BATTLE_FX.creatures[art]?.body ?? (art.startsWith('fish_') ? 'aquatic' : 'quadruped');

/** What an actor does with its body. */
export type Pose = 'attack' | 'cast' | 'support' | 'ultimate' | 'guard' | 'stunned';

/**
 * When things happen in a beat (ms from its start, normal speed): the actor winds up until `release`, the effect travels or grows until
 * `impact` (the moment the numbers and the hit reactions play, as the battle's events say), the actor recovers until `end`.
 */
export interface Timing {
  release: number;
  impact: number;
  end: number;
}

export const TIMING: Readonly<Record<Delivery | 'ultimate', Timing>> = BATTLE_FX.deliveries;

/** How long the magic circle shows around a caster before its skill leaves (ms, normal speed). */
export const CIRCLE_MS = BATTLE_FX.pacing.circle;
/** A beat with no action (a turn lost to a status, or damage over time only). */
export const QUIET_MS = BATTLE_FX.pacing.quiet;
/** Between two beats. */
export const BEAT_GAP_MS = BATTLE_FX.pacing.gap;
/** A whole step never plays longer than this (ms, normal speed): longer steps are squeezed, so the battle never waits on its art. */
export const STEP_MAX_MS = BATTLE_FX.pacing.stepMax;
/** Speed x2 plays the motion at this share of its time. */
export const FAST_SHARE = BATTLE_FX.pacing.fast;

/** A skill that moves or looks different from its category and element (battle_fx.json `skills`). */
export const skillFx = (skillId: string | null) => (skillId ? BATTLE_FX.skills[skillId] : undefined);

/** The timing of a beat: the skill's own, else its way of delivery's (an Ultimate has its own). */
export const timingOf = (pose: Pose | null, delivery: Delivery, skillId: string | null): Timing => skillFx(skillId)?.timing ?? TIMING[pose === 'ultimate' ? 'ultimate' : delivery];

/** The look of a beat's effects: its element's (or the neutral one), with what the skill changes. */
export function lookOf(element: Element | null, skillId: string | null = null): BattleLook {
  const base = BATTLE_FX.elements[element ?? 'NEUTRAL'] ?? BATTLE_FX.elements.NEUTRAL!;
  const own = skillFx(skillId);
  if (!own) return base;
  const look = Object.entries(own).filter(([k, v]) => v !== undefined && k !== 'delivery' && k !== 'timing');
  return { ...base, ...Object.fromEntries(look) } as BattleLook;
}
