// What the Aquarium's screens and scene read off its state (derived, never stored).
import { dayPeriod } from '../../../core/clock';
import { TIME } from '../../../core/config/time';
import { AB, FISH, TANK_LEVELS, MAX_TANK_LEVEL, tankCapacity } from './config/content';
import { fishHealth, fishStage, isAdult, isGrown, isPet } from './fishLife';
import { scalesCap } from './simulate';
import type { AquariumState, Fish } from './state';

/** Is it the night period (the fish that bite only then, the lights in the scene)? */
export const isNightNow = (now: number, dayOffsetMs: number): boolean => dayPeriod(now, dayOffsetMs, TIME) === 'night';

/** Milliseconds until the rod can be cast again (0 = ready). */
export const castCooldownLeft = (a: Pick<AquariumState, 'lastCastAt'>, now: number): number =>
  a.lastCastAt === null ? 0 : Math.max(0, a.lastCastAt + AB.fishing.cooldownSec * 1000 - now);

export const tankFree = (a: Pick<AquariumState, 'tank' | 'fish'>): number => Math.max(0, tankCapacity(a.tank.level) - a.fish.length);

/** The next tank level, its price and materials, or null at the top. */
export function nextTankLevel(a: Pick<AquariumState, 'tank'>): { level: number; capacity: number; price: number; materials: Readonly<Record<string, number | undefined>> } | null {
  if (a.tank.level >= MAX_TANK_LEVEL) return null;
  const row = TANK_LEVELS[a.tank.level]!;
  return { level: a.tank.level + 1, capacity: row.capacity, price: row.price, materials: row.materials };
}

export const scalesRoom = (a: Pick<AquariumState, 'tank'>): number => Math.max(0, scalesCap(a.tank.level) - a.tank.scales);

/** A fish as the scene and the panel show it. */
export interface FishView {
  id: string;
  species: string;
  name: string;
  stage: ReturnType<typeof fishStage>;
  /** Growth progress, 0-100. */
  growth: number;
  hunger: number;
  cleanliness: number;
  sick: boolean;
  critical: boolean;
  adult: boolean;
  grown: boolean;
  pet: boolean;
  hearts: number;
}

export interface SceneState {
  fish: FishView[];
  water: number;
  level: number;
  scales: number;
  eggs: number;
  night: boolean;
  castReady: boolean;
}

export const fishView = (f: Fish, now: number): FishView => ({
  id: f.id,
  species: f.breed,
  name: f.name,
  stage: fishStage(f),
  growth: f.growthProgress,
  hunger: f.hunger,
  cleanliness: f.cleanliness,
  sick: f.isSick,
  critical: ['critical', 'dead'].includes(fishHealth(f, now)),
  adult: isAdult(f),
  grown: isGrown(f),
  pet: isPet(f),
  hearts: Math.floor((f.bond ?? 0) / 20),
});

export const sceneState = (a: AquariumState, now: number, dayOffsetMs: number): SceneState => ({
  fish: a.fish.map((f) => fishView(f, now)),
  water: a.tank.water,
  level: a.tank.level,
  scales: a.tank.scales,
  eggs: a.eggs.length,
  night: isNightNow(now, dayOffsetMs),
  castReady: castCooldownLeft(a, now) === 0,
});

/** Display name of a species (content). */
export const speciesName = (id: string): string => FISH[id]?.nameVi ?? id;
