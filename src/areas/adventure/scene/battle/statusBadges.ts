// The statuses of the fighters on the battle stage (decision 044 status_overlay): up to three badges (`st_…`) floating by the head
// (more take turns), the body coloured while a status says so, a frame of a strip laid over it (the ice of Freeze), and the little
// loop a status plays while it lasts (a spore rising from a poisoned unit…). With reduced motion the badges stay, still; nothing loops.
import type * as Phaser from 'phaser';
import type { StatusId } from '../../../../systems/combat/types';
import { BATTLE_FX } from '../../logic/config/content';
import { loopCues } from '../../ui/battleScript';
import type { ScriptCue } from '../../ui/battleScript';
import { AIR_DEPTH } from './fxBursts';
import type { FxAnchor } from './fxPlayer';

const SHOWN = 3;
const TURN_MS = 1600;

interface Held {
  badges: Phaser.GameObjects.Image[];
  cover: Phaser.GameObjects.Image | null;
  /** When each status of the unit last played its loop. */
  looped: Map<string, number>;
}

export class StatusBadges {
  private held = new Map<string, Held>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly want: (id: string) => void,
  ) {}

  /** The colour a status gives the body of the unit now (the last one that has one), or null. */
  tintOf(statuses: readonly string[]): number | null {
    let tint: number | null = null;
    for (const s of statuses) {
      const t = BATTLE_FX.statuses[s as StatusId]?.tint;
      if (t) tint = t.color;
    }
    return tint;
  }

  /** Draws the badges of every unit at `now`; returns the loops due now (played by the caller unless motion is reduced). */
  update(units: readonly { id: string; statuses: readonly string[]; down: boolean }[], anchors: ReadonlyMap<string, FxAnchor>, now: number, reduce: boolean): ScriptCue[] {
    const due: ScriptCue[] = [];
    const seen = new Set<string>();
    for (const u of units) {
      seen.add(u.id);
      const a = anchors.get(u.id);
      const h: Held = this.held.get(u.id) ?? { badges: [], cover: null, looped: new Map() };
      this.held.set(u.id, h);
      const icons = u.down || !a ? [] : u.statuses.map((s) => BATTLE_FX.statuses[s as StatusId]?.icon).filter((x): x is string => !!x);
      for (const icon of icons) this.want(icon);
      const ready = icons.filter((i) => this.scene.textures.exists(i));
      // More than three take turns, three at a time.
      const turn = ready.length > SHOWN ? Math.floor(now / TURN_MS) % Math.ceil(ready.length / SHOWN) : 0;
      const shown = ready.slice(turn * SHOWN, turn * SHOWN + SHOWN);
      while (h.badges.length < shown.length) h.badges.push(this.scene.add.image(0, 0, shown[h.badges.length]!).setDepth(AIR_DEPTH - 5));
      h.badges.forEach((b, i) => {
        const key = shown[i];
        if (!key || !a) return void b.setVisible(false);
        if (b.texture.key !== key) b.setTexture(key);
        const size = Math.max(22, a.width * 0.26);
        const dir = a.side === 'ally' ? 1 : -1;
        const bob = reduce ? 0 : Math.sin(now / 420 + i * 1.3) * 3;
        b.setVisible(true).setDisplaySize(size, size).setPosition(a.head.x + dir * (a.width * 0.3 + i * size * 0.9), a.feet.y - a.height * 0.98 + bob - i * 4);
      });
      // A strip frame laid over the body (Freeze).
      const cover = u.down ? null : u.statuses.map((s) => BATTLE_FX.statuses[s as StatusId]?.cover).find((c) => !!c) ?? null;
      if (cover && a) {
        this.want(cover.img);
        if (this.scene.textures.exists(cover.img)) {
          const frame = Math.min(cover.frame, this.scene.textures.get(cover.img).frameTotal - 2);
          h.cover ??= this.scene.add.image(0, 0, cover.img, frame);
          h.cover.setTexture(cover.img, frame).setVisible(true).setDepth(1000 + a.feet.y + 0.5).setAlpha(cover.alpha).setPosition(a.chest.x, a.feet.y - a.height * 0.48).setDisplaySize(a.width * 1.15, a.height * 1.1);
        }
      } else h.cover?.setVisible(false);
      if (reduce || u.down) continue;
      for (const s of u.statuses) {
        const loop = BATTLE_FX.statuses[s as StatusId]?.loop;
        if (!loop) continue;
        const last = h.looped.get(s);
        if (last === undefined) {
          // The first loop waits a little so it does not land on the status' own entrance.
          h.looped.set(s, now - loop.every * 0.4);
          continue;
        }
        if (now - last < loop.every) continue;
        h.looped.set(s, now);
        due.push(...loopCues(loop.script, u.id));
      }
      for (const s of h.looped.keys()) if (!u.statuses.includes(s)) h.looped.delete(s);
    }
    for (const [id, h] of this.held) {
      if (seen.has(id)) continue;
      for (const b of h.badges) b.destroy();
      h.cover?.destroy();
      this.held.delete(id);
    }
    return due;
  }

  hideAll() {
    for (const h of this.held.values()) {
      for (const b of h.badges) b.setVisible(false);
      h.cover?.setVisible(false);
    }
  }
}
