// The 3D layer of the battle's effects (decision 059): one Three.js renderer draws on its own canvas, which is copied each frame into
// a Phaser texture and shown as two screen-sized images over the effects: the "paint" (normal blend) and the "light" (added: additive
// effects and the bloom, see post3d.ts). Everything stays inside the Phaser scene, so hit stop, slow motion, the camera's punch /
// shake and the reduced-motion rule apply to it like to every other effect. An effect is a pure function of its age (ms): the
// timeline that calls `update(ms)` is the battle's own clock, never a clock of this layer.
import * as Phaser from 'phaser';
import * as THREE from 'three';
import { Post3d } from './post3d';
import { lightBlend } from './quads';

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
  /** The ground points under every unit the act is played on (one unit, or each unit of the row); never empty. */
  targets: THREE.Vector3[];
  /** The ground points under the units of the acting side (the origin when unknown); never empty. */
  friends: THREE.Vector3[];
  /** The ground points under the units the beat really lands on, in order (random targets: a subset of `targets`); never empty. */
  struck: THREE.Vector3[];
  /** World height of a unit there (its picture's height): a chest is at about half of it. */
  tall: number;
}
export type Vfx3dFactory = (env: Vfx3dEnv) => Vfx3dHandle;

type AddTimed = (dur: number, step: (t: number) => void, done?: () => void) => void;
type Px = { x: number; y: number };
export interface PlayOpts {
  scale?: number;
  from?: Px | undefined;
  color?: number | null;
  row?: boolean;
  /** Feet of the units played on / of the acting side, in game px. */
  targets?: Px[];
  friends?: Px[];
  struck?: Px[];
  /** Height of a unit's picture in game px. */
  heightPx?: number;
}

