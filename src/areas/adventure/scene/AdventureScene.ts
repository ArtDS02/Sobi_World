// The Adventure on screen (spec §3): at the camp and in a battle, the zone's picture behind the DOM screens; on a trip, the area itself —
// its ground, props, decorations and things dressed with depth (mapDepth.ts), the enemy groups standing and breathing, the teleport gates
// (open, or locked behind the guardian; walking into an open one lands in the next area), and the party walking with the keys, the camera
// easing after them (decision 045, 046, 047). The scene reads a plain state from the UI and reports what the walker does (stops, touches
// a group, has a thing in reach and presses the interact key, walks into an exit); it never reaches the store.
import * as Phaser from 'phaser';
import type { AreaVfx } from '../../../core/events';
import { inputVector, type Walkable } from '../../../systems/character';
import type { ControlInput } from '../../../ui/world/controlInput';
import { FALLBACK_PROP_KEY, textureKey } from '../../../ui/world/keys';
import { AB, MAPS, type AreaMap } from '../logic/config/content';
import { distanceToThing, thingsOf, walkableOf } from '../logic/maps';
import { BATTLE_SCENE_KEY } from './battle/BattleScene';

export { BattleScene, manifestImages } from './battle/BattleScene';
export { registryArt } from './diorama/artKit';
export { dioramaFellBack } from './diorama/quality';
import { ADVENTURE_DESIGN, fitZoom } from './mapCamera';
import { coverUnder } from './coverUnder';
import { touchGroups } from './foeTouch';
import type { ArtFn } from './diorama/artKit';
import type { MapLook } from './mapLook';
import type { MapRenderer } from './mapRenderer';
import { RendererSwitch } from './rendererSwitch';
import { playMapVfx } from './mapVfx';
import type { AdventureSceneState, SceneReport } from './sceneState';
import { Walker } from './walker';
import { BattleAmbient, styleOfBackdrop } from './battleAmbient';

export const ADVENTURE_SCENE_KEY = 'adventure';
export { ADVENTURE_DESIGN };

export interface AdventureSceneDeps {
  read(): AdventureSceneState | null;
  report: SceneReport;
  input: Pick<ControlInput, 'held' | 'onPress'>;
  reduceMotion(): boolean;
  /** A panel of the shell covers the world (the walker stands still). */
  paused(): boolean;
  /** The url of a manifest image, for the art loaded only when needed (a painted area's background). */
  image?(id: string): { url: string } | null;
  /** The map's style and quality from the player's settings (absent: the classic 2D drawing always). */
  mapLook?(): MapLook;
  /** Pictures by id and state for the diorama (absent: the classic 2D drawing always). */
  art?: ArtFn;
}

/** The one place that picks how the map is drawn: the diorama of a Forest area when the settings say so, else the classic 2D drawing. */
function createRenderer(scene: Phaser.Scene, walker: Walker, deps: AdventureSceneDeps): MapRenderer {
  return new RendererSwitch(scene, walker, deps);
}

const MOVE_EVERY_MS = 3000;
const REST_SAVE_MS = 600;
/** The teleport through a gate: the party dissolves into light, the screen flashes, then the next area fades in (ms). */
const WARP_MS = 520;
const ARRIVE_MS = 520;

export class AdventureScene extends Phaser.Scene {
  private backdrop!: Phaser.GameObjects.Image;
  private backdropId = '';
  private ambient!: BattleAmbient;
  private walker!: Walker;
  private map: AreaMap | null = null;
  private mapRenderer!: MapRenderer;
  private placeKey = '';
  private walk: { gates: string; ground: Walkable } | null = null;
  private focus: string | null = null;
  private saved = { x: 0, y: 0 };
  private sinceSave = 0;
  private restMs = 0;
  private touchLockUntil = 0;
  private exitLock = false;
  private texturesChanged = false;
  /** A teleport under way: when it started and the gate it goes through; the moment the party arrived somewhere. */
  private warp: { at: number; exitId: string; pos: { x: number; y: number; facing: 'up' | 'down' | 'left' | 'right' } } | null = null;
  private arrivedAt = -Infinity;
  /** The cover the party stands under (decision 045). */
  private coverIn: string | null = null;
  private builtCorruption = -1;
  private offs: (() => void)[] = [];

  constructor(private readonly deps: AdventureSceneDeps) {
    super(ADVENTURE_SCENE_KEY);
  }

