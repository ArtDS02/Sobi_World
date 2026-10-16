// The Garden on screen (spec §8.2, GĐ14 on the owner's mock-up): a painted field (bg_garden) with four rows of plots on
// the lawn inside the path, the crops growing on them, the mill and the composter at the left, the sprinkler at the right,
// each with its name sign on a post. Draws and reports clicks only — what a click does, and every number, comes from the
// app through GardenSceneDeps, so the scene never reaches the store or another Area.
import * as Phaser from 'phaser';
import type { WorldRect } from '../../../systems/layout/camera';
import { vi } from '../../../i18n/vi';
import { fitCamera } from '../../../ui/world/fitCamera';
import { FALLBACK_PROP_KEY, textureKey } from '../../../ui/world/keys';
import { CROP_STAGES, cropArtId, GARDEN_BACKDROP_ART, GARDEN_SIGN_ART, PLOT_ART, SPRINKLER_ART } from '../logic/art';
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

type Img = Phaser.GameObjects.Image;
type Place = BuildingId | 'sprinkler';

interface PlotSprites {
  soil: Img;
  crop: Img;
  ripe: boolean;
}

const KEY = (id: string, textures: Phaser.Textures.TextureManager) => (textures.exists(textureKey(id)) ? textureKey(id) : FALLBACK_PROP_KEY);

export class GardenScene extends Phaser.Scene {
  private plots: PlotSprites[] = [];
  private workshops = new Map<Place, { img: Img; badge: Phaser.GameObjects.Text; scale: number }>();
  private backdrop!: Img;
  private shown = '';
  /** Images whose art is fixed: re-pointed when their texture arrives after the scene was built (slow first load). */
  private fixedArt: [Img, string][] = [];

  constructor(private readonly deps: GardenSceneDeps) {
    super(GARDEN_SCENE_KEY);
  }

