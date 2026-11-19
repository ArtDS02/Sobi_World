// The classic 2D drawing of an Adventure map (decision 045-047): the baked ground and props, the things, the foe groups, the covers
// and decorations that fade over the party, the camera easing after it, and the walker's own sprites. Wraps the existing Phaser code
// unchanged; the rules (walk, touch, reach, exits, saving) stay in AdventureScene.
import type * as Phaser from 'phaser';
import type { AreaMap } from '../logic/config/content';
import { fitZoom, MapCamera } from './mapCamera';
import { fadeCovers } from './mapCovers';
import { updateGroups } from './mapGroups';
import { PaintedArt } from './mapScene';
import { fadeScenery } from './mapScenery';
import { buildMap, edgeColour, refreshThings, type MapObjects } from './mapView';
import type { MapRenderer } from './mapRenderer';
import type { AdventureSceneState } from './sceneState';
import type { Walker } from './walker';

export interface ClassicRendererDeps {
  reduceMotion(): boolean;
  /** The url of a manifest image, for a painted area's background. */
  image?(id: string): { url: string } | null;
}

export class ClassicRenderer implements MapRenderer {
  private objs: MapObjects | null = null;
  private map: AreaMap | null = null;
  private readonly camera: MapCamera;
  private readonly painted: PaintedArt;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly walker: Walker,
    private readonly deps: ClassicRendererDeps,
  ) {
    this.camera = new MapCamera(scene.cameras.main);
    this.painted = new PaintedArt(scene, (id) => deps.image?.(id) ?? null);
  }

  enter(map: AreaMap, s: AdventureSceneState) {
    this.leave();
    this.painted.enter(map);
    this.map = map;
    this.objs = buildMap(this.scene, map, s, !this.deps.reduceMotion());
    this.walker.setSpritesVisible(true);
    this.scene.cameras.main.setBackgroundColor(edgeColour(map));
    this.camera.reset();
  }

  ready(): boolean {
    return this.objs !== null;
  }

  frame(s: AdventureSceneState, walker: Walker, time: number, delta: number) {
    const { map, objs } = this;
    if (!map || !objs) return;
    const pos = walker.position;
    const still = this.deps.reduceMotion();
    this.camera.fit(map, fitZoom(this.scene.scale));
    this.camera.follow(pos, delta, still);
    fadeCovers(map, objs.covers, pos, delta, still);
    fadeScenery(map, objs.scenery, pos, delta, still);
    refreshThings(this.scene, map, objs, s, time, pos);
    objs.dressing.update(time, pos);
    updateGroups(s, map, objs, pos, time, still);
  }

  chestHint(id: string, k: number) {
    this.objs?.sparkles.get(id)?.setAlpha(k);
  }

  warp(k: number) {
    this.walker.setWarp(this.deps.reduceMotion() ? 0 : k);
  }

  screenOf(px: { x: number; y: number }) {
    return { x: px.x, y: px.y };
  }

  snapCamera() {
    this.camera.snapNext();
  }

  /** The classic drawing keeps nothing for the camp or a battle: the area is built again on return. */
  hide() {
    this.leave();
    this.camera.reset();
    this.walker.setSpritesVisible(false);
  }

  show() {
    this.walker.setSpritesVisible(true);
  }

  leave() {
    this.objs?.layer.destroy();
    this.objs = null;
    this.map = null;
  }
}
