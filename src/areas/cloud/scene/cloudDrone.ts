// The fertiliser drone over the Cloud (decision 028): when flowers of the tier on screen gain fertiliser, the drone flies
// from the cauldron's bank over each of them and their fertilised look shows as it passes (ui/world/fertilizerDrone).
import type * as Phaser from 'phaser';
import { flyDrone } from '../../../ui/world/fertilizerDrone';
import { PLOTS_PER_TIER } from '../logic/config/content';
import type { SceneState } from '../logic/derived';
import { CLOUD_VIEW, plotIndex } from './cloudView';

export interface DroneDeps {
  /** Where slot `slot` of the tier is on screen now. */
  centre: (slot: number) => { x: number; y: number };
  reduceMotion: () => boolean;
  /** A slot's flower now shows its fertiliser. */
  show: (slot: number) => void;
}

export class CloudDrone {
  /** Fertiliser seen per slot at the last draw ("flowerId:0/1"). */
  private readonly seen = new Map<number, string>();
  private readonly waiting = new Set<number>();
  private stop: (() => void) | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly d: DroneDeps,
  ) {}

  /** The slot's fertilised look waits for the drone. */
  holding = (slot: number): boolean => this.waiting.has(slot);

  /** Before a draw of `tier`: flowers that gained fertiliser since the last one call the drone. */
  check(state: SceneState, tier: number, busy: boolean) {
    const fresh: number[] = [];
    for (let slot = 0; slot < PLOTS_PER_TIER; slot += 1) {
      const p = state.plots[plotIndex(tier, slot)];
      if (p?.flowerId && p.fertilized && this.seen.get(slot) === `${p.flowerId}:0`) fresh.push(slot);
      this.seen.set(slot, p?.flowerId ? `${p.flowerId}:${p.fertilized ? 1 : 0}` : '');
    }
    if (fresh.length === 0 || this.stop || busy || this.d.reduceMotion()) return;
    const v = CLOUD_VIEW.drone;
    for (const slot of fresh) this.waiting.add(slot);
    this.stop = flyDrone(this.scene, {
      art: v.art,
      from: v.from,
      stops: fresh.map((slot) => this.d.centre(slot)),
      exit: v.exit,
      hoverY: v.hoverY,
      speed: v.speed,
      dropMs: v.dropMs,
      size: v.size,
      depth: CLOUD_VIEW.depth.bird + 10,
      puff: [0xb59ad8, 0xfff3c4, 0x9fd8a8],
      onVisit: (k) => this.release(fresh[k]!),
      done: () => {
        this.stop = null;
        for (const slot of [...this.waiting]) this.release(slot);
      },
    });
  }

  /** The tier changed or the scene sleeps: the drone leaves, every flower shows its look, nothing is remembered. */
  reset() {
    this.stop?.();
    this.seen.clear();
  }

  private release(slot: number) {
    this.waiting.delete(slot);
    this.d.show(slot);
  }
}
