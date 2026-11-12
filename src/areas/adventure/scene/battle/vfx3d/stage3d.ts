// The 3D layer of the battle's effects (prototype, decision 059): one Three.js renderer draws on its own canvas, which is copied each
// frame into a Phaser texture and shown as a screen-sized image over the effects. Everything stays inside the Phaser scene, so hit stop,
// slow motion, the camera's punch / shake and the reduced-motion rule apply to it like to every other effect. An effect is a pure
// function of its age (ms): the timeline that calls `update(ms)` is the battle's own clock, never a clock of this layer.
import * as Phaser from 'phaser';
import * as THREE from 'three';

/** One running 3D effect: `update` poses it for `ms` since its start; `dispose` frees its GPU objects. */
export interface Vfx3dHandle {
  update(ms: number): void;
  dispose(): void;
}

/** What an effect is built from: where it stands in the 3D world and how big one unit's width is there. */
export interface Vfx3dEnv {
  /** The 3D scene to add objects to (an effect adds one group and removes it on dispose). */
  scene: THREE.Scene;
  /** The ground point under the spot the act names. */
  origin: THREE.Vector3;
  /** The ground point under whoever acts (a shot or a breath starts there); the origin when the act has no actor. */
  from: THREE.Vector3;
  /** The act's own colour (a number), or null: effects keep their default. */
  color: number | null;
  /** The anchor is a whole row (or the stage), not one unit: effects spread over three spots. */
  row: boolean;
  /** World size of the anchor's width (a unit, or a whole row): effects scale themselves with it. */
  unit: number;
  /** Draw quality share, 0.25–1 (particle counts scale with it). */
  quality: number;
}
export type Vfx3dFactory = (env: Vfx3dEnv) => Vfx3dHandle;

type AddTimed = (dur: number, step: (t: number) => void, done?: () => void) => void;

/** Longest side of the 3D canvas in px: a bigger game screen is drawn smaller and scaled up (the effects are soft). */
const MAX_SIDE = 1280;
const TEXTURE_KEY = 'vfx3d-layer';

/** Frees every geometry and material under `o`. */
export function disposeTree(o: THREE.Object3D) {
  o.traverse((c) => {
    const m = c as THREE.Mesh;
    m.geometry?.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else mat?.dispose();
  });
}

export class Stage3d {
  private renderer: THREE.WebGLRenderer | null = null;
  private failed = false;
  private readonly scene3 = new THREE.Scene();
  /** Fixed camera: a 3/4 view from the front and above, far away with a narrow lens (little parallax: the stage's art is flat). */
  private readonly cam = new THREE.PerspectiveCamera(10, 16 / 9, 1, 160);
  private copy: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private tex: Phaser.Textures.CanvasTexture | null = null;
  private img: Phaser.GameObjects.Image | null = null;
  private readonly live = new Set<Vfx3dHandle>();
  private w = 0;
  private h = 0;
  private readonly ray = new THREE.Raycaster();
  private readonly plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  constructor(private readonly scene: Phaser.Scene, private readonly depth: number) {
    this.cam.position.set(0, 23.7, 36.4);
    this.cam.lookAt(0, 0, 0);
    this.scene3.add(new THREE.HemisphereLight(0xb8d8ff, 0x203040, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(3, 7, 5);
    this.scene3.add(sun);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  /** The `?vfx3d=0` address switches the layer off (to compare with the 2D effects). */
  static enabled(): boolean {
    try {
      return new URLSearchParams(window.location.search).get('vfx3d') !== '0';
    } catch {
      return true;
    }
  }

  private init(): boolean {
    if (this.renderer) return true;
    if (this.failed) return false;
    try {
      const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
      r.setClearColor(0x000000, 0);
      r.setPixelRatio(1);
      this.renderer = r;
      this.copy = document.createElement('canvas');
      this.ctx = this.copy.getContext('2d');
      return !!this.ctx;
    } catch {
      this.failed = true;
      return false;
    }
  }

  private fit() {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    const k = Math.min(1, MAX_SIDE / Math.max(W, H));
    const w = Math.max(2, Math.round(W * k));
    const h = Math.max(2, Math.round(H * k));
    if (w === this.w && h === this.h && this.tex) return;
    this.w = w;
    this.h = h;
    this.renderer!.setSize(w, h, false);
    this.copy!.width = w;
    this.copy!.height = h;
    this.cam.aspect = W / H;
    this.cam.updateProjectionMatrix();
    if (this.tex) this.tex.setSize(w, h);
    else {
      this.tex = this.scene.textures.addCanvas(TEXTURE_KEY, this.copy!);
      if (this.tex) this.img = this.scene.add.image(0, 0, TEXTURE_KEY).setOrigin(0).setDepth(this.depth).setVisible(false);
    }
  }

  /** The ground point under a screen pixel (page px of the Phaser canvas), or null above the horizon. */
  ground(x: number, y: number): THREE.Vector3 | null {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    this.cam.updateMatrixWorld();
    this.ray.setFromCamera(new THREE.Vector2((x / W) * 2 - 1, -((y / H) * 2 - 1)), this.cam);
    return this.ray.ray.intersectPlane(this.plane, new THREE.Vector3());
  }

  /** Starts `fx` on the ground under the screen point (x, y); `widthPx` is the anchor's width, `dur` the act's length. */
  play(factory: Vfx3dFactory, x: number, y: number, widthPx: number, dur: number, add: AddTimed, scale = 1, fromPx?: { x: number; y: number }, opts: { color?: number | null; row?: boolean } = {}) {
    if (!this.init()) return;
    this.fit();
    const o = this.ground(x, y);
    const a = this.ground(x - widthPx / 2, y);
    const b = this.ground(x + widthPx / 2, y);
    if (!o || !a || !b) return;
    const unit = Math.max(0.2, a.distanceTo(b)) * scale;
    const f = (fromPx && this.ground(fromPx.x, fromPx.y)) || o.clone();
    const handle = factory({ scene: this.scene3, origin: o, from: f, unit, quality: 1, color: opts.color ?? null, row: opts.row ?? false });
    this.live.add(handle);
    handle.update(0);
    add(dur, (t) => handle.update(t * dur), () => {
      this.live.delete(handle);
      handle.dispose();
    });
  }

  /** Something of the layer is on screen. */
  alive(): number {
    return this.live.size;
  }

  clear() {
    for (const h of this.live) h.dispose();
    this.live.clear();
    this.img?.setVisible(false);
  }

  /** Draws the layer into its Phaser image (called once a frame, after the effects have moved on). */
  render() {
    if (!this.renderer || !this.img || !this.tex || !this.ctx || !this.copy) return;
    if (this.live.size === 0) {
      this.img.setVisible(false);
      return;
    }
    this.fit();
    this.renderer.render(this.scene3, this.cam);
    this.ctx.clearRect(0, 0, this.w, this.h);
    this.ctx.drawImage(this.renderer.domElement, 0, 0, this.w, this.h);
    this.tex.refresh();
    this.img.setDisplaySize(this.scene.scale.width, this.scene.scale.height).setVisible(true);
  }

  private destroy() {
    this.clear();
    this.renderer?.dispose();
    this.renderer = null;
    if (this.scene.textures.exists(TEXTURE_KEY)) this.scene.textures.remove(TEXTURE_KEY);
    this.tex = null;
    this.img = null;
  }
}
