// The statuses of the fighters on the battle stage (decision 044 status_overlay): up to three badges (`st_…`) floating by the head
// (more take turns), the body coloured while a status says so, a frame of a strip laid over it (the ice of Freeze), and the little
// loop a status plays while it lasts (a spore rising from a poisoned unit…). With reduced motion the badges stay, still; nothing loops.
import type * as Phaser from 'phaser';
import type { StatusId } from '../../../../systems/combat/types';
import { BATTLE_FX } from '../../logic/config/content';
import { loopCues } from '../../ui/battleScript';
import { statusDelta } from '../../ui/statusDelta';
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
  /** The statuses seen last frame (for the expire diff, ANIM-003). */
  seen: Set<string>;
}

export class StatusBadges {
  private held = new Map<string, Held>();
  /** Units seen at least once (a first sight has no previous statuses to diff against). */
  private known = new Set<string>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly want: (id: string) => void,
  ) {}

  /** The colour a status gives the body of the unit now (the last one that has one), or null. */
  tintOf(statuses: readonly string[]): number | null {
    let tint: number | null = null;
    let best = -1;
    for (const s of statuses) {
      const def = BATTLE_FX.statuses[s as StatusId];
      // The highest priority wins; of equal ones the later (ANIM-003).
      if (def?.tint && (def.priority ?? 0) >= best) {
        tint = def.tint.color;
        best = def.priority ?? 0;
      }
    }
    return tint;
  }

  /** Whether a status holds the body perfectly still (Freeze): no breathing, no bobbing. */
  frozenBody(statuses: readonly string[]): boolean {
    return statuses.some((s) => BATTLE_FX.statuses[s as StatusId]?.freezeBody === true);
  }

  /** Draws the badges of every unit at `now`; returns the loops due now (played by the caller unless motion is reduced). */
  update(units: readonly { id: string; statuses: readonly string[]; down: boolean }[], anchors: ReadonlyMap<string, FxAnchor>, now: number, reduce: boolean): ScriptCue[] {
    const due: ScriptCue[] = [];
    const seen = new Set<string>();
    for (const u of units) {
      seen.add(u.id);
      const a = anchors.get(u.id);
      const h: Held = this.held.get(u.id) ?? { badges: [], cover: null, looped: new Map(), seen: new Set() };
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
      // A status that was on the unit last frame and is gone plays its expire script once (a unit seen for the first time, or one
      // knocked out, plays none: no false expiry on a reload).
      const known = this.known.has(u.id);
      const delta = statusDelta(known ? h.seen : null, u.statuses, u.down);
      this.known.add(u.id);
      h.seen = new Set(u.statuses);
      if (!reduce) {
        for (const s of delta.removed) {
          const expire = BATTLE_FX.statuses[s as StatusId]?.expire;
          if (expire && expire.length > 0) due.push(...loopCues(expire, u.id));
        }
      }
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
      this.known.delete(id);
    }
    return due;
  }

  hideAll() {
    // A battle is over (or not shown): the next one starts with no memory of statuses, so none expires falsely.
    this.known.clear();
    for (const h of this.held.values()) {
      for (const b of h.badges) b.setVisible(false);
      h.cover?.setVisible(false);
    }
  }
}
