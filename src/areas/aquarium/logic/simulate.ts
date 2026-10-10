// The Aquarium's numbers over time (ARCHITECTURE §5–6): closed form, the same call for every mode. The water clouds,
// fish grow, get hungry, shed scales and may fall ill; eggs hatch when there is room. Nothing here needs `rng`:
// time is the only input (the children are fixed when the eggs are laid).
import { HEALTH } from '../../../core/config/health';
import type { SimMode } from '../../../core/simulation/simulate';
import { hashSeed } from '../../../core/rng';
import type { WorldSave } from '../../../core/save/world';
import { AB, FISH_NAMES, TANK_LEVELS, tankCapacity } from './config/content';
import type { AquariumEvent } from './events';
import { advanceFish, fishHealth, waterLossPerHour } from './fishLife';
import { aquariumOf, withAquarium } from './save/lens';
import type { AquariumState, Fish, FishEgg } from './state';

const HOUR = 3_600_000;
const MEMORIALS_MAX = 50;

export const scalesCap = (level: number): number => tankCapacity(level) * AB.tank.scalesPerSlot;
export const waterFactor = (level: number): number => TANK_LEVELS[Math.min(level, TANK_LEVELS.length) - 1]!.waterFactor;

/** The fry of a hatched egg: born at `at`, hungry enough to want food soon, in the tank's own water. */
export function hatchling(egg: FishEgg, at: number, water: number): Fish {
  return {
    id: `fish-${egg.id}`,
    breed: egg.species,
    name: FISH_NAMES[hashSeed(egg.id, 'name') % FISH_NAMES.length]!,
    gender: egg.gender,
    growthProgress: 0,
    hunger: 80,
    cleanliness: water,
    isSick: false,
    generation: egg.generation,
    ...(egg.traits.length > 0 ? { traits: egg.traits } : {}),
    ...(egg.hiddenTrait ? { hiddenTrait: egg.hiddenTrait } : {}),
    ...(egg.lineage ? { lineage: egg.lineage } : {}),
    createdAt: at,
    lastTickedAt: at,
  };
}

/** Eggs due by `at` hatch while there is room in the tank; the rest wait. */
function hatch(a: AquariumState, at: number, events: AquariumEvent[]): AquariumState {
  const due = a.eggs.filter((e) => e.hatchAt <= at).sort((x, y) => x.hatchAt - y.hatchAt);
  const room = tankCapacity(a.tank.level) - a.fish.length;
  if (due.length === 0 || room <= 0) return a;
  const born = due.slice(0, room);
  const fry = born.map((e) => hatchling(e, Math.max(e.hatchAt, a.lastTickedAt), a.tank.water));
  for (const f of fry) events.push({ type: 'AQUARIUM_EGG_HATCHED', fishId: f.id, speciesId: f.breed, name: f.name });
  const gone = new Set(born.map((e) => e.id));
  return { ...a, fish: [...a.fish, ...fry], eggs: a.eggs.filter((e) => !gone.has(e.id)) };
}

/** The tank advanced to `end`: with the fish it has now, nothing joins it inside the span. */
function advanceSpan(a: AquariumState, end: number, dayOffsetMs: number, createdAt: number, events: AquariumEvent[]): AquariumState {
  if (end <= a.lastTickedAt) return a;
  const hours = (end - a.lastTickedAt) / HOUR;
  const rate = waterLossPerHour(a.fish.length, waterFactor(a.tank.level));
  let shed = 0;
  const fish = a.fish.map((f) => {
    const next = advanceFish(f, end, rate, dayOffsetMs, createdAt);
    shed += Math.floor(next.poopProgress ?? 0) - Math.floor(f.poopProgress ?? 0);
    if (!f.isSick && next.isSick) events.push({ type: 'AQUARIUM_FISH_SICK', fishId: f.id });
    if (fishHealth(f, f.lastTickedAt) !== 'critical' && fishHealth(next, end) === 'critical') events.push({ type: 'AQUARIUM_FISH_CRITICAL', fishId: f.id });
    return next;
  });
  const cap = scalesCap(a.tank.level);
  const scales = Math.min(cap, a.tank.scales + Math.max(0, shed));
  if (scales > a.tank.scales) events.push({ type: 'AQUARIUM_SCALES_SHED', count: scales - a.tank.scales });
  return { ...a, fish, tank: { ...a.tank, water: Math.max(0, a.tank.water - rate * hours), scales }, lastTickedAt: end };
}

/**
 * Illness left alone turns critical, then fatal (decisions 002, 004). `online`: a fish at its fatal time dies unless
 * a grace period runs. `offline`: nobody dies; a fish past its time only starts the grace period (counted from now).
 */
function mortality(a: AquariumState, now: number, mode: SimMode, events: AquariumEvent[]): AquariumState {
  const doomed = a.fish.filter((f) => fishHealth(f, now) === 'dead');
  if (doomed.length === 0) return a;
  if (mode === 'offline') return { ...a, graceUntil: Math.max(a.graceUntil ?? 0, now + HEALTH.deathGraceMs) };
  if (now < (a.graceUntil ?? 0)) return a;
  const gone = new Set(doomed.map((f) => f.id));
  for (const f of doomed) events.push({ type: 'AQUARIUM_FISH_DIED', fishId: f.id, name: f.name, speciesId: f.breed });
  return {
    ...a,
    fish: a.fish.filter((f) => !gone.has(f.id)),
    memorials: [...doomed.map((f) => ({ id: f.id, name: f.name, breed: f.breed, diedAt: now })), ...a.memorials].slice(0, MEMORIALS_MAX),
  };
}

/** The slice caught up to `now` (never backwards), and what happened on the way. */
export function simulateAquarium(
  a: AquariumState,
  now: number,
  mode: SimMode,
  dayOffsetMs: number,
  createdAt: number,
): { state: AquariumState; events: AquariumEvent[] } {
  if (now <= a.lastTickedAt) return { state: a, events: [] };
  const events: AquariumEvent[] = [];
  let state = hatch(a, a.lastTickedAt, events); // eggs that were waiting for a free place
  // Each hatching inside the span changes the number of fish, so the span is cut there.
  const cuts = [...new Set(state.eggs.map((e) => e.hatchAt).filter((t) => t > state.lastTickedAt && t < now))].sort((x, y) => x - y);
  for (const cut of cuts) {
    state = advanceSpan(state, cut, dayOffsetMs, createdAt, events);
    state = hatch(state, cut, events);
  }
  state = advanceSpan(state, now, dayOffsetMs, createdAt, events);
  state = hatch(state, now, events);
  state = mortality(state, now, mode, events);
  return { state, events };
}

export function advanceAquariumWorld(
  world: WorldSave,
  now: number,
  dayOffsetMs: number,
  mode: SimMode,
): { state: WorldSave; events: AquariumEvent[] } {
  const r = simulateAquarium(aquariumOf(world), now, mode, dayOffsetMs, world.meta.createdAt);
  return { state: r.state === aquariumOf(world) ? world : withAquarium(world, r.state), events: r.events };
}
