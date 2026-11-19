// What makes the diorama's one-shot bursts happen: dust at the party's feet as it walks, rings on the water (the bank under the
// party, fish jumping near the view, frogs, the feet of foes standing in water). Timing only; the pools live in bursts.ts.
import type * as THREE from 'three';
import type { Bursts } from './bursts';
import { deckAt, type Deck } from './decks';
import { weightsAt, type Grid } from './field';
import type { Foes } from './foes';
import { hash2 } from './noise';

export class BurstDriver {
  private stepClock = 0;
  private splashClock = 0;

  update(bursts: Bursts, g: Grid, decks: readonly Deck[], foes: Foes, view: THREE.Vector3, at: THREE.Vector3, t: number, dt: number, moving: boolean) {
    this.stepClock += dt;
    if (moving && this.stepClock > 0.24) {
      this.stepClock = 0;
      if (weightsAt(g, at.x, at.z + 0.3)[2] > 0.35 && !deckAt(decks, at.x, at.z)) bursts.ripple(at.x, at.z + 0.2, 0.55);
      else bursts.puff(at.x + (hash2(Math.round(t * 50), 1) - 0.5) * 0.3, at.y, at.z + 0.1, 0.38);
    }
    this.splashClock += dt;
    if (this.splashClock > 1.3) {
      this.splashClock = 0;
      for (let i = 0; i < 6; i += 1) {
        const x = view.x + (hash2(Math.round(t * 10), i, 2) - 0.5) * 30;
        const z = view.z + (hash2(Math.round(t * 10), i, 3) - 0.5) * 18;
        if (weightsAt(g, x, z)[2] > 0.92) {
          bursts.ripple(x, z, 0.9);
          break;
        }
      }
      for (const f of foes.foes) if (!f.state.defeated && weightsAt(g, f.x, f.z)[2] > 0.4) bursts.ripple(f.x, f.z, 1.1);
    }
    bursts.update(t);
  }
}
