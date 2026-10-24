// The one table the battle's motion reads (GĐ14 animation pipeline, docs/animation/): the body plan of each fighter (how it idles and
// moves), the timing of every pose, the look of each element's effects and the skills that have their own. Art is optional and goes
// through the manifest by id: `fx_adv_<element>_<phase>` for an element, `fx_<skillId>_<phase>` for a skill of its own; while a file is
// missing the effect is drawn by CSS (the fallback is the shape named here). Presentation only: nothing here changes a battle. Pure.
import type { Element } from '../../../systems/combat/types';

/** How a body moves: its idle loop, and how far it leans into an action. */
export type BodyPlan = 'quadruped' | 'aquatic' | 'flyer' | 'floater' | 'sprout' | 'heavy';

export interface BodyProfile {
  /** One idle loop (ms); the units start at different points of it so a team never breathes as one. */
  idleMs: number;
  /** How far the body travels on a melee lunge (rem). */
  lunge: number;
}

export const BODY: Readonly<Record<BodyPlan, BodyProfile>> = {
  quadruped: { idleMs: 2200, lunge: 3.2 },
  aquatic: { idleMs: 2600, lunge: 2.6 },
  flyer: { idleMs: 1400, lunge: 3.6 },
  floater: { idleMs: 3000, lunge: 2.2 },
  sprout: { idleMs: 1800, lunge: 2.4 },
  heavy: { idleMs: 3200, lunge: 1.8 },
};

/** The enemies of content/adventure/enemies.json by what they are (an enemy missing here idles as a quadruped). */
export const ENEMY_BODY: Readonly<Record<string, BodyPlan>> = {
  enemy_mossling: 'sprout',
  enemy_thorn_sprout: 'sprout',
  enemy_gale_sparrow: 'flyer',
  enemy_ember_fox: 'quadruped',
  enemy_dew_frog: 'quadruped',
  enemy_forest_wolf: 'quadruped',
  enemy_bramble_boar: 'quadruped',
  enemy_wolf_alpha: 'quadruped',
  enemy_old_treant: 'heavy',
  enemy_rock_beetle: 'quadruped',
  enemy_cliff_hawk: 'flyer',
  enemy_lava_newt: 'quadruped',
  enemy_snow_goat: 'quadruped',
  enemy_ore_golem: 'heavy',
  enemy_thunder_ram: 'quadruped',
  enemy_magma_drake: 'heavy',
  enemy_stone_sentinel: 'heavy',
  enemy_rune_wisp: 'floater',
  enemy_tide_wraith: 'floater',
  enemy_ember_idol: 'heavy',
  enemy_shadow_priest: 'floater',
  enemy_ancient_guardian: 'heavy',
};

/** A fighter's body plan from its battle id: allies are `<areaId>:<id>` (a fish swims), enemies `<enemyId>#<n>`. */
export function bodyOf(unitId: string): BodyPlan {
  if (unitId.startsWith('sobi_aquarium:')) return 'aquatic';
  if (unitId.includes(':')) return 'quadruped';
  return ENEMY_BODY[unitId.split('#')[0]!] ?? 'quadruped';
}

/** What an actor does with its body. */
export type Pose = 'attack' | 'cast' | 'support' | 'ultimate' | 'guard' | 'stunned';
/** How the effect reaches its targets. */
export type Delivery = 'melee' | 'slam' | 'projectile' | 'burst' | 'aura';

/**
 * When things happen in a beat (ms from its start, normal speed): the actor winds up until `release`, the effect travels or grows until
 * `impact` (the moment the numbers and the hit reactions play, as the battle's events say), the actor recovers until `end`.
 */
export interface Timing {
  release: number;
  impact: number;
  end: number;
}

export const TIMING: Readonly<Record<Delivery | 'ultimate', Timing>> = {
  melee: { release: 220, impact: 330, end: 620 },
  slam: { release: 260, impact: 380, end: 680 },
  projectile: { release: 260, impact: 520, end: 760 },
  burst: { release: 300, impact: 440, end: 720 },
  aura: { release: 240, impact: 360, end: 640 },
  ultimate: { release: 420, impact: 640, end: 1000 },
};

/** How long the magic circle shows around a caster before its skill leaves (ms, normal speed). */
export const CIRCLE_MS = { skill: 560, ultimate: 820 } as const;

/** A beat with no action (a turn lost to a status, or damage over time only). */
export const QUIET_MS = 360;
/** Between two beats. */
export const BEAT_GAP_MS = 80;
/** A whole step never plays longer than this (ms, normal speed): longer steps are squeezed, so the battle never waits on its art. */
export const STEP_MAX_MS = 5600;
/** Speed x2 plays the motion at this share of its time. */
export const FAST_SHARE = 0.55;

/** The CSS shape an element's effect falls back to while it has no art, and its colours (the shape differs, not just the colour). */
export interface ElementLook {
  shape: 'ember' | 'bubble' | 'leaf' | 'rock' | 'blade' | 'bolt' | 'ink' | 'star' | 'ring';
  color: string;
  glow: string;
}

export const ELEMENT_LOOK: Readonly<Record<Element, ElementLook>> = {
  FIRE: { shape: 'ember', color: '#ff8a3a', glow: '#ffd36a' },
  WATER: { shape: 'bubble', color: '#5cc6ff', glow: '#d8f4ff' },
  NATURE: { shape: 'leaf', color: '#62c25a', glow: '#d6ffa8' },
  EARTH: { shape: 'rock', color: '#b08350', glow: '#f2d7a6' },
  METAL: { shape: 'blade', color: '#c9d3e0', glow: '#ffffff' },
  LIGHTNING: { shape: 'bolt', color: '#ffe14a', glow: '#fffbd0' },
  DARK: { shape: 'ink', color: '#5a3d8a', glow: '#c9a8ff' },
  LIGHT: { shape: 'star', color: '#fff2a8', glow: '#ffffff' },
  VOID: { shape: 'ring', color: '#8c7cff', glow: '#e4dcff' },
};

/** The look of an effect with no element (support skills, items, guard). */
export const NEUTRAL_LOOK: ElementLook = { shape: 'star', color: '#9ef0c8', glow: '#ffffff' };

/** A skill with motion of its own (the vertical slice of docs/animation/: Cu Ủn's "Gai Độc"); the rest follow their category. */
export interface SkillMotion {
  delivery?: Delivery;
  shape?: ElementLook['shape'] | 'thorn';
  /** The effect's art in the manifest (`<id>_projectile`, `<id>_impact`), used when it has a file. */
  art?: string;
}

export const SKILL_MOTION: Readonly<Record<string, SkillMotion>> = {
  skill_mm_poison_thorn: { delivery: 'projectile', shape: 'thorn', art: 'fx_skill_mm_poison_thorn' },
};

/** The manifest id of an effect's picture for one phase: the skill's own, else its element's. */
export function vfxArt(skillId: string | null, element: Element | null, phase: 'projectile' | 'impact'): string[] {
  const own = skillId ? SKILL_MOTION[skillId]?.art : undefined;
  return [own ? `${own}_${phase}` : null, element ? `fx_adv_${element.toLowerCase()}_${phase}` : null].filter((x): x is string => x !== null);
}
