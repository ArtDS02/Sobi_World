// The diorama of an area as one running thing: a Three.js renderer on its own canvas, the area's ground, water, bridges and dressing,
// the party posed where the host says it stands, the camera easing after it at a fixed 3/4 angle, the light of the chosen time of day
// (leaning as the map's contract says) and the post chain. The view has NO loop and NO walking of its own: the host (the game's
// scene, or the Admin lab) calls `frame` each tick with the party's pose. Pictures come by id through the host's resolver.
// The ground the party stands on is the game's own tile grid (`walkableOf`); this only draws it.
import * as THREE from 'three';
import { AB, type AreaMap } from '../../logic/config/content';
import type { AdventureSceneState } from '../sceneState';
import { cardOf, forestKit, type ArtFn } from './artKit';
import { Birds } from './birds';
import { blockerPlan } from './blockers';
import { Bursts } from './bursts';
import { newCardUniforms, type CardUniforms } from './cards';
import { CONTRACTS, type SceneContract } from './contracts';
import { deckAt, decksOf, standAt, type Deck } from './decks';
import { buildCliffs, buildLilies } from './details';
import { dressThings, type Things } from './dressThings';
import { dressTrees } from './dressTrees';
import { gridOf, weightsAt, type Grid } from './field';
import type { Foes } from './foes';
import { buildBridges, buildGround, type GroundUniforms } from './ground';
import { Life } from './life';
import { Look, PRESETS, type TimeOfDay } from './look';
import { hash2 } from './noise';
import { Party, type PartyPose } from './party';
import { blobTexture, loadTiling } from './textures';
import { buildWater, type WaterUniforms } from './water';

export interface ViewOpts {
  time: TimeOfDay;
  quality: 'full' | 'light';
  /** Wind and ambient life (false: reduced motion, the scene stands still). */
  wind: boolean;
}

/** One tick of the host: seconds since the last one, the party's pose (game px) and whether the camera jumps there. */
export interface ViewFrame {
  dt: number;
  pose: PartyPose;
  snap?: boolean;
}

const NEUTRAL: SceneContract = { trees: [0.45, 0.2, 0.15, 0.2], light: { sat: 0, warm: 0, fog: 0, fogTint: 0xbcd2e0 }, accent: 'lotus', spots: [] };
const PITCH = THREE.MathUtils.degToRad(52);
const DIST = 41;
const FOLLOW_S = 0.14;

export class DioramaView {
  readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(22, 16 / 9, 1, 220);
  private readonly look: Look;
  private readonly cardU: CardUniforms = newCardUniforms();
  private readonly groundU: GroundUniforms = { uTime: { value: 0 }, uCloud: { value: 0.16 } };
  private readonly waterU: WaterUniforms = { uTime: { value: 0 }, uLight: { value: new THREE.Color(1, 1, 1) }, uGlint: { value: 1 } };
  private readonly target = new THREE.Vector3();
  /** Where the camera leads the party (it looks a little ahead of where it walks). */
  private readonly lead = new THREE.Vector3();
  private readonly v = new THREE.Vector3();
  private root: THREE.Group | null = null;
  private g: Grid | null = null;
  private decks: Deck[] = [];
  private contract = NEUTRAL;
  private party: Party | null = null;
  private things: Things | null = null;
  private life: Life | null = null;
  private bursts: Bursts | null = null;
  private birds: Birds | null = null;
  private tile = 40;
  private w = 1;
  private h = 1;
  private clock = 0;
  private stepClock = 0;
  private splashClock = 0;
  private prev: { x: number; y: number } | null = null;
  private gen = 0;
  private visible = true;
  ready = false;

