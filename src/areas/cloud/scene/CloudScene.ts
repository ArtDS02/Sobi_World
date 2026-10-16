// The Cloud on screen (spec §8.4, decision 023): a painted sky island (bg_cloud) with one cloud tier of 5 × 3 flower plots
// at a time, the spring of pure water and the cauldron on the grass banks at the left, wooden label planks, and the tier's
// title banner with arrows to go up or down a tier. Motion is presentation only and stops with reduceMotion: flowers sway in
// a breeze, slow idle floating (never in step), light hover answers, the cloud bird and its caterpillars (cloudBird), and a
// pass through the clouds when the tier changes.
// Draws and reports clicks only — what a click does, and every number, comes from the app through CloudSceneDeps, so the
// scene never reaches the store or another Area.
import * as Phaser from 'phaser';
import { fitCamera } from '../../../ui/world/fitCamera';
import { FALLBACK_PROP_KEY, textureKey } from '../../../ui/world/keys';
import type { WorldRect } from '../../../systems/layout/camera';
import { CLOUD_BACKDROP_ART, CLOUD_PLOT_ART, FLOWER_STAGES, flowerArtId, type FlowerStage } from '../logic/art';
import { FLOWERS, PLOTS_PER_TIER, TIER_COUNT } from '../logic/config/content';
import type { SceneState } from '../logic/derived';
import { CloudBird } from './cloudBird';
import { brightOf, coverBackdrop, ensureFxTextures, paintSky, floatIdle, makeDrifts, makeVeil, moveDrifts, playTierMove, pressable, setBright, swayFlowers, type Drift } from './cloudFx';
import { setViewedTier } from '../viewedTier';
import { CloudBuildings } from './cloudBuildings';
import { CloudDrone } from './cloudDrone';
import { CloudTierBar } from './cloudTierBar';
import { CLOUD_DESIGN, CLOUD_VIEW, flowerStageOf, plotCentre, plotIndex, viewableTiers } from './cloudView';

export const CLOUD_SCENE_KEY = 'cloud';

/** What a click on the canvas was on. */
export type CloudPick =
  | { kind: 'plot'; index: number }
  | { kind: 'locked' }
  | { kind: 'building'; building: 'spring' | 'cauldron' | 'shop' }
  | { kind: 'ground' };

export interface CloudSceneDeps {
  /** The cloud now (null before the world is loaded or while the Cloud is closed). */
  read: () => SceneState | null;
  onPick: (pick: CloudPick) => void;
  reduceMotion: () => boolean;
  /** A panel or dialog covers the world: clicks on the canvas are ignored. */
  paused: () => boolean;
}

export interface PlotSprites {
  bed: Phaser.GameObjects.Image;
  flower: Phaser.GameObjects.Image;
  bright: Phaser.FX.ColorMatrix | null;
  /** The picture on the plot (null: no flower), for the sway and the caterpillars. */
  stage: FlowerStage | null;
  ripe: boolean;
}

const KEY = (id: string, textures: Phaser.Textures.TextureManager) => (textures.exists(textureKey(id)) ? textureKey(id) : FALLBACK_PROP_KEY);

/** The tier a fresh look at the Cloud opens on: the highest one with an owned plot. */
const topOwnedTier = (owned: number): number => Math.floor((owned - 1) / PLOTS_PER_TIER);

export class CloudScene extends Phaser.Scene {
  private plots: PlotSprites[] = [];
  private buildings!: CloudBuildings;
  private drone!: CloudDrone;
  private nightWash!: Phaser.GameObjects.Rectangle;
  private sky!: Phaser.GameObjects.Graphics;
  private backdrop!: Phaser.GameObjects.Image;
  private field!: Phaser.GameObjects.Container;
  private veil: Phaser.GameObjects.Image[] = [];
  private drifts: Drift[] = [];
  private bar!: CloudTierBar;
  private bird!: CloudBird;
  private view: WorldRect = { x: 0, y: 0, width: CLOUD_DESIGN.width, height: CLOUD_DESIGN.height };
  private skyNight: boolean | null = null;
  private shown = '';
  /** The tier on screen (0-based), the owned plot count it was chosen for, and whether a tier change is playing. */
  private tier = -1;
  private ownedSeen = 0;
  private moving = false;
  private idleCount = 0;
  /** Images whose art is fixed: re-pointed when their texture arrives after the scene was built (slow first load). */
  private fixedArt: [Phaser.GameObjects.Image, string][] = [];

  constructor(private readonly deps: CloudSceneDeps) {
    super(CLOUD_SCENE_KEY);
  }

