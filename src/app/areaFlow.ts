// Moving between the plaza and the Areas (spec §3, §4; GĐ3): the place on screen changes, the Area left runs
// its onExit hook and the Area entered its onEnter hook. Only the presentation changes — the numbers of
// every Area run the same formula whichever place the player is in (ARCHITECTURE §6).
import type { AreaModule } from '../core/area-registry/registry';
import { PLAZA_ID } from '../core/player/player';

/** The plaza is not an Area (no numbers, no save slice): the app gives its two hooks. */
export interface PlazaPlace {
  /** `from` = the Area just left (the character comes out of its door), null at the game start. */
  enter(from: string | null): void;
  exit(): void;
}

export interface AreaFlowDeps {
  plaza: PlazaPlace;
  /** A built Area's hooks; undefined for an id that is not built. */
  area: (id: string) => Pick<AreaModule, 'onEnter' | 'onExit'> | undefined;
  /** After a change of place (the HUD follows, the spot is kept). */
  changed: (to: string, from: string) => void;
}

export interface AreaFlow {
  current(): string;
  /** Goes to the plaza or a built Area; false (nothing happens) for the same place or an unknown one. */
  go(to: string): boolean;
}

export function createAreaFlow(deps: AreaFlowDeps, start: string = PLAZA_ID): AreaFlow {
  let current = start;
  const leave = (id: string) => (id === PLAZA_ID ? deps.plaza.exit() : deps.area(id)?.onExit?.());
  const enter = (id: string, from: string) => (id === PLAZA_ID ? deps.plaza.enter(from) : deps.area(id)?.onEnter?.());
  return {
    current: () => current,
    go(to) {
      if (to === current || (to !== PLAZA_ID && !deps.area(to))) return false;
      const from = current;
      leave(from);
      current = to;
      enter(to, from);
      deps.changed(to, from);
      return true;
    },
  };
}