  constructor(
    private readonly art: ArtFn,
    private opts: ViewOpts,
    pixelRatio = 1,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(pixelRatio, opts.quality === 'full' ? 1.5 : 1));
    this.look = new Look(this.renderer, this.scene, this.camera);
  }

  get canvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  /** The foes and chests of the area, to pose from the scene state (`setFoe`, `setChest`). */
  get foes(): Foes | null {
    return this.things?.foes ?? null;
  }

  /** Sets the size of the picture in CSS px. */
  setSize(w: number, h: number) {
    this.w = Math.max(1, Math.round(w));
    this.h = Math.max(1, Math.round(h));
    this.renderer.setSize(this.w, this.h, false);
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
    const pr = this.renderer.getPixelRatio();
    this.look.setSize(this.w * pr, this.h * pr);
  }

  /** Builds the area `map` (blocked tiles of the scene state's opened gates and the `closed` rectangles); the old one is dropped. */
  async enter(map: AreaMap, s: AdventureSceneState, closed: readonly { x: number; y: number; w: number; h: number }[] = []) {
    this.leave();
    const gen = this.gen;
    const opened = new Set(s.openedGates);
    const g = gridOf(map, opened, closed);
    const contract = CONTRACTS[map.id] ?? NEUTRAL;
    const quality = this.opts.quality === 'full' ? 1 : 0.55;
    const [grass, path, cliff, butterfly] = await Promise.all([
      loadTiling(this.url('adv_map_forest_tile_grass_a')),
      loadTiling(this.url('adv_map_forest_tile_top')),
      loadTiling(this.url(forestKit('edge_cliff'))),
      cardOf(this.art, 'prop_butterfly_red', true),
    ]);
    const blob = blobTexture();
    const decks = decksOf(g);
    const root = new THREE.Group();
    root.add(buildGround(g, grass, path, this.groundU), buildCliffs(g, cliff), buildBridges(decks), buildWater(g, this.waterU), buildLilies(g));
    root.add(await dressTrees(this.art, blockerPlan(map, opened, closed, g), map, g, this.cardU, contract));
    const things = await dressThings(this.art, map, g, this.cardU, quality, blob, s);
    root.add(things.group);
    const party = new Party(this.cardU, blob, map.tile);
    await party.setTeam(this.art, s.leader === 'bi' ? 'chr_bi' : 'chr_so', s.followers.map((f) => f.art));
    root.add(party.group);
    const life = new Life(butterfly, quality);
    const bursts = new Bursts(blob);
    const birds = new Birds(blob);
    root.add(life.group, bursts.group, birds.group);
    if (gen !== this.gen) return disposeTree(root);
    this.g = g;
    this.decks = decks;
    this.contract = contract;
    this.tile = map.tile;
    [this.root, this.things, this.party, this.life, this.bursts, this.birds] = [root, things, party, life, bursts, birds];
    this.scene.add(root);
    this.setOpts(this.opts);
    this.ready = true;
  }

  /** Drops the area's objects (the kit's picture cache stays for the next area of the zone). */
  leave() {
    this.gen += 1;
    this.ready = false;
    if (this.root) {
      this.scene.remove(this.root);
      disposeTree(this.root);
    }
    [this.root, this.g, this.things, this.party, this.life, this.bursts, this.birds, this.prev] = [null, null, null, null, null, null, null, null];
  }

  setOpts(o: ViewOpts) {
    this.opts = o;
    const p = PRESETS[o.time];
    const full = o.quality === 'full';
    this.look.apply(p, { shadows: full, bloom: full, tilt: full }, this.contract.light);
    this.waterU.uLight.value.setRGB(...p.water);
    this.waterU.uGlint.value = p.glint;
    this.groundU.uCloud.value = o.time === 'night' ? 0.06 : 0.16;
    this.cardU.uWind.value = o.wind ? 1 : 0;
    this.life?.setMood(p.fireflies, o.time === 'day' ? 1 : o.time === 'golden' ? 0.6 : 0);
    this.birds?.setSky(p.sunDir, o.time === 'night' ? 0 : 1);
  }

  /** Height of the ground under a point of the area (game px), a deck counting as ground. */
  groundAt(px: { x: number; y: number }): number {
    return this.g ? standAt(this.g, this.decks, px.x / this.tile, px.y / this.tile) : 0;
  }

  /** Where a point of the area (game px, on the ground) is in the picture, CSS px from its top-left. */
  screenOf(px: { x: number; y: number }): { x: number; y: number } {
    this.camera.updateMatrixWorld();
    this.v.set(px.x / this.tile, this.groundAt(px), px.y / this.tile).project(this.camera);
    return { x: (this.v.x * 0.5 + 0.5) * this.w, y: (1 - (this.v.y * 0.5 + 0.5)) * this.h };
  }

  hide() {
    this.visible = false;
  }

  show() {
    this.visible = true;
  }

  private ground = (x: number, z: number) => (this.g ? standAt(this.g, this.decks, x, z) : 0);

  /** Eases the camera's look-at point after the party, kept inside the area. */
  private aim(at: THREE.Vector3, heading: { x: number; y: number }, snap: boolean, dt: number) {
    const g = this.g!;
    const halfW = Math.tan(THREE.MathUtils.degToRad(11)) * DIST * this.camera.aspect * 0.92;
    if (snap) this.lead.set(0, 0, 0);
    else if (this.opts.wind) this.lead.lerp(this.v.set(heading.x * 2.6, 0, heading.y * 1.6), 1 - Math.exp(-dt / 0.7));
    const want = new THREE.Vector3(THREE.MathUtils.clamp(at.x + this.lead.x, halfW, g.cols - halfW), 0, THREE.MathUtils.clamp(at.z + 0.6 + this.lead.z, 9.5, g.rows - 5.5));
    if (snap) this.target.copy(want);
    else this.target.lerp(want, 1 - Math.exp(-dt / FOLLOW_S));
    this.camera.position.set(this.target.x, this.target.y + Math.sin(PITCH) * DIST, this.target.z + Math.cos(PITCH) * DIST);
    this.camera.lookAt(this.target);
  }

  /** One tick: poses the party and everything alive, then draws (unless hidden or still building). */
  frame(f: ViewFrame) {
    if (!this.ready || !this.visible || !this.party || !this.g) return;
    const dt = Math.min(0.05, f.dt);
    this.clock += dt;
    const t = this.clock;
    this.cardU.uTime.value = t;
    this.groundU.uTime.value = t;
    this.waterU.uTime.value = t;
    const lead = f.pose.leader;
    const moved = this.prev && dt > 0 ? { x: (lead.x - this.prev.x) / dt / AB.explore.speed, y: (lead.y - this.prev.y) / dt / AB.explore.speed } : { x: 0, y: 0 };
    this.prev = { x: lead.x, y: lead.y };
    this.party.update(f.pose, dt * 1000, t, this.ground);
    const at = this.party.world(f.pose, this.ground);
    this.aim(at, moved, !!f.snap, dt);
    this.seeThrough(at);
    this.things!.foes.update(t, dt, at);
    this.life!.update(t, this.target, this.opts.wind ? 1 : 0.2, this.ground);
    this.lifeBursts(t, dt, at, lead.moving);
    this.birds!.update(t, this.target, this.ground);
    this.look.follow(this.target, at);
    this.look.composer.render();
  }

  /** The party's place on screen and in depth, for the see-through circle of the cards in front of it. */
  private seeThrough(at: THREE.Vector3) {
    this.cardU.uPlayer.value.copy(at);
    this.camera.updateMatrixWorld();
    this.v.set(at.x, at.y + 1, at.z).project(this.camera);
    const pr = this.renderer.getPixelRatio();
    this.cardU.uSee.value.set((this.v.x * 0.5 + 0.5) * this.w * pr, (this.v.y * 0.5 + 0.5) * this.h * pr, this.h * pr * 0.2);
  }

  /** Dust at the party's feet as it walks, rings on the water: fish jumping near the view, frogs, the bank under the party. */
  private lifeBursts(t: number, dt: number, at: THREE.Vector3, moving: boolean) {
    const g = this.g!;
    const bursts = this.bursts!;
    this.stepClock += dt;
    if (moving && this.stepClock > 0.24) {
      this.stepClock = 0;
      if (weightsAt(g, at.x, at.z + 0.3)[2] > 0.35 && !deckAt(this.decks, at.x, at.z)) bursts.ripple(at.x, at.z + 0.2, 0.55);
      else bursts.puff(at.x + (hash2(Math.round(t * 50), 1) - 0.5) * 0.3, at.y, at.z + 0.1, 0.38);
    }
    this.splashClock += dt;
    if (this.splashClock > 1.3) {
      this.splashClock = 0;
      for (let i = 0; i < 6; i += 1) {
        const x = this.target.x + (hash2(Math.round(t * 10), i, 2) - 0.5) * 30;
        const z = this.target.z + (hash2(Math.round(t * 10), i, 3) - 0.5) * 18;
        if (weightsAt(g, x, z)[2] > 0.92) {
          bursts.ripple(x, z, 0.9);
          break;
        }
      }
      for (const f of this.things!.foes.foes) if (!f.state.defeated && weightsAt(g, f.x, f.z)[2] > 0.4) bursts.ripple(f.x, f.z, 1.1);
    }
    bursts.update(t);
  }

  private url(id: string): string {
    return this.art(id) ?? '';
  }

  dispose() {
    this.leave();
    this.look.composer.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

function disposeTree(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    mats.forEach((x) => x.dispose());
  });
}
