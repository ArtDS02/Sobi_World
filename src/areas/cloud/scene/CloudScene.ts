// The Cloud on screen (spec §8.4): beds of flowers on a bank of cloud under a pastel sky, the spring of pure water and
// the cauldron. Draws and reports clicks only — what a click does, and every number, comes from the app through
// CloudSceneDeps, so the scene never reaches the store or another Area.
import * as Phaser from 'phaser';
import { vi } from '../../../i18n/vi';
import { fitCamera } from '../../../ui/world/fitCamera';
import { FALLBACK_PROP_KEY, textureKey } from '../../../ui/world/keys';
import { CLOUD_BUILDING_ART, CLOUD_PLOT_ART, FLOWER_STAGES, flowerArtId } from '../logic/art';
import { FLOWERS, MAX_PLOTS } from '../logic/config/content';
import type { SceneState } from '../logic/derived';
import { CLOUD_DESIGN, CLOUD_VIEW, flowerStageOf, plotCentre, slotsToDraw } from './cloudView';

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

export class CloudScene extends Phaser.Scene {
  private plots: PlotSprites[] = [];
  private buildings = new Map<'spring' | 'cauldron', { img: Phaser.GameObjects.Image; badge: Phaser.GameObjects.Text }>();
  private hover!: Phaser.GameObjects.Rectangle;
  private nightWash!: Phaser.GameObjects.Rectangle;
  private sky!: Phaser.GameObjects.Graphics;
  private skyNight: boolean | null = null;
  private shown = '';

  constructor(private readonly deps: CloudSceneDeps) {
    super(CLOUD_SCENE_KEY);
  }