/** The effects setting (decision 057, B8) as the layer draws it: fewer particles, no bloom and a smaller picture below `full`. */
export type Vfx3dMode = 'off' | 'light' | 'full';
const MODES: Record<Vfx3dMode, { quality: number; bloom: number; samples: number; side: number }> = {
  full: { quality: 1, bloom: 1, samples: 4, side: 1280 },
  light: { quality: 0.55, bloom: 0, samples: 0, side: 960 },
  off: { quality: 0.3, bloom: 0, samples: 0, side: 800 },
};
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
  private post: Post3d | null = null;
  private failed = false;
  private readonly scene3 = new THREE.Scene();
  /** Fixed camera: a 3/4 view from the front and above, far away with a narrow lens (little parallax: the stage's art is flat). */
  private readonly cam = new THREE.PerspectiveCamera(10, 16 / 9, 1, 160);
  private copy: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private tex: Phaser.Textures.CanvasTexture | null = null;
  private paint: Phaser.GameObjects.Image | null = null;
  private light: Phaser.GameObjects.Image | null = null;
  private readonly live = new Set<Vfx3dHandle>();
  private w = 0;
  private h = 0;
  private mode: Vfx3dMode = 'full';
  private readonly ray = new THREE.Raycaster();
  private readonly plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  constructor(private readonly scene: Phaser.Scene, private readonly depth: number) {
    this.cam.position.set(0, 23.7, 36.4);
    this.cam.lookAt(0, 0, 0);
    this.scene3.add(new THREE.HemisphereLight(0xd8e8ff, 0x50586a, 1.0));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
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

  /** Follows the player's effects setting; takes effect from the next frame. `?vfx3d=light` (or `off`, `full`) forces one (review tools). */
  setMode(mode: Vfx3dMode) {
    this.mode = Stage3d.forced ?? mode;
  }

  private static readonly forced: Vfx3dMode | null = (() => {
    try {
      const v = new URLSearchParams(window.location.search).get('vfx3d');
      return v === 'off' || v === 'light' || v === 'full' ? v : null;
    } catch {
      return null;
    }
  })();

  private init(): boolean {
    if (this.renderer) return true;
    if (this.failed) return false;
    try {
      // Colours of the layer are display-referred end to end: a hex or a GLSL literal is what the screen shows.
      THREE.ColorManagement.enabled = false;
      const r = new THREE.WebGLRenderer({ alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'high-performance' });
      r.outputColorSpace = THREE.LinearSRGBColorSpace;
      r.setClearColor(0x000000, 0);
      r.setPixelRatio(1);
      this.renderer = r;
      this.post = new Post3d(r);
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
    const m = MODES[this.mode];
    const k = Math.min(1, m.side / Math.max(W, H));
    const w = Math.max(2, Math.round(W * k));
    const h = Math.max(2, Math.round(H * k));
    this.post!.setSize(w, h, m.samples);
    if (w === this.w && h === this.h && this.tex) return;
    this.w = w;
    this.h = h;
    // The canvas holds two pictures, one over the other: the paint, then the light.
    this.renderer!.setSize(w, h * 2, false);
    this.copy!.width = w;
    this.copy!.height = h * 2;
    this.cam.aspect = W / H;
    this.cam.updateProjectionMatrix();
    if (this.tex) {
      this.tex.setSize(w, h * 2);
      this.tex.get('paint').setSize(w, h, 0, 0);
      this.tex.get('light').setSize(w, h, 0, h);
    } else {
      this.tex = this.scene.textures.addCanvas(TEXTURE_KEY, this.copy!);
      if (!this.tex) return;
      this.tex.add('paint', 0, 0, 0, w, h);
      this.tex.add('light', 0, 0, h, w, h);
      this.paint = this.scene.add.image(0, 0, TEXTURE_KEY, 'paint').setOrigin(0).setDepth(this.depth).setVisible(false);
      this.light = this.scene.add.image(0, 0, TEXTURE_KEY, 'light').setOrigin(0).setDepth(this.depth).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
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

  /** How many screen px one world unit of height covers at ground point `p`. */
  private pxPerUnitUp(p: THREE.Vector3): number {
    const a = p.clone().project(this.cam);
    const b = p.clone().setY(p.y + 1).project(this.cam);
    return Math.max(1, Math.abs(b.y - a.y) * 0.5 * this.scene.scale.height);
  }

  /** Starts `fx` on the ground under the screen point (x, y); `widthPx` is the anchor's width, `dur` the act's length. */
  play(factory: Vfx3dFactory, x: number, y: number, widthPx: number, dur: number, add: AddTimed, opts: PlayOpts = {}) {
    if (!this.init()) return;
    this.fit();
    const o = this.ground(x, y);
    const a = this.ground(x - widthPx / 2, y);
    const b = this.ground(x + widthPx / 2, y);
    if (!o || !a || !b) return;
    const unit = Math.max(0.2, a.distanceTo(b)) * (opts.scale ?? 1);
    const f = (opts.from && this.ground(opts.from.x, opts.from.y)) || o.clone();
    const pts = (list: Px[] | undefined, fallback: THREE.Vector3) => {
      const got = (list ?? []).map((p) => this.ground(p.x, p.y)).filter((p): p is THREE.Vector3 => !!p);
      return got.length > 0 ? got : [fallback.clone()];
    };
    const tall = opts.heightPx ? opts.heightPx / this.pxPerUnitUp(o) : unit;
    const targets = pts(opts.targets, o);
    const before = this.scene3.children.length;
    const handle = factory({ scene: this.scene3, origin: o, from: f, unit, quality: MODES[this.mode].quality, color: opts.color ?? null, row: opts.row ?? false, targets, friends: pts(opts.friends, f), struck: opts.struck?.length ? pts(opts.struck, o) : targets, tall });
    // Additive materials of the effect become light: they brighten the picture and never cover it (see post3d.ts).
    for (const root of this.scene3.children.slice(before)) {
      root.traverse((c) => {
        const mat = (c as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
        for (const m of Array.isArray(mat) ? mat : mat ? [mat] : []) if (m.blending === THREE.AdditiveBlending) lightBlend(m);
      });
    }
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
    this.paint?.setVisible(false);
    this.light?.setVisible(false);
  }

  /** Draws the layer into its Phaser images (called once a frame, after the effects have moved on). */
  render() {
    if (!this.renderer || !this.post || !this.paint || !this.light || !this.tex || !this.ctx || !this.copy) return;
    if (this.live.size === 0) {
      this.paint.setVisible(false);
      this.light.setVisible(false);
      return;
    }
    this.fit();
    this.post.render(this.scene3, this.cam, MODES[this.mode].bloom);
    this.ctx.clearRect(0, 0, this.w, this.h * 2);
    this.ctx.drawImage(this.renderer.domElement, 0, 0, this.w, this.h * 2);
    this.tex.refresh();
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    this.paint.setDisplaySize(W, H).setVisible(true);
    this.light.setDisplaySize(W, H).setVisible(true);
  }

  private destroy() {
    this.clear();
    this.post?.dispose();
    this.post = null;
    this.renderer?.dispose();
    this.renderer = null;
    if (this.scene.textures.exists(TEXTURE_KEY)) this.scene.textures.remove(TEXTURE_KEY);
    this.tex = null;
    this.paint = null;
    this.light = null;
  }
}
