// The Aquarium on screen (spec V2 §8.3): the tank with its fish swimming, the eggs on the sand, the pile of scales, the
// dock where the rod is cast. Draws and reports clicks only — what a click does, and every number, comes from the app
// through AquariumSceneDeps, so the scene never reaches the store or another Area.
import * as Phaser from 'phaser';
import { hashSeed, mulberry32, type Rng } from '../../../core/rng';
import { fitCamera } from '../../../ui/world/fitCamera';
import { FALLBACK_PROP_KEY, textureKey } from '../../../ui/world/keys';
import { TANK_ART } from '../logic/art';
import { FISH } from '../logic/config/content';
import type { SceneState } from '../logic/derived';
import { AQUARIUM_DESIGN, AQUARIUM_VIEW, eggSpot, fishIcon, fishScale } from './aquariumView';

export const AQUARIUM_SCENE_KEY = 'aquarium';

/** What a click on the canvas was on. */
export type AquariumPick = { kind: 'fish'; id: string } | { kind: 'tank' } | { kind: 'dock' } | { kind: 'scales' } | { kind: 'ground' };

export interface AquariumSceneDeps {
  /** The tank now (null before the world is loaded or while the Aquarium is closed). */
  read: () => SceneState | null;
  onPick: (pick: AquariumPick) => void;
  reduceMotion: () => boolean;
  /** A panel or dialog covers the world: clicks on the canvas are ignored. */
  paused: () => boolean;
}

interface Swimmer {
  img: Phaser.GameObjects.Image;
  icon: Phaser.GameObjects.Text;
  rng: Rng;
  tx: number;
  ty: number;
  /** Time (scene ms) the fish rests until before choosing its next target. */
  restUntil: number;
  species: string;
  sick: boolean;
}

const KEY = (id: string, textures: Phaser.Textures.TextureManager) => (textures.exists(textureKey(id)) ? textureKey(id) : FALLBACK_PROP_KEY);

export class AquariumScene extends Phaser.Scene {
  private swimmers = new Map<string, Swimmer>();
  private eggs!: Phaser.GameObjects.Graphics;
  private murk!: Phaser.GameObjects.Rectangle;
  private night!: Phaser.GameObjects.Rectangle;
  private pile!: Phaser.GameObjects.Text;
  private bubbles: { dot: Phaser.GameObjects.Arc; speed: number }[] = [];
  private shown = '';

  constructor(private readonly deps: AquariumSceneDeps) {
    super(AQUARIUM_SCENE_KEY);
  }

