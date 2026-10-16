// The Garden on screen (spec §8.2, GĐ14 on the owner's mock-up, decisions 027 and 028): a painted field (bg_garden) with
// one zone of plots on the lawn inside the path (GardenField), the mill and the composter at the left, the sprinkler at
// the right spraying while it works, and the fertiliser drone flying over newly fertilised plots. Draws and reports clicks
// only — what a click does, and every number, comes from the app through GardenSceneDeps, so the scene never reaches
// the store or another Area. The zone on screen is the UI's choice (viewedZone).
import * as Phaser from 'phaser';
import type { WorldRect } from '../../../systems/layout/camera';
import { vi } from '../../../i18n/vi';
import { itemArtId } from '../../../core/config/assetIds';
import { stallKey } from '../../../ui/world/codeStall';
import { fitCamera } from '../../../ui/world/fitCamera';
import { FALLBACK_PROP_KEY, textureKey } from '../../../ui/world/keys';
import { GARDEN_BACKDROP_ART, SPRINKLER_ART } from '../logic/art';
import { CROPS, GB, PLOTS_PER_ZONE, type BuildingId } from '../logic/config/content';
import type { SceneState, WorkshopView } from '../logic/derived';
import { onViewedZone, viewedZone } from '../viewedZone';
import { GardenDrone } from './gardenDrone';
import { GardenField } from './gardenField';
import { harvestFly, mist, NameTip, ripenSparkle, sprayBurst } from './gardenFx';
import { GardenLife } from './gardenLife';
import { GARDEN_DESIGN, GARDEN_VIEW, plotIndex } from './gardenView';

export const GARDEN_SCENE_KEY = 'garden';

/** What a click on the canvas was on. */
export type GardenPick =
  | { kind: 'plot'; index: number }
  | { kind: 'locked' }
  | { kind: 'building'; building: BuildingId | 'sprinkler' | 'shop' }
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
type Place = BuildingId | 'sprinkler' | 'shop';

const KEY = (id: string, textures: Phaser.Textures.TextureManager) => (textures.exists(textureKey(id)) ? textureKey(id) : FALLBACK_PROP_KEY);

