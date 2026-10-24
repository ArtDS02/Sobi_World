// The Aquarium's care effects (GĐ14), presentation only:
// - Feeding: pellets are sprinkled over the water, splash in with a ripple, sink with a wobble and lie a while on the
//   bottom; the fish that just ate claim the nearest pellet and swim to it (the scene moves them, see fishSwim.ts).
// - Changing the water: fresh water pours in from above, bubbles rush up, a clear wave sweeps across while the murk
//   fades, and the water sparkles.
// Pictures come from the manifest when painted (fx_fish_pellet, fx_water_pour, fx_water_ripple); until then small
// textures drawn here stand in. fx_bubble and fx_sparkle are the shared ones.
import * as Phaser from 'phaser';
import type { Rng } from '../../../core/rng';
import { textureKey } from '../../../ui/world/keys';
import { ensureSoftTextures, SOFT_GLOW } from '../../../ui/world/softTextures';
import { AQUARIUM_VIEW, type Box } from './aquariumView';

const CODE = { pellet: 'aq_fx_pellet', pour: 'aq_fx_pour', ripple: 'aq_fx_ripple', sweep: 'aq_fx_sweep', bubble: 'aq_fx_bubble' } as const;

function canvas(scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h)!;
  draw(tex.getContext());
  tex.refresh();
}

