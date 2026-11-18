// The air of a battle (decision 063): a few slow things drift over the zone's painting behind the fighters: leaves and pollen in the
// forest, snow and dust in the mountains, rising motes in the ruins, bubbles and spray on the coast, so the field is never a still
// picture. Drawn with small procedural textures (no art), a pool of sprites reused as they leave the view, under every unit and effect
// (depth just above the backdrop). Presentation only; reduced motion shows nothing.
import * as Phaser from 'phaser';

export type AmbientStyle = 'forest' | 'mountain' | 'ruins' | 'coast' | 'motes';

interface Recipe {
  /** Texture and the colours the flecks are tinted with. */
  tex: 'leaf' | 'soft' | 'flake' | 'ring';
  tints: readonly number[];
  count: number;
  /** Size (scale of a 16 px texture) range, speed in px / s (x: wind, y: + falls, - rises), sway in px, alpha. */
  size: readonly [number, number];
  vx: readonly [number, number];
  vy: readonly [number, number];
  sway: readonly [number, number];
  alpha: readonly [number, number];
  spin: number;
  add: boolean;
}

const RECIPES: Record<AmbientStyle, readonly Recipe[]> = {
  forest: [
    { tex: 'leaf', tints: [0x7bbf4a, 0xa6d45a, 0xe3b94a, 0xd9823b], count: 12, size: [0.7, 1.2], vx: [10, 28], vy: [22, 44], sway: [14, 34], alpha: [0.8, 0.95], spin: 90, add: false },
    { tex: 'soft', tints: [0xfff3b0, 0xffe58a], count: 16, size: [0.4, 0.9], vx: [-6, 8], vy: [-14, -4], sway: [8, 22], alpha: [0.5, 0.85], spin: 0, add: true },
  ],
  mountain: [
    { tex: 'flake', tints: [0xffffff, 0xe8f4ff], count: 26, size: [0.35, 0.8], vx: [18, 44], vy: [28, 60], sway: [10, 26], alpha: [0.7, 0.95], spin: 40, add: false },
    { tex: 'soft', tints: [0xd9d2c4], count: 8, size: [1.4, 2.4], vx: [14, 30], vy: [-2, 4], sway: [6, 14], alpha: [0.12, 0.22], spin: 0, add: false },
  ],
  ruins: [
    { tex: 'soft', tints: [0xb48cff, 0x7fd8ff, 0xffd27a], count: 22, size: [0.4, 1.0], vx: [-8, 8], vy: [-34, -12], sway: [8, 24], alpha: [0.55, 0.95], spin: 0, add: true },
    { tex: 'flake', tints: [0x8fb0c8], count: 10, size: [0.3, 0.6], vx: [4, 14], vy: [8, 18], sway: [6, 16], alpha: [0.4, 0.7], spin: 30, add: false },
  ],
  coast: [
    { tex: 'ring', tints: [0xffffff, 0xcdeeff], count: 14, size: [0.35, 0.8], vx: [-6, 10], vy: [-30, -10], sway: [8, 20], alpha: [0.5, 0.8], spin: 0, add: false },
    { tex: 'soft', tints: [0xffffff, 0xbfe8ff], count: 12, size: [0.5, 1.1], vx: [30, 70], vy: [-4, 6], sway: [4, 12], alpha: [0.25, 0.5], spin: 0, add: true },
  ],
  motes: [{ tex: 'soft', tints: [0xfff3b0, 0xffffff], count: 14, size: [0.4, 0.9], vx: [-6, 8], vy: [-10, 6], sway: [8, 20], alpha: [0.4, 0.75], spin: 0, add: true }],
};

/** The style that goes with a zone's painting (`bg_adventure_forest`...); the Rift paints the ruins. */
export function styleOfBackdrop(backdrop: string): AmbientStyle {
  for (const s of ['forest', 'mountain', 'ruins', 'coast'] as const) if (backdrop.includes(s)) return s;
  return 'motes';
}

interface Fleck {
  img: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vx: number;
  vy: number;
  amp: number;
  rate: number;
  phase: number;
  spin: number;
  alpha: number;
}

const TEX = { leaf: 'adv_amb_leaf', soft: 'adv_amb_soft', flake: 'adv_amb_flake', ring: 'adv_amb_ring' } as const;
const DEPTH = -900;

