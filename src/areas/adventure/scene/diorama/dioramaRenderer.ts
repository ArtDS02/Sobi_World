// The diorama as a map renderer (design A3, A6): a DioramaView draws the area with Three.js on a canvas of its own, and each frame the
// picture is copied into a Phaser canvas texture shown as a screen-sized image behind everything (the battle's 3D layer does the same).
// It has no loop of its own: AdventureScene's update calls `frame`. The rules stay in the scene; this follows the scene state (groups,
// chests, gates, the team) and the walker (where the party stands). Phaser still draws the tags, the Zzz and the one-shot effects on
// top, and the camera's fades. Building is asynchronous: until `ready()` the party stands still; an error, a lost WebGL context or
// more than 6 s give the diorama up for the session (`failed()`), and the host draws the classic 2D map instead.
import * as Phaser from 'phaser';
import * as THREE from 'three';
import type { AreaMap } from '../../logic/config/content';
import { fitZoom } from '../mapCamera';
import type { MapRenderer } from '../mapRenderer';
import type { AdventureSceneState } from '../sceneState';
import type { Walker } from '../walker';
import type { ArtFn } from './artKit';
import { disposeKit } from './textures';
import { FoeOverlay } from './dioramaOverlay';
import { DioramaView, type ViewOpts } from './dioramaView';
import { probeGpuName } from './gpuProbe';
import { FpsGate, giveUp, startLevel, type Level } from './quality';
import type { MapLook } from '../mapLook';

export interface DioramaDeps {
  art: ArtFn;
  reduceMotion(): boolean;
  look(): MapLook;
}

const TEXTURE_KEY = 'diorama-map';
const BUILD_LIMIT_MS = 6000;
/** The longest side (px) of the picture drawn and copied, per level (the light one is stretched on the screen). */
const SIDE: Record<'full' | 'light', number> = { full: 1600, light: 960 };
const PARTICLES = { off: 0.3, light: 0.55, full: 1 } as const;

