// What the Aquarium suggests the player do now (AreaModule.suggest): ill fish first, then hungry fish, cloudy water,
// scales to collect, the rod. Pure.
import type { Suggestion } from '../../../core/area-registry/registry';
import { castCooldownLeft } from './derived';
import { fishHealth } from './fishLife';
import type { AquariumState } from './state';

const GO = { target: 'aquarium' } as const;

export function aquariumSuggestions(a: AquariumState, now: number): Suggestion[] {
  const out: Suggestion[] = [];
  const critical = a.fish.filter((f) => ['critical'].includes(fishHealth(f, now)));
  const sick = a.fish.filter((f) => f.isSick && !critical.includes(f));
  if (critical.length > 0) out.push({ key: 'suggest.aquarium.critical', params: { name: critical[0]!.name }, priority: 95, tone: 'alert', goto: GO });
  if (sick.length > 0) out.push({ key: 'suggest.aquarium.treat', params: { name: sick[0]!.name }, priority: 85, tone: 'warn', goto: GO });
  const hungry = a.fish.filter((f) => f.hunger < 30).length;
  if (hungry > 0) out.push({ key: 'suggest.aquarium.feed', params: { count: hungry }, priority: 70, goto: GO });
  if (a.tank.water < 35) out.push({ key: 'suggest.aquarium.water', priority: 60, goto: GO });
  if (a.tank.scales > 0) out.push({ key: 'suggest.aquarium.scales', params: { count: a.tank.scales }, priority: 30, goto: GO });
  if (a.eggs.some((e) => e.hatchAt <= now)) out.push({ key: 'suggest.aquarium.eggWaits', priority: 40, goto: GO });
  if (castCooldownLeft(a, now) === 0) out.push({ key: 'suggest.aquarium.fish', priority: 22, goto: GO });
  return out;
}
