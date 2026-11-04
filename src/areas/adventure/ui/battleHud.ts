// The state of the battle HUD (ANIM-010): which phase the fight is in decides how much of the command dock, the turn bar and the name
// plates shows. While a skill plays the dock slides away and the plates shrink to their health, so the animation has the whole field;
// when it is over they come back. Pure: battleView.ts puts the result on the screen as classes (transform / opacity only in CSS).

export type HudPhase = 'idle' | 'turnStart' | 'choosing' | 'aiming' | 'resolving' | 'result';
export type DockMode = 'open' | 'compact' | 'hidden';

export interface HudLayout {
  dock: DockMode;
  turnbar: 'full' | 'mini';
  plates: 'full' | 'hp-only' | 'hidden';
}

/** What decides the phase. */
export interface HudInput {
  /** A step is playing (its animation is on screen). */
  resolving: boolean;
  /** The battle is over (the result shows). */
  ended: boolean;
  /** A skill is chosen and a target is being aimed. */
  aiming: boolean;
  /** It is our turn to choose / the enemy's turn is coming. */
  turn: 'ally' | 'enemy' | null;
}

/** The phase of the fight: the result, a step playing, aiming, choosing (ours), an enemy turn about to play, or nothing. */
export function hudPhase(i: HudInput): HudPhase {
  if (i.ended) return 'result';
  if (i.resolving) return 'resolving';
  if (i.aiming) return 'aiming';
  if (i.turn === 'ally') return 'choosing';
  if (i.turn === 'enemy') return 'turnStart';
  return 'idle';
}

/** How the HUD looks in each phase (tune here; the CSS reads these names). */
export const HUD_LAYOUT: Readonly<Record<HudPhase, HudLayout>> = {
  idle: { dock: 'open', turnbar: 'full', plates: 'full' },
  turnStart: { dock: 'compact', turnbar: 'full', plates: 'full' },
  choosing: { dock: 'open', turnbar: 'full', plates: 'full' },
  aiming: { dock: 'compact', turnbar: 'full', plates: 'full' },
  resolving: { dock: 'hidden', turnbar: 'mini', plates: 'hp-only' },
  result: { dock: 'hidden', turnbar: 'mini', plates: 'full' },
};

/** How long the HUD takes to move between two layouts (ms). */
export const HUD_MOVE_MS = 220;

/**
 * Whether the HUD is moving: the phase changed less than HUD_MOVE_MS ago (the screen carries the `is-hud-moving` class for that long
 * so the CSS animates), never with reduced motion.
 */
export const hudMoving = (changedAt: number, now: number, reduce: boolean) => !reduce && now - changedAt < HUD_MOVE_MS;

/** Remembers the phase between redraws, so a change is dated once however often the screen is rebuilt. */
export function hudTracker() {
  let phase: HudPhase | null = null;
  let changedAt = -Infinity;
  return (next: HudPhase, now: number): { phase: HudPhase; changedAt: number } => {
    if (phase !== next) {
      phase = next;
      changedAt = now;
    }
    return { phase, changedAt };
  };
}