/** The stand-in textures, drawn once. */
function ensureCodeTextures(scene: Phaser.Scene) {
  canvas(scene, CODE.pellet, 32, 32, (c) => {
    const g = c.createRadialGradient(12, 11, 2, 16, 16, 14);
    g.addColorStop(0, '#ffd89a');
    g.addColorStop(0.55, '#d98a3d');
    g.addColorStop(1, '#9a5524');
    c.fillStyle = g;
    c.beginPath();
    c.arc(16, 16, 13, 0, Math.PI * 2);
    c.fill();
  });
  canvas(scene, CODE.ripple, 128, 48, (c) => {
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.lineWidth = 5;
    c.beginPath();
    c.ellipse(64, 24, 58, 18, 0, 0, Math.PI * 2);
    c.stroke();
  });
  canvas(scene, CODE.pour, 64, 256, (c) => {
    const across = c.createLinearGradient(0, 0, 64, 0);
    across.addColorStop(0, 'rgba(210,240,255,0)');
    across.addColorStop(0.3, 'rgba(225,246,255,0.85)');
    across.addColorStop(0.5, 'rgba(255,255,255,0.95)');
    across.addColorStop(0.7, 'rgba(225,246,255,0.85)');
    across.addColorStop(1, 'rgba(210,240,255,0)');
    c.fillStyle = across;
    c.fillRect(0, 0, 64, 256);
  });
  canvas(scene, CODE.sweep, 128, 8, (c) => {
    const g = c.createLinearGradient(0, 0, 128, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(235,250,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 8);
  });
  canvas(scene, CODE.bubble, 32, 32, (c) => {
    c.fillStyle = 'rgba(220,240,255,0.35)';
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.lineWidth = 2.5;
    c.beginPath();
    c.arc(16, 16, 13, 0, Math.PI * 2);
    c.fill();
    c.stroke();
  });
}

interface Pellet {
  img: Phaser.GameObjects.Image;
  vy: number;
  wobble: number;
  /** 'air' above the surface, 'sink' in the water, 'bottom' lying on the sand. */
  at: 'air' | 'sink' | 'bottom';
  until: number;
  /** The swimmer going for it. */
  taker: string | null;
}

export class AquariumFx {
  private pellets: Pellet[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly rng: Rng,
  ) {
    ensureCodeTextures(scene);
    ensureSoftTextures(scene);
  }

  /** A fish nibbling at the line: two small rings by the float and a droplet hop, or the lantern of the deep flaring. */
  bite(spot: { x: number; y: number; kind: 'ripple' | 'glow' }, box: Box) {
    if (spot.kind === 'glow') {
      const glow = this.scene.add.image(spot.x, spot.y, SOFT_GLOW).setDepth(AQUARIUM_VIEW.depth.ripple).setTint(0xffe9a8).setAlpha(0).setScale(0.6);
      this.scene.tweens.add({ targets: glow, alpha: 0.85, scale: 1.3, duration: 260, yoyo: true, ease: 'Sine.easeOut', onComplete: () => glow.destroy() });
      for (let i = 0; i < 3; i += 1) this.scene.time.delayedCall(i * 140, () => this.bubble(spot.x + (this.rng.next() * 2 - 1) * 10, spot.y + 30, box, 6 + this.rng.next() * 5, 70));
      return;
    }
    this.ripple(spot.x, spot.y, 70);
    this.scene.time.delayedCall(170, () => this.ripple(spot.x, spot.y, 46));
    const drop = this.image(AQUARIUM_VIEW.bubbleArt, CODE.bubble, spot.x, spot.y, 7, AQUARIUM_VIEW.depth.ripple).setAlpha(0.9);
    this.scene.tweens.add({ targets: drop, y: spot.y - 16, duration: 180, yoyo: true, ease: 'Quad.easeOut', onComplete: () => drop.destroy() });
  }

  /** The painted picture when the manifest has it, else the stand-in. */
  private key(art: string, fallback: string): string {
    return this.scene.textures.exists(textureKey(art)) ? textureKey(art) : fallback;
  }

  private image(art: string, fallback: string, x: number, y: number, px: number, depth: number) {
    const img = this.scene.add.image(x, y, this.key(art, fallback)).setDepth(depth);
    return img.setScale(px / Math.max(img.width, img.height));
  }

  /** A ring spreading on the surface. */
  ripple(x: number, y: number, px = 120) {
    const v = AQUARIUM_VIEW;
    const img = this.image(v.water.rippleArt, CODE.ripple, x, y, px * 0.3, v.depth.ripple).setAlpha(0.85);
    const to = (px / Math.max(img.width, 1)) * 1.1;
    this.scene.tweens.add({ targets: img, scale: to, alpha: 0, duration: 650, ease: 'Sine.easeOut', onComplete: () => img.destroy() });
  }

  /** A poke in the water at (x, y): rings spread from it under water and a few bubbles rise. */
  poke(x: number, y: number, box: Box) {
    const v = AQUARIUM_VIEW;
    const t = v.moments.tease;
    t.rings.forEach((px, i) => {
      const ring = this.scene.add.circle(x, y, px / 2).setStrokeStyle(5, 0xffffff, 0.9).setDepth(v.depth.ripple).setScale(0.1);
      this.scene.tweens.add({ targets: ring, scale: 1, alpha: { from: 1, to: 0 }, duration: t.ringMs, delay: i * 150, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    });
    for (let i = 0; i < t.bubbles; i += 1) this.bubble(x + (this.rng.next() * 2 - 1) * 16, y, box, 6 + this.rng.next() * 6, 80 + this.rng.next() * 40);
  }

  /** A bubble rising from (x, y) to the top of `box`, wobbling, then popping. */
  bubble(x: number, y: number, box: Box, px = 10 + this.rng.next() * 8, speed = 50 + this.rng.next() * 40) {
    const v = AQUARIUM_VIEW;
    const img = this.image(v.bubbleArt, CODE.bubble, x, y, px, v.depth.bubble).setAlpha(0.85);
    const rise = Math.max(20, y - box.top);
    this.scene.tweens.add({ targets: img, y: y - rise, duration: (rise / speed) * 1000, ease: 'Sine.easeIn', onComplete: () => img.destroy() });
    this.scene.tweens.add({ targets: img, x: x + (this.rng.next() * 2 - 1) * 14, duration: 500 + this.rng.next() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /** A sparkle twinkling at (x, y) after `delay` ms (the water change; a fish just cured). */
  sparkle(x: number, y: number, delay: number) {
    const v = AQUARIUM_VIEW;
    const img = this.image(v.sparkleArt, CODE.bubble, x, y, 34, v.depth.sparkle).setScale(0).setAlpha(0.95);
    const to = 34 / Math.max(img.width, 1);
    this.scene.tweens.add({ targets: img, scale: to, angle: 90, duration: 320, delay, yoyo: true, ease: 'Back.easeOut', onComplete: () => img.destroy() });
  }

  /** Sprinkles food for `fed` fish around `x` (they ate just now), from the drone at `fromY`. */
  feed(fed: number, x: number, box: Box, fromY: number) {
    const f = AQUARIUM_VIEW.feed;
    const n = Math.min(f.max, Math.max(f.perFish, fed * f.perFish));
    const cx = Math.min(box.right - f.spread, Math.max(box.left + f.spread, x));
    for (let i = 0; i < n; i += 1) {
      const px = cx + (this.rng.next() * 2 - 1) * f.spread * 0.5;
      const img = this.image(f.art, CODE.pellet, px, fromY - this.rng.next() * 30, f.pelletPx * (0.8 + this.rng.next() * 0.4), AQUARIUM_VIEW.depth.pellet);
      img.setAngle(this.rng.next() * 360);
      // Shaken out of the hopper: they fan out sideways as they fall.
      this.scene.tweens.add({ targets: img, x: px + (this.rng.next() * 2 - 1) * f.spread, duration: 500, ease: 'Quad.easeOut' });
      this.pellets.push({ img, vy: -40 + this.rng.next() * 90, wobble: this.rng.next() * Math.PI * 2, at: 'air', until: 0, taker: null });
    }
  }

  /** Moves the pellets: a fall onto the water, a slow wobbling sink, a rest on the sand, a fade. */
  update(time: number, delta: number, box: Box) {
    const f = AQUARIUM_VIEW.feed;
    const dt = Math.min(delta, 50) / 1000;
    for (const p of this.pellets) {
      const img = p.img;
      if (p.at === 'air') {
        p.vy += f.gravity * dt;
        img.y += p.vy * dt;
        if (img.y >= box.top) {
          p.at = 'sink';
          p.vy = f.sink[0] + this.rng.next() * (f.sink[1] - f.sink[0]);
          if (this.rng.next() < 0.5) this.ripple(img.x, box.top, 70 + this.rng.next() * 50);
        }
      } else if (p.at === 'sink') {
        img.y += p.vy * dt;
        img.x += Math.sin(time / 380 + p.wobble) * 12 * dt;
        img.angle += 40 * dt;
        if (img.y >= box.bottom - 6) {
          p.at = 'bottom';
          p.until = time + f.restMs;
        }
      } else if (time >= p.until) {
        img.setAlpha(Math.max(0, img.alpha - dt * 1.5));
      }
    }
    this.pellets = this.pellets.filter((p) => {
      if (p.img.alpha > 0.02) return true;
      p.img.destroy();
      return false;
    });
  }

  /** Is there food left in the water? */
  hasFood(): boolean {
    return this.pellets.some((p) => p.img.alpha > 0.5);
  }

  /** The pellet `taker` goes for: the one it has, or the nearest free one; null when none is left. */
  claim(taker: string, x: number, y: number): { x: number; y: number } | null {
    const mine = this.pellets.find((p) => p.taker === taker && p.img.alpha > 0.5);
    if (mine) return mine.img;
    let best: Pellet | null = null;
    let bestD = Infinity;
    for (const p of this.pellets) {
      if (p.taker || p.img.alpha <= 0.5) continue;
      const d = Math.hypot(p.img.x - x, p.img.y - y);
      if (d < bestD) {
        best = p;
        bestD = d;
      }
    }
    if (!best) return null;
    best.taker = taker;
    return best.img;
  }

  /** `taker` ate its pellet if it is close enough; true when it did. */
  eat(taker: string, x: number, y: number, reach: number): boolean {
    const p = this.pellets.find((q) => q.taker === taker);
    if (!p || p.at === 'air' || Math.hypot(p.img.x - x, p.img.y - y) > reach) return false;
    p.img.destroy();
    this.pellets = this.pellets.filter((q) => q !== p);
    return true;
  }

  /**
   * Fresh water: a stream pours in at the left of the water, ripples where it lands, bubbles rush up, then a clear
   * wave sweeps across the murk's area (`sea`) while the murk fades from `murkFrom` to its new alpha, and a few
   * sparkles twinkle in the water.
   */
  changeWater(box: Box, sea: Box, murk: Phaser.GameObjects.Rectangle, murkFrom: number, view: { x: number; y: number; width: number; height: number }, pourTop: number) {
    const v = AQUARIUM_VIEW;
    const w = v.water;
    const murkTo = murk.alpha;
    murk.setAlpha(murkFrom);
    const x = box.left + (box.right - box.left) * w.pourAt;
    const top = pourTop;
    const pour = this.scene.add
      .image(x, top, this.key(w.pourArt, CODE.pour))
      .setOrigin(0.5, 0)
      .setDepth(v.depth.pour)
      .setAlpha(0.9);
    const length = box.top + 50 - top;
    pour.setDisplaySize(70, 1).setData('length', length);
    this.scene.tweens.add({ targets: pour, displayHeight: length, duration: 260, ease: 'Quad.easeIn' });
    this.scene.tweens.add({ targets: pour, alpha: 0, displayWidth: 24, delay: w.pourMs - 300, duration: 300, onComplete: () => pour.destroy() });
    for (let t = 200; t < w.pourMs; t += 220) this.scene.time.delayedCall(t, () => this.ripple(x, box.top, 150));
    for (let i = 0; i < w.bubbles; i += 1) {
      this.scene.time.delayedCall(150 + this.rng.next() * w.pourMs, () => {
        const by = box.top + 40 + this.rng.next() * Math.min(260, box.bottom - box.top - 40);
        this.bubble(x + (this.rng.next() * 2 - 1) * 60, by, box, 8 + this.rng.next() * 14, 110 + this.rng.next() * 90);
      });
    }
    // The clear wave, clipped to the murk's area as far as the screen shows it.
    const left = Math.max(sea.left, view.x);
    const right = Math.min(sea.right, view.x + view.width);
    const top2 = Math.max(sea.top, view.y);
    const bottom = Math.min(sea.bottom, view.y + view.height);
    const sweep = this.scene.add
      .image(left - w.sweepPx, (top2 + bottom) / 2, CODE.sweep)
      .setDepth(v.depth.pour)
      .setAlpha(0.45)
      .setDisplaySize(w.sweepPx, bottom - top2);
    const clip = this.scene.make.graphics({}, false).fillRect(left, top2, right - left, bottom - top2);
    sweep.setMask(clip.createGeometryMask());
    this.scene.tweens.add({
      targets: sweep,
      x: right + w.sweepPx,
      delay: 350,
      duration: w.sweepMs,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        sweep.destroy();
        clip.destroy();
      },
    });
    this.scene.tweens.add({ targets: murk, alpha: murkTo, delay: 350, duration: w.sweepMs, ease: 'Sine.easeInOut' });
    for (let i = 0; i < w.sparkles; i += 1) {
      const sx = box.left + 40 + this.rng.next() * (box.right - box.left - 80);
      const sy = box.top + 20 + this.rng.next() * (box.bottom - box.top - 40);
      this.sparkle(sx, sy, 900 + i * 120 + this.rng.next() * 200);
    }
  }

  /** Drops what is on screen (another place, the scene asleep). */
  clear() {
    for (const p of this.pellets) p.img.destroy();
    this.pellets = [];
  }
}
