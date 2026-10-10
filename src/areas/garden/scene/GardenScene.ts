// The Garden on screen (spec §8.2): a fenced field of plots with the crops growing on them, the sprinkler and the
// two workshops. Draws and reports clicks only — what a click does, and every number, comes from the app through
// GardenSceneDeps, so the scene never reaches the store or another Area.
import * as Phaser from 'phaser';
import { vi } from '../../../i18n/vi';
import { fitCamera } from '../../../ui/world/fitCamera';
import { FALLBACK_PROP_KEY, textureKey } from '../../../ui/world/keys';
import { CROP_STAGES, cropArtId, PLOT_ART, SPRINKLER_ART } from '../logic/art';
import { CROPS, GB, MAX_PLOTS, type BuildingId } from '../logic/config/content';
import type { SceneState, WorkshopView } from '../logic/derived';
import { cropStageOf, GARDEN_DESIGN, GARDEN_VIEW, plotCentre, slotsToDraw } from './gardenView';

export const GARDEN_SCENE_KEY = 'garden';

/** What a click on the canvas was on. */
export type GardenPick =
  | { kind: 'plot'; index: number }
  | { kind: 'locked' }
  | { kind: 'building'; building: BuildingId | 'sprinkler' }
  | { kind: 'ground' };

export interface GardenSceneDeps {
  /** The garden now (null before the world is loaded or while the Garden is closed). */
  read: () => SceneState | null;
  onPick: (pick: GardenPick) => void;
  reduceMotion: () => boolean;
  /** A panel or dialog covers the world: clicks on the canvas are ignored. */
  paused: () => boolean;
}

interface PlotSprites {
  soil: Phaser.GameObjects.Image;
  crop: Phaser.GameObjects.Image;
  ripe: boolean;
}

const KEY = (id: string, textures: Phaser.Textures.TextureManager) => (textures.exists(textureKey(id)) ? textureKey(id) : FALLBACK_PROP_KEY);

export class GardenScene extends Phaser.Scene {
  private plots: PlotSprites[] = [];
  private workshops = new Map<BuildingId | 'sprinkler', { img: Phaser.GameObjects.Image; badge: Phaser.GameObjects.Text }>();
  private hover!: Phaser.GameObjects.Rectangle;
  private shown = '';

  constructor(private readonly deps: GardenSceneDeps) {
    super(GARDEN_SCENE_KEY);
  }

  create() {
    fitCamera(this, GARDEN_DESIGN);
    this.paintGround();
    this.hover = this.add
      .rectangle(0, 0, GARDEN_VIEW.plotSize.width + 8, GARDEN_VIEW.plotSize.height + 8)
      .setStrokeStyle(4, GARDEN_VIEW.hover, 0.9)
      .setDepth(GARDEN_VIEW.depth.plot + 1)
      .setVisible(false);
    for (let i = 0; i < MAX_PLOTS; i += 1) this.plots.push(this.makePlot(i));
    this.makeBuilding('mill', GB.buildings.mill.art, GARDEN_VIEW.mill, vi.garden.mill);
    this.makeBuilding('composter', GB.buildings.composter.art, GARDEN_VIEW.composter, vi.garden.composter);
    this.makeBuilding('sprinkler', SPRINKLER_ART, GARDEN_VIEW.sprinkler, vi.garden.sprinkler);
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
    const { scale, periodMs } = GARDEN_VIEW.ripePulse;
    const swing = 1 + Math.sin((time / periodMs) * Math.PI * 2) * scale;
    for (const p of this.plots) if (p.ripe) p.crop.setScale(swing);
  }

  private paintGround() {
    const { width, height } = GARDEN_DESIGN;
    const v = GARDEN_VIEW;
    const bleed = width * 2;
    const g = this.add.graphics().setDepth(v.depth.ground);
    // Two flat bands read as a sky on every renderer (a gradient fill needs WebGL).
    g.fillStyle(v.skyTop, 1).fillRect(-bleed, -bleed, width + bleed * 2, bleed + v.horizonY);
    g.fillStyle(v.skyBottom, 1).fillRect(-bleed, v.horizonY - 70, width + bleed * 2, 70);
    g.fillStyle(v.grass, 1).fillRect(-bleed, v.horizonY, width + bleed * 2, height + bleed);
    g.fillStyle(v.grassDark, 1);
    for (let i = 0; i < 18; i += 1) g.fillEllipse(80 + ((i * 331) % (width - 160)), v.horizonY + 60 + ((i * 197) % (height - v.horizonY - 100)), 120, 26);
    // The path from the workshops to the field, and the fence around the field.
    g.fillStyle(v.path, 1).fillRoundedRect(150, 470, 380, 56, 24);
    const f = v.field;
    const left = f.x - 100;
    const right = f.x + (v.columns - 1) * f.stepX + 100;
    const top = f.y - 90;
    const bottom = f.y + 3 * f.stepY + 70;
    g.lineStyle(10, v.fence, 1).strokeRoundedRect(left, top, right - left, bottom - top, 18);
  }