/** The world rectangle the camera shows. */
export interface AmbientView {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class BattleAmbient {
  private flecks: Fleck[] = [];
  private style: AmbientStyle | null = null;
  private time = 0;
  private seed = 12345;

  constructor(private readonly scene: Phaser.Scene) {
    this.makeTextures();
  }

  /** A tiny generator of its own: the air is decoration and must not draw from anything that is replayed. */
  private rand(): number {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 2 ** 32;
  }

  private between(r: readonly [number, number]): number {
    return r[0] + (r[1] - r[0]) * this.rand();
  }

  private makeTextures() {
    const textures = this.scene.textures;
    const draw = (key: string, paint: (g: Phaser.GameObjects.Graphics) => void) => {
      if (textures.exists(key)) return;
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1);
      paint(g);
      g.generateTexture(key, 16, 16);
      g.destroy();
    };
    draw(TEX.leaf, (g) => g.fillEllipse(8, 8, 14, 7));
    draw(TEX.soft, (g) => {
      for (let i = 0; i < 8; i += 1) {
        g.fillStyle(0xffffff, 0.14 + i * 0.05);
        g.fillCircle(8, 8, 8 - i);
      }
    });
    draw(TEX.flake, (g) => g.fillCircle(8, 8, 5));
    draw(TEX.ring, (g) => {
      g.lineStyle(1.5, 0xffffff, 0.95);
      g.strokeCircle(8, 8, 6);
      g.fillStyle(0xffffff, 0.18);
      g.fillCircle(8, 8, 6);
    });
  }

  private clear() {
    for (const f of this.flecks) f.img.destroy();
    this.flecks = [];
  }

  private build(style: AmbientStyle, view: AmbientView) {
    this.clear();
    this.style = style;
    for (const recipe of RECIPES[style]) {
      for (let i = 0; i < recipe.count; i += 1) {
        const img = this.scene.add.image(0, 0, TEX[recipe.tex]).setDepth(DEPTH);
        if (recipe.add) img.setBlendMode(Phaser.BlendModes.ADD);
        img.setTint(recipe.tints[Math.floor(this.rand() * recipe.tints.length)]!);
        const alpha = this.between(recipe.alpha);
        img.setScale(this.between(recipe.size)).setAlpha(alpha);
        this.flecks.push({
          img,
          x: view.x + this.rand() * view.w,
          y: view.y + this.rand() * view.h,
          vx: this.between(recipe.vx),
          vy: this.between(recipe.vy),
          amp: this.between(recipe.sway),
          rate: 0.6 + this.rand() * 1.2,
          phase: this.rand() * Math.PI * 2,
          spin: (this.rand() - 0.5) * 2 * recipe.spin,
          alpha,
        });
      }
    }
  }

  /** Drifts the air for `delta` ms over `view`; a null `style`, or reduced motion, shows nothing. */
  update(style: AmbientStyle | null, delta: number, reduce: boolean, view: AmbientView) {
    if (!style || reduce) {
      if (this.flecks.length > 0) this.clear();
      this.style = null;
      return;
    }
    if (style !== this.style) this.build(style, view);
    const dt = Math.min(delta, 100) / 1000;
    this.time += dt;
    const margin = 40;
    for (const f of this.flecks) {
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      if (f.x > view.x + view.w + margin) f.x = view.x - margin;
      else if (f.x < view.x - margin) f.x = view.x + view.w + margin;
      if (f.y > view.y + view.h + margin) {
        f.y = view.y - margin;
        f.x = view.x + this.rand() * view.w;
      } else if (f.y < view.y - margin) {
        f.y = view.y + view.h + margin;
        f.x = view.x + this.rand() * view.w;
      }
      f.img.setPosition(f.x + Math.sin(this.time * f.rate + f.phase) * f.amp * 0.5, f.y + Math.cos(this.time * f.rate * 0.7 + f.phase) * f.amp * 0.15);
      if (f.spin !== 0) f.img.angle += f.spin * dt;
      // A soft shimmer: the fleck breathes between three quarters and all of its own alpha.
      f.img.setAlpha(f.alpha * (0.75 + 0.25 * Math.sin(this.time * f.rate * 1.3 + f.phase)));
    }
  }

  destroy() {
    this.clear();
  }
}
