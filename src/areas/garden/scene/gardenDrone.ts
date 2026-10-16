// The fertiliser drone over the Garden (decision 028): when plots of the zone on screen gain fertiliser, the drone flies
// from the composter over each of them in a snake order (row by row) and their fertilised look shows as it passes
// (ui/world/fertilizerDrone). Presentation only.
import type * as Phaser from 'phaser';
import { flyDrone } from '../../../ui/world/fertilizerDrone';
import { PLOTS_PER_ZONE } from '../logic/config/content';
import type { SceneState } from '../logic/derived';
import type { GardenField } from './gardenField';
import { GARDEN_VIEW, plotIndex } from './gardenView';

export class GardenDrone {
  /** Fertiliser seen per slot of the zone at the last draw ("cropId:0/1"). */
  private readonly seen = new Map<number, string>();
  private stop: (() => void) | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly field: GardenField,
    private readonly reduceMotion: () => boolean,
  ) {}

  /** Before a draw of `zone`: plots that gained fertiliser since the last one (same crop) call the drone. */
  check(state: SceneState, zone: number, busy: boolean) {
    const fresh: number[] = [];
    for (let slot = 0; slot < PLOTS_PER_ZONE; slot += 1) {
      const p = state.plots[plotIndex(zone, slot)];
      if (p?.cropId && p.fertilized && this.seen.get(slot) === `${p.cropId}:0`) fresh.push(slot);
      this.seen.set(slot, p?.cropId ? `${p.cropId}:${p.fertilized ? 1 : 0}` : '');
    }
    if (fresh.length > 0 && !this.stop && !busy && !this.reduceMotion()) this.send(fresh);
  }

  /** The zone changed or the scene sleeps: the drone leaves, every plot shows its look, nothing is remembered. */
  reset() {
    this.stop?.();
    this.seen.clear();
  }

  private send(slots: number[]) {
    const d = GARDEN_VIEW.drone;
    const cols = GARDEN_VIEW.columns;
    const order = [...slots].sort((a, b) => {
      const ra = Math.floor(a / cols);
      const rb = Math.floor(b / cols);
      return ra !== rb ? ra - rb : ra % 2 === 0 ? a - b : b - a;
    });
    this.field.hold(order);
    this.stop = flyDrone(this.scene, {
      art: d.art,
      from: d.from,
      stops: order.map((slot) => this.field.centre(slot)),
      exit: d.exit,
      hoverY: d.hoverY,
      speed: d.speed,
      dropMs: d.dropMs,
      size: d.size,
      depth: GARDEN_VIEW.depth.drone,
      onVisit: (k) => this.field.release(order[k]!, this.reduceMotion()),
      done: () => {
        this.stop = null;
        this.field.releaseAll();
      },
    });
  }
}
