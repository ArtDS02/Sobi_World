// The world store as the farm's screens and scene see it: snapshots carry the farm's working state
// (FarmGame, save/lens.ts) and farm actions are lifted onto the world save. Everything else (events,
// backups, import…) is the world store itself.
import type { CatchupInfo, EventOrigin, GameStore, StoreSnapshot } from '../../core/world/gameStore';
import type { ActionResultOf } from '../../core/types';
import type { WorldSave } from '../../core/save/world';
import { farmOf } from './logic/save/lens';
import type { GameEvent } from './logic/events';
import type { ActionResult, FarmGame } from './logic/types';
import { liftFarmAction, type FarmAction } from './logic/world';

export type { CatchupInfo, EventOrigin, StoreStatus } from '../../core/world/gameStore';
/** The store's events as the farm reads them. Another Area's events have types the farm's
 * consumers do not know and ignore (their switches fall through to nothing). */
export type EventListener = (events: GameEvent[], origin: EventOrigin, catchup?: CatchupInfo) => void;
/** A farm action bound to its arguments, e.g. `(s, c) => buyPig(s, args, c)`. */
export type BoundAction = FarmAction;

export interface FarmSnapshot extends Omit<StoreSnapshot, 'save'> {
  save: FarmGame | null;
}

export type FarmStore = Omit<GameStore, 'getSnapshot' | 'subscribe' | 'onEvents' | 'dispatch' | 'importSave'> & {
  onEvents(fn: EventListener): () => void;
  getSnapshot(): FarmSnapshot;
  subscribe(fn: (s: FarmSnapshot) => void): () => void;
  dispatch(action: BoundAction): Promise<ActionResult>;
  importSave(json: string): Promise<ActionResult>;
  /** The whole world save (export writes the world, not the farm view). */
  worldSave(): WorldSave | null;
};

const farmResult = (r: ActionResultOf<WorldSave>): ActionResult =>
  r.ok ? { ...r, state: farmOf(r.state), events: r.events as GameEvent[] } : r;

export function farmStore(store: GameStore): FarmStore {
  let lastWorld: StoreSnapshot | null = null;
  let lastFarm: FarmSnapshot | null = null;
  /** One farm snapshot per world snapshot: readers keep comparing references. */
  const view = (s: StoreSnapshot): FarmSnapshot => {
    if (s !== lastWorld) {
      lastWorld = s;
      lastFarm = { ...s, save: s.save ? farmOf(s.save) : null };
    }
    return lastFarm!;
  };
  return {
    ...store,
    getSnapshot: () => view(store.getSnapshot()),
    subscribe: (fn) => store.subscribe((s) => fn(view(s))),
    onEvents: (fn) => store.onEvents((events, origin, catchup) => fn(events as GameEvent[], origin, catchup)),
    dispatch: async (action) => farmResult(await store.dispatch(liftFarmAction(action))),
    importSave: async (json) => farmResult(await store.importSave(json)),
    worldSave: () => store.getSnapshot().save,
  };
}
