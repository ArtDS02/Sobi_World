// The cloud bird and its caterpillars (owner's ask, decision 023). Scenery only: no gameplay, nothing saved, not clickable.
// The bird rests (hovering in place) for a while, now and then flies a smooth curve to a random spot over the island or back
// to its perch, and when a caterpillar shows up on a flower it goes and catches them one by one. A caterpillar appears now
// and then on a growing flower of the tier on screen. With reduced motion the bird stays still at its perch and no
// caterpillar appears.
import * as Phaser from 'phaser';
import { CLOUD_DRESSING_ART } from '../logic/art';
import { FX_KEYS } from './cloudFx';
import { CLOUD_VIEW } from './cloudView';

type Img = Phaser.GameObjects.Image;
type Point = { x: number; y: number };

/** A flower a caterpillar may sit on: its plot slot and the point on its stem. */
export interface PestSpot {
  slot: number;
  x: number;
  y: number;
}

export interface BirdDeps {
  fixed: (x: number, y: number, id: string) => Img;
  reduceMotion: () => boolean;
  /** The tier is changing: no new caterpillar meanwhile. */
  busy: () => boolean;
  /** The flowers on screen (by plot slot): growing and ripe ones may get a caterpillar. */
  flowers: () => readonly { flower: Img; stage: string | null }[];
}

interface Pest {
  slot: number;
  img: Img;
}

type Flight = { from: Point; ctrl: Point; to: Point; t: number; ms: number; pest: Pest | null };

const between = (r: readonly [number, number]) => Phaser.Math.Between(r[0], r[1]);

export class CloudBird {
  private readonly img: Img;
  private readonly baseScale: { x: number; y: number };
  private pos: Point;
  private rest: Point;
  private flight: Flight | null = null;
  private restUntil = 0;
  /** When the current rest began: the bird notices a caterpillar after a short moment, not mid-landing. */
  private restSince = 0;
  private nextPestAt = 0;
  private pests: Pest[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly d: BirdDeps,
  ) {
    const b = CLOUD_VIEW.bird;
    this.img = d.fixed(b.x, b.y, CLOUD_DRESSING_ART.bird).setDisplaySize(b.size, b.size * (150 / 180)).setDepth(CLOUD_VIEW.depth.bird);
    this.baseScale = { x: this.img.scaleX, y: this.img.scaleY };
    this.pos = { x: b.x, y: b.y };
    this.rest = { ...this.pos };
  }

  update(time: number, delta: number) {
    if (this.d.reduceMotion()) return;
    if (this.restUntil === 0) {
      this.restSince = time;
      this.restUntil = time + between(CLOUD_VIEW.bird.restMs);
      this.nextPestAt = time + between(CLOUD_VIEW.pest.everyMs);
    }
    this.maybeSpawnPest(time);
    if (this.flight) this.fly(time, delta);
    else this.hover(time);
  }

  /** The tier changed: the caterpillars of the old one go away. */
  clearPests() {
    for (const p of this.pests) this.pop(p.img, false);
    this.pests = [];
    if (this.flight?.pest) this.flight.pest = null;
  }

  /** Caterpillars whose flower is gone (picked, wilted, another tier) leave. */
  keepOnly(slots: ReadonlySet<number>) {
    const gone = this.pests.filter((p) => !slots.has(p.slot));
    for (const p of gone) this.pop(p.img, false);
    this.pests = this.pests.filter((p) => slots.has(p.slot));
    if (this.flight?.pest && !this.pests.includes(this.flight.pest)) this.flight.pest = null;
  }

  // ---------- behaviour ----------

  /** Resting: a gentle bob and an occasional wing beat; then the next flight. */
  private hover(time: number) {
    const bob = Math.sin(time / 700) * 6;
    const flap = Math.sin(time / 110) > 0.92 ? 0.9 : 1;
    this.img.setPosition(this.rest.x + Math.sin(time / 1300) * 4, this.rest.y + bob).setAngle(Math.sin(time / 1500) * 3);
    this.img.setScale(this.baseScale.x * Math.sign(this.img.scaleX || 1), this.baseScale.y * flap);
    this.pos = { x: this.img.x, y: this.img.y };
    const pest = this.pests[0];
    // It waits a moment before going, so the caterpillar is seen first.
    if (pest && time > this.restSince + CLOUD_VIEW.pest.noticeMs) return this.flyTo({ x: pest.img.x + 4, y: pest.img.y - 26 }, pest);
    if (time < this.restUntil) return;
    // Now and then: somewhere over the island, or back to the perch.
    const a = CLOUD_VIEW.bird.area;
    const home = Math.random() < 0.35;
    this.flyTo(home ? { x: CLOUD_VIEW.bird.x, y: CLOUD_VIEW.bird.y } : { x: Phaser.Math.Between(a.x0, a.x1), y: Phaser.Math.Between(a.y0, a.y1) }, null);
  }

