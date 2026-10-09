// The farm (spec §11.1, §11.2): static scene from layout.placements (layers 0–5), the trough and
// a Map<pigId, PigSprite> reconciled with every store snapshot. Draws only; selection goes to DOM.
// Feedback (§11.3) arrives through bridge.effects (SceneEffects), never from diffing snapshots.
import * as Phaser from 'phaser';
import { SEASON_UNSIGNED_IDS, TROUGH_PROP_ID, type AnchorName, type FxId } from '../../../../core/config/assetIds';
import { FARM_LAYOUT } from '../config/layout';
import { FARM_VIEW } from '../config/farmView';
import { readyOrderCount } from '../../logic/actions/fulfillOrder';
import type { FarmSnapshot } from '../../store';
import { SCENE_KEYS } from '../config/phaser';
import type { FarmBridge, FarmDeps } from '../farmView';
import { noEffects } from '../feedback/effects';
import { Ambient } from '../fx/ambient';
import { DayNightDirector } from '../fx/DayNightDirector';
import { SeasonDirector } from '../fx/SeasonDirector';
import { PigLife } from '../fx/PigLife';
import { SceneEffects } from '../fx/SceneEffects';
import { Backdrop } from '../prefabs/Backdrop';
import { DayNightLayer } from '../prefabs/DayNightLayer';
import { FarmProps } from '../prefabs/FarmProps';
import { FarmWalker } from '../prefabs/FarmWalker';
import { PigArt } from '../prefabs/PigArt';
import { spreadCrowd } from '../prefabs/crowd';
import { GiftBoxes } from '../prefabs/GiftBoxes';
import { Nameplates } from '../prefabs/Nameplates';
import { addHover, addShadow, Badge } from '../prefabs/ObjectDecor';
import type { PigEnv } from '../prefabs/pigEnv';
import { PigSprite } from '../prefabs/PigSprite';
import { giftSpot, type Rect } from '../view/giftPlacement';
import { pigView, type FarmLayout } from '../view/pigView';
import { placementTransform, placementView, visibleLayout } from '../view/sceneLayout';
import { FALLBACK_PROP_KEY, textureKey, troughTextureKey } from '../view/textureKeys';
import { makeClickable } from './farmPick';
import { warnLoadErrors } from './PreloadScene';

export class MainFarmScene extends Phaser.Scene {
  private readonly pigs = new Map<string, PigSprite>();
  /** Pigs gone from the save but still playing their exit tween (bursts can still find them). */
  private readonly leaving = new Map<string, PigSprite>();
  private art!: PigArt; // pig art loaded after preload, anchors, freeing (R12A)
  private trough: Phaser.GameObjects.Image | null = null;
  private board: Phaser.GameObjects.Image | null = null;
  private ordersBadge: Badge | null = null;
  private layout!: FarmLayout;
  private pigEnv!: PigEnv;
  private ambient!: Ambient;
  private plates!: Nameplates;
  private gifts!: GiftBoxes;
  private dayNight!: DayNightLayer;
  private dayClock!: DayNightDirector;
  private season!: SeasonDirector; // seasonal art, backdrop palette, environment FX (SE-1, MU-2)
  private life!: PigLife; // the pigs' needs-driven behaviour (PL-1)
  private walker!: FarmWalker; // the player's character (GĐ3)
  private readonly obstacles: Rect[] = []; // world object bounds; gift boxes keep clear (U06)
  private readonly props = new FarmProps(); // trough texture + owned decorations (PG-3)

  constructor(
    private readonly deps: FarmDeps,
    private readonly bridge: FarmBridge,
  ) {
    super(SCENE_KEYS.farm);
  }

