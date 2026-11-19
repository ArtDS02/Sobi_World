// The diorama prototype (G0) as one running thing: a Three.js renderer on its own canvas, the area's ground, water, bridges and
// dressing, the party walking with the keys on the game's own grid, the camera easing after it at a fixed 3/4 angle, the light of
// the chosen time of day and the post chain. Admin / dev only; it reads the game's content and writes nothing.
import * as THREE from 'three';
import { MAPS } from '../../../src/areas/adventure/logic/config/content';
import { canStand } from '../../../src/systems/character';
import { Birds } from './birds';
import { Bursts } from './bursts';
import { newCardUniforms, type CardUniforms } from './cards';
import { buildCliffs, buildLilies } from './details';
import { dress, type Dressing } from './dress';
import { decksOf, gridOf, standAt, weightsAt, type Deck, type Grid } from './field';
import { buildBridges, buildGround, type GroundUniforms } from './ground';
import { Life } from './life';
import { Look, PRESETS, type TimeOfDay } from './look';
import { Party } from './party';
import { blobTexture, loadCard, loadTiling } from './textures';
import { walkOf } from './walk';
import { buildWater, type WaterUniforms } from './water';
import { hash2 } from './noise';

export interface DioramaOpts {
  time: TimeOfDay;
  quality: 'full' | 'light';
  wind: boolean;
}

const PITCH = THREE.MathUtils.degToRad(52);
const DIST = 41;
const FOLLOW_S = 0.14;
const FOLLOWERS = ['/assets/pigs/base/pig_knight.png', '/assets/pigs/base/pig_ninja.png', '/assets/pigs/base/pig_robot.png'];

export class Diorama {
  readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(22, 16 / 9, 1, 220);
  private readonly look: Look;
  private readonly cardU: CardUniforms = newCardUniforms();
  private readonly groundU: GroundUniforms = { uTime: { value: 0 }, uCloud: { value: 0.16 } };
  private readonly waterU: WaterUniforms = { uTime: { value: 0 }, uLight: { value: new THREE.Color(1, 1, 1) }, uGlint: { value: 1 } };
  private readonly keys = new Set<string>();
  private readonly target = new THREE.Vector3();
  private g!: Grid;
  private walk!: ReturnType<typeof walkOf>;
  private decks: Deck[] = [];
  private party!: Party;
  private life!: Life;
  private dressing!: Dressing;
  private bursts!: Bursts;
  private birds!: Birds;
  /** Where the camera leads the party (it looks a little ahead of where it walks). */
  private readonly lead = new THREE.Vector3();
  private stepClock = 0;
  private splashClock = 0;
  private readonly v = new THREE.Vector3();
  private raf = 0;
  private last = 0;
  private clock = 0;
  private resize: ResizeObserver;
  fps = 0;
  ready = false;

