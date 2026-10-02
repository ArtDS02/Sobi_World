// The farm (spec §11.1, §11.2): static scene from layout.placements (layers 0–5), the trough and
// a Map<pigId, PigSprite> reconciled with every store snapshot. Draws only; selection goes to DOM.
// Feedback (§11.3) arrives through bridge.effects (SceneEffects), never from diffing snapshots.
import * as Phaser from 'phaser';
import { parseAnchors, type Anchors } from '../../core/assets/anchors';
import {
  TROUGH_PROP_ID,
  type AnchorName,
  type FarmAction,
  type FxId,
} from '../../core/config/assetIds';
import { FARM_VIEW } from '../../core/config/farmView';
import { readyOrderCount } from '../../core/actions/fulfillOrder';
import type { SaveGame } from '../../core/types';
import type { StoreSnapshot } from '../../store/gameStore';
import { SCENE_KEYS } from '../config/phaser';
import type { FarmBridge, FarmDeps } from '../farmView';
import { noEffects } from '../feedback/effects';
import { Ambient } from '../fx/ambient';
import { DayNightDirector } from '../fx/DayNightDirector';
import { SceneEffects } from '../fx/SceneEffects';
import { vi } from '../../i18n/vi';
import { Backdrop } from '../prefabs/Backdrop';
import { DayNightLayer } from '../prefabs/DayNightLayer';
import { othersOf, spreadCrowd } from '../prefabs/crowd';
import { GiftBoxes } from '../prefabs/GiftBoxes';
import { Nameplates } from '../prefabs/Nameplates';
import { addHover, addShadow, Badge } from '../prefabs/ObjectDecor';
import type { PigEnv } from '../prefabs/pigEnv';
import { PigSprite } from '../prefabs/PigSprite';
import { giftSpot, type Rect } from '../view/giftPlacement';
import { pigView, type FarmLayout } from '../view/pigView';
import { placementTransform, placementView, visibleLayout } from '../view/sceneLayout';
import {
  anchorsKey,
  FALLBACK_PROP_KEY,
  artLoadList,
  textureKey,
  troughTextureKey,
} from '../view/textureKeys';
import { ACTION_DATA, pickOf } from './farmPick';
import { queueLoadList, warnLoadErrors } from './PreloadScene';

export class MainFarmScene extends Phaser.Scene {
  private readonly pigs = new Map<string, PigSprite>();
  /** Pigs gone from the save but still playing their exit tween (bursts can still find them). */
  private readonly leaving = new Map<string, PigSprite>();
  private readonly anchors = new Map<string, Anchors>();
  /** Pig art rows whose files were requested after preload (loaded once, failures fall back). */
  private readonly requested = new Set<string>();
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
  private readonly obstacles: Rect[] = []; // world object bounds; gift boxes keep clear (U06)

  constructor(
    private readonly deps: FarmDeps,
    private readonly bridge: FarmBridge,
  ) {
    super(SCENE_KEYS.farm);
  }

