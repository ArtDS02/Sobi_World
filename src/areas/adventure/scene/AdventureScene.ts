// The Adventure on screen (spec §3): at the camp and in a battle, the zone's picture behind the DOM screens; on a trip, the area itself —
// its ground, props and things dressed with depth (mapDepth.ts), the enemy groups standing and breathing, the teleport gates (open or
// locked behind the guardian; walking into an open one plays the teleport and lands in the next area), and the party (So or Bi in
// front) walking with the keys. The
// scene reads a plain state from the UI and reports what the walker does (stops somewhere, touches a group, has a thing in reach and
// presses the interact key, walks into an exit); it never reaches the store.
import * as Phaser from 'phaser';
import { inputVector, type Walkable } from '../../../systems/character';
import { farmCamera } from '../../../systems/layout/camera';
import type { ControlInput } from '../../../ui/world/controlInput';
import { FALLBACK_PROP_KEY, textureKey } from '../../../ui/world/keys';
import { AB, MAPS, type AreaMap } from '../logic/config/content';
import { distanceToThing, groupPosition, thingsOf, walkableOf } from '../logic/maps';
import { buildMap, edgeColour, refreshThings, type MapObjects } from './mapView';
import type { AdventureSceneState, SceneReport } from './sceneState';
import { Walker } from './walker';

export const ADVENTURE_SCENE_KEY = 'adventure';
export const ADVENTURE_DESIGN = { width: 1600, height: 900 } as const;

export interface AdventureSceneDeps {
  read(): AdventureSceneState | null;
  report: SceneReport;
  input: Pick<ControlInput, 'held' | 'onPress'>;
  reduceMotion(): boolean;
  /** A panel of the shell covers the world (the walker stands still). */
  paused(): boolean;
}

const MOVE_EVERY_MS = 3000;
const REST_SAVE_MS = 600;
const TOUCH_LOCK_MS = 1200;
/** The teleport through a gate: the party dissolves into light, the screen flashes, then the next area fades in (ms). */
const WARP_MS = 520;
const ARRIVE_MS = 520;
/** Room (design px) the camera may scroll past the area's edges, so the HUD on top and the key hint below never hide a tile. */
const HUD_TOP = 270;
const HUD_BOTTOM = 70;

export class AdventureScene extends Phaser.Scene {
  private backdrop!: Phaser.GameObjects.Image;
  private backdropId = '';
  private walker!: Walker;
  private map: AreaMap | null = null;
  private objs: MapObjects | null = null;
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
  private offs: (() => void)[] = [];

  constructor(private readonly deps: AdventureSceneDeps) {
    super(ADVENTURE_SCENE_KEY);
  }

