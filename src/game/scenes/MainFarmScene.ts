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
import { FARM_FALLBACK, FARM_VIEW } from '../../core/config/farmView';
import type { SaveGame } from '../../core/types';
import type { StoreSnapshot } from '../../store/gameStore';
import { SCENE_KEYS } from '../config/phaser';
import type { FarmBridge, FarmDeps, FarmPick } from '../farmView';
import { noEffects } from '../feedback/effects';
import { SceneEffects } from '../fx/SceneEffects';
import { vi } from '../../i18n/vi';
import { PIG_ID_DATA, PigSprite, type PigEnv } from '../prefabs/PigSprite';
import { pigView, type FarmLayout } from '../view/pigView';
import { groundLineY, placementView } from '../view/sceneLayout';
import {
  anchorsKey,
  FALLBACK_PROP_KEY,
  skinLoadList,
  textureKey,
  troughTextureKey,
} from '../view/textureKeys';
import { queueLoadList, warnLoadErrors } from './PreloadScene';

const ACTION_DATA = 'farmAction';

/** The top object under the pointer → what was clicked. */
function pickOf(top: Phaser.GameObjects.GameObject | undefined): FarmPick {
  const pigId: unknown = top?.getData(PIG_ID_DATA);
  if (typeof pigId === 'string') return { kind: 'pig', pigId };
  const action: unknown = top?.getData(ACTION_DATA);
  if (typeof action === 'string') return { kind: 'action', action: action as FarmAction };
  return { kind: 'ground' };
}

export class MainFarmScene extends Phaser.Scene {
  private readonly pigs = new Map<string, PigSprite>();
  /** Pigs gone from the save but still playing their exit tween (bursts can still find them). */
  private readonly leaving = new Map<string, PigSprite>();
  private readonly anchors = new Map<string, Anchors>();
  /** Skins whose files were requested after preload (loaded once, failures fall back). */
  private readonly requested = new Set<string>();
  private trough: Phaser.GameObjects.Image | null = null;
  private board: Phaser.GameObjects.Image | null = null;
  private layout!: FarmLayout;
  private pigEnv!: PigEnv;

  constructor(
    private readonly deps: FarmDeps,
    private readonly bridge: FarmBridge,
  ) {
    super(SCENE_KEYS.farm);
  }

  create() {
    this.layout = this.deps.assets.manifest.layout;
    this.pigEnv = { layout: this.layout, troughX: () => this.trough?.x ?? null };
    warnLoadErrors(this.load);
    this.drawBackdrop();
    this.drawPlacements();
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
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      off();
      this.bridge.refresh = () => {};
      this.bridge.effects = noEffects;
    });
    this.sync(this.deps.store.getSnapshot());
  }

  /** Flat sky and ground fills: what shows where an environment file is missing (spec §11.4). */
  private drawBackdrop() {
    const { width, height } = this.layout.designSize;
    const isEnv = (id: string) => this.deps.assets.resolve(id)?.section === 'environment';
    const ground = groundLineY(this.layout, isEnv);
    this.add.rectangle(0, 0, width, ground, FARM_FALLBACK.SKY).setOrigin(0).setDepth(-Infinity);
    this.add
      .rectangle(0, ground, width, height - ground, FARM_FALLBACK.GROUND)
      .setOrigin(0)
      .setDepth(-Infinity);
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
        if (p.action) this.makeClickable(this.trough, p.action);
        return;
      }
      const key = textureKey(p.id);
      const loaded = this.textures.exists(key);
      if (entry?.section === 'environment') {
        if (!loaded) return; // the flat backdrop shows through
        const row = this.deps.assets.manifest.environment.find((r) => r.id === p.id);
        if (row?.tile) {
          this.add
            .tileSprite(0, v.y, width, height - v.y, key)
            .setOrigin(0, 0)
            .setDepth(v.depth);
          return;
        }
      }
      const img = this.add
        .image(v.x, v.y, loaded ? key : FALLBACK_PROP_KEY)
        .setOrigin(v.originX, v.originY)
        .setDepth(v.depth);
      if (p.role === 'orderBoard') this.board = img;
      if (p.action) this.makeClickable(img, p.action);
    });
  }

  /** Hand cursor + pixel-perfect hit + an always-visible name tag (no hover-only cue, §10.4). */
  private makeClickable(img: Phaser.GameObjects.Image, action: FarmAction) {
    img.setData(ACTION_DATA, action).setInteractive({
      pixelPerfect: true,
      alphaTolerance: FARM_VIEW.HIT_ALPHA,
      useHandCursor: true,
    });
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
      .setDepth(l.depth)
      .setData(ACTION_DATA, action)
      .setInteractive({ useHandCursor: true });
  }

  private sync(snap: StoreSnapshot) {
    const save = snap.save;
    if (!this.sys.isActive()) return;
    this.syncTrough(save);
    const now = this.deps.now();
    const seen = new Set<string>();
    for (const pig of save?.pigs ?? []) {
      seen.add(pig.id);
      const view = pigView(pig, now, this.layout, this.deps.assets);
      if (!this.textures.exists(view.textureId)) this.requestSkin(view.skinId);
      let sprite = this.pigs.get(pig.id);
      if (!sprite) {
        sprite = new PigSprite(this, pig.id, view, this.pigEnv);
        this.pigs.set(pig.id, sprite);
      }
      sprite.apply(
        view,
        this.anchorsOf(view.skinId),
        pig.id === this.bridge.selectedId,
        this.fxAnchor,
      );
    }
    const reduceMotion = save?.settings.reduceMotion ?? false;
    for (const [id, sprite] of this.pigs) {
      if (seen.has(id)) continue;
      this.pigs.delete(id);
      this.leaving.set(id, sprite);
      sprite.leave(reduceMotion, () => this.leaving.delete(id));
    }
  }

  private syncTrough(save: SaveGame | null) {
    if (!this.trough || !save) return;
    const key = troughTextureKey(save.trough.food, save.trough.capacity);
    const next = this.textures.exists(key) ? key : FALLBACK_PROP_KEY;
    if (this.trough.texture.key !== next) this.trough.setTexture(next);
  }

  private anchorsOf(skinId: string): Anchors {
    const cached = this.anchors.get(skinId);
    if (cached) return cached;
    const raw: unknown = this.cache.json.get(anchorsKey(skinId));
    const parsed = parseAnchors(raw);
    // Only cache once the json is in (or the skin has none), so a late load still applies.
    if (raw !== undefined || !this.deps.assets.url(skinId, 'anchors')) {
      this.anchors.set(skinId, parsed);
    }
    return parsed;
  }

  private readonly fxAnchor = (fx: FxId): AnchorName =>
    this.deps.assets.manifest.fx.find((r) => r.id === fx)?.anchor ?? 'fx_above';

  /** A skin bought after preload: load it once, then re-sync. */
  private requestSkin(skinId: string) {
    if (this.requested.has(skinId)) return;
    this.requested.add(skinId);
    if (queueLoadList(this.load, skinLoadList(this.deps.assets, skinId)) === 0) return;
    this.load.once(Phaser.Loader.Events.COMPLETE, () => this.bridge.refresh());
    this.load.start();
  }
}