  create() {
    this.layout = visibleLayout(this.deps.assets.manifest.layout);
    this.pigEnv = {
      layout: this.layout,
      troughX: () => this.trough?.x ?? null,
      reduceMotion: () => this.deps.store.getSnapshot().save?.settings.reduceMotion ?? false,
      others: (pigId) => othersOf(this.pigs, pigId),
      napChance: () => this.dayClock.napChance(),
    };
    warnLoadErrors(this.load);
    this.ambient = new Ambient(this, this.pigEnv.reduceMotion);
    this.plates = new Nameplates(this);
    this.gifts = new GiftBoxes(this, this.pigEnv.reduceMotion);
    this.dayNight = new DayNightLayer(this);
    Backdrop.follow(this, this.layout, (rect) => this.dayNight.setView(rect));
    this.drawPlacements();
    const preview = () => this.bridge.phasePreview;
    this.dayClock = new DayNightDirector(this, this.dayNight, this.deps.now, preview);
    // R12A: the farm fades in after the preload screen (skipped with reduceMotion).
    if (!this.pigEnv.reduceMotion()) this.cameras.main.fadeIn(FARM_VIEW.AMBIENT.fadeInMs);
    this.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
        this.deps.onPick(pickOf(over[0]));
      },
    );
    const off = this.deps.store.subscribe((s) => this.sync(s));
    this.bridge.refresh = () => this.sync(this.deps.store.getSnapshot());
    this.bridge.effects = new SceneEffects(this, {
      pig: (id) => this.pigs.get(id) ?? this.leaving.get(id),
      trough: () => this.trough,
      board: () => this.board,
      gifts: () => this.gifts,
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      off();
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
      this.dress(img, p);
    });
  }

  /** Size/rotation/mirror from the layout, shadow, gift obstacle, click + hover, badge (non-environment art). */
  private dress(img: Phaser.GameObjects.Image, p: FarmLayout['placements'][number]) {
    const t = placementTransform(p, img.width, img.height); // layout editor fields (AD-1)
    img.setScale(t.scaleX, t.scaleY).setAngle(t.angle).setFlipX(t.flipX);
    if (p.layer > 2) this.dayNight.addShadow(addShadow(this, img));
    this.dayNight.addLight(img, p.action);
    this.obstacles.push(img.getBounds());
    if (p.action) {
      this.makeClickable(img, p.action, !p.signed);
      addHover(this, img, this.pigEnv.reduceMotion);
    }
    if (p.badge === 'orders') this.ordersBadge = new Badge(this, img, this.pigEnv.reduceMotion);
  }

  /**
   * Hand cursor + pixel-perfect hit + an always-visible name tag (no hover-only cue, §10.4); art
   * with its own painted sign (`signed`) needs no tag.
   */
  private makeClickable(img: Phaser.GameObjects.Image, action: FarmAction, tag: boolean) {
    img.setData(ACTION_DATA, action).setInteractive({
      pixelPerfect: true,
      alphaTolerance: FARM_VIEW.HIT_ALPHA,
      useHandCursor: true,
    });
    if (!tag) return;
    const l = FARM_VIEW.LABEL;
    const bottom = img.y + img.displayHeight * (1 - img.originY);
    this.add
      .text(img.x, bottom + l.offsetY, vi.farm[action], {
        color: l.color,
        backgroundColor: l.background,
        fontSize: `${l.fontPx}px`,
        fontFamily: l.fontFamily,
        fontStyle: 'bold',
        padding: { x: l.padX, y: l.padY },
      })
      .setOrigin(0.5, 0)
      .setDepth(img.depth + l.depthAbove)
      .setData(ACTION_DATA, action)
      .setInteractive({ useHandCursor: true });
  }

  override update(_time: number, delta: number) {
    this.ambient.update(delta);
    spreadCrowd(this.pigs, delta);
    this.plates.update((id) => this.pigs.get(id)?.plateAnchor() ?? null);
  }

  private sync(snap: StoreSnapshot) {
    const save = snap.save;
    if (!this.sys.isActive()) return;
    this.ambient.sync();
    this.dayClock.update();
    this.syncTrough(save);
    const now = this.deps.now();
    this.ordersBadge?.set(save ? readyOrderCount(save, now) : 0);
    const seen = new Set<string>();
    for (const pig of save?.pigs ?? []) {
      seen.add(pig.id);
      const view = pigView(pig, now, this.layout, this.deps.assets);
      if (!this.textures.exists(view.textureId)) this.requestArt(view.artId);
      let sprite = this.pigs.get(pig.id);
      if (!sprite) {
        sprite = new PigSprite(this, pig.id, view, this.pigEnv);
        this.pigs.set(pig.id, sprite);
      }
      sprite.apply(
        view,
        this.anchorsOf(view.artId),
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
      this.leaving.set(id, sprite);
      sprite.leave(reduceMotion, () => this.leaving.delete(id));
    }
    this.releaseArt();
  }

  /**
   * R12A: pig art loaded after preload (missed by the preload list) is freed once no pig, staying or
   * leaving, wears it; wearing it again reloads it. Preloaded breed defaults are kept.
   */
  private releaseArt() {
    if (this.requested.size === 0) return;
    const sprites = [...this.pigs.values(), ...this.leaving.values()];
    const worn = new Set(sprites.map((s) => s.artId));
    for (const artId of this.requested) {
      if (worn.has(artId)) continue;
      for (const file of ['asset', 'sleep']) {
        const key = textureKey(artId, file);
        if (this.textures.exists(key)) this.textures.remove(key);
      }
      this.cache.json.remove(anchorsKey(artId));
      this.anchors.delete(artId);
      this.requested.delete(artId);
    }
  }

  private syncTrough(save: SaveGame | null) {
    if (!this.trough || !save) return;
    const key = troughTextureKey(save.trough.food, save.trough.capacity);
    const next = this.textures.exists(key) ? key : FALLBACK_PROP_KEY;
    if (this.trough.texture.key !== next) this.trough.setTexture(next);
  }

  private anchorsOf(artId: string): Anchors {
    const cached = this.anchors.get(artId);
    if (cached) return cached;
    const raw: unknown = this.cache.json.get(anchorsKey(artId));
    const parsed = parseAnchors(raw);
    // Only cache once the json is in (or the art row has none), so a late load still applies.
    if (raw !== undefined || !this.deps.assets.url(artId, 'anchors')) {
      this.anchors.set(artId, parsed);
    }
    return parsed;
  }

  private readonly fxAnchor = (fx: FxId): AnchorName =>
    this.deps.assets.manifest.fx.find((r) => r.id === fx)?.anchor ?? 'fx_above';

  /** Pig art missing after preload: load it once, then re-sync. */
  private requestArt(artId: string) {
    if (this.requested.has(artId)) return;
    this.requested.add(artId);
    if (queueLoadList(this.load, artLoadList(this.deps.assets, artId)) === 0) return;
    this.load.once(Phaser.Loader.Events.COMPLETE, () => this.bridge.refresh());
    this.load.start();
  }
}