  create() {
    this.backdrop = this.add.image(ADVENTURE_DESIGN.width / 2, ADVENTURE_DESIGN.height / 2, FALLBACK_PROP_KEY).setDepth(-1000);
    this.walker = new Walker(this);
    const onTexture = () => (this.texturesChanged = true);
    this.textures.on(Phaser.Textures.Events.ADD, onTexture);
    const use = () => this.useFocus();
    this.offs.push(this.deps.input.onPress('interact', use));
    this.input.keyboard?.on('keydown-SPACE', use);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.textures.off(Phaser.Textures.Events.ADD, onTexture);
      this.input.keyboard?.off('keydown-SPACE', use);
      for (const off of this.offs) off();
    });
  }

  private useFocus() {
    const s = this.deps.read();
    if (!s || s.mode !== 'explore' || s.paused || this.deps.paused() || !this.focus) return;
    this.deps.report.use(this.focus, this.walker.position);
  }

  private fitZoom(): number {
    return farmCamera(this.scale.width, this.scale.height, ADVENTURE_DESIGN.width, ADVENTURE_DESIGN.height).zoom;
  }

  private showBackdrop(s: AdventureSceneState | null) {
    if (this.objs) {
      this.objs.layer.destroy();
      this.objs = null;
      this.map = null;
    }
    this.walker.setVisible(false);
    const cam = this.cameras.main;
    cam.removeBounds();
    cam.setBackgroundColor('rgba(0,0,0,0)');
    const zoom = this.fitZoom();
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
    this.objs?.layer.destroy();
    this.map = map;
    this.objs = buildMap(this, map, s, !this.deps.reduceMotion());
    this.walk = null;
    this.backdrop.setVisible(false);
    this.walker.setVisible(true);
    this.cameras.main.setBackgroundColor(edgeColour(map));
    this.cameras.main.setZoom(this.fitZoom()).setBounds(0, -HUD_TOP, map.cols * map.tile, map.rows * map.tile + HUD_TOP + HUD_BOTTOM);
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
      return;
    }
    if (this.map?.id !== map.id || this.texturesChanged) this.enterMap(s, map);
    this.texturesChanged = false;
    if (s.placeKey !== this.placeKey) {
      const arrived = this.placeKey !== '';
      this.placeKey = s.placeKey;
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
    const still = s.paused || this.deps.paused() || this.warp !== null;
    const dir = still ? { x: 0, y: 0 } : inputVector(this.deps.input.held());
    this.walker.update(dir, delta, this.ground(s, map), s.leader === 'bi' ? 'chr_bi' : 'chr_so', !this.deps.reduceMotion());
    // The party dissolves into the gate's light, or comes out of it.
    const warpK = this.warp ? Math.min(1, (time - this.warp.at) / WARP_MS) : Math.max(0, 1 - (time - this.arrivedAt) / ARRIVE_MS);
    this.walker.setWarp(this.deps.reduceMotion() ? 0 : warpK);
    if (this.warp && time - this.warp.at >= WARP_MS) {
      const w = this.warp;
      this.warp = null;
      this.deps.report.exit(w.exitId, w.pos);
    }
    const pos = this.walker.position;
    this.cameras.main.centerOn(pos.x, pos.y);
    refreshThings(this, map, this.objs!, s, time, pos);
    this.objs!.dressing.update(time, pos);
    this.updateGroups(s, map, time);
    this.updateFocus(s, map);
    this.updateExit(s, map);
    this.saveNow(s, delta);
  }

  private updateGroups(s: AdventureSceneState, map: AreaMap, time: number) {
    const pos = this.walker.position;
    const now = s.now;
    for (const g of s.groups) {
      const view = this.objs!.groups.get(g.id);
      const row = map.groups.find((x) => x.id === g.id);
      if (!view || !row) continue;
      view.img.setVisible(!g.defeated);
      view.shadow.setVisible(!g.defeated);
      view.label.setVisible(false);
      if (g.defeated) continue;
      const at = groupPosition(map, row);
      // Groups stand still and breathe (adventure-big-update-1 §12): a slow squash and stretch, each on its own beat.
      const beat = this.deps.reduceMotion() ? 0 : Math.sin(time / (760 + view.phase * 9) + view.phase);
      view.img.setPosition(at.x, at.y + 6).setDepth(at.y).setScale(view.sx * (1 - 0.018 * beat), view.sy * (1 + 0.035 * beat));
      view.shadow.setPosition(at.x, at.y + 4).setScale(1 - 0.06 * beat, 1).setDepth(at.y - 1);
      const d = Math.hypot(at.x - pos.x, at.y - pos.y);
      if (d < AB.explore.foeInfo * map.tile) {
        view.label.setPosition(at.x, at.y - view.img.displayHeight - 4).setVisible(true);
      }
      if (!s.paused && now >= s.graceUntil && now >= this.touchLockUntil && d < AB.explore.touch) {
        this.touchLockUntil = now + TOUCH_LOCK_MS;
        this.deps.report.touch(g.id, pos);
      }
    }
  }

  private updateFocus(s: AdventureSceneState, map: AreaMap) {
    const pos = this.walker.position;
    let best: { id: string; d: number } | null = null;
    for (const t of thingsOf(map)) {
      if (t.kind === 'exit' || (t.kind === 'gate' && s.openedGates.includes(t.id))) continue;
      const d = distanceToThing(map, pos, t);
      if (d <= AB.explore.reach && (!best || d < best.d)) best = { id: t.id, d };
      if (t.kind === 'chest') {
        const sp = this.objs!.sparkles.get(t.id);
        const near = !s.openedChests.includes(t.id) && d < AB.explore.chestHint * map.tile;
        sp?.setAlpha(near ? 0.5 + 0.5 * Math.sin(this.time.now / 180) : 0);
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