  create() {
    fitCamera(this, CLOUD_DESIGN);
    this.sky = this.add.graphics().setDepth(CLOUD_VIEW.depth.sky);
    this.paintGround();
    this.nightWash = this.add
      .rectangle(CLOUD_DESIGN.width / 2, CLOUD_DESIGN.height / 2, CLOUD_DESIGN.width * 3, CLOUD_DESIGN.height * 3, 0x1a1a40, CLOUD_VIEW.nightAlpha)
      .setDepth(CLOUD_VIEW.depth.night)
      .setVisible(false);
    this.hover = this.add
      .rectangle(0, 0, CLOUD_VIEW.plotSize.width + 8, CLOUD_VIEW.plotSize.height + 8)
      .setStrokeStyle(4, CLOUD_VIEW.hover, 0.9)
      .setDepth(CLOUD_VIEW.depth.plot + 1)
      .setVisible(false);
    for (let i = 0; i < MAX_PLOTS; i += 1) this.plots.push(this.makePlot(i));
    this.makeBuilding('spring', CLOUD_BUILDING_ART.spring, CLOUD_VIEW.spring, vi.cloud.spring);
    this.makeBuilding('cauldron', CLOUD_BUILDING_ART.cauldron, CLOUD_VIEW.cauldron, vi.cloud.cauldron);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (this.deps.paused() || over.length > 0) return;
      this.deps.onPick({ kind: 'ground' });
    });
    this.events.on(Phaser.Scenes.Events.WAKE, () => this.sync(true));
    this.sync(true);
  }

  override update(time: number) {
    this.sync(false);
    if (this.deps.reduceMotion()) return;
    const { scale, periodMs } = CLOUD_VIEW.ripePulse;
    const swing = 1 + Math.sin((time / periodMs) * Math.PI * 2) * scale;
    for (const p of this.plots) if (p.ripe) p.flower.setScale(swing);
  }

  /** The sky (day or night wash) and the cloud banks the beds stand on. */
  private paintSky(night: boolean) {
    const { width, height } = CLOUD_DESIGN;
    const v = CLOUD_VIEW;
    const bleed = width * 2;
    this.sky.clear();
    this.sky.fillStyle(night ? v.sky.nightTop : v.sky.dayTop, 1).fillRect(-bleed, -bleed, width + bleed * 2, height + bleed * 2);
    this.sky.fillStyle(night ? v.sky.nightBottom : v.sky.dayBottom, 1).fillRect(-bleed, height * 0.55, width + bleed * 2, height + bleed);
  }

  private paintGround() {
    const { width, height } = CLOUD_DESIGN;
    const v = CLOUD_VIEW;
    const g = this.add.graphics().setDepth(v.depth.ground);
    for (let i = 0; i < 12; i += 1) {
      const x = 120 + ((i * 331) % (width - 240));
      const y = 120 + ((i * 197) % (height * 0.35));
      g.fillStyle(v.cloudShade, 0.8).fillEllipse(x, y + 10, 220, 60);
      g.fillStyle(v.cloudBank, 0.9).fillEllipse(x, y, 200, 56);
    }
    // The bank under the beds, and the path from the spring and the cauldron to them.
    g.fillStyle(v.cloudShade, 1).fillRoundedRect(150, 150, width - 300, height - 220, 120);
    g.fillStyle(v.cloudBank, 1).fillRoundedRect(160, 140, width - 320, height - 230, 120);
    g.fillStyle(v.path, 1).fillRoundedRect(150, 470, 380, 56, 24);
  }

  private makePlot(index: number): PlotSprites {
    const { x, y } = plotCentre(index);
    const v = CLOUD_VIEW;
    const bed = this.add.image(x, y, KEY(CLOUD_PLOT_ART, this.textures)).setDepth(v.depth.plot).setInteractive({ useHandCursor: true });
    const flower = this.add.image(x, y + v.plotSize.height * 0.3, FALLBACK_PROP_KEY).setOrigin(0.5, 1).setDepth(v.depth.crop + index * 0.01).setVisible(false);
    bed.on(Phaser.Input.Events.POINTER_OVER, () => !this.deps.paused() && this.hover.setPosition(x, y).setVisible(true));
    bed.on(Phaser.Input.Events.POINTER_OUT, () => this.hover.setVisible(false));
    bed.on(Phaser.Input.Events.POINTER_DOWN, () => {
      if (this.deps.paused()) return;
      const state = this.deps.read();
      this.deps.onPick(state && index < state.plots.length ? { kind: 'plot', index } : { kind: 'locked' });
    });
    return { bed, flower, ripe: false };
  }

  private makeBuilding(id: 'spring' | 'cauldron', art: string, at: { x: number; y: number }, name: string) {
    const v = CLOUD_VIEW;
    const img = this.add.image(at.x, at.y, KEY(art, this.textures)).setOrigin(0.5, 1).setDepth(v.depth.building + at.y * 0.01);
    img.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 20 });
    img.on(Phaser.Input.Events.POINTER_DOWN, () => !this.deps.paused() && this.deps.onPick({ kind: 'building', building: id }));
    const l = v.label;
    this.add
      .text(at.x, at.y + l.offsetY, name, { fontFamily: l.fontFamily, fontSize: `${l.fontPx}px`, color: l.color, backgroundColor: l.background, padding: { x: l.padX, y: l.padY } })
      .setOrigin(0.5, 0)
      .setDepth(v.depth.badge - 1);
    const badge = this.add
      .text(at.x + img.displayWidth * 0.38, at.y - img.displayHeight + 6, '', { fontFamily: l.fontFamily, fontSize: `${v.badge.fontPx}px`, color: v.badge.color, backgroundColor: v.badge.background, padding: { x: 8, y: 2 } })
      .setOrigin(0.5)
      .setDepth(v.depth.badge)
      .setVisible(false);
    this.buildings.set(id, { img, badge });
  }

  /** Redraws what changed since the last call (the picture of a plot only changes now and then). */
  private sync(force: boolean) {
    const state = this.deps.read();
    if (!state) return;
    if (state.night !== this.skyNight) {
      this.skyNight = state.night;
      this.paintSky(state.night);
      this.nightWash.setVisible(state.night);
    }
    const key = JSON.stringify([
      state.plots.map((p) => [p.stage, p.flowerId, Math.floor(p.share * 8), p.watered, p.fertilized]),
      state.water,
      state.cauldron,
    ]);
    if (!force && key === this.shown) return;
    this.shown = key;
    const drawn = slotsToDraw(state.plots.length, MAX_PLOTS);
    this.plots.forEach((sprites, i) => {
      const view = state.plots[i];
      const visible = i < drawn;
      sprites.bed.setVisible(visible);
      if (!visible) return void sprites.flower.setVisible(false);
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
      sprites.flower.setTexture(KEY(flowerArtId(flower, stage), this.textures)).setVisible(true).setScale(1);
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
}
