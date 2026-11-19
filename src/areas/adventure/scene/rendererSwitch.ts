// Picks how the map in front of the party is drawn and swaps it at once when the player changes the setting or the diorama gives up
// (forest-diorama design A6). The diorama only draws a Forest area that has a scene contract, only when the setting says so, only with
// the pieces it needs (the picture resolver) and never after it failed in this session; everything else is the classic 2D drawing. The
// party stays where it stands: the walker is never touched by a swap.
import type * as Phaser from 'phaser';
import type { AreaMap } from '../logic/config/content';
import { ClassicRenderer, type ClassicRendererDeps } from './classicRenderer';
import type { ArtFn } from './diorama/artKit';
import { CONTRACTS } from './diorama/contracts';
import { DioramaRenderer } from './diorama/dioramaRenderer';
import { sessionLimit } from './diorama/quality';
import type { MapLook } from './mapLook';
import type { MapRenderer } from './mapRenderer';
import type { AdventureSceneState } from './sceneState';
import type { Walker } from './walker';

export interface RendererSwitchDeps extends ClassicRendererDeps {
  /** The settings' map style and quality; absent: always the classic drawing. */
  mapLook?(): MapLook;
  /** The picture resolver of the game's manifest (id, state → url); absent: always the classic drawing. */
  art?: ArtFn;
}

export class RendererSwitch implements MapRenderer {
  private readonly classic: ClassicRenderer;
  private diorama: DioramaRenderer | null = null;
  private active: MapRenderer;
  private map: AreaMap | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly walker: Walker,
    private readonly deps: RendererSwitchDeps,
  ) {
    this.classic = new ClassicRenderer(scene, walker, deps);
    this.active = this.classic;
  }

  /** Whether `map` is drawn as a diorama now. */
  private wants(map: AreaMap): boolean {
    const look = this.deps.mapLook?.();
    return !!look && !!this.deps.art && look.view === 'diorama' && map.zoneId === 'zone_forest' && !!CONTRACTS[map.id] && sessionLimit() !== 'classic';
  }

  private pick(wantDiorama: boolean): MapRenderer {
    if (!wantDiorama) return this.classic;
    this.diorama ??= new DioramaRenderer(this.scene, this.walker, { art: this.deps.art!, reduceMotion: this.deps.reduceMotion, look: () => this.deps.mapLook!() });
    return this.diorama;
  }

  /** Leaves the drawing in use and draws `map` with the one the settings call for. */
  private swapTo(map: AreaMap, s: AdventureSceneState) {
    const next = this.pick(this.wants(map));
    if (next !== this.active) {
      // The diorama gives its GPU share back for good; the classic map is only left.
      if (this.active === this.diorama) this.diorama.dispose();
      else this.active.leave();
      this.active = next;
      next.snapCamera();
    }
    next.enter(map, s);
  }

  enter(map: AreaMap, s: AdventureSceneState) {
    this.map = map;
    this.swapTo(map, s);
    // A diorama that gave up while starting (a software card): the classic map takes over in the same frame.
    if (this.diorama?.failed() && this.active === this.diorama) this.swapTo(map, s);
  }

  ready() {
    return this.active.ready();
  }

  frame(s: AdventureSceneState, walker: Walker, time: number, delta: number) {
    const map = this.map;
    if (map && (this.wants(map) !== (this.active === this.diorama) || (this.active === this.diorama && this.diorama?.failed()))) this.swapTo(map, s);
    this.active.frame(s, walker, time, delta);
  }

  chestHint(id: string, k: number) {
    this.active.chestHint(id, k);
  }

  warp(k: number) {
    this.active.warp(k);
  }

  screenOf(px: { x: number; y: number }) {
    return this.active.screenOf(px);
  }

  overlayScale() {
    return this.active.overlayScale();
  }

  snapCamera() {
    this.active.snapCamera();
  }

  hide() {
    this.active.hide();
  }

  suspend() {
    return this.active.suspend();
  }

  leave() {
    this.active.leave();
  }

  dispose() {
    this.classic.dispose();
    this.diorama?.dispose();
  }
}
