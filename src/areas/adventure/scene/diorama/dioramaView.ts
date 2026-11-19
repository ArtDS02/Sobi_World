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
import { CanopyCover } from './canopyCover';
import { blockerPlan } from './blockers';
import { Bursts } from './bursts';
import { BurstDriver } from './burstDriver';
import { newCardUniforms, type CardUniforms } from './cards';
import { CONTRACTS, type SceneContract } from './contracts';
import { decksOf, standAt, type Deck } from './decks';
import { buildCliffs, buildLilies, buildStairs } from './details';
import { dressThings, type Things } from './dressThings';
import { disposeTree } from './disposeTree';
import { gpuNameOf } from './gpuProbe';
import { dressTrees } from './dressTrees';
import { disposeRuneTexture } from './landmarkGlow';
import { gridOf, heightAt, type Grid } from './field';
import type { Foes } from './foes';
import { buildBridges, buildGround, setGroundMood, type GroundUniforms } from './ground';
import { Life } from './life';
import { SunShafts, shaftSpots, disposeShaftTexture } from './sunShafts';
import { FollowCam } from './followCam';
import { Look, PRESETS, type TimeOfDay } from './look';
import { Party, type PartyPose } from './party';
import { blobTexture, loadCrop, loadTiling } from './textures';
import { buildWater, type WaterUniforms } from './water';

export interface ViewOpts {
  time: TimeOfDay;
  quality: 'full' | 'light';
  /** Wind and ambient life (false: reduced motion, the scene stands still). */
  wind: boolean;
  /** Share of the ambient particles (fireflies, leaves, motes, butterflies) drawn, 0–1 (default 1); read when the area is built. */
  particles?: number;
}

/** One tick of the host: seconds since the last one, the party's pose (game px) and whether the camera jumps there. */
export interface ViewFrame {
  dt: number;
  pose: PartyPose;
  snap?: boolean;
}

const NEUTRAL: SceneContract = { trees: [0.45, 0.2, 0.15, 0.2], light: { sat: 0, warm: 0, fog: 0, fogTint: 0xbcd2e0 }, accent: 'lotus', spots: [] };

export class DioramaView {
  readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(22, 16 / 9, 1, 220);
  private readonly look: Look;
  private readonly cardU: CardUniforms = newCardUniforms();
  private readonly groundU: GroundUniforms = { uTime: { value: 0 }, uCloud: { value: 0.16 }, uSee: this.cardU.uSee, uNight: { value: 0 }, uLift: { value: 0 }, uBreeze: { value: 1 }, uSeeTint: { value: new THREE.Color(1, 1, 1) }, uInk: { value: new THREE.Vector3() } };
  private readonly waterU: WaterUniforms = {
    uTime: { value: 0 },
    uLight: { value: new THREE.Color(1, 1, 1) },
    uGlint: { value: 1 },
  };
  private readonly cam = new FollowCam(this.camera);
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
  private shafts: SunShafts | null = null;
  private cover: CanopyCover | null = null;
  private tile = 40;
  private w = 1;
  private h = 1;
  private clock = 0;
  private readonly burstDriver = new BurstDriver();
  private prev: { x: number; y: number } | null = null;
  private gen = 0;
  private visible = true;
  ready = false;

