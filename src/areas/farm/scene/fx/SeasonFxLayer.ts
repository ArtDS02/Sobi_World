// Seasonal environment FX on the farm (DECISIONS MU-2): runs the emitters of config/seasonFx.ts for
// the shown season + day / night phase. Sprites are pooled per art strip and reused (never more
// than each emitter's maxActive alive); spawn timing, motion and fades come from the pure
// core/engine/seasonFx.ts. View-only: no input, no physics, nothing the pigs or camera read.
// 'ground' sprites sit just under every actor (pigs, buildings), 'air' ones under the day / night
// tint, 'glow' ones (fireflies) over it like the window glows. Hidden with reduceMotion (spec §10.4). A missing art strip silently skips its emitter.
import * as Phaser from 'phaser';
import type { AssetRegistry } from '../../../../core/assets/registry';
import { DAY_NIGHT_VIEW, type DayPhase } from '../../../../core/config/dayNight';
import { FARM_VIEW } from '../../../../core/config/farmView';
import { SEASON_VIEW, type SeasonId } from '../../../../core/config/seasons';
import {
  activeEmitters,
  particlePose,
  spawnParticle,
  type ActiveEmitter,
  type FxAnchor,
  type FxParticle,
} from '../../../../core/engine/seasonFx';
import { mulberry32, type Rng } from '../../../../core/rng';
import { textureKey } from '../view/textureKeys';

interface Live {
  active: ActiveEmitter;
  p: FxParticle;
  img: Phaser.GameObjects.Image;
}

/** ground: just under the Y-sorted actor band (layers 0–3 are the backdrop bands). */
const DEPTH = {
  ground: FARM_VIEW.BACK_LAYER_DEPTH + 3.5 * FARM_VIEW.BACK_LAYER_STEP,
  air: FARM_VIEW.OVERLAY_DEPTH - SEASON_VIEW.fxAirDepthBelowOverlay,
  glow: FARM_VIEW.OVERLAY_DEPTH - DAY_NIGHT_VIEW.glowDepthBelowOverlay,
} as const;

export class SeasonFxLayer {
  private emitters: ActiveEmitter[] = [];
  private readonly live: Live[] = [];
  private readonly pool = new Map<string, Phaser.GameObjects.Image[]>();
  private readonly nextAt = new Map<string, number>();
  private key = '';
  private hidden = false;
  private readonly rng: Rng;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly assets: AssetRegistry,
    private readonly anchors: () => readonly FxAnchor[],
    seed: number,
  ) {
    this.rng = mulberry32(seed);
  }

  /** Season / phase changed: new emitter set; particles already alive finish their life. */
  set(season: SeasonId, phase: DayPhase) {
    const key = `${season}:${phase}`;
    if (key === this.key) return;
    this.key = key;
    this.emitters = activeEmitters(season, phase).filter((a) => this.scene.textures.exists(textureKey(a.emitter.art)));
    const ids = new Set(this.emitters.map((a) => a.emitter.id));
    for (const id of [...this.nextAt.keys()]) if (!ids.has(id)) this.nextAt.delete(id);
  }

  /** reduceMotion: no FX at all. */
  setHidden(hidden: boolean) {
    if (hidden === this.hidden) return;
    this.hidden = hidden;
    if (hidden) while (this.live.length) this.release(this.live.pop()!);
  }

  update(time: number) {
    if (this.hidden) return;
    for (const a of this.emitters) this.maybeSpawn(a, time);
    for (let i = this.live.length - 1; i >= 0; i--) {
      const l = this.live[i]!;
      const pose = particlePose(l.active.emitter, l.p, time);
      if (!pose.alive) {
        this.release(l);
        this.live.splice(i, 1);
        continue;
      }
      l.img.setPosition(pose.x, pose.y).setAngle(pose.angle).setAlpha(pose.alpha);
      if (l.active.emitter.flap && this.frameCount(l.active) > 1) l.img.setFrame(pose.frame);
    }
  }

  destroy() {
    for (const l of this.live) l.img.destroy();
    for (const list of this.pool.values()) for (const img of list) img.destroy();
    this.live.length = 0;
    this.pool.clear();
  }

  private frameCount(a: ActiveEmitter): number {
    return this.assets.manifest.fx.find((r) => r.id === a.emitter.art)?.frames?.count ?? 1;
  }

  private maybeSpawn(a: ActiveEmitter, time: number) {
    const e = a.emitter;
    const due = this.nextAt.get(e.id);
    const wait = () => a.intervalMs[0] + (a.intervalMs[1] - a.intervalMs[0]) * this.rng.next();
    if (due === undefined) {
      // First attempt after a random part of one interval: emitters do not all fire at once.
      this.nextAt.set(e.id, time + wait() * this.rng.next());
      return;
    }
    if (time < due) return;
    this.nextAt.set(e.id, time + wait());
    if (this.rng.next() >= a.chance) return;
    const alive = this.live.filter((l) => l.active.emitter.id === e.id).length;
    const burst = Math.round(e.burst[0] + (e.burst[1] - e.burst[0]) * this.rng.next());
    const view = this.scene.cameras.main.worldView;
    const frames = this.frameCount(a);
    for (let n = 0; n < Math.min(burst, a.maxActive - alive); n++) {
      const p = spawnParticle(e, frames, view, this.anchors(), time, this.rng);
      if (!p) return;
      this.live.push({ active: a, p, img: this.take(a, p, frames) });
    }
  }

  private take(a: ActiveEmitter, p: FxParticle, frames: number): Phaser.GameObjects.Image {
    const e = a.emitter;
    const key = textureKey(e.art);
    const img = this.pool.get(key)?.pop() ?? this.scene.add.image(0, 0, key);
    if (frames > 1) img.setFrame(p.frame);
    const scale = p.size / Math.max(img.frame.width, img.frame.height);
    img
      .setScale(scale)
      .setDepth(DEPTH[e.layer])
      .setBlendMode(e.blend === 'add' ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL)
      .setAlpha(0)
      .setVisible(true)
      .setActive(true);
    if (p.tint === null) img.clearTint();
    else img.setTint(p.tint);
    return img;
  }

  private release(l: Live) {
    l.img.setVisible(false).setActive(false);
    const key = textureKey(l.active.emitter.art);
    const list = this.pool.get(key) ?? [];
    list.push(l.img);
    this.pool.set(key, list);
  }
}