  constructor(
    private readonly host: HTMLElement,
    private readonly mapId: string,
    private opts: DioramaOpts,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.quality === 'full' ? 1.5 : 1));
    host.appendChild(this.renderer.domElement);
    this.look = new Look(this.renderer, this.scene, this.camera);
    this.resize = new ResizeObserver(() => this.fit());
    this.resize.observe(host);
    this.fit();
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKey);
  }

  private onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && ['INPUT', 'SELECT', 'TEXTAREA'].includes(t.tagName)) return;
    const k = e.key.toLowerCase();
    if (!['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) return;
    e.preventDefault();
    if (e.type === 'keydown') this.keys.add(k);
    else this.keys.delete(k);
  };

  private fit() {
    const w = Math.max(1, this.host.clientWidth);
    const h = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.look.setSize(w * this.renderer.getPixelRatio(), h * this.renderer.getPixelRatio());
  }

  async start() {
    const map = MAPS[this.mapId]!;
    this.g = gridOf(map);
    this.decks = decksOf(this.g);
    this.walk = walkOf(map, this.g, this.decks);
    const full = this.opts.quality === 'full' ? 1 : 0.55;
    const [grass, path, cliff, butterfly] = await Promise.all([
      loadTiling('/assets/props/adventure_map/adv_map_forest_tile_grass_a.png'),
      loadTiling('/assets/props/adventure_map/adv_map_forest_tile_top.png'),
      loadTiling('/assets/props/adventure_map/adv_map_forest_edge_cliff.png'),
      loadCard('/assets/props/prop_butterfly_red.png', true).catch(() => null),
    ]);
    const blob = blobTexture();
    this.scene.add(buildGround(this.g, grass, path, this.groundU), buildCliffs(this.g, cliff), buildBridges(this.decks), buildWater(this.g, this.waterU), buildLilies(this.g));
    this.dressing = await dress(map, this.g, this.cardU, full, blob);
    this.scene.add(this.dressing.group);
    this.party = new Party(this.cardU, blob);
    await this.party.load('chr_so', FOLLOWERS);
    this.scene.add(this.party.group);
    this.life = new Life(butterfly, full);
    this.bursts = new Bursts(blob);
    this.birds = new Birds(blob);
    this.scene.add(this.life.group, this.bursts.group, this.birds.group);
    this.goto(map.spawn.x, map.spawn.y);
    this.setOpts(this.opts);
    this.ready = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  setOpts(o: DioramaOpts) {
    this.opts = o;
    const p = PRESETS[o.time];
    const full = o.quality === 'full';
    this.look.apply(p, { shadows: full, bloom: full, tilt: full });
    this.waterU.uLight.value.setRGB(...p.water);
    this.waterU.uGlint.value = p.glint;
    this.groundU.uCloud.value = o.time === 'night' ? 0.06 : 0.16;
    this.cardU.uWind.value = o.wind ? 1 : 0;
    this.life?.setMood(p.fireflies, o.time === 'day' ? 1 : o.time === 'golden' ? 0.6 : 0);
    this.birds?.setSky(p.sunDir, o.time === 'night' ? 0 : 1);
  }

  /** Puts the party on tile (x, y) (or the nearest spot it can stand on) and the camera over it. */
  goto(x: number, y: number) {
    for (let r = 0; r < 6; r += 1)
      for (let dy = -r; dy <= r; dy += 1)
        for (let dx = -r; dx <= r; dx += 1) {
          const p = { x: (x + dx + 0.5) * 40, y: (y + dy + 0.5) * 40 };
          if (!canStand(p, this.walk)) continue;
          // The companions line up toward the most open side (the longest free run of 4 tiles).
          let back = { x: -1, y: 0 };
          let best = -1;
          for (let k = 0; k < 8; k += 1) {
            const d = { x: Math.cos((k / 8) * Math.PI * 2), y: Math.sin((k / 8) * Math.PI * 2) };
            let free = 0;
            while (free < 160 && canStand({ x: p.x + d.x * (free + 8), y: p.y + d.y * (free + 8) }, this.walk)) free += 8;
            if (free > best) [best, back] = [free, d];
          }
          this.party.place(p.x, p.y, back);
          this.party.update({ x: 0, y: 0 }, 16, this.walk, this.clock, this.ground);
          this.aim(true);
          return;
        }
  }

  private ground = (x: number, z: number) => standAt(this.g, this.decks, x, z);

  /** Eases the camera's look-at point after the party, kept inside the area. */
  private aim(snap: boolean, dt = 0) {
    const at = this.party.world(this.ground);
    const halfW = (Math.tan(THREE.MathUtils.degToRad(11)) * DIST * this.camera.aspect) * 0.92;
    const head = this.party.heading;
    if (snap) this.lead.set(0, 0, 0);
    else this.lead.lerp(new THREE.Vector3(head.x * 2.6, 0, head.y * 1.6), 1 - Math.exp(-dt / 0.7));
    const want = new THREE.Vector3(
      THREE.MathUtils.clamp(at.x + this.lead.x, halfW, this.g.cols - halfW),
      0,
      THREE.MathUtils.clamp(at.z + 0.6 + this.lead.z, 9.5, this.g.rows - 5.5),
    );
    if (snap) this.target.copy(want);
    else this.target.lerp(want, 1 - Math.exp(-dt / FOLLOW_S));
    this.camera.position.set(this.target.x, this.target.y + Math.sin(PITCH) * DIST, this.target.z + Math.cos(PITCH) * DIST);
    this.camera.lookAt(this.target);
  }

  private frame = (now: number) => {
    this.raf = requestAnimationFrame(this.frame);
    const dtMs = Math.min(50, now - this.last);
    this.last = now;
    this.fps = this.fps ? this.fps * 0.95 + (1000 / Math.max(1, dtMs)) * 0.05 : 60;
    this.clock += dtMs / 1000;
    const t = this.clock;
    this.cardU.uTime.value = t;
    this.groundU.uTime.value = t;
    this.waterU.uTime.value = t;
    const k = this.keys;
    const dir = { x: (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0), y: (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0) };
    this.party.update(dir, dtMs, this.walk, t, this.ground);
    this.aim(false, dtMs / 1000);
    const at = this.party.world(this.ground);
    this.seeThrough(at);
    this.dressing.creatures.update(t, dtMs / 1000, at);
    this.life.update(t, this.target, this.opts.wind ? 1 : 0.2, this.ground);
    this.lifeBursts(t, dtMs / 1000, at);
    this.birds.update(t, this.target, this.ground);
    this.look.follow(this.target, at);
    this.look.composer.render();
  };

  /** The party's place on screen and in depth, for the see-through circle of the cards in front of it. */
  private seeThrough(at: THREE.Vector3) {
    this.cardU.uPlayer.value.copy(at);
    this.camera.updateMatrixWorld();
    this.v.set(at.x, at.y + 1, at.z).project(this.camera);
    const pr = this.renderer.getPixelRatio();
    const w = this.host.clientWidth * pr;
    const h = this.host.clientHeight * pr;
    this.cardU.uSee.value.set((this.v.x * 0.5 + 0.5) * w, (this.v.y * 0.5 + 0.5) * h, h * 0.2);
  }

  /** Dust at the party's feet as it walks, rings on the water: fish jumping near the view, frogs, the bank under the party. */
  private lifeBursts(t: number, dt: number, at: THREE.Vector3) {
    this.stepClock += dt;
    if (this.party.isMoving && this.stepClock > 0.24) {
      this.stepClock = 0;
      const wet = weightsAt(this.g, at.x, at.z + 0.3)[2] > 0.35;
      if (wet) this.bursts.ripple(at.x, at.z + 0.2, 0.55);
      else this.bursts.puff(at.x + (hash2(Math.round(t * 50), 1) - 0.5) * 0.3, at.y, at.z + 0.1, 0.38);
    }
    this.splashClock += dt;
    if (this.splashClock > 1.3) {
      this.splashClock = 0;
      for (let i = 0; i < 6; i += 1) {
        const x = this.target.x + (hash2(Math.round(t * 10), i, 2) - 0.5) * 30;
        const z = this.target.z + (hash2(Math.round(t * 10), i, 3) - 0.5) * 18;
        if (weightsAt(this.g, x, z)[2] > 0.92) {
          this.bursts.ripple(x, z, 0.9);
          break;
        }
      }
      for (const f of this.dressing.creatures.foes) if (weightsAt(this.g, f.x, f.z)[2] > 0.4) this.bursts.ripple(f.x, f.z, 1.1);
    }
    this.bursts.update(t);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.resize.disconnect();
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKey);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      mats.forEach((x) => x.dispose());
    });
    this.look.composer.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