  private flyTo(to: Point, pest: Pest | null) {
    const from = { ...this.pos };
    const dist = Phaser.Math.Distance.BetweenPoints(from, to);
    const lift = Math.min(160, 40 + dist * 0.25);
    const ctrl = { x: (from.x + to.x) / 2 + Phaser.Math.Between(-60, 60), y: Math.min(from.y, to.y) - lift };
    this.flight = { from, ctrl, to, t: 0, ms: Math.max(500, (dist / CLOUD_VIEW.bird.speed) * 1000), pest };
  }

  private fly(time: number, delta: number) {
    const f = this.flight!;
    f.t = Math.min(1, f.t + delta / f.ms);
    const e = Phaser.Math.Easing.Sine.InOut(f.t);
    const u = 1 - e;
    const x = u * u * f.from.x + 2 * u * e * f.ctrl.x + e * e * f.to.x;
    const y = u * u * f.from.y + 2 * u * e * f.ctrl.y + e * e * f.to.y;
    // The art faces left: flip when flying right; tilt into the flight; beat the wings fast.
    const facing = x > this.pos.x ? -1 : x < this.pos.x ? 1 : Math.sign(this.img.scaleX || 1);
    this.img.setPosition(x, y).setAngle(Phaser.Math.Clamp((y - this.pos.y) * 1.5, -12, 12));
    this.img.setScale(this.baseScale.x * facing, this.baseScale.y * (Math.sin(time / 60) > 0 ? 0.88 : 1));
    this.pos = { x, y };
    if (f.t < 1) return;
    this.flight = null;
    this.rest = { ...f.to };
    this.restSince = time;
    this.restUntil = time + (f.pest ? CLOUD_VIEW.bird.catchMs : between(CLOUD_VIEW.bird.restMs));
    if (f.pest) this.catch(f.pest);
  }

  /** The bird pecks the caterpillar: it pops away and the bird hops. */
  private catch(p: Pest) {
    this.pests = this.pests.filter((q) => q !== p);
    this.pop(p.img, true);
    this.scene.tweens.add({ targets: this.img, y: this.img.y - 12, duration: 140, yoyo: true, ease: 'Quad.easeOut' });
  }

  private pop(img: Img, eaten: boolean) {
    this.scene.tweens.killTweensOf(img);
    this.scene.tweens.add({ targets: img, scale: eaten ? 1.4 : 0.6, alpha: 0, duration: eaten ? 220 : 300, ease: 'Quad.easeOut', onComplete: () => img.destroy() });
  }

  private maybeSpawnPest(time: number) {
    if (time < this.nextPestAt) return;
    this.nextPestAt = time + between(CLOUD_VIEW.pest.everyMs);
    if (this.d.busy() || this.pests.length >= CLOUD_VIEW.pest.max) return;
    const spots: PestSpot[] = this.d.flowers().flatMap((p, slot) =>
      p.stage === 'grow' || p.stage === 'ripe' ? [{ slot, x: p.flower.x + 8, y: p.flower.y - p.flower.displayHeight * 0.42 }] : [],
    );
    const free = spots.filter((s) => !this.pests.some((p) => p.slot === s.slot));
    const spot = free[Phaser.Math.Between(0, free.length - 1)];
    if (!spot) return;
    const img = this.scene.add.image(spot.x, spot.y, FX_KEYS.pest).setDepth(CLOUD_VIEW.depth.pest).setScale(0).setFlipX(Math.random() < 0.5);
    const k = CLOUD_VIEW.pest.scale;
    this.scene.tweens.add({ targets: img, scale: k, duration: 260, ease: 'Back.easeOut' });
    // It wriggles and inches along the stem.
    this.scene.tweens.add({ targets: img, scaleX: k * 1.12, scaleY: k * 0.9, duration: 380, yoyo: true, repeat: -1, delay: 260, ease: 'Sine.easeInOut' });
    this.scene.tweens.add({ targets: img, x: spot.x + 6, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.pests.push({ slot: spot.slot, img });
  }
}
