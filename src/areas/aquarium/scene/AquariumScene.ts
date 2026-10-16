// The Aquarium on screen (spec V2 §8.3, GĐ14 on the owner's mock-ups, decision 030): one painted place per tank level
// (AquariumPlaces) with its fish swimming, the "Bể cá" sign and the name plaque, the rod at the fishing spot, the eggs
// and the pile of scales on the sand. The fish swim (fishSwim.ts); feeding drops pellets the fed fish chase, a water
// change pours fresh water in (aquariumFx.ts) — both read off the state (a new meal, the water rising), like the
// Garden's harvest. Draws and reports clicks only — what a click does, and every number, comes from
// the app through AquariumSceneDeps, so the scene never reaches the store or another Area.
import * as Phaser from 'phaser';
import type { WorldRect } from '../../../systems/layout/camera';
import { vi } from '../../../i18n/vi';
import { hashSeed, mulberry32, type Rng } from '../../../core/rng';
import { fitCamera } from '../../../ui/world/fitCamera';
import { FALLBACK_PROP_KEY, textureKey } from '../../../ui/world/keys';
import { FISH } from '../logic/config/content';
import type { SceneState } from '../logic/derived';
import { AquariumCare } from './aquariumCare';
import { AquariumFx } from './aquariumFx';
import { AquariumProps } from './aquariumProps';
import { FishBody } from './fishBody';
import { Swimmer, type Mood } from './fishSwim';
import { AQUARIUM_DESIGN, AQUARIUM_VIEW, aquariumPlace, fishIcon, fishScale, murkAlpha, type AquariumPlace } from './aquariumView';

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

const KEY = (id: string, textures: Phaser.Textures.TextureManager) => (textures.exists(textureKey(id)) ? textureKey(id) : FALLBACK_PROP_KEY);

export class AquariumScene extends Phaser.Scene {
  private swimmers = new Map<string, Swimmer>();
  private backdrop!: Phaser.GameObjects.Image;
  private props!: AquariumProps;
  private murk!: Phaser.GameObjects.Rectangle;
  private night!: Phaser.GameObjects.Rectangle;
  private bubbles: { dot: Phaser.GameObjects.Arc; speed: number }[] = [];
  private fx!: AquariumFx;
  private care!: AquariumCare;
  /** A cast is ready (a fish bites now and then) and when it next bites. */
  private castReady = false;
  private biteAt = 0;
  private readonly biteRng = mulberry32(hashSeed('aquarium-bite'));
  private place: AquariumPlace = aquariumPlace(1);
  private level = 0;
  private shown = '';
  /** The world rect the screen shows, as fitCamera last reported it (the camera's worldView lags a frame). */
  private view: WorldRect = { x: 0, y: 0, ...AQUARIUM_DESIGN };

  constructor(private readonly deps: AquariumSceneDeps) {
    super(AQUARIUM_SCENE_KEY);
  }