  create() {
    this.backdrop = this.add.image(ADVENTURE_DESIGN.width / 2, ADVENTURE_DESIGN.height / 2, FALLBACK_PROP_KEY).setDepth(-1000);
    this.walker = new Walker(this);
    this.ambient = new BattleAmbient(this);
    this.mapRenderer = createRenderer(this, this.walker, this.deps);
    const onTexture = () => (this.texturesChanged = true);
    this.textures.on(Phaser.Textures.Events.ADD, onTexture);
    const use = () => this.useFocus();
    this.offs.push(this.deps.input.onPress('interact', use));
    this.input.keyboard?.on('keydown-SPACE', use);
    // The battle stage (decision 042) is drawn over this scene and sleeps and wakes with it.
    const stage = () => this.scene.get(BATTLE_SCENE_KEY);
    const runStage = () => {
      if (stage()) {
        this.scene.run(BATTLE_SCENE_KEY);
        this.scene.bringToTop(BATTLE_SCENE_KEY);
      }
    };
    const sleepStage = () => {
      if (stage() && this.scene.isActive(BATTLE_SCENE_KEY)) this.scene.sleep(BATTLE_SCENE_KEY);
      // Asleep (the Adventure is left): a diorama gives its GPU share back and is built again on waking.
      if (this.mapRenderer.suspend()) this.map = null;
    };
    runStage();
    this.events.on(Phaser.Scenes.Events.WAKE, runStage);
    this.events.on(Phaser.Scenes.Events.SLEEP, sleepStage);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.WAKE, runStage);
      this.events.off(Phaser.Scenes.Events.SLEEP, sleepStage);
      this.textures.off(Phaser.Textures.Events.ADD, onTexture);
      this.ambient.destroy();
      this.mapRenderer.dispose();
      this.input.keyboard?.off('keydown-SPACE', use);
      for (const off of this.offs) off();
    });
  }

  /** A one-shot picture of the FeedbackDirector (decision 045), see mapVfx.ts. */
  playVfx(vfx: AreaVfx, still: boolean) {
    if (this.map && this.mapRenderer.ready() && this.sys.isActive()) playMapVfx(this, this.map, this.walker.position, vfx, still, this.overlay());
  }

  /** Where one-shot effects stand when the map is drawn fixed on the screen (a diorama); undefined for the 2D map's own world. */
  private overlay() {
    const k = this.mapRenderer.overlayScale();
    return k === null ? undefined : { screenOf: (p: { x: number; y: number }) => this.mapRenderer.screenOf(p), k };
  }

  private useFocus() {
    const s = this.deps.read();
    if (!s || s.mode !== 'explore' || s.paused || this.deps.paused() || !this.focus) return;
    this.deps.report.use(this.focus, this.walker.position);
  }

  private showBackdrop(s: AdventureSceneState | null) {
    this.mapRenderer.hide();
    this.map = null;
    const cam = this.cameras.main;
    cam.removeBounds();
    cam.setBackgroundColor('rgba(0,0,0,0)');
    const zoom = fitZoom(this.scale);
    cam.setZoom(zoom).centerOn(ADVENTURE_DESIGN.width / 2, ADVENTURE_DESIGN.height / 2);
    this.backdropId = s?.backdrop ?? '';
    const k = s ? textureKey(s.backdrop) : '';
    this.backdrop.setVisible(true).setTexture(this.textures.exists(k) ? k : FALLBACK_PROP_KEY);
    // The camera's worldView is only refreshed on its next render (it may still be the map's), so size from the zoom itself.
    const viewW = this.scale.width / zoom;
    const viewH = this.scale.height / zoom;
    const ratio = this.backdrop.width / Math.max(1, this.backdrop.height);
    const w = Math.max(viewW, viewH * ratio, ADVENTURE_DESIGN.width);
    this.backdrop.setDisplaySize(w, w / ratio).setPosition(ADVENTURE_DESIGN.width / 2, ADVENTURE_DESIGN.height / 2);
  }

  private enterMap(s: AdventureSceneState, map: AreaMap) {
    this.mapRenderer.enter(map, s);
    this.map = map;
    this.builtCorruption = s.corruption;
    this.walk = null;
    this.backdrop.setVisible(false);
  }

  private ground(s: AdventureSceneState, map: AreaMap): Walkable {
    // A teleport gate still locked behind its guardian blocks the way like a wall.
    const shut = map.exits.filter((e) => !s.exits.find((x) => x.id === e.id)?.open);
    const gates = `${s.openedGates.join(',')}|${shut.map((e) => e.id).join(',')}`;
    if (!this.walk || this.walk.gates !== gates) this.walk = { gates, ground: walkableOf(map, new Set(s.openedGates), shut) };
    return this.walk.ground;
  }

  override update(time: number, delta: number) {
    const s = this.deps.read();
    const map = s?.mapId ? MAPS[s.mapId] : undefined;
    if (!s || s.mode !== 'explore' || !map) {
      if (this.map || !this.backdrop.visible || this.texturesChanged || (s?.backdrop ?? '') !== this.backdropId) this.showBackdrop(s);
      this.texturesChanged = false;
      // The air over the painting while a battle is on (decision 063).
      const zoom = fitZoom(this.scale);
      const w = this.scale.width / zoom;
      const h = this.scale.height / zoom;
      const view = { w, h, x: ADVENTURE_DESIGN.width / 2 - w / 2, y: ADVENTURE_DESIGN.height / 2 - h / 2 };
      this.ambient.update(s?.mode === 'battle' ? styleOfBackdrop(s.backdrop) : null, delta, this.deps.reduceMotion(), view);
      return;
    }
    this.ambient.update(null, delta, true, { x: 0, y: 0, w: 0, h: 0 });
    // The area is built again when its corruption changes (its zone just purified).
    if (this.map?.id !== map.id || this.texturesChanged || s.corruption !== this.builtCorruption) this.enterMap(s, map);
    this.texturesChanged = false;
    if (s.placeKey !== this.placeKey) {
      const arrived = this.placeKey !== '';
      this.placeKey = s.placeKey;
      this.mapRenderer.snapCamera();
      this.walker.place(s.pos);
      this.saved = { x: s.pos.x, y: s.pos.y };
      this.exitLock = true;
      this.warp = null;
      // Arriving in another area (a gate or a portal): the area fades in out of the light.
      if (arrived && !this.deps.reduceMotion()) {
        this.arrivedAt = time;
        this.cameras.main.fadeIn(ARRIVE_MS, 255, 255, 255);
      }
    }
    this.walker.setFollowers(s.followers);
    const still = s.paused || this.deps.paused() || this.warp !== null || !this.mapRenderer.ready();
    const dir = still ? { x: 0, y: 0 } : inputVector(this.deps.input.held());
    this.walker.update(dir, delta, this.ground(s, map), s.leader === 'bi' ? 'chr_bi' : 'chr_so', !this.deps.reduceMotion());
    // The party dissolves into the gate's light, or comes out of it.
    const warpK = this.warp ? Math.min(1, (time - this.warp.at) / WARP_MS) : Math.max(0, 1 - (time - this.arrivedAt) / ARRIVE_MS);
    this.mapRenderer.warp(warpK);
    if (this.warp && time - this.warp.at >= WARP_MS) {
      const w = this.warp;
      this.warp = null;
      this.deps.report.exit(w.exitId, w.pos);
    }
    const pos = this.walker.position;
    // Under a cover not found yet: save the spot now, so the hidden place counts at once.
    const under = coverUnder(map, pos);
    if (under && under !== this.coverIn && !s.foundSecrets.includes(under) && !s.paused) this.deps.report.move(pos);
    this.coverIn = under;
    this.mapRenderer.frame(s, this.walker, time, delta);
    this.touchLockUntil = touchGroups(s, map, pos, s.paused, this.touchLockUntil, this.deps.report);
    this.updateFocus(s, map);
    this.updateExit(s, map);
    this.saveNow(s, delta);
  }

  private updateFocus(s: AdventureSceneState, map: AreaMap) {
    const pos = this.walker.position;
    let best: { id: string; d: number } | null = null;
    for (const t of thingsOf(map)) {
      if (t.kind === 'exit' || (t.kind === 'gate' && s.openedGates.includes(t.id))) continue;
      const d = distanceToThing(map, pos, t);
      if (d <= AB.explore.reach && (!best || d < best.d)) best = { id: t.id, d };
      if (t.kind === 'chest') {
        const near = !s.openedChests.includes(t.id) && d < AB.explore.chestHint * map.tile;
        this.mapRenderer.chestHint(t.id, near ? 0.5 + 0.5 * Math.sin(this.time.now / 180) : 0);
      }
    }
    const id = best?.id ?? null;
    if (id !== this.focus) {
      this.focus = id;
      this.deps.report.focus(id);
    }
  }

  private updateExit(s: AdventureSceneState, map: AreaMap) {
    const pos = this.walker.position;
    const exit = map.exits.find((e) => distanceToThing(map, pos, e) < map.tile * 0.3 && s.exits.find((x) => x.id === e.id)?.open);
    if (!exit) {
      this.exitLock = false;
      return;
    }
    if (this.exitLock || s.paused || this.warp) return;
    this.exitLock = true;
    if (this.deps.reduceMotion()) {
      this.deps.report.exit(exit.id, pos);
      return;
    }
    // Into the gate: the light takes the party, the screen flashes white, then the next area (the report goes when it is over).
    this.warp = { at: this.time.now, exitId: exit.id, pos };
    this.cameras.main.flash(WARP_MS, 255, 255, 255, true);
    this.deps.report.warp?.(exit.id);
  }

  private saveNow(s: AdventureSceneState, delta: number) {
    const pos = this.walker.position;
    const away = Math.hypot(pos.x - this.saved.x, pos.y - this.saved.y) > 2;
    this.sinceSave += delta;
    this.restMs = this.walker.isMoving ? 0 : this.restMs + delta;
    if (s.paused || !away) return;
    if ((this.walker.isMoving && this.sinceSave >= MOVE_EVERY_MS) || (!this.walker.isMoving && this.restMs >= REST_SAVE_MS)) {
      this.sinceSave = 0;
      this.saved = { x: pos.x, y: pos.y };
      this.deps.report.move(pos);
    }
  }
}
