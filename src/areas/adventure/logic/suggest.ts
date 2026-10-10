// What the Adventure suggests the player do now (AreaModule.suggest): meet the knight, finish or close a run, take the loot.
// It cannot see the other Areas' creatures (it has no roster here), so it never says which fighter to send. Pure.
import type { Suggestion } from '../../../core/area-registry/registry';
import type { AdventureState } from './state';

const GO = { target: 'adventure' } as const;

export function adventureSuggestions(a: AdventureState): Suggestion[] {
  const out: Suggestion[] = [];
  if (a.run && a.run.phase !== 'done') out.push({ key: 'suggest.adventure.run', priority: 60, goto: GO });
  if (a.run?.phase === 'done') out.push({ key: 'suggest.adventure.result', priority: 55, goto: GO });
  if (Object.keys(a.pending).length > 0) out.push({ key: 'suggest.adventure.loot', params: { count: Object.values(a.pending).reduce((n, v) => n + v, 0) }, priority: 50, goto: GO });
  if (!a.starterClaimed) out.push({ key: 'suggest.adventure.starter', priority: 66, goto: GO });
  return out;
}