  create() {
    const v = AQUARIUM_VIEW;
    const { width, height } = AQUARIUM_DESIGN;
    const bleed = width * 2;
    const g = this.add.graphics().setDepth(v.depth.sky);
    g.fillStyle(v.sky, 1).fillRect(-bleed, -bleed, width + bleed * 2, bleed + height * 0.35);
    g.fillStyle(v.sea, 1).fillRect(-bleed, height * 0.35, width + bleed * 2, height + bleed);
    this.backdrop = this.add.image(width / 2, height / 2, KEY(this.place.art, this.textures)).setDepth(v.depth.ground);
    fitCamera(this, AQUARIUM_DESIGN, (view) => {
      this.view = view;
      this.coverView();
    });

    const pick = (p: AquariumPick) => !this.deps.paused() && this.deps.onPick(p);
    this.props = new AquariumProps(this, { onPick: pick, reduceMotion: () => this.deps.reduceMotion() });
    this.murk = this.add.rectangle(0, 0, 1, 1, v.murk).setOrigin(0, 0).setAlpha(0).setDepth(v.depth.murk);
    this.fx = new AquariumFx(this, mulberry32(hashSeed('aquarium-fx')));
    this.care = new AquariumCare(this, {
      fx: this.fx,
      murk: this.murk,
      swimmers: () => this.swimmers.values(),
      fish: (id) => this.swimmers.get(id),
      place: () => this.place,
      view: () => this.view,
      reduceMotion: () => this.deps.reduceMotion(),
    });
    this.night = this.add.rectangle(width / 2, height / 2, width * 3, height * 3, v.night).setAlpha(0).setDepth(v.depth.night);
    const rng = mulberry32(hashSeed('bubbles'));
    for (let i = 0; i < 9; i += 1) {
      const dot = this.add.circle(0, rng.next() * 1000, 4 + rng.next() * 5, 0xffffff, 0.45).setDepth(v.depth.bubble);
      dot.setData('u', rng.next()).setData('v', rng.next());
      this.bubbles.push({ dot, speed: 18 + rng.next() * 26 });
    }
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (this.deps.paused() || over.length > 0) return;
      this.deps.onPick({ kind: 'ground' });
    });
    // Pictures that arrive after the scene was built (slow first load) replace their fallback.
    const onTexture = (key: string) => {
      if (key === textureKey(this.place.art)) {
        this.backdrop.setTexture(key);
        this.coverView();
      }
      this.props.retexture(key);
      for (const s of this.swimmers.values()) if (key === textureKey(FISH[s.species]?.art ?? '')) s.img.setTexture(key);
    };
    this.textures.on(Phaser.Textures.Events.ADD, onTexture);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.textures.off(Phaser.Textures.Events.ADD, onTexture));
    this.events.on(Phaser.Scenes.Events.WAKE, () => this.sync(true));
    this.events.on(Phaser.Scenes.Events.SLEEP, () => this.care.calmDown());
    this.sync(true);
  }

  override update(time: number, delta: number) {
    this.sync(false);
    if (this.deps.reduceMotion()) {
      for (const s of this.swimmers.values()) s.still();
      return;
    }
    const w = this.place.water;
    this.fx.update(time, delta, w);
    if (this.castReady && time >= this.biteAt) {
      const [lo, hi] = AQUARIUM_VIEW.bite.everyMs;
      this.biteAt = time + lo + this.biteRng.next() * (hi - lo);
      const spot = this.props.bite();
      if (spot) this.fx.bite(spot, w);
    }
    const hooks = { bubble: (x: number, y: number) => this.fx.bubble(x, y, w, 8, 40) };
    const { chaseFactor, eatPx } = AQUARIUM_VIEW.feed;
    for (const [id, s] of this.swimmers) {
      let food = s.appetite > 0 ? this.fx.claim(id, s.m.x, s.m.y) : null;
      if (s.appetite > 0 && !food) s.appetite = 0;
      if (food && this.fx.eat(id, s.m.x, s.m.y, eatPx + s.img.displayWidth * 0.25)) {
        s.appetite -= 1;
        s.gulp(time);
        hooks.bubble(s.m.x + s.facing * s.img.displayWidth * 0.4, s.m.y);
        food = null;
      }
      s.update(time, delta, w, food, chaseFactor, hooks);
    }
    for (const b of this.bubbles) {
      b.dot.y -= (b.speed * delta) / 1000;
      if (b.dot.y < w.top) b.dot.y = w.bottom;
    }
  }

  /** The backdrop covers whatever part of the world the screen shows (wide screens see more of its sides). */
  private coverView() {
    const view = this.view;
    const { width, height } = AQUARIUM_VIEW.backdrop;
    const s = Math.max(view.width / width, view.height / height, AQUARIUM_DESIGN.height / height);
    this.backdrop.setDisplaySize(width * s, height * s).setPosition(view.x + view.width / 2, view.y + view.height / 2);
  }

  /** Moves everything to the place of a tank level (on entry, and when the tank is upgraded). */
  private enterPlace(level: number) {
    this.level = level;
    this.place = aquariumPlace(level);
    const p = this.place;
    this.backdrop.setTexture(KEY(p.art, this.textures));
    this.coverView();
    this.props.layout(p, vi.aquarium.scene.places[Math.min(level, vi.aquarium.scene.places.length) - 1] ?? '');
    this.murk.setPosition(p.murk.left, p.murk.top).setSize(p.murk.right - p.murk.left, p.murk.bottom - p.murk.top);
    for (const b of this.bubbles) {
      b.dot.x = p.water.left + (b.dot.getData('u') as number) * (p.water.right - p.water.left);
      b.dot.y = p.water.top + (b.dot.getData('v') as number) * (p.water.bottom - p.water.top);
    }
    this.care.calmDown();
    for (const s of this.swimmers.values()) {
      const at = this.randomSpot(s.rng);
      s.place(at.x, at.y);
    }
  }

  private randomSpot(rng: Rng): { x: number; y: number } {
    const w = this.place.water;
    return { x: w.left + 60 + rng.next() * (w.right - w.left - 120), y: w.top + 30 + rng.next() * (w.bottom - w.top - 60) };
  }

  /** Redraws what changed since the last call (the fish themselves move every frame, but who is there changes rarely). */
  private sync(force: boolean) {
    const state = this.deps.read();
    if (!state) return;
    if (state.level !== this.level) this.enterPlace(state.level);
    this.care.notice(state);
    this.castReady = state.castReady;
    const key = JSON.stringify([
      state.fish.map((f) => [f.id, f.species, Math.round(f.growth / 5), f.sick, f.hunger < 30]),
      Math.round(state.water / 5),
      state.scales,
      state.eggs,
      state.night,
      state.castReady,
      this.level,
    ]);
    if (!force && key === this.shown) return;
    this.shown = key;
    const v = AQUARIUM_VIEW;
    // While a water change plays, its tween owns the murk.
    if (!this.care.murkHeld && !this.tweens.isTweening(this.murk)) this.murk.setAlpha(murkAlpha(state.water));
    this.night.setAlpha(state.night ? 0.32 : 0);
    this.props.show(state);
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
        const { x, y } = this.randomSpot(rng);
        // Plain bounds, not pixel-perfect: a flipped, scaled fish is hard to hit pixel by pixel.
        const img = new FishBody(this, x, y, KEY(art, this.textures), v.depth.fish);
        img.hit.on(Phaser.Input.Events.POINTER_DOWN, () => !this.deps.paused() && this.deps.onPick({ kind: 'fish', id: f.id }));
        const icon = this.add.text(x, y, '', { fontSize: '30px' }).setOrigin(0.5).setDepth(v.depth.badge - 2);
        s = new Swimmer(img, icon, rng, f.species);
        s.fedAt = f.fedAt;
        this.swimmers.set(f.id, s);
      }
      if (s.species !== f.species) {
        s.species = f.species;
        s.img.setTexture(KEY(art, this.textures));
      }
      s.mood = moodOf(f);
      s.base = fishScale(f.growth);
      s.img.setTint(f.sick ? v.sickTint : 0xffffff);
      if (this.deps.reduceMotion()) s.still();
      s.icon.setText(fishIcon(f));
    }
  }
}


const moodOf = (f: { sick: boolean; hunger: number }): Mood => (f.sick ? 'sick' : f.hunger < 30 ? 'hungry' : 'calm');