  create() {
    this.layout = visibleLayout(FARM_LAYOUT);
    this.art = new PigArt(this, this.deps.assets, () => this.bridge.refresh());
    this.pigEnv = {
      layout: this.layout,
      troughX: () => this.trough?.x ?? null,
      reduceMotion: () => this.deps.store.getSnapshot().save?.settings.reduceMotion ?? false,
    };
    warnLoadErrors(this.load);
    this.ambient = new Ambient(this, this.pigEnv.reduceMotion);
    this.plates = new Nameplates(this);
    this.gifts = new GiftBoxes(this, this.pigEnv.reduceMotion);
    this.dayNight = new DayNightLayer(this);
    const backdrop = Backdrop.follow(this, this.layout, (rect) => this.dayNight.setView(rect));
    const seasonPreview = () => this.bridge.seasonPreview;
    const phase = () => this.dayClock?.phase() ?? 'day';
    this.season = new SeasonDirector(this, this.deps.assets, backdrop, this.deps.now, seasonPreview, phase);
    this.walker = new FarmWalker(this, {
      layout: this.layout,
      character: this.deps.character,
      host: this.deps.host,
      activate: (pick) => this.deps.onPick(pick),
      pigs: () => this.pigs,
      pigName: (id) => this.deps.store.getSnapshot().save?.pigs.find((p) => p.id === id)?.name,
      gifts: () => this.gifts,
    });
    this.drawPlacements();
    this.season.update();
    const preview = () => this.bridge.phasePreview;
    const bedtime = () => this.life?.nightChanged();
    this.dayClock = new DayNightDirector(this, this.dayNight, this.deps.now, preview, bedtime);
    this.life = new PigLife({
      layout: this.layout,
      now: this.deps.now,
      night: () => this.dayClock.isNight(),
      reduceMotion: this.pigEnv.reduceMotion,
      pigs: () => this.pigs,
      data: () => this.deps.store.getSnapshot().save?.pigs ?? [],
      trough: () => this.trough?.getBounds() ?? null,
    });
    this.bridge.loaded();
    // R12A: the farm fades in after the preload screen (skipped with reduceMotion).
    if (!this.pigEnv.reduceMotion()) this.cameras.main.fadeIn(FARM_VIEW.AMBIENT.fadeInMs);
    // The numbers kept running while the scene slept (the player was in the plaza): draw them now.
    this.events.on(Phaser.Scenes.Events.WAKE, () => this.sync(this.deps.store.getSnapshot()));
    const off = this.deps.store.subscribe((s) => this.sync(s));
    this.bridge.refresh = () => this.sync(this.deps.store.getSnapshot());
    this.bridge.effects = new SceneEffects(this, {
      pig: (id) => this.pigs.get(id) ?? this.leaving.get(id),
      trough: () => this.trough,
      board: () => this.board,
      gifts: () => this.gifts,
      life: (e) => this.life.onEvent(e),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      off();
      this.walker.destroy();
      this.plates.destroy();
      this.gifts.destroy();
      this.dayNight.destroy();
      this.bridge.refresh = () => {};
      this.bridge.effects = noEffects;
    });
    this.sync(this.deps.store.getSnapshot());
  }

  private drawPlacements() {
    const { width, height } = this.layout.designSize;
    this.layout.placements.forEach((p, i) => {
      const v = placementView(p, i, this.layout);
      const entry = this.deps.assets.resolve(p.id);
      if (p.role === 'trough' || p.id === TROUGH_PROP_ID) {
        // Start on a real state texture so the name tag sits under the real sprite.
        const first = troughTextureKey(0, 1);
        this.trough = this.add
          .image(v.x, v.y, this.textures.exists(first) ? first : FALLBACK_PROP_KEY)
          .setOrigin(v.originX, v.originY)
          .setDepth(v.depth);
        this.dress(this.trough, p);
        return;
      }
      const key = textureKey(p.id);
      const loaded = this.textures.exists(key);
      if (entry?.section === 'environment') {
        if (!loaded) return; // the flat backdrop shows through
        const row = this.deps.assets.manifest.environment.find((r) => r.id === p.id);
        if (row?.tile) {
          const tile = this.add
            .tileSprite(0, v.y, width, height - v.y, key)
            .setOrigin(0, 0)
            .setDepth(v.depth);
          this.ambient.add(p.id, tile);
          return;
        }
      }
      const img = this.add
        .image(v.x, v.y, loaded ? key : FALLBACK_PROP_KEY)
        .setOrigin(v.originX, v.originY)
        .setDepth(v.depth);
      if (entry?.section === 'environment') {
        this.ambient.add(p.id, img);
        return;
      }
      if (p.role === 'orderBoard') this.board = img;
      this.season.track(p.id, img, this.dress(img, p));
    });
  }