  private makePlot(index: number): PlotSprites {
    const { x, y } = plotCentre(index);
    const v = GARDEN_VIEW;
    const soil = this.add.image(x, y, KEY(PLOT_ART.soil, this.textures)).setDepth(v.depth.plot).setInteractive({ useHandCursor: true });
    const crop = this.add.image(x, y + v.plotSize.height * 0.3, FALLBACK_PROP_KEY).setOrigin(0.5, 1).setDepth(v.depth.crop + index * 0.01).setVisible(false);
    soil.on(Phaser.Input.Events.POINTER_OVER, () => !this.deps.paused() && this.hover.setPosition(x, y).setVisible(true));
    soil.on(Phaser.Input.Events.POINTER_OUT, () => this.hover.setVisible(false));
    soil.on(Phaser.Input.Events.POINTER_DOWN, () => {
      if (this.deps.paused()) return;
      const state = this.deps.read();
      this.deps.onPick(state && index < state.plots.length ? { kind: 'plot', index } : { kind: 'locked' });
    });
    return { soil, crop, ripe: false };
  }

  private makeBuilding(id: BuildingId | 'sprinkler', art: string, at: { x: number; y: number }, name: string) {
    const v = GARDEN_VIEW;
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
    this.workshops.set(id, { img, badge });
  }

  /** Redraws what changed since the last call (the picture of a plot only changes now and then). */
  private sync(force: boolean) {
    const state = this.deps.read();
    if (!state) return;
    const key = JSON.stringify([
      state.plots.map((p) => [p.stage, p.cropId, Math.floor(p.share * 8), p.watered, p.fertilized]),
      state.sprinkler,
      state.mill,
      state.composter,
    ]);
    if (!force && key === this.shown) return;
    this.shown = key;
    const drawn = slotsToDraw(state.plots.length, MAX_PLOTS);
    this.plots.forEach((sprites, i) => {
      const view = state.plots[i];
      const visible = i < drawn;
      sprites.soil.setVisible(visible);
      if (!visible) return void sprites.crop.setVisible(false);
      if (!view) {
        sprites.soil.setTexture(KEY(PLOT_ART.locked, this.textures)).clearTint();
        sprites.crop.setVisible(false);
        sprites.ripe = false;
        return;
      }
      sprites.soil.setTexture(KEY(view.watered ? PLOT_ART.wet : PLOT_ART.soil, this.textures)).clearTint();
      const crop = view.cropId ? CROPS[view.cropId] : undefined;
      sprites.ripe = view.stage === 'ripe';
      if (!crop) return void sprites.crop.setVisible(false);
      const stage = cropStageOf(view);
      if (!CROP_STAGES.includes(stage)) return;
      sprites.crop.setTexture(KEY(cropArtId(crop, stage), this.textures)).setVisible(true).setScale(1);
      sprites.crop.setTint(view.fertilized ? 0xf4ffd8 : 0xffffff);
    });
    this.setWorkshop('mill', state.mill);
    this.setWorkshop('composter', state.composter);
    const sprinkler = this.workshops.get('sprinkler');
    if (sprinkler) {
      sprinkler.img.setTint(state.sprinkler > 0 ? 0xffffff : GARDEN_VIEW.unbuiltTint);
      sprinkler.badge.setText(state.sprinkler > 0 ? `${state.sprinkler}` : '').setVisible(state.sprinkler > 0);
    }
  }

  private setWorkshop(id: BuildingId, view: WorkshopView) {
    const w = this.workshops.get(id);
    if (!w) return;
    w.img.setTint(view.built ? 0xffffff : GARDEN_VIEW.unbuiltTint);
    const text = view.ready > 0 ? `✓ ${view.ready}` : view.busy ? '…' : '';
    w.badge.setText(text).setBackgroundColor(view.ready > 0 ? GARDEN_VIEW.badge.readyBackground : GARDEN_VIEW.badge.background).setVisible(text !== '');
  }
}
