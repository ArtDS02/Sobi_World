// The weather and the night on the water (GĐ14, decision 034), presentation only:
// - rain (and snow, softer) rings the surface here and there;
// - at night fireflies drift over the water and the moon's light glints on the surface; in the deep sea (no surface)
//   little glowing specks drift instead.
// Reads only the place and two flags from the scene state.
import type * as Phaser from 'phaser';
import type { Rng } from '../../../core/rng';
import { ensureSoftTextures, SOFT_GLOW } from '../../../ui/world/softTextures';
import { AQUARIUM_VIEW, type AquariumPlace } from './aquariumView';

interface Glow {
  img: Phaser.GameObjects.Image;
  x: number;
  y: number;
  phase: number;
  speed: number;
}

export class AquariumAmbience {
  private glows: Glow[] = [];
  private glints: Phaser.GameObjects.Image[] = [];
  private nextDrop = 0;
  private night = false;
  private place: AquariumPlace | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly rng: Rng,
    /** Rings the water at (x, y), `px` wide. */
    private readonly ripple: (x: number, y: number, px: number) => void,
  ) {
    ensureSoftTextures(scene);
  }

  /** The night came or went, or the place changed: the fireflies / specks and the moon glints follow. */
  set(place: AquariumPlace, night: boolean) {
    if (place === this.place && night === this.night) return;
    this.place = place;
    this.night = night;
    for (const g of this.glows) g.img.destroy();
    for (const g of this.glints) g.destroy();
    this.glows = [];
    this.glints = [];
    if (!night) return;
    const a = AQUARIUM_VIEW.ambience;
    const w = place.water;
    const deep = !place.surface;
    // Fireflies over the water (the air above the surface), or specks all through the deep water.
    const top = deep ? w.top : w.top - a.fireflyBand;
    const bottom = deep ? w.bottom : w.top - 12;
    for (let i = 0; i < a.fireflies; i += 1) {
      const x = w.left + this.rng.next() * (w.right - w.left);
      const y = top + this.rng.next() * (bottom - top);
      const img = this.scene.add
        .image(x, y, SOFT_GLOW)
        .setDepth(AQUARIUM_VIEW.depth.night + 1)
        .setTint(deep ? 0x9fe8ff : 0xfff3a0)
        .setScale((deep ? 0.12 : 0.16) + this.rng.next() * 0.08)
        .setBlendMode('ADD');
      this.glows.push({ img, x, y, phase: this.rng.next() * Math.PI * 2, speed: 0.4 + this.rng.next() * 0.6 });
    }
    if (deep) return;
    // The moon's light on the surface: a few soft streaks that shimmer.
    for (let i = 0; i < a.glints; i += 1) {
      const x = w.left + ((i + 0.5) / a.glints) * (w.right - w.left) + (this.rng.next() * 2 - 1) * 60;
      const img = this.scene.add
        .image(x, w.top + 4, SOFT_GLOW)
        .setDepth(AQUARIUM_VIEW.depth.night + 1)
        .setTint(0xdfe9ff)
        .setScale(0.9 + this.rng.next() * 0.6, 0.08)
        .setAlpha(0.4)
        .setBlendMode('ADD');
      img.setData('phase', this.rng.next() * Math.PI * 2);
      this.glints.push(img);
    }
  }

  /** One frame: drops on the water while it rains or snows, the fireflies wander and flicker, the glints shimmer. */
  update(time: number, weather: string) {
    const place = this.place;
    if (!place) return;
    const a = AQUARIUM_VIEW.ambience;
    const w = place.water;
    const wet = weather === 'rainy' || weather === 'snowy';
    if (wet && place.surface && time >= this.nextDrop) {
      const rain = weather === 'rainy';
      this.nextDrop = time + (rain ? a.rainMs : a.snowMs) * (0.5 + this.rng.next());
      this.ripple(w.left + this.rng.next() * (w.right - w.left), w.top + this.rng.next() * 10, rain ? 34 + this.rng.next() * 30 : 22);
    }
    for (const g of this.glows) {
      const t = time / 1000;
      g.img
        .setPosition(g.x + Math.sin(t * g.speed + g.phase) * 40, g.y + Math.sin(t * g.speed * 1.7 + g.phase * 2) * 16)
        .setAlpha(0.35 + 0.6 * Math.max(0, Math.sin(t * 2.2 * g.speed + g.phase)));
    }
    for (const img of this.glints) img.setAlpha(0.2 + 0.3 * (0.5 + 0.5 * Math.sin(time / 500 + (img.getData('phase') as number))));
  }
}
