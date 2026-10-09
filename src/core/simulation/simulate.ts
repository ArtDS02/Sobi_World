// The world simulation (ARCHITECTURE §6): the same call for every mode. It catches every Area up to
// `now` slice by slice (each Area's own `simulate` hook, closed form inside a slice), keeps within the
// offline cap and never runs time backwards. Pure: time and randomness come in as arguments.
import { awayWindow, type TimeRules } from '../clock';
import type { EventBase } from '../events';
import type { Rng } from '../rng';
import type { WorldSave } from '../save/world';
import { sliceEnds } from './slices';

/**
 * `online` = the game is open, `offline` = catching up after it was closed or hidden. One formula for
 * both; the mode only switches rules such as "nothing dies during a catch-up" (DECISIONS 004).
 */
export type SimMode = 'online' | 'offline';

/** What the simulation needs from an Area (core/area-registry's AreaModule satisfies it). */
export interface Simulated {
  simulate(world: WorldSave, now: number, rng: Rng, dayOffsetMs: number, mode: SimMode): { state: WorldSave; events: EventBase[] };
  /** Time the Area was last simulated up to. */
  simulatedAt(world: WorldSave): number;
  /** Moves the Area's time stamps to `to` without simulating (the part over the offline cap is skipped). */
  rebase(world: WorldSave, to: number): WorldSave;
}

export interface SimulationResult {
  state: WorldSave;
  events: EventBase[];
  /** The clock is set back: nothing was simulated (the caller warns the player). */
  rewound: boolean;
  /** The away time exceeded the cap: only its first part was simulated. */
  capped: boolean;
}

export function simulateWorld(
  areas: readonly Simulated[],
  world: WorldSave,
  now: number,
  rng: Rng,
  dayOffsetMs: number,
  mode: SimMode,
  rules: TimeRules,
): SimulationResult {
  const last = Math.min(...areas.map((a) => a.simulatedAt(world)));
  const span = awayWindow(last, now, rules);
  if (span.rewound) return { state: world, events: [], rewound: true, capped: false };

  const events: EventBase[] = [];
  let state = world;
  for (const end of sliceEnds(span.from, span.to, dayOffsetMs, rules.stepMs[mode])) {
    for (const area of areas) {
      const r = area.simulate(state, end, rng, dayOffsetMs, mode);
      state = r.state;
      events.push(...r.events);
    }
  }
  if (span.capped) state = areas.reduce((s, a) => a.rebase(s, now), state);
  return { state, events, rewound: false, capped: span.capped };
}