  create() {
    const v = CLOUD_VIEW;
    ensureFxTextures(this);
    this.sky = this.add.graphics().setDepth(v.depth.sky);
    this.backdrop = this.fixed(CLOUD_DESIGN.width / 2, CLOUD_DESIGN.height / 2, CLOUD_BACKDROP_ART).setDepth(v.depth.ground);
    this.drifts = makeDrifts((x, y, art) => this.fixed(x, y, art));
    fitCamera(this, CLOUD_DESIGN, (view) => this.coverView(view));
    this.nightWash = this.add
      .rectangle(CLOUD_DESIGN.width / 2, CLOUD_DESIGN.height / 2, CLOUD_DESIGN.width * 3, CLOUD_DESIGN.height * 3, 0x1a1a40, v.nightAlpha)
      .setDepth(v.depth.night)
      .setVisible(false);
    // The field: beds first, then every flower above every bed; moved as one when the tier changes.
    this.field = this.add.container(0, 0).setDepth(v.depth.plot);
    const beds = Array.from({ length: PLOTS_PER_TIER }, (_, slot) => this.makeBed(slot));
    this.plots = beds.map((bed, slot) => this.makeFlower(bed, slot));
    this.buildings = new CloudBuildings(this, {
      fixed: (x, y, id) => this.fixed(x, y, id),
      press: (img) => this.press(img),
      paused: () => this.deps.paused(),
      reduceMotion: () => this.deps.reduceMotion(),
      onPick: (building) => this.deps.onPick({ kind: 'building', building }),
    });
    this.bar = new CloudTierBar(this, this.field, {
      fixed: (x, y, id) => this.fixed(x, y, id),
      press: (img) => this.press(img),
      float: (targets, px) => this.float(targets, px),
      paused: () => this.deps.paused(),
      onStep: (step) => this.changeTier(step),
      onLocked: () => this.deps.onPick({ kind: 'locked' }),
    });
    this.bird = new CloudBird(this, {
      fixed: (x, y, id) => this.fixed(x, y, id),
      reduceMotion: () => this.deps.reduceMotion(),
      busy: () => this.moving,
      flowers: () => this.plots,
    });
    this.veil = makeVeil((x, y, art) => this.fixed(x, y, art));
    this.drone = new CloudDrone(this, {
      centre: (slot) => ({ x: plotCentre(slot).x + this.field.x, y: plotCentre(slot).y + this.field.y }),
      reduceMotion: () => this.deps.reduceMotion(),
      show: (slot) => this.plots[slot]?.flower.setTint(0xf4ffd8),
    });
    this.events.on(Phaser.Scenes.Events.SLEEP, () => this.drone.reset());
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (this.deps.paused() || over.length > 0) return;
      this.deps.onPick({ kind: 'ground' });
    });
    this.events.on(Phaser.Scenes.Events.WAKE, () => this.sync(true));
    const onTexture = (key: string) => {
      for (const [img, id] of this.fixedArt) if (textureKey(id) === key) img.setTexture(key);
      this.sync(true);
    };
    this.textures.on(Phaser.Textures.Events.ADD, onTexture);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.textures.off(Phaser.Textures.Events.ADD, onTexture));
    this.sync(true);
  }

  override update(time: number, delta: number) {
    this.sync(false);
    if (this.deps.reduceMotion()) return;
    swayFlowers(this.plots, time);
    moveDrifts(this.drifts, this.view, time);
    this.bird.update(time, delta);
  }

  /** An image of fixed art (see fixedArt). */
  private fixed(x: number, y: number, id: string): Phaser.GameObjects.Image {
    const img = this.add.image(x, y, KEY(id, this.textures));
    this.fixedArt.push([img, id]);
    return img;
  }

  /** Hover press (a small swell) on a plank or an arrow. */
  private press(img: Phaser.GameObjects.Image) {
    pressable(this, img, { paused: () => this.deps.paused(), reduceMotion: () => this.deps.reduceMotion() });
  }

  /** A slow float of its own rhythm (none when motion is reduced). */
  private float(targets: Phaser.GameObjects.GameObject[], px: number) {
    if (!this.deps.reduceMotion()) floatIdle(this, targets, px, this.idleCount++);
  }

  private makeBed(slot: number): Phaser.GameObjects.Image {
    const { x, y } = plotCentre(slot);
    const bed = this.add.image(x, y, KEY(CLOUD_PLOT_ART, this.textures)).setInteractive({ useHandCursor: true });
    this.field.add(bed);
    return bed;
  }

  private makeFlower(bed: Phaser.GameObjects.Image, slot: number): PlotSprites {
    const v = CLOUD_VIEW;
    const { x, y } = plotCentre(slot);
    const flowerY = y + v.flowerOffsetY;
    const flower = this.add.image(x, flowerY, FALLBACK_PROP_KEY).setOrigin(0.5, 1).setVisible(false);
    this.field.add(flower);
    const sprites: PlotSprites = { bed, flower, bright: brightOf(bed), stage: null, ripe: false };
    const lift = (dy: number) => {
      if (this.deps.reduceMotion()) return;
      this.tweens.add({ targets: bed, y: y - dy, duration: v.hover.ms, ease: 'Sine.easeOut' });
      this.tweens.add({ targets: flower, y: flowerY - dy, duration: v.hover.ms, ease: 'Sine.easeOut' });
    };
    bed.on(Phaser.Input.Events.POINTER_OVER, () => {
      if (this.deps.paused() || this.moving) return;
      setBright(sprites.bright, true);
      lift(v.hover.lift);
    });
    bed.on(Phaser.Input.Events.POINTER_OUT, () => {
      setBright(sprites.bright, false);
      lift(0);
    });
    bed.on(Phaser.Input.Events.POINTER_DOWN, () => {
      if (this.deps.paused() || this.moving) return;
      const state = this.deps.read();
      const index = plotIndex(this.tier, slot);
      this.deps.onPick(state && index < state.plots.length ? { kind: 'plot', index } : { kind: 'locked' });
    });
    return sprites;
  }

  // ---------- view, tiers ----------

  /** The backdrop covers the whole visible view (wider or taller than the design frame), keeping its proportions. */
  private coverView(view: WorldRect) {
    this.view = view;
    coverBackdrop(this.backdrop, view);
  }

  /** Goes `step` tiers up (+1) or down (−1): the field passes through the clouds (instant when motion is reduced). */
  private changeTier(step: number) {
    const state = this.deps.read();
    if (!state || this.moving) return;
    const max = viewableTiers(state.plots.length, TIER_COUNT) - 1;
    const next = Math.min(Math.max(this.tier + step, 0), max);
    if (next === this.tier) return;
    if (this.deps.reduceMotion()) {
      this.tier = next;
      this.drone.reset();
      return void this.sync(true);
    }
    this.drone.reset();
    this.moving = true;
    for (const p of this.plots) setBright(p.bright, false);
    this.bird.clearPests();
    playTierMove(this, {
      field: this.field,
      backdrop: this.backdrop,
      veil: this.veil,
      title: this.bar.title,
      dir: Math.sign(next - this.tier),
      swap: () => {
        this.tier = next;
        this.sync(true);
        return this.bar.titleScale();
      },
      done: () => (this.moving = false),
    });
  }

  /** Redraws what changed since the last call (the picture of a plot only changes now and then). */
  private sync(force: boolean) {
    const state = this.deps.read();
    if (!state) return;
    const owned = state.plots.length;
    // First look: the highest owned tier. A newly opened tier: go there.
    if (this.tier < 0 || (owned > this.ownedSeen && this.ownedSeen > 0 && topOwnedTier(owned) > topOwnedTier(this.ownedSeen))) {
      this.tier = topOwnedTier(owned);
      force = true;
    }
    this.ownedSeen = owned;
    setViewedTier(this.tier);
    if (state.night !== this.skyNight) {
      this.skyNight = state.night;
      paintSky(this.sky, state.night);
      this.nightWash.setVisible(state.night);
    }
    const first = plotIndex(this.tier, 0);
    const key = JSON.stringify([
      this.tier,
      owned,
      state.plots.slice(first, first + PLOTS_PER_TIER).map((p) => [p.stage, p.flowerId, Math.floor(p.share * 8), p.watered, p.fertilized]),
      state.water,
      state.cauldron,
    ]);
    if (!force && key === this.shown) return;
    this.shown = key;
    this.drone.check(state, this.tier, this.moving);
    this.drawTierBar(owned);
    this.plots.forEach((sprites, slot) => {
      const view = state.plots[plotIndex(this.tier, slot)];
      sprites.stage = null;
      sprites.ripe = false;
      if (!view) {
        sprites.bed.setTexture(KEY(CLOUD_PLOT_ART, this.textures)).setTint(CLOUD_VIEW.unbuilt.tint).setAlpha(CLOUD_VIEW.unbuilt.alpha);
        sprites.flower.setVisible(false);
        return;
      }
      sprites.bed.setTexture(KEY(CLOUD_PLOT_ART, this.textures)).setTint(view.watered ? 0xdcecff : 0xffffff).setAlpha(1);
      const flower = view.flowerId ? FLOWERS[view.flowerId] : undefined;
      sprites.ripe = view.stage === 'ripe';
      if (!flower) return void sprites.flower.setVisible(false);
      const stage = flowerStageOf(view);
      if (!FLOWER_STAGES.includes(stage)) return;
      sprites.stage = stage;
      sprites.flower.setTexture(KEY(flowerArtId(flower, stage), this.textures)).setVisible(true).setScale(CLOUD_VIEW.flowerScale);
      sprites.flower.setTint(view.fertilized && !this.drone.holding(slot) ? 0xf4ffd8 : 0xffffff);
    });
    this.buildings.draw(state);
    this.bird.keepOnly(new Set(this.plots.flatMap((p, slot) => (p.stage === 'grow' || p.stage === 'ripe' ? [slot] : []))));
  }

  /** The tier bar and the tier's colour over the shared backdrop. */
  private drawTierBar(owned: number) {
    this.bar.draw(this.tier, owned);
    this.backdrop.setTint(CLOUD_VIEW.tierTints[this.tier] ?? 0xffffff);
  }
}