  create() {
    const v = GARDEN_VIEW;
    this.paintSky();
    this.backdrop = this.fixed(GARDEN_DESIGN.width / 2, GARDEN_DESIGN.height / 2, GARDEN_BACKDROP_ART).setDepth(v.depth.ground);
    fitCamera(this, GARDEN_DESIGN, (view) => this.coverView(view));
    for (let i = 0; i < MAX_PLOTS; i += 1) this.plots.push(this.makePlot(i));
    this.makeBuilding('mill', GB.buildings.mill.art, v.mill, vi.garden.mill);
    this.makeBuilding('composter', GB.buildings.composter.art, v.composter, vi.garden.composter);
    this.makeBuilding('sprinkler', SPRINKLER_ART, v.sprinkler, vi.garden.sprinkler);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (this.deps.paused() || over.length > 0) return;
      this.deps.onPick({ kind: 'ground' });
    });
    const onTexture = (key: string) => {
      for (const [img, id] of this.fixedArt) if (textureKey(id) === key) img.setTexture(key);
      if (key === textureKey(GARDEN_BACKDROP_ART)) this.coverView(this.viewNow());
      this.sync(true);
    };
    this.textures.on(Phaser.Textures.Events.ADD, onTexture);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.textures.off(Phaser.Textures.Events.ADD, onTexture));
    this.events.on(Phaser.Scenes.Events.WAKE, () => this.sync(true));
    this.sync(true);
  }

  override update(time: number) {
    this.sync(false);
    if (this.deps.reduceMotion()) return;
    const { scale, periodMs } = GARDEN_VIEW.ripePulse;
    const swing = GARDEN_VIEW.cropScale * (1 + Math.sin((time / periodMs) * Math.PI * 2) * scale);
    for (const p of this.plots) if (p.ripe) p.crop.setScale(swing);
  }

  /** An image of fixed art (see fixedArt). */
  private fixed(x: number, y: number, id: string): Img {
    const img = this.add.image(x, y, KEY(id, this.textures));
    this.fixedArt.push([img, id]);
    return img;
  }

  /** The flat sky behind the backdrop (seen only where the image does not reach). */
  private paintSky() {
    const { width, height } = GARDEN_DESIGN;
    const { sky, depth } = GARDEN_VIEW;
    const bleed = width * 2;
    const g = this.add.graphics().setDepth(depth.sky);
    g.fillStyle(sky.top, 1).fillRect(-bleed, -bleed, width + bleed * 2, height + bleed * 2);
    g.fillStyle(sky.bottom, 1).fillRect(-bleed, height * 0.55, width + bleed * 2, height + bleed);
  }

  private viewNow(): WorldRect {
    const cam = this.cameras.main;
    return { x: cam.worldView.x, y: cam.worldView.y, width: cam.worldView.width, height: cam.worldView.height };
  }

  /** The backdrop covers whatever part of the world the screen shows (wide screens see more of its sides). */
  private coverView(view: WorldRect) {
    const { width, height } = GARDEN_VIEW.backdrop;
    const s = Math.max(view.width / width, view.height / height, GARDEN_DESIGN.height / height);
    this.backdrop.setDisplaySize(width * s, height * s).setPosition(view.x + view.width / 2, view.y + view.height / 2);
  }

  /** Hover: the target swells a touch (and lifts by `lift` px) while the pointer is on it. */
  private hoverable(img: Img, base: () => { scale: number; y: number }, lift = 0) {
    const h = GARDEN_VIEW.hover;
    const to = (on: boolean) => {
      const b = base();
      this.tweens.killTweensOf(img);
      if (this.deps.reduceMotion()) return void img.setScale(on ? b.scale * h.swell : b.scale).setY(on ? b.y - lift : b.y);
      this.tweens.add({ targets: img, scale: on ? b.scale * h.swell : b.scale, y: on ? b.y - lift : b.y, duration: h.ms, ease: 'Quad.easeOut' });
    };
    img.on(Phaser.Input.Events.POINTER_OVER, () => !this.deps.paused() && to(true));
    img.on(Phaser.Input.Events.POINTER_OUT, () => to(false));
  }

  private makePlot(index: number): PlotSprites {
    const { x, y } = plotCentre(index);
    const v = GARDEN_VIEW;
    const soil = this.add.image(x, y, KEY(PLOT_ART.soil, this.textures)).setScale(v.plotScale).setDepth(v.depth.plot).setInteractive({ useHandCursor: true });
    const cropY = y + v.plotSize.height * v.plotScale * v.cropOffset;
    const crop = this.add.image(x, cropY, FALLBACK_PROP_KEY).setOrigin(0.5, 1).setScale(v.cropScale).setDepth(v.depth.crop + index * 0.01).setVisible(false);
    this.hoverable(soil, () => ({ scale: v.plotScale, y }), v.hover.lift);
    soil.on(Phaser.Input.Events.POINTER_DOWN, () => {
      if (this.deps.paused()) return;
      const state = this.deps.read();
      this.deps.onPick(state && index < state.plots.length ? { kind: 'plot', index } : { kind: 'locked' });
    });
    return { soil, crop, ripe: false };
  }

  private makeBuilding(id: Place, art: string, at: { x: number; y: number; scale: number }, name: string) {
    const v = GARDEN_VIEW;
    const pick = () => !this.deps.paused() && this.deps.onPick({ kind: 'building', building: id });
    const img = this.fixed(at.x, at.y, art).setOrigin(0.5, 1).setScale(at.scale).setDepth(v.depth.building + at.y * 0.01);
    img.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 20 });
    img.on(Phaser.Input.Events.POINTER_DOWN, pick);
    this.hoverable(img, () => ({ scale: at.scale, y: at.y }));
    if (id === 'composter') this.makePaintedLabel(v.paintedSign.composter, name, pick);
    else this.makeSign(v.signs[id], name, pick);
    const badge = this.add
      .text(at.x + img.displayWidth * 0.38, at.y - img.displayHeight + 6, '', { fontFamily: v.label.fontFamily, fontSize: `${v.badge.fontPx}px`, color: v.badge.color, backgroundColor: v.badge.background, padding: { x: 8, y: 2 } })
      .setOrigin(0.5)
      .setDepth(v.depth.badge)
      .setVisible(false);
    this.workshops.set(id, { img, badge, scale: at.scale });
  }

  /** The building's name on a wooden sign; clicking the sign is clicking the building. */
  private makeSign(at: { x: number; y: number }, name: string, pick: () => void) {
    const v = GARDEN_VIEW;
    const sign = this.fixed(at.x, at.y, GARDEN_SIGN_ART).setOrigin(0.5, 1).setDepth(v.depth.sign + at.y * 0.01);
    const scale = v.sign.width / v.sign.canvas.width;
    sign.setScale(scale).setInteractive({ useHandCursor: true });
    sign.on(Phaser.Input.Events.POINTER_DOWN, pick);
    const text = this.add
      .text(at.x, at.y - v.sign.canvas.height * scale * v.sign.textY, name, { fontFamily: v.label.fontFamily, fontSize: `${v.label.fontPx}px`, fontStyle: 'bold', color: v.label.color })
      .setOrigin(0.5)
      .setDepth(v.depth.sign + at.y * 0.01 + 0.001);
    const fit = (v.sign.width * v.sign.maxText) / text.width;
    if (fit < 1) text.setScale(fit);
    this.hoverable(sign, () => ({ scale, y: at.y }));
  }

  /** A name written on a sign painted in the backdrop; a click on the sign's face is a click on the building. */
  private makePaintedLabel(at: { x: number; y: number; width: number; height: number }, name: string, pick: () => void) {
    const v = GARDEN_VIEW;
    const text = this.add
      .text(at.x, at.y, name, { fontFamily: v.label.fontFamily, fontSize: `${v.label.fontPx}px`, fontStyle: 'bold', color: v.label.color })
      .setOrigin(0.5)
      .setDepth(v.depth.sign);
    const fit = (at.width * 0.9) / text.width;
    if (fit < 1) text.setScale(fit);
    const zone = this.add.zone(at.x, at.y, at.width, at.height).setInteractive({ useHandCursor: true });
    zone.on(Phaser.Input.Events.POINTER_DOWN, pick);
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
        sprites.soil.setTexture(KEY(PLOT_ART.locked, this.textures));
        sprites.crop.setVisible(false);
        sprites.ripe = false;
        return;
      }
      sprites.soil.setTexture(KEY(view.watered ? PLOT_ART.wet : PLOT_ART.soil, this.textures));
      const crop = view.cropId ? CROPS[view.cropId] : undefined;
      sprites.ripe = view.stage === 'ripe';
      if (!crop) return void sprites.crop.setVisible(false);
      const stage = cropStageOf(view);
      if (!CROP_STAGES.includes(stage)) return;
      sprites.crop.setTexture(KEY(cropArtId(crop, stage), this.textures)).setVisible(true).setScale(GARDEN_VIEW.cropScale);
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