export class DioramaRenderer implements MapRenderer {
  private view: DioramaView | null = null;
  private map: AreaMap | null = null;
  private stage: 'idle' | 'building' | 'ready' | 'failed' = 'idle';
  private hidden = false;
  private key = '';
  private gen = 0;
  private buildFrom = -1;
  private snap = true;
  private opts = '';
  private level: Level = 'full';
  private gate: FpsGate | null = null;
  private overlay: FoeOverlay | null = null;
  private tex: Phaser.Textures.CanvasTexture | null = null;
  private img: Phaser.GameObjects.Image | null = null;
  private size = { w: 0, h: 0 };
  /** Screen px per picture px (the picture is drawn at most `SIDE` wide). */
  private stretch = 1;
  private lost = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly walker: Walker,
    private readonly deps: DioramaDeps,
  ) {}

  /** The diorama cannot be used (any more) in this session. */
  failed(): boolean {
    return this.stage === 'failed';
  }

  private keyOf(map: AreaMap, s: AdventureSceneState): string {
    const shut = map.exits.filter((e) => !s.exits.find((x) => x.id === e.id)?.open).map((e) => e.id);
    return [map.id, s.corruption, s.openedGates.join(), shut.join(), s.litPuzzles.join(), s.portalLit, s.leader, s.followers.map((f) => f.art).join(), this.deps.look().quality, this.particles()].join('|');
  }

  private particles(): number {
    return this.deps.reduceMotion() ? 0 : PARTICLES[this.deps.look().effects];
  }

  enter(map: AreaMap, s: AdventureSceneState) {
    if (this.stage === 'failed') return;
    // The same map again (back from a battle, or only a texture was added): show what is kept.
    if (this.map?.id === map.id && this.stage !== 'idle' && this.key === this.keyOf(map, s)) {
      this.show();
      return;
    }
    this.build(map, s);
  }

  private build(map: AreaMap, s: AdventureSceneState) {
    if (this.stage === 'failed') return;
    THREE.ColorManagement.enabled = true;
    this.clearMap();
    this.map = map;
    this.key = this.keyOf(map, s);
    this.hidden = false;
    this.walker.setSpritesVisible(false);
    this.screenCamera();
    if (!this.view && !this.makeView(s)) return;
    this.view!.setOpts(this.optsOf(s));
    this.opts = this.skyKey(s);
    this.stage = 'building';
    this.buildFrom = -1;
    this.snap = true;
    this.overlay = new FoeOverlay(this.scene, map, s);
    const closed = map.exits.filter((e) => !s.exits.find((x) => x.id === e.id)?.open);
    const gen = ++this.gen;
    this.view!.enter(map, s, closed).then(
      () => {
        if (gen === this.gen && this.stage === 'building') this.stage = 'ready';
      },
      () => void (gen === this.gen && this.fail()),
    );
  }

  /** The WebGL side, at the level the setting and the device allow; false when the card cannot run the diorama at all. */
  private makeView(s: AdventureSceneState): boolean {
    const look = this.deps.look();
    this.level = startLevel(look.quality, probeGpuName());
    if (this.level === 'classic') return this.fail();
    this.gate = new FpsGate(this.level, look.quality !== 'full');
    try {
      this.view = new DioramaView(this.deps.art, this.optsOf(s), 1);
      this.view.canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        this.lost = true;
      });
      this.lost = false;
      return true;
    } catch {
      return this.fail();
    }
  }

  private optsOf(s?: AdventureSceneState): ViewOpts {
    return { time: s?.sky ?? 'day', quality: this.level === 'light' ? 'light' : 'full', wind: !this.deps.reduceMotion(), particles: this.particles() };
  }

  private skyKey(s: AdventureSceneState): string {
    return `${s.sky}|${this.deps.reduceMotion()}|${this.level}`;
  }

  /** Gives the diorama up for the session; always false (a failed `makeView`). */
  private fail(): false {
    giveUp();
    this.suspend();
    this.stage = 'failed';
    return false;
  }

  ready = (): boolean => this.stage === 'ready';

  frame(s: AdventureSceneState, walker: Walker, time: number, delta: number) {
    const map = this.map;
    const view = this.view;
    if (!map || !view || this.stage === 'idle' || this.stage === 'failed' || this.hidden) return;
    THREE.ColorManagement.enabled = true;
    if (this.stage === 'building') {
      if (this.buildFrom < 0) this.buildFrom = time;
      if (time - this.buildFrom > BUILD_LIMIT_MS) this.fail();
      return;
    }
    if (this.lost) return void this.fail();
    if (this.keyOf(map, s) !== this.key) return this.build(map, s);
    const next = this.gate!.frame(time);
    if (next !== this.level) {
      // Stepping down: a smaller picture and no post effects, drawn by a new view.
      if (next === 'classic') return void this.fail();
      this.level = next;
      this.view?.dispose();
      this.view = null;
      if (this.makeView(s)) this.build(map, s);
      return;
    }
    this.fit();
    const sky = this.skyKey(s);
    if (sky !== this.opts) {
      this.opts = sky;
      view.setOpts(this.optsOf(s));
    }
    this.syncState(s, map, view);
    const p = walker.position;
    view.frame({
      dt: delta / 1000,
      snap: this.snap,
      pose: { leader: { x: p.x, y: p.y, face: p.facing, moving: walker.isMoving }, share: walker.isMoving ? 1 : 0, followers: walker.followerSpots() },
    });
    this.snap = false;
    this.copy();
    this.overlay?.update(s, map, p, (px, lift) => this.screenAt(px, lift), fitZoom(this.scene.scale), time, this.deps.reduceMotion());
  }

  private syncState(s: AdventureSceneState, map: AreaMap, view: DioramaView) {
    const foes = view.foes;
    if (!foes) return;
    for (const g of s.groups) foes.setFoe(g.id, { asleep: g.asleep, defeated: g.defeated, golden: !!g.affix?.golden, disguised: g.disguised });
    for (const c of map.chests) foes.setChest(c.id, s.openedChests.includes(c.id));
    view.setDown(s.followers.map((f) => f.down));
  }

  /** Sizes the drawn picture to the screen (at most `SIDE` px on its long side) and the Phaser texture with it. */
  private fit() {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    const k = Math.min(1, SIDE[this.level === 'light' ? 'light' : 'full'] / Math.max(W, H));
    const w = Math.max(2, Math.round(W * k));
    const h = Math.max(2, Math.round(H * k));
    this.stretch = W / w;
    this.img?.setDisplaySize(W, H);
    if (w === this.size.w && h === this.size.h && this.tex) return;
    this.size = { w, h };
    this.view!.setSize(w, h);
    if (this.tex) this.scene.textures.remove(TEXTURE_KEY);
    this.tex = this.scene.textures.createCanvas(TEXTURE_KEY, w, h);
    if (this.img) this.img.setTexture(TEXTURE_KEY).setDisplaySize(W, H);
    else this.img = this.scene.add.image(0, 0, TEXTURE_KEY).setOrigin(0).setScrollFactor(0).setDepth(-1000).setVisible(false);
  }

  /** Copies the finished picture into the Phaser texture (in the same task as the draw: the canvas does not keep its picture). */
  private copy() {
    const ctx = this.tex?.getContext();
    if (!ctx || !this.view || !this.img) return;
    ctx.drawImage(this.view.canvas, 0, 0, this.size.w, this.size.h);
    this.tex!.refresh();
    this.img.setVisible(true);
  }

  private screenAt(px: { x: number; y: number }, lift = 0) {
    const p = this.view?.screenOf(px, lift) ?? { x: 0, y: 0 };
    return { x: p.x * this.stretch, y: p.y * this.stretch };
  }

  screenOf = (px: { x: number; y: number }) => this.screenAt(px);

  overlayScale = (): number | null => fitZoom(this.scene.scale);

  chestHint = (id: string, k: number) => this.view?.hintChest(id, k);

  warp() {
    // Nothing: the screen flash of the teleport covers the party, so the 3D party is not dissolved.
  }

  snapCamera = () => void (this.snap = true);

  /** The camera shows the screen as it is (no zoom, no scroll): what the overlays and the picture stand on. */
  private screenCamera() {
    const cam = this.scene.cameras.main;
    cam.removeBounds();
    cam.setZoom(1).setScroll(0, 0).setBackgroundColor('#000000');
  }

  /** Back from a battle or the camp: the picture shows again; the party is posed from the walker on the next frame. */
  private show() {
    this.hidden = false;
    this.walker.setSpritesVisible(false);
    this.view?.show();
    this.screenCamera();
  }

  hide() {
    this.hidden = true;
    this.view?.hide();
    this.img?.setVisible(false);
    this.overlay?.setVisible(false);
    this.walker.setSpritesVisible(false);
  }

  private clearMap() {
    this.gen += 1;
    this.view?.leave();
    this.overlay?.destroy();
    this.overlay = null;
    this.img?.setVisible(false);
    this.stage = 'idle';
    this.map = null;
    this.key = '';
  }

  leave = () => this.clearMap();

  /** The scene sleeps: all of the GPU's share goes (the view, its canvas and the kit's pictures); waking builds the map again. */
  suspend(): boolean {
    const had = this.stage !== 'idle';
    this.clearMap();
    this.view?.dispose();
    this.view = null;
    this.gate = null;
    disposeKit();
    if (this.tex) this.scene.textures.remove(TEXTURE_KEY);
    this.tex = null;
    this.size = { w: 0, h: 0 };
    this.img?.destroy();
    this.img = null;
    return had;
  }

  dispose = () => void this.suspend();
}