export class GardenScene extends Phaser.Scene {
  private field!: GardenField;
  private workshops = new Map<Place, { img: Img; badge: Phaser.GameObjects.Text; scale: number }>();
  private backdrop!: Img;
  private tip!: NameTip;
  private shown = '';
  /** The zone drawn, and whether a zone change is playing. */
  private zone = 0;
  private moving = false;
  private drone!: GardenDrone;
  private turn = 0;
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
    this.field = new GardenField(this, { paused: () => this.deps.paused(), onSlot: (slot) => this.pickSlot(slot) });
    this.tip = new NameTip(this);
    this.drone = new GardenDrone(this, this.field, () => this.deps.reduceMotion());
    this.makeBuilding('mill', GB.buildings.mill.art, v.mill, vi.garden.mill);
    this.makeBuilding('composter', GB.buildings.composter.art, v.composter, vi.garden.composter);
    this.makeBuilding('sprinkler', SPRINKLER_ART, v.sprinkler, vi.garden.sprinkler);
    this.makeBuilding('shop', v.shop.art, v.shop, vi.garden.shop);
    const shop = this.workshops.get('shop')!.img;
    if (!this.textures.exists(textureKey(v.shop.art))) shop.setTexture(stallKey(this, v.shop.art, v.shop.colours));
    new GardenLife(this, () => this.deps.reduceMotion());
    this.zone = Math.max(0, viewedZone());
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (this.deps.paused() || over.length > 0) return;
      this.deps.onPick({ kind: 'ground' });
    });
    const offZone = onViewedZone((zone, from) => this.changeZone(zone, from));
    const onTexture = (key: string) => {
      for (const [img, id] of this.fixedArt) if (textureKey(id) === key) img.setTexture(key);
      if (key === textureKey(GARDEN_BACKDROP_ART)) this.coverView(this.viewNow());
      this.sync(true);
    };
    this.textures.on(Phaser.Textures.Events.ADD, onTexture);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.textures.off(Phaser.Textures.Events.ADD, onTexture);
      offZone();
    });
    this.events.on(Phaser.Scenes.Events.WAKE, () => this.sync(true));
    this.events.on(Phaser.Scenes.Events.SLEEP, () => this.drone.reset());
    this.time.addEvent({ delay: v.spray.everyMs, loop: true, callback: () => this.spray() });
    this.time.addEvent({ delay: v.spray.mistEveryMs, loop: true, callback: () => this.mistPlots() });
    this.sync(true);
  }

  override update(time: number) {
    this.sync(false);
    if (!this.deps.reduceMotion()) this.field.sway(time);
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

  private pickSlot(slot: number) {
    const state = this.deps.read();
    const index = plotIndex(this.zone, slot);
    this.deps.onPick(state && index < state.plots.length ? { kind: 'plot', index } : { kind: 'locked' });
  }

  private makeBuilding(id: Place, art: string, at: { x: number; y: number; scale: number }, name: string) {
    const v = GARDEN_VIEW;
    const img = this.fixed(at.x, at.y, art).setOrigin(0.5, 1).setScale(at.scale).setDepth(v.depth.building + at.y * 0.01);
    img.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 20 });
    img.on(Phaser.Input.Events.POINTER_DOWN, () => !this.deps.paused() && this.deps.onPick({ kind: 'building', building: id }));
    const swell = (on: boolean) => {
      this.tweens.killTweensOf(img);
      const base = this.workshops.get(id)?.scale ?? at.scale;
      const scale = on ? base * v.hover.swell : base;
      if (this.deps.reduceMotion()) img.setScale(scale);
      else this.tweens.add({ targets: img, scale, duration: v.hover.ms, ease: 'Quad.easeOut' });
    };
    img.on(Phaser.Input.Events.POINTER_OVER, () => {
      if (this.deps.paused()) return;
      swell(true);
      this.tip.show(name, at.x, at.y - img.displayHeight);
    });
    img.on(Phaser.Input.Events.POINTER_OUT, () => {
      swell(false);
      this.tip.hide();
    });
    const badge = this.add
      .text(at.x + img.displayWidth * 0.36, at.y - img.displayHeight * 0.86, '', {
        fontFamily: v.label.fontFamily,
        fontSize: `${v.badge.fontPx}px`,
        fontStyle: 'bold',
        color: v.badge.color,
        backgroundColor: v.badge.background,
        padding: { x: 12, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(v.depth.badge)
      .setVisible(false);
    this.workshops.set(id, { img, badge, scale: at.scale });
  }

  /** The UI chose another zone: the field slides there (at once when motion is reduced or on first look). */
  private changeZone(zone: number, from: number) {
    this.drone.reset();
    this.field.forget();
    if (from < 0 || this.deps.reduceMotion() || this.moving) {
      this.zone = Math.max(0, zone);
      return void this.sync(true);
    }
    this.moving = true;
    this.field.slide(
      Math.sign(zone - from),
      () => {
        this.zone = zone;
        this.sync(true);
      },
      () => (this.moving = false),
    );
  }

  /** A burst from the sprinkler's head while it is built (it waters on its own). */
  private spray() {
    const state = this.deps.read();
    const s = this.workshops.get('sprinkler');
    if (!state || !s || state.sprinkler <= 0 || this.deps.reduceMotion() || !this.sys.isActive()) return;
    this.turn += 0.9;
    sprayBurst(this, s.img.x, s.img.y - s.img.displayHeight * GARDEN_VIEW.spray.headY, this.turn);
  }

  /** A light mist on a few plots of the zone on screen that the sprinkler keeps watered. */
  private mistPlots() {
    const state = this.deps.read();
    if (!state || this.deps.reduceMotion() || this.moving || !this.sys.isActive()) return;
    const first = this.zone * PLOTS_PER_ZONE;
    const covered = state.plots.slice(first, first + PLOTS_PER_ZONE).flatMap((p, slot) => (p.covered && p.stage === 'growing' ? [slot] : []));
    for (let k = 0; k < GARDEN_VIEW.spray.mistPlots && covered.length > 0; k += 1) {
      const slot = covered.splice(Phaser.Math.Between(0, covered.length - 1), 1)[0]!;
      const c = this.field.centre(slot);
      mist(this, c.x, c.y);
    }
  }

  /** Redraws what changed since the last call (the picture of a plot only changes now and then). */
  private sync(force: boolean) {
    const state = this.deps.read();
    if (!state) return;
    const first = this.zone * PLOTS_PER_ZONE;
    const key = JSON.stringify([
      this.zone,
      state.plots.length,
      state.plots.slice(first, first + PLOTS_PER_ZONE).map((p) => [p.stage, p.cropId, Math.floor(p.share * 8), p.watered, p.fertilized]),
      state.sprinkler,
      state.mill,
      state.composter,
    ]);
    if (!force && key === this.shown) return;
    this.shown = key;
    const calm = this.deps.reduceMotion() || this.moving;
    this.drone.check(state, this.zone, this.moving);
    const { harvested, ripened } = this.field.changes(this.zone, state.plots);
    this.field.draw(this.zone, state.plots);
    this.backdrop.setTint(GARDEN_VIEW.zoneTints[this.zone] ?? 0xffffff);
    if (!calm) this.celebrate(harvested, ripened);
    this.drawSprinkler(state.sprinkler);
    this.setWorkshop('mill', state.mill);
    this.setWorkshop('composter', state.composter);
  }

  /** Harvested crops fly to the bag; crops that just ripened hop and sparkle. */
  private celebrate(harvested: { slot: number; cropId: string; amount: number }[], ripened: number[]) {
    for (const h of harvested) {
      const produce = CROPS[h.cropId]?.produceItem;
      if (produce) harvestFly(this, this.field.centre(h.slot), KEY(itemArtId(produce), this.textures), h.amount);
    }
    for (const slot of ripened) {
      this.field.hop(slot);
      const c = this.field.centre(slot);
      ripenSparkle(this, c.x, c.y - 40);
    }
  }

  /** The sprinkler's look for its level: its own art when painted, else the base art a little bigger per level. */
  private drawSprinkler(level: number) {
    const s = this.workshops.get('sprinkler');
    if (!s) return;
    const v = GARDEN_VIEW;
    const own = `${SPRINKLER_ART}_l${level}`;
    const painted = level >= 2 && this.textures.exists(textureKey(own));
    s.img.setTexture(KEY(painted ? own : SPRINKLER_ART, this.textures)).setTint(level > 0 ? 0xffffff : v.unbuiltTint);
    s.scale = v.sprinkler.scale * (painted ? 1 : 1 + Math.max(0, level - 1) * v.sprinklerGrow);
    if (!this.tweens.isTweening(s.img)) s.img.setScale(s.scale);
  }

  private setWorkshop(id: BuildingId, view: WorkshopView) {
    const w = this.workshops.get(id);
    if (!w) return;
    w.img.setTint(view.built ? 0xffffff : GARDEN_VIEW.unbuiltTint);
    const text = view.ready > 0 ? `✓ ${view.ready}` : view.busy ? '…' : '';
    w.badge.setText(text).setBackgroundColor(view.ready > 0 ? GARDEN_VIEW.badge.readyBackground : GARDEN_VIEW.badge.background).setVisible(text !== '');
  }
}
