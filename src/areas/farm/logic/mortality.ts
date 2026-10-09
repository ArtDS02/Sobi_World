// Critical illness and death (decisions 002 and 004, GAME_BALANCE §2.4). An illness left untreated
// turns critical, then fatal. While the game was closed nothing dies: a catch-up that finds a pig
// past its time only sets a grace period, counted from when the game is open again. Pure.
import { HEALTH } from '../../../core/config/health';
import type { SimMode } from '../../../core/simulation/simulate';
import { healthStage, type HealthStage } from '../../../systems/health/disease';
import { BALANCE } from './config/balance';
import type { GameEvent } from './events';
import type { FarmGame, Pig } from './types';

const RULES = { criticalAfterMs: HEALTH.criticalAfterMs, deathAfterMs: HEALTH.deathAfterMs };

/** How far an illness has come at `at`: ill → critical → dead. */
export const pigStage = (pig: Pig, at: number): HealthStage => healthStage(pig, at, RULES);

const isCriticalOrWorse = (s: HealthStage): boolean => s === 'critical' || s === 'dead';

/** PIG_BECAME_CRITICAL for every pig that crossed into critical (or past it) during this window. */
export function criticalEvents(before: readonly Pig[], after: readonly Pig[], now: number): GameEvent[] {
  const prev = new Map(before.map((p) => [p.id, p]));
  return after.flatMap((p) => {
    const old = prev.get(p.id);
    if (!old || !isCriticalOrWorse(pigStage(p, now))) return [];
    return isCriticalOrWorse(pigStage(old, old.lastTickedAt)) ? [] : [{ type: 'PIG_BECAME_CRITICAL' as const, pigId: p.id }];
  });
}

/**
 * Deaths of the window. `online`: a pig whose illness reached the fatal time dies, unless a grace
 * period is running. `offline`: nobody dies; if a pig is past its time the grace period starts
 * (it ends `deathGraceMs` after the catch-up's end), so the player can still act first.
 */
export function resolveMortality(state: FarmGame, now: number, mode: SimMode): { state: FarmGame; events: GameEvent[] } {
  const doomed = state.pigs.filter((p) => pigStage(p, now) === 'dead');
  if (doomed.length === 0) return { state, events: [] };
  if (mode === 'offline') {
    return { state: { ...state, graceUntil: Math.max(state.graceUntil ?? 0, now + HEALTH.deathGraceMs) }, events: [] };
  }
  if (now < (state.graceUntil ?? 0)) return { state, events: [] };
  const gone = new Set(doomed.map((p) => p.id));
  const memorials = [
    ...doomed.map((p) => ({ id: p.id, name: p.name, breed: p.breed, diedAt: now })),
    ...(state.memorials ?? []),
  ].slice(0, BALANCE.MEMORIALS_MAX);
  return {
    state: { ...state, pigs: state.pigs.filter((p) => !gone.has(p.id)), memorials },
    events: doomed.map((p) => ({ type: 'PIG_DIED' as const, pigId: p.id, name: p.name, breed: p.breed })),
  };
}
