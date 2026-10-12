// The Cloud on screen (spec §8.4, decision 023): a painted sky island (bg_cloud) with one cloud tier of 5 × 3 flower plots
// at a time, the spring of pure water and the cauldron on the grass banks at the left, wooden label planks, and the tier's
// title banner with arrows to go up or down a tier. Draws and reports clicks only — what a click does, and every number,
// comes from the app through CloudSceneDeps, so the scene never reaches the store or another Area.
import * as Phaser from 'phaser';
import { formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { fitCamera } from '../../../ui/world/fitCamera';
import { FALLBACK_PROP_KEY, textureKey } from '../../../ui/world/keys';
import type { WorldRect } from '../../../systems/layout/camera';
import { CLOUD_BACKDROP_ART, CLOUD_BUILDING_ART, CLOUD_DRESSING_ART, CLOUD_PLOT_ART, FLOWER_STAGES, flowerArtId } from '../logic/art';
import { CB, FLOWERS, PLOTS_PER_TIER, TIER_COUNT } from '../logic/config/content';
import type { SceneState } from '../logic/derived';
import { CLOUD_DESIGN, CLOUD_VIEW, flowerStageOf, plotCentre, plotIndex, viewableTiers } from './cloudView';

export const CLOUD_SCENE_KEY = 'cloud';

/** What a click on the canvas was on. */
export type CloudPick =
  | { kind: 'plot'; index: number }
  | { kind: 'locked' }
  | { kind: 'building'; building: 'spring' | 'cauldron' }
  | { kind: 'ground' };

export interface CloudSceneDeps {
  /** The cloud now (null before the world is loaded or while the Cloud is closed). */
  read: () => SceneState | null;
  onPick: (pick: CloudPick) => void;
  reduceMotion: () => boolean;
  /** A panel or dialog covers the world: clicks on the canvas are ignored. */
  paused: () => boolean;
}

interface PlotSprites {
  bed: Phaser.GameObjects.Image;
  flower: Phaser.GameObjects.Image;
  ripe: boolean;
}

const KEY = (id: string, textures: Phaser.Textures.TextureManager) => (textures.exists(textureKey(id)) ? textureKey(id) : FALLBACK_PROP_KEY);

/** The tier a fresh look at the Cloud opens on: the highest one with an owned plot. */
const topOwnedTier = (owned: number): number => Math.floor((owned - 1) / PLOTS_PER_TIER);

/** The step that opens tier `tier` (0-based), for the closed tier's notice. */
const tierStep = (tier: number) => CB.plotExpansions.find((e) => e.plots === (tier + 1) * PLOTS_PER_TIER);

export class CloudScene extends Phaser.Scene {
  private plots: PlotSprites[] = [];
  private buildings = new Map<'spring' | 'cauldron', { img: Phaser.GameObjects.Image; badge: Phaser.GameObjects.Text }>();
  private hover!: Phaser.GameObjects.Rectangle;
  private nightWash!: Phaser.GameObjects.Rectangle;
  private sky!: Phaser.GameObjects.Graphics;
  private backdrop!: Phaser.GameObjects.Image;
  private titleText!: Phaser.GameObjects.Text;
  private upArrow!: Phaser.GameObjects.Image;
  private downArrow!: Phaser.GameObjects.Image;
  private lockedNote!: Phaser.GameObjects.Text;
  private bird!: Phaser.GameObjects.Image;
  private skyNight: boolean | null = null;
  private shown = '';
  /** The tier on screen (0-based) and the owned plot count it was chosen for. */
  private tier = -1;
  private ownedSeen = 0;
  /** Images whose art is fixed: re-pointed when their texture arrives after the scene was built (slow first load). */
  private fixedArt: [Phaser.GameObjects.Image, string][] = [];

  constructor(private readonly deps: CloudSceneDeps) {
    super(CLOUD_SCENE_KEY);
  }

  create() {
    const v = CLOUD_VIEW;
    this.sky = this.add.graphics().setDepth(v.depth.sky);
    this.backdrop = this.fixed(CLOUD_DESIGN.width / 2, CLOUD_DESIGN.height / 2, CLOUD_BACKDROP_ART).setDepth(v.depth.ground);
    fitCamera(this, CLOUD_DESIGN, (view) => this.coverView(view));
    this.nightWash = this.add
      .rectangle(CLOUD_DESIGN.width / 2, CLOUD_DESIGN.height / 2, CLOUD_DESIGN.width * 3, CLOUD_DESIGN.height * 3, 0x1a1a40, v.nightAlpha)
      .setDepth(v.depth.night)
      .setVisible(false);
    this.hover = this.add
      .rectangle(0, 0, v.plotSize.width + 8, v.plotSize.height + 8)
      .setStrokeStyle(4, v.hover, 0.9)
      .setDepth(v.depth.plot + 1)
      .setVisible(false);
    for (let slot = 0; slot < PLOTS_PER_TIER; slot += 1) this.plots.push(this.makePlot(slot));
    this.makeBuilding('spring', CLOUD_BUILDING_ART.spring, v.spring);
    this.makeBuilding('cauldron', CLOUD_BUILDING_ART.cauldron, v.cauldron);
    this.makePlank(v.springLabel, vi.cloud.spring, 'spring');
    this.makePlank(v.cauldronLabel, vi.cloud.cauldron, 'cauldron');
    this.makeTierBar();
    this.makeBird();
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

  /** An image of fixed art (see fixedArt). */
  private fixed(x: number, y: number, id: string): Phaser.GameObjects.Image {
    const img = this.add.image(x, y, KEY(id, this.textures));
    this.fixedArt.push([img, id]);
    return img;
  }

  override update(time: number) {
    this.sync(false);
    if (this.deps.reduceMotion()) return;
    const { scale, periodMs } = CLOUD_VIEW.ripePulse;
    const swing = CLOUD_VIEW.flowerScale * (1 + Math.sin((time / periodMs) * Math.PI * 2) * scale);
    for (const p of this.plots) if (p.ripe) p.flower.setScale(swing);
  }

  /** The backdrop covers the whole visible view (wider or taller than the design frame), keeping its proportions. */
  private coverView(view: WorldRect) {
    const { width, height } = CLOUD_VIEW.backdrop;
    const s = Math.max(view.width / width, view.height / height, CLOUD_DESIGN.height / height);
    this.backdrop.setDisplaySize(width * s, height * s).setPosition(view.x + view.width / 2, view.y + view.height / 2);
  }

  /** The flat sky behind the backdrop (seen only where the image does not reach). */
  private paintSky(night: boolean) {
    const { width, height } = CLOUD_DESIGN;
    const v = CLOUD_VIEW;
    const bleed = width * 2;
    this.sky.clear();
    this.sky.fillStyle(night ? v.sky.nightTop : v.sky.dayTop, 1).fillRect(-bleed, -bleed, width + bleed * 2, height + bleed * 2);
    this.sky.fillStyle(night ? v.sky.nightBottom : v.sky.dayBottom, 1).fillRect(-bleed, height * 0.55, width + bleed * 2, height + bleed);
  }

  private makePlot(slot: number): PlotSprites {
    const { x, y } = plotCentre(slot);
    const v = CLOUD_VIEW;
    const bed = this.add.image(x, y, KEY(CLOUD_PLOT_ART, this.textures)).setDepth(v.depth.plot + slot * 0.01).setInteractive({ useHandCursor: true });
    const flower = this.add.image(x, y + v.plotSize.height * 0.3, FALLBACK_PROP_KEY).setOrigin(0.5, 1).setDepth(v.depth.crop + slot * 0.01).setVisible(false);
    bed.on(Phaser.Input.Events.POINTER_OVER, () => !this.deps.paused() && this.hover.setPosition(x, y).setVisible(true));
    bed.on(Phaser.Input.Events.POINTER_OUT, () => this.hover.setVisible(false));
    bed.on(Phaser.Input.Events.POINTER_DOWN, () => {
      if (this.deps.paused()) return;
      const state = this.deps.read();
      const index = plotIndex(this.tier, slot);
      this.deps.onPick(state && index < state.plots.length ? { kind: 'plot', index } : { kind: 'locked' });
    });
    return { bed, flower, ripe: false };
  }

  private makeBuilding(id: 'spring' | 'cauldron', art: string, at: { x: number; y: number }) {
    const v = CLOUD_VIEW;
    const img = this.fixed(at.x, at.y, art).setOrigin(0.5, 1).setDepth(v.depth.building + at.y * 0.01);
    img.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 20 });
    img.on(Phaser.Input.Events.POINTER_DOWN, () => !this.deps.paused() && this.deps.onPick({ kind: 'building', building: id }));
    const l = v.label;
    const badge = this.add
      .text(at.x + img.displayWidth * (id === 'cauldron' ? -0.38 : 0.38), at.y - img.displayHeight + 6, '', { fontFamily: l.fontFamily, fontSize: `${v.badge.fontPx}px`, color: v.badge.color, backgroundColor: v.badge.background, padding: { x: 8, y: 2 } })
      .setOrigin(0.5)
      .setDepth(v.depth.badge)
      .setVisible(false);
    this.buildings.set(id, { img, badge });
  }

  /** A wooden plank with the building's name; clicking it is clicking the building. */
  private makePlank(at: { x: number; y: number }, name: string, building: 'spring' | 'cauldron') {
    const v = CLOUD_VIEW;
    const plank = this.fixed(at.x, at.y, CLOUD_DRESSING_ART.plank)
      .setDisplaySize(v.plank.width, v.plank.height)
      .setDepth(v.depth.sign)
      .setInteractive({ useHandCursor: true });
    plank.on(Phaser.Input.Events.POINTER_DOWN, () => !this.deps.paused() && this.deps.onPick({ kind: 'building', building }));
    this.add
      .text(at.x + v.plank.height * 0.2, at.y, name, this.signStyle(v.label.fontPx, v.label.color, v.label.stroke, v.label.strokePx))
      .setOrigin(0.5)
      .setDepth(v.depth.sign + 1);
  }

  /** The tier's title banner at the bottom of the field, with the arrows that go down or up a tier. */
  private makeTierBar() {
    const v = CLOUD_VIEW;
    this.fixed(v.title.x, v.title.y, CLOUD_DRESSING_ART.banner).setDisplaySize(v.title.width, v.title.height).setDepth(v.depth.sign);
    const tt = v.titleText;
    this.titleText = this.add.text(v.title.x, v.title.y + 6, '', this.signStyle(tt.fontPx, tt.color, tt.stroke, tt.strokePx)).setOrigin(0.5).setDepth(v.depth.sign + 1);
    const arrow = (at: { x: number; y: number }, art: string, step: number, label: string) => {
      const img = this.fixed(at.x, at.y, art).setDisplaySize(v.arrowSize, v.arrowSize).setDepth(v.depth.sign).setInteractive({ useHandCursor: true });
      img.setName(label);
      img.on(Phaser.Input.Events.POINTER_DOWN, () => !this.deps.paused() && this.showTier(this.tier + step));
      return img;
    };
    this.downArrow = arrow(v.tierDown, CLOUD_DRESSING_ART.down, -1, vi.cloud.tierDown);
    this.upArrow = arrow(v.tierUp, CLOUD_DRESSING_ART.up, 1, vi.cloud.tierUp);
    const lt = v.lockedText;
    const centre = plotCentre(Math.floor(PLOTS_PER_TIER / 2));
    this.lockedNote = this.add
      .text(centre.x, centre.y, '', { fontFamily: v.label.fontFamily, fontSize: `${lt.fontPx}px`, color: lt.color, backgroundColor: lt.background, padding: { x: 18, y: 8 }, align: 'center' })
      .setOrigin(0.5)
      .setDepth(v.depth.sign + 2)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.lockedNote.on(Phaser.Input.Events.POINTER_DOWN, () => !this.deps.paused() && this.deps.onPick({ kind: 'locked' }));
  }

  /** The bird that hovers over the island (scenery only; still when motion is reduced). */
  private makeBird() {
    const b = CLOUD_VIEW.bird;
    this.bird = this.fixed(b.x, b.y, CLOUD_DRESSING_ART.bird).setDisplaySize(b.size, b.size * (150 / 180)).setDepth(CLOUD_VIEW.depth.sign - 1);
    if (this.deps.reduceMotion()) return;
    this.tweens.add({ targets: this.bird, y: b.y - b.drift, x: b.x + b.drift, duration: b.periodMs, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private signStyle(px: number, color: string, stroke: string, strokePx: number): Phaser.Types.GameObjects.Text.TextStyle {
    return { fontFamily: CLOUD_VIEW.label.fontFamily, fontSize: `${px}px`, fontStyle: 'bold', color, stroke, strokeThickness: strokePx };
  }

  /** Puts tier `tier` on screen (clamped to the tiers the player may look at) and redraws. */
  private showTier(tier: number) {
    const state = this.deps.read();
    if (!state) return;
    const max = viewableTiers(state.plots.length, TIER_COUNT) - 1;
    const next = Math.min(Math.max(tier, 0), max);
    if (next === this.tier) return;
    this.tier = next;
    this.hover.setVisible(false);
    this.sync(true);
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
    if (state.night !== this.skyNight) {
      this.skyNight = state.night;
      this.paintSky(state.night);
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
    this.drawTierBar(owned);
    this.plots.forEach((sprites, slot) => {
      const view = state.plots[plotIndex(this.tier, slot)];
      if (!view) {
        sprites.bed.setTexture(KEY(CLOUD_PLOT_ART, this.textures)).setTint(CLOUD_VIEW.unbuiltTint);
        sprites.flower.setVisible(false);
        sprites.ripe = false;
        return;
      }
      sprites.bed.setTexture(KEY(CLOUD_PLOT_ART, this.textures)).setTint(view.watered ? 0xcfe6ff : 0xffffff);
      const flower = view.flowerId ? FLOWERS[view.flowerId] : undefined;
      sprites.ripe = view.stage === 'ripe';
      if (!flower) return void sprites.flower.setVisible(false);
      const stage = flowerStageOf(view);
      if (!FLOWER_STAGES.includes(stage)) return;
      sprites.flower.setTexture(KEY(flowerArtId(flower, stage), this.textures)).setVisible(true).setScale(CLOUD_VIEW.flowerScale);
      sprites.flower.setTint(view.fertilized ? 0xf4ffd8 : 0xffffff);
    });
    const spring = this.buildings.get('spring');
    if (spring) spring.badge.setText(state.water > 0 ? `${state.water}` : '').setBackgroundColor(state.water >= state.waterCapacity ? CLOUD_VIEW.badge.readyBackground : CLOUD_VIEW.badge.background).setVisible(state.water > 0);
    const cauldron = this.buildings.get('cauldron');
    if (cauldron) {
      cauldron.img.setTint(state.cauldron.built ? 0xffffff : CLOUD_VIEW.unbuiltTint);
      const text = state.cauldron.ready > 0 ? `✓ ${state.cauldron.ready}` : state.cauldron.busy ? '…' : '';
      cauldron.badge.setText(text).setBackgroundColor(state.cauldron.ready > 0 ? CLOUD_VIEW.badge.readyBackground : CLOUD_VIEW.badge.background).setVisible(text !== '');
    }
  }

  /** Title, arrows, the tier's colour and the notice over a closed tier. */
  private drawTierBar(owned: number) {
    const name = vi.cloud.tierNames[this.tier] ?? '';
    this.titleText.setText(this.tier === 0 ? name : t(vi.cloud.tierTitle, { n: this.tier + 1, name }));
    const viewable = viewableTiers(owned, TIER_COUNT);
    this.downArrow.setVisible(this.tier > 0);
    this.upArrow.setVisible(this.tier < viewable - 1);
    this.backdrop.setTint(CLOUD_VIEW.tierTints[this.tier] ?? 0xffffff);
    const closed = plotIndex(this.tier, 0) >= owned;
    const step = closed ? tierStep(this.tier) : undefined;
    this.lockedNote.setVisible(Boolean(step));
    if (step) this.lockedNote.setText(t(vi.cloud.tierLocked, { n: this.tier + 1, level: step.level ?? 1, gold: `${formatInt(step.price)} ${vi.cloud.coins}` }));
  }
}