  create() {
    fitCamera(this, AQUARIUM_DESIGN);
    const v = AQUARIUM_VIEW;
    const { width, height } = AQUARIUM_DESIGN;
    const bleed = width * 2;
    const g = this.add.graphics().setDepth(v.depth.ground);
    g.fillStyle(v.sky, 1).fillRect(-bleed, -bleed, width + bleed * 2, bleed + height * 0.4);
    g.fillStyle(v.sea, 1).fillRect(-bleed, height * 0.4, width + bleed * 2, height + bleed);
    this.add.image(0, 0, KEY('bg_aquarium', this.textures)).setOrigin(0, 0).setDisplaySize(width, height).setDepth(v.depth.ground + 1);

    const tank = this.add.image(v.tank.x, v.tank.y, KEY(TANK_ART.glass, this.textures)).setOrigin(0.5, 1).setDepth(v.depth.tank);
    tank.setScale(v.tank.width / tank.width);
    tank.setInteractive({ useHandCursor: true });
    tank.on(Phaser.Input.Events.POINTER_DOWN, () => !this.deps.paused() && this.deps.onPick({ kind: 'tank' }));
    this.eggs = this.add.graphics().setDepth(v.depth.egg);
    const w = v.water;
    this.murk = this.add.rectangle((w.left + w.right) / 2, (w.top + w.bottom) / 2, w.right - w.left, w.bottom - w.top, v.murk).setAlpha(0).setDepth(v.depth.murk);

    const dock = this.add.image(v.dock.x, v.dock.y, KEY(TANK_ART.dock, this.textures)).setOrigin(0.5, 1).setDepth(v.depth.dock);
    dock.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 20 });
    dock.on(Phaser.Input.Events.POINTER_DOWN, () => !this.deps.paused() && this.deps.onPick({ kind: 'dock' }));
    const l = v.label;
    this.add
      .text(v.dock.x, v.dock.y + 8, '🎣', { fontFamily: l.fontFamily, fontSize: `${l.fontPx}px`, color: l.color, backgroundColor: l.background, padding: { x: l.padX, y: l.padY } })
      .setOrigin(0.5, 0)
      .setDepth(v.depth.badge - 1);

    this.pile = this.add
      .text(v.scales.x, v.scales.y, '', { fontFamily: l.fontFamily, fontSize: `${v.badge.fontPx}px`, color: v.badge.color, backgroundColor: v.badge.background, padding: { x: 10, y: 3 } })
      .setOrigin(0.5)
      .setDepth(v.depth.badge)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.pile.on(Phaser.Input.Events.POINTER_DOWN, () => !this.deps.paused() && this.deps.onPick({ kind: 'scales' }));

    this.night = this.add.rectangle(width / 2, height / 2, width * 3, height * 3, v.night).setAlpha(0).setDepth(v.depth.night);
    const rng = mulberry32(hashSeed('bubbles'));
    for (let i = 0; i < 9; i += 1) {
      const dot = this.add.circle(w.left + rng.next() * (w.right - w.left), w.bottom - rng.next() * (w.bottom - w.top), 4 + rng.next() * 5, 0xffffff, 0.45).setDepth(v.depth.bubble);
      this.bubbles.push({ dot, speed: 18 + rng.next() * 26 });
    }
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (this.deps.paused() || over.length > 0) return;
      this.deps.onPick({ kind: 'ground' });
    });
    this.events.on(Phaser.Scenes.Events.WAKE, () => this.sync(true));
    this.sync(true);
  }

  override update(time: number, delta: number) {
    this.sync(false);
    if (this.deps.reduceMotion()) return;
    const w = AQUARIUM_VIEW.water;
    for (const s of this.swimmers.values()) this.swim(s, time, delta);
    for (const b of this.bubbles) {
      b.dot.y -= (b.speed * delta) / 1000;
      if (b.dot.y < w.top) b.dot.y = w.bottom;
    }
  }

  /** One step of a fish towards its target; at the target it rests, then picks another. */
  private swim(s: Swimmer, time: number, delta: number) {
    const { water, swim } = AQUARIUM_VIEW;
    const dx = s.tx - s.img.x;
    const dy = s.ty - s.img.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      if (time >= s.restUntil) {
        s.tx = water.left + 60 + s.rng.next() * (water.right - water.left - 120);
        s.ty = water.top + 30 + s.rng.next() * (water.bottom - water.top - 60);
        s.restUntil = time + swim.pauseMs[0] + s.rng.next() * (swim.pauseMs[1] - swim.pauseMs[0]);
      }
    } else {
      const step = (swim.speed * (s.sick ? swim.sickFactor : 1) * s.img.scaleX * delta) / 1000;
      const k = Math.min(1, Math.abs(step) / dist);
      s.img.x += dx * k;
      s.img.y += dy * k;
      if (Math.abs(dx) > 4) s.img.setFlipX(dx < 0);
    }
    s.icon.setPosition(s.img.x, s.img.y - s.img.displayHeight * 0.6);
  }

  /** Redraws what changed since the last call (the fish themselves move every frame, but who is there changes rarely). */
  private sync(force: boolean) {
    const state = this.deps.read();
    if (!state) return;
    const key = JSON.stringify([
      state.fish.map((f) => [f.id, f.species, Math.round(f.growth / 5), f.sick, f.hunger < 30]),
      Math.round(state.water / 5),
      state.scales,
      state.eggs,
      state.night,
    ]);
    if (!force && key === this.shown) return;
    this.shown = key;
    const v = AQUARIUM_VIEW;
    this.murk.setAlpha(Math.min(0.5, Math.max(0, (1 - state.water / 100) * 0.55)));
    this.night.setAlpha(state.night ? 0.32 : 0);
    this.pile.setText(`✨ ${state.scales}`).setVisible(state.scales > 0);
    // Eggs on the sand.
    this.eggs.clear();
    for (let i = 0; i < state.eggs; i += 1) {
      const { x, y } = eggSpot(i);
      this.eggs.fillStyle(0xfff3d6, 1).fillEllipse(x, y, 30, 38).lineStyle(3, 0xd9b98a, 1).strokeEllipse(x, y, 30, 38);
    }
    // Fish: add the new, update the known, drop the gone.
    const ids = new Set(state.fish.map((f) => f.id));
    for (const [id, s] of this.swimmers) {
      if (ids.has(id)) continue;
      s.img.destroy();
      s.icon.destroy();
      this.swimmers.delete(id);
    }
    for (const f of state.fish) {
      let s = this.swimmers.get(f.id);
      const art = FISH[f.species]?.art ?? '';
      if (!s) {
        const rng = mulberry32(hashSeed('swim', f.id));
        const w = v.water;
        const x = w.left + 60 + rng.next() * (w.right - w.left - 120);
        const y = w.top + 30 + rng.next() * (w.bottom - w.top - 60);
        // Plain bounds, not pixel-perfect: a flipped, scaled fish is hard to hit pixel by pixel.
        const img = this.add.image(x, y, KEY(art, this.textures)).setDepth(v.depth.fish).setInteractive({ useHandCursor: true });
        img.on(Phaser.Input.Events.POINTER_DOWN, () => !this.deps.paused() && this.deps.onPick({ kind: 'fish', id: f.id }));
        const icon = this.add.text(x, y, '', { fontSize: '30px' }).setOrigin(0.5).setDepth(v.depth.badge - 2);
        s = { img, icon, rng, tx: x, ty: y, restUntil: 0, species: f.species, sick: f.sick };
        this.swimmers.set(f.id, s);
      }
      if (s.species !== f.species) {
        s.species = f.species;
        s.img.setTexture(KEY(art, this.textures));
      }
      s.sick = f.sick;
      s.img.setScale(fishScale(f.growth)).setTint(f.sick ? v.sickTint : 0xffffff);
      s.icon.setText(fishIcon(f));
    }
  }
}