  /**
   * Size/rotation/mirror from the layout, shadow, gift obstacle, click + hover, badge (non-environment
   * art). Returns the name tag that only shows with sign-less seasonal art (SE-1), if any.
   */
  private dress(
    img: Phaser.GameObjects.Image,
    p: FarmLayout['placements'][number],
  ): Phaser.GameObjects.Text | null {
    const t = placementTransform(p, img.width, img.height); // layout editor fields (AD-1)
    img.setScale(t.scaleX, t.scaleY).setAngle(t.angle).setFlipX(t.flipX);
    const shadow = p.layer > 2 ? addShadow(this, img) : null;
    if (shadow) this.dayNight.addShadow(shadow);
    if (p.decor) {
      this.props.addDecor(p.decor, img, shadow); // no click, light or obstacle
      return null;
    }
    this.dayNight.addLight(img, p.action);
    this.obstacles.push(img.getBounds());
    this.walker.addObstacle(img);
    if (p.action) this.walker.addObject(img, p.action);
    const seasonTag = !!p.signed && SEASON_UNSIGNED_IDS.includes(p.id);
    let tag: Phaser.GameObjects.Text | null = null;
    if (p.action) {
      tag = makeClickable(this, img, p.action, !p.signed || seasonTag);
      addHover(this, img, this.pigEnv.reduceMotion);
    }
    if (p.badge === 'orders') this.ordersBadge = new Badge(this, img, this.pigEnv.reduceMotion);
    return seasonTag ? tag : null;
  }

  override update(time: number, delta: number) {
    this.ambient.update(delta);
    this.season.tick(time);
    this.life.update(delta);
    this.walker.update(delta);
    spreadCrowd(this.pigs, delta);
    this.plates.update((id) => this.pigs.get(id)?.plateAnchor() ?? null);
  }

  private sync(snap: FarmSnapshot) {
    const save = snap.save;
    if (!this.sys.isActive()) return;
    this.ambient.sync();
    this.dayClock.update();
    this.season.update();
    this.season.setReduceMotion(this.pigEnv.reduceMotion());
    this.props.sync(this.textures, this.trough, save);
    const now = this.deps.now();
    this.ordersBadge?.set(save ? readyOrderCount(save, now) : 0);
    const seen = new Set<string>();
    for (const pig of save?.pigs ?? []) {
      seen.add(pig.id);
      const view = pigView(pig, now, this.layout, this.deps.assets);
      if (!this.textures.exists(view.textureId)) this.art.request(view.artId);
      let sprite = this.pigs.get(pig.id);
      if (!sprite) {
        sprite = new PigSprite(this, pig.id, view, this.pigEnv, this.life.add(pig.id));
        this.pigs.set(pig.id, sprite);
      }
      sprite.apply(
        view,
        this.art.anchorsOf(view.artId),
        pig.id === this.bridge.selectedId,
        this.fxAnchor,
      );
    }
    this.plates.sync(new Map((save?.pigs ?? []).map((p) => [p.id, p.name])));
    const pigHomes = (save?.pigs ?? []).map((p) => pigView(p, now, this.layout, this.deps.assets));
    this.gifts.sync(save?.gifts.boxes ?? [], (box) =>
      giftSpot(box.seed, this.layout, {
        obstacles: this.obstacles,
        pigHomes,
        gifts: this.gifts.points(),
      }),
    );
    const reduceMotion = save?.settings.reduceMotion ?? false;
    for (const [id, sprite] of this.pigs) {
      if (seen.has(id)) continue;
      this.pigs.delete(id);
      this.life.remove(id);
      this.leaving.set(id, sprite);
      sprite.leave(reduceMotion, () => this.leaving.delete(id));
    }
    this.art.release(new Set([...this.pigs.values(), ...this.leaving.values()].flatMap((sprite) => (sprite.artId ? [sprite.artId] : []))));
  }

  private readonly fxAnchor = (fx: FxId): AnchorName =>
    this.deps.assets.manifest.fx.find((r) => r.id === fx)?.anchor ?? 'fx_above';
}
