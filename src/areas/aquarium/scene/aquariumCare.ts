// The care the player gives, as the Aquarium scene shows it (decision 033), read off the state like the Garden's
// harvest: a fish whose last meal is new gets food brought by the food drone (pellets it then chases), and water that
// rose is a water change — the water drone flies over and pours, then the murk clears; a fish that was ill and is
// not any more was treated — a medicine shot pokes it (ui/world/syringe.ts), then it sparkles. Presentation only.
import type * as Phaser from 'phaser';
import { flyDrone } from '../../../ui/world/fertilizerDrone';
import { textureKey } from '../../../ui/world/keys';
import { playSyringe } from '../../../ui/world/syringe';
import type { WorldRect } from '../../../systems/layout/camera';
import type { SceneState } from '../logic/derived';
import type { AquariumFx } from './aquariumFx';
import { AQUARIUM_VIEW, murkAlpha, type AquariumPlace } from './aquariumView';
import { nextLeg, type Swimmer } from './fishSwim';

export interface AquariumCareDeps {
  fx: AquariumFx;
  murk: Phaser.GameObjects.Rectangle;
  swimmers: () => Iterable<Swimmer>;
  fish: (id: string) => Swimmer | undefined;
  place: () => AquariumPlace;
  view: () => WorldRect;
  reduceMotion: () => boolean;
}

export class AquariumCare {
  /** Water clarity at the last look (null before the first): a jump up is a water change. */
  private lastWater: number | null = null;
  /** Who was ill at the last look: a fish that is well now was just cured. */
  private sickSeen = new Map<string, boolean>();
  /** Flying drones (each entry stops one). */
  private drones = new Set<() => void>();
  /** The water drone is on its way: the murk stays as it was until it pours. */
  murkHeld = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly d: AquariumCareDeps,
  ) {}

  /**
   * What care just happened, read off the state: fish whose last meal is new get pellets to chase (sprinkled over
   * them), and water that rose is a water change. The first look after entering only takes note.
   */
  notice(state: SceneState) {
    const calm = this.d.reduceMotion();
    const fed: Swimmer[] = [];
    for (const f of state.fish) {
      const s = this.d.fish(f.id);
      if (!s || f.fedAt === s.fedAt) continue;
      s.fedAt = f.fedAt;
      fed.push(s);
    }
    if (fed.length > 0 && !calm) this.feedByDrone(fed);
    const cured: Swimmer[] = [];
    for (const f of state.fish) {
      const s = this.d.fish(f.id);
      if (s && this.sickSeen.get(f.id) === true && !f.sick) cured.push(s);
      this.sickSeen.set(f.id, f.sick);
    }
    if (cured.length > 0 && !calm) this.inject(cured);
    const before = this.lastWater;
    this.lastWater = state.water;
    if (before === null || state.water - before < 5 || calm) return;
    this.waterByDrone(murkAlpha(before), murkAlpha(state.water));
  }

  /**
   * The craft that brings `job`: a drone over the surface, a submarine in the deep sea (no surface) — at its art id
   * when painted, else its stand-in (a drone of another Area).
   */
  private droneArt(job: 'feed' | 'water'): string {
    const d = AQUARIUM_VIEW.drone;
    const c = this.d.place().surface ? d[job] : d.sub[job];
    return this.scene.textures.exists(textureKey(c.art)) ? c.art : c.stand;
  }

  private fly(art: string, x: number, holdMs: number, puff: readonly number[], arrive: (at: { x: number; y: number }) => void) {
    const d = AQUARIUM_VIEW.drone;
    const w = this.d.place().water;
    const v = this.d.view();
    // A drone comes in high and hovers over the surface; a submarine glides in level, under the top of the water.
    const deep = !this.d.place().surface;
    const top = deep ? w.top + d.sub.diveY + d.hoverY : w.top;
    const at = { x, y: top - d.hoverY };
    const stop = flyDrone(this.scene, {
      art,
      from: { x: v.x - d.size, y: top - d.hoverY - (deep ? 0 : 120) },
      stops: [{ x, y: top }],
      exit: { x: v.x + v.width + d.size, y: top - d.hoverY - (deep ? 0 : 160) },
      hoverY: d.hoverY,
      speed: d.speed,
      dropMs: holdMs,
      size: d.size,
      depth: AQUARIUM_VIEW.depth.drone,
      puff,
      onVisit: () => arrive(at),
      done: () => this.drones.delete(stop),
    });
    this.drones.add(stop);
  }

  /** The food drone flies over the fish that just ate and shakes pellets out; then they go for them. */
  private feedByDrone(fed: Swimmer[]) {
    const d = AQUARIUM_VIEW.drone;
    const { perFish, max, spread } = AQUARIUM_VIEW.feed;
    const w = this.d.place().water;
    const share = Math.max(1, Math.floor(Math.min(max, fed.length * perFish) / fed.length));
    const mid = fed.reduce((sum, s) => sum + s.m.x, 0) / fed.length;
    const x = Math.min(w.right - spread, Math.max(w.left + spread, mid));
    this.fly(this.droneArt('feed'), x, d.feedMs, d.puffFeed, (at) => {
      this.d.fx.feed(fed.length, at.x, w, at.y + d.size * 0.3);
      for (const s of fed) s.appetite = share;
    });
  }

  /** The water drone hovers at the left of the water and pours; the murk waits for it, then clears. */
  private waterByDrone(from: number, to: number) {
    const d = AQUARIUM_VIEW.drone;
    const w = this.d.place().water;
    this.murkHeld = true;
    this.d.murk.setAlpha(from);
    const x = w.left + (w.right - w.left) * AQUARIUM_VIEW.water.pourAt;
    this.fly(this.droneArt('water'), x, AQUARIUM_VIEW.water.pourMs, d.puffWater, (at) => {
      this.murkHeld = false;
      this.d.murk.setAlpha(to);
      this.d.fx.changeWater(w, this.d.place().murk, this.d.murk, from, this.d.view(), at.y + d.size * 0.28);
      const { happyFactor, happyMs } = AQUARIUM_VIEW.water;
      for (const s of this.d.swimmers()) {
        s.hurry(this.scene.time.now, happyFactor, happyMs);
        const leg = nextLeg(s.rng, s.m, w, s.mood);
        s.tx = leg.x;
        s.ty = leg.y;
      }
    });
  }

  /** A shot for each cured fish, one after another; it follows the fish as it swims, then the fish sparkles. */
  private inject(cured: Swimmer[]) {
    const v = AQUARIUM_VIEW.treat;
    cured.forEach((s, i) => {
      const end = playSyringe(this.scene, { at: { x: s.m.x, y: s.m.y }, follow: () => ({ x: s.m.x, y: s.m.y }), delayMs: i * v.staggerMs, depth: AQUARIUM_VIEW.depth.sparkle, px: v.px });
      for (let k = 0; k < v.sparkles; k += 1) {
        const [dx, dy] = [((k % 2) * 2 - 1) * 30, (k < v.sparkles / 2 ? -1 : 1) * 22];
        this.scene.time.delayedCall(end, () => this.d.fx.sparkle(s.m.x + dx, s.m.y + dy, k * 90));
      }
    });
  }

  /** Sends the drones home and drops the effects (another place, the scene asleep). */
  calmDown() {
    for (const stop of [...this.drones]) stop();
    this.drones.clear();
    this.murkHeld = false;
    this.d.fx.clear();
    this.lastWater = null;
    this.sickSeen.clear();
  }
}
