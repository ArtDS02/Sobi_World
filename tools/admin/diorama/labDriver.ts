// The lab's stand-in for the game's Walker: reads the keys and walks the party with the game's own rules (`walkableOf` for the ground,
// `stepCharacter` for the feet box, the same easing as the game), keeps the companions on the leader's trail and hands the view its
// pose. No collision of its own: what blocks is what the game blocks.
import { stepCharacter, canStand, type Walkable } from '../../../src/systems/character';
import { AB, type AreaMap } from '../../../src/areas/adventure/logic/config/content';
import { walkableOf } from '../../../src/areas/adventure/logic/maps';
import { approachVelocity, unitOf } from '../../../src/areas/adventure/logic/walkMotion';
import type { PartyPose, Face } from '../../../src/areas/adventure/scene/diorama/party';

const GAP_PX = 42;
const KEYS = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

export class LabDriver {
  readonly walk: Walkable;
  private readonly keys = new Set<string>();
  private pos = { x: 0, y: 0 };
  private vel = { x: 0, y: 0 };
  private face: Face = 'down';
  private moving = false;
  private trail: { x: number; y: number }[] = [];

  constructor(
    private readonly map: AreaMap,
    private readonly followers: number,
  ) {
    this.walk = walkableOf(map);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKey);
    this.goto(map.spawn.x, map.spawn.y);
  }

  private onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && ['INPUT', 'SELECT', 'TEXTAREA'].includes(t.tagName)) return;
    const k = e.key.toLowerCase();
    if (!KEYS.includes(k)) return;
    e.preventDefault();
    if (e.type === 'keydown') this.keys.add(k);
    else this.keys.delete(k);
  };

  /** Puts the party on tile (x, y) or the nearest tile it can stand on; the companions line up toward the most open side. */
  goto(x: number, y: number) {
    const t = this.map.tile;
    for (let r = 0; r < 6; r += 1)
      for (let dy = -r; dy <= r; dy += 1)
        for (let dx = -r; dx <= r; dx += 1) {
          const p = { x: (x + dx + 0.5) * t, y: (y + dy + 0.5) * t };
          if (!canStand(p, this.walk)) continue;
          let back = { x: -1, y: 0 };
          let best = -1;
          for (let k = 0; k < 8; k += 1) {
            const d = { x: Math.cos((k / 8) * Math.PI * 2), y: Math.sin((k / 8) * Math.PI * 2) };
            let free = 0;
            while (free < 160 && canStand({ x: p.x + d.x * (free + 8), y: p.y + d.y * (free + 8) }, this.walk)) free += 8;
            if (free > best) [best, back] = [free, d];
          }
          this.pos = p;
          this.vel = { x: 0, y: 0 };
          this.moving = false;
          this.trail = Array.from({ length: 160 }, (_, i) => ({ x: p.x + back.x * i * 1.1, y: p.y + back.y * i * 1.1 }));
          return;
        }
  }

  /** One tick: walks, and returns where everyone stands. */
  step(dtMs: number): PartyPose {
    const k = this.keys;
    const dir = { x: (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0), y: (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0) };
    this.vel = approachVelocity(this.vel, unitOf(dir), dtMs);
    const share = Math.min(1, Math.hypot(this.vel.x, this.vel.y));
    const next = share > 0 ? stepCharacter({ x: this.pos.x, y: this.pos.y, facing: this.face, moving: this.moving }, this.vel, dtMs, AB.explore.speed * share, this.walk) : { ...this.pos, facing: this.face, moving: false };
    const moved = Math.hypot(next.x - this.pos.x, next.y - this.pos.y);
    this.moving = next.moving && moved > 0.01;
    if (!this.moving && share > 0) this.vel = { x: 0, y: 0 };
    this.pos = { x: next.x, y: next.y };
    if (dir.x !== 0 || dir.y !== 0) this.face = Math.abs(dir.x) > Math.abs(dir.y) ? (dir.x > 0 ? 'right' : 'left') : dir.y > 0 ? 'down' : 'up';
    const head = this.trail[0];
    if (moved > 0 && (!head || Math.hypot(this.pos.x - head.x, this.pos.y - head.y) >= 3)) {
      this.trail.unshift({ ...this.pos });
      if (this.trail.length > 200) this.trail.length = 200;
    }
    return {
      leader: { ...this.pos, face: this.face, moving: this.moving },
      share,
      followers: Array.from({ length: this.followers }, (_, i) => this.behind((i + 1) * GAP_PX)),
    };
  }

  /** The point `d` px back along the leader's trail. */
  private behind(d: number): { x: number; y: number } {
    let left = d;
    let prev = this.pos;
    for (const p of this.trail) {
      const seg = Math.hypot(p.x - prev.x, p.y - prev.y);
      if (seg >= left) {
        const k = left / Math.max(1e-6, seg);
        return { x: prev.x + (p.x - prev.x) * k, y: prev.y + (p.y - prev.y) * k };
      }
      left -= seg;
      prev = p;
    }
    return prev;
  }

  dispose() {
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKey);
  }
}