  constructor(
    private readonly art: ArtFn,
    private opts: ViewOpts,
    pixelRatio = 1,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
    });
    // Light draws at 3/4 of the size (the host stretches it): the cheap path must hold 30 FPS without a GPU.
    this.renderer.setPixelRatio(opts.quality === 'full' ? Math.min(pixelRatio, 1.5) : Math.min(pixelRatio, 1));
    this.renderer.info.autoReset = false;
    this.look = new Look(this.renderer, this.scene, this.camera);
  }

  get canvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  /** The foes and chests of the area, to pose from the scene state (`setFoe`, `setChest`). */
  get foes(): Foes | null {
    return this.things?.foes ?? null;
  }

  /** What the last frame cost the GPU, all passes together (`info` is reset by hand once per frame). */
  stats() {
    const i = this.renderer.info.render;
    let meshes = 0;
    this.root?.traverse(() => (meshes += 1));
    return { calls: i.calls, triangles: i.triangles, meshes };
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
    const particles = quality * (this.opts.particles ?? 1);
    const tile = (name: string) => (this.art(forestKit(name)) ? loadTiling(this.url(forestKit(name))) : Promise.resolve(null));
    const [grass, cliff, endL, endR, stone, butterfly] = await Promise.all([
      loadTiling(this.url('adv_map_forest_tile_grass_a')),
      loadTiling(this.url(forestKit('edge_cliff'))),
      tile('edge_cliff_end_l'),
      tile('edge_cliff_end_r'),
      // One step of the kit's stairs picture (its middle band), for the treads and risers of the flights of steps.
      g.stairs.length && this.art(forestKit('edge_stairs')) ? loadCrop(this.url(forestKit('edge_stairs')), 0.43, 0.34, 0.57, 0.5) : Promise.resolve(null),
      cardOf(this.art, 'prop_butterfly_red', true),
    ]);
    const blob = blobTexture();
    this.groundU.uInk.value.set(contract.ink?.x ?? 0, contract.ink?.y ?? 0, contract.ink?.r ?? 0);
    const decks = decksOf(g);
    const root = new THREE.Group();
    root.add(buildGround(this.renderer, g, grass, this.opts.quality, this.groundU, contract.pathTone), buildCliffs(g, { strip: cliff, endL, endR }), ...(stone ? [buildStairs(g.stairs, stone)] : []), buildBridges(decks, contract.deckLift), buildWater(g, this.waterU), ...(contract.lilies === false ? [] : [buildLilies(g)]));
    root.add(await dressTrees(this.art, blockerPlan(map, opened, closed, g), map, g, this.cardU, contract, this.opts.quality === 'light'));
    const things = await dressThings(this.art, map, g, this.cardU, quality, blob, s, { inkPools: contract.accent === 'corruptionInk', spore: this.opts.particles ?? 1, barrier: contract.barrier });
    root.add(things.group);
    const party = new Party(this.cardU, blob, map.tile);
    await party.setTeam(
      this.art,
      s.leader === 'bi' ? 'chr_bi' : 'chr_so',
      s.followers.map((f) => f.art),
    );
    root.add(party.group);
    const life = new Life(butterfly, particles, contract.life, contract.ink ?? null);
    const bursts = new Bursts(blob);
    const birds = new Birds(blob);
    root.add(life.group, bursts.group, birds.group);
    const shafts = contract.accent === 'sunShafts' ? new SunShafts(shaftSpots(g), blob, (x, z) => heightAt(g, x, z), quality < 1 ? 3 : 6) : null;
    if (shafts) root.add(shafts.group);
    const cover = contract.accent === 'spores' ? await CanopyCover.build(this.art, map, g, this.cardU) : null;
    if (cover) root.add(cover.group);
    if (gen !== this.gen) return disposeTree(root);
    this.g = g;
    this.decks = decks;
    this.contract = contract;
    this.tile = map.tile;
    [this.root, this.things, this.party, this.life, this.bursts, this.birds, this.shafts, this.cover] = [root, things, party, life, bursts, birds, shafts, cover];
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
    [this.root, this.g, this.things, this.party, this.life, this.bursts, this.birds, this.shafts, this.cover, this.prev] = [null, null, null, null, null, null, null, null, null, null];
  }

  setOpts(o: ViewOpts) {
    this.opts = o;
    const p = PRESETS[o.time];
    const full = o.quality === 'full';
    this.look.apply(p, { shadows: full, bloom: full, tilt: full }, this.contract.light);
    this.waterU.uLight.value.setRGB(...p.water);
    this.waterU.uGlint.value = p.glint;
    setGroundMood(this.groundU, o.time, o.wind, this.contract.nightLift ?? 0);
    this.cardU.uWind.value = o.wind ? (this.contract.wind ?? 1) : 0;
    this.life?.setMood(p.fireflies, o.time === 'day' ? 1 : o.time === 'golden' ? 0.6 : 0);
    this.birds?.setSky(p.sunDir, o.time === 'night' ? 0 : 1);
    this.shafts?.setSun(o.time === 'night' ? 0 : o.time === 'golden' ? 0.5 : 1, o.time === 'golden' ? 0xffa860 : 0xffd98a, o.time === 'golden');
  }

  /** Height of the ground under a point of the area (game px), a deck counting as ground. */
  groundAt(px: { x: number; y: number }): number {
    return this.g ? standAt(this.g, this.decks, px.x / this.tile, px.y / this.tile) : 0;
  }

  /** Where a point of the area (game px, on the ground, `lift` tiles above it) is in the picture, CSS px from its top-left. */
  screenOf(px: { x: number; y: number }, lift = 0): { x: number; y: number } {
    this.camera.updateMatrixWorld();
    this.v.set(px.x / this.tile, this.groundAt(px) + lift, px.y / this.tile).project(this.camera);
    return { x: (this.v.x * 0.5 + 0.5) * this.w, y: (1 - (this.v.y * 0.5 + 0.5)) * this.h };
  }

  /** Pulses the hint of a chest the party is near at strength `k` (0 = none). */
  hintChest = (id: string, k: number) => this.things?.foes.hint(id, k);

  /** Greys the companions that are knocked out (in team order). */
  setDown(down: readonly boolean[]) {
    this.party?.setDown(down);
  }

  /** The graphics card's name ('' when the browser hides it). */
  gpuName(): string {
    return gpuNameOf(this.renderer);
  }

  hide = () => void (this.visible = false);
  show = () => void (this.visible = true);

  private ground = (x: number, z: number) => (this.g ? standAt(this.g, this.decks, x, z) : 0);

  /** True where the party may stand (a tile the game does not block): what a drawn-only offset must never leave. */
  private free = (x: number, z: number): boolean => {
    const g = this.g;
    return !!g && x >= 0 && z >= 0 && x < g.cols && z < g.rows && !g.blocked[Math.floor(z) * g.cols + Math.floor(x)];
  };

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
    const moved =
      this.prev && dt > 0
        ? {
            x: (lead.x - this.prev.x) / dt / AB.explore.speed,
            y: (lead.y - this.prev.y) / dt / AB.explore.speed,
          }
        : { x: 0, y: 0 };
    this.prev = { x: lead.x, y: lead.y };
    this.party.update(f.pose, dt * 1000, t, this.ground, this.free);
    const at = this.party.world(f.pose, this.ground);
    this.cam.aim(at, moved, !!f.snap, dt, this.g, this.opts.wind);
    this.seeThrough(at);
    this.things!.foes.update(t, dt, at);
    this.things!.glow(t);
    this.life!.update(t, this.cam.target, this.opts.wind ? 1 : 0.2, this.ground);
    this.burstDriver.update(this.bursts!, this.g, this.decks, this.things!.foes, this.cam.target, at, t, dt, lead.moving);
    this.birds!.update(t, this.cam.target, this.ground);
    this.shafts?.update(t, this.cam.target, at);
    this.cover?.update(at, dt);
    this.look.follow(this.cam.target, at);
    this.renderer.info.reset();
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

  private url = (id: string): string => this.art(id) ?? '';

  dispose() {
    this.leave();
    disposeShaftTexture();
    disposeRuneTexture();
    this.look.composer.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
