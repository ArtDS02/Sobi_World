// Thác Rêu's accent (docs/agent-loop/forest-diorama/design.md §C.5): the falls themselves. A tall sheet of falling water that spans the
// whole cliff face from the plateau's lip to the pool (the kit's waterfall picture, tiled and scrolled, under moving streaks), the river
// that comes over the lip on top of the plateau, spray and a slow mist at the foot, a faint rainbow in the spray by day, and fish that
// jump in the pool. The pool's foam ring is drawn by the water itself (water.ts). Code plus the kit's picture; every motion is a
// function of the clock and an index. The spray and the mist thin out near the party, so they never hide it.
import * as THREE from 'three';
import { TILT } from './cards';
import { heightAt, weightsAt, type Grid } from './field';
import { GLSL_NOISE, hash2 } from './noise';
import { texture } from './textures';
import type { TimeOfDay } from './look';

/** Where the falls are: the tiles of the `w` terrain (columns x0..x1, rows z0..z1) and the height of the plateau beside them. */
export interface FallSite {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  top: number;
}

export function fallSite(g: Grid): FallSite | null {
  let [x0, x1, z0, z1] = [Infinity, -1, Infinity, -1];
  g.fall.forEach((v, i) => {
    if (!v) return;
    const [x, z] = [i % g.cols, Math.floor(i / g.cols)];
    [x0, x1, z0, z1] = [Math.min(x0, x), Math.max(x1, x + 1), Math.min(z0, z), Math.max(z1, z + 1)];
  });
  if (x1 < 0) return null;
  const top = Math.max(heightAt(g, x0 - 1.5, z0 + 1.5), heightAt(g, x1 + 1.5, z0 + 1.5));
  return { x0, x1, z0, z1, top: Math.max(2, top) };
}

/** The pool's plunge point (tiles) and the reach of the foam ring there, for the water shader. */
export const footOf = (s: FallSite) => ({ x: (s.x0 + s.x1) / 2 - 0.5, z: s.z1 - 0.1, r: 2.1 });

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const SHEET = /* glsl */ `
uniform sampler2D uTex; uniform float uHas; uniform float uH; uniform float uMode; uniform float uTime; uniform vec3 uLight;
varying vec2 vUv;
${GLSL_NOISE}
void main(){
  float u = vUv.x; float v = vUv.y; float t = uTime;
  vec3 col; float a;
  if (uMode < .5) {
    // The sheet: v = 0 at the pool, 1 at the lip. Soft ragged sides, streaks that run down at their own speeds, the kit's water on top.
    float wob = (dFbm(vec2(v * 2.2, t * .35)) - .5) * .3;
    float side = smoothstep(0., .3, u + wob * 1.4) * smoothstep(0., .08, 1. - u + wob * .3);
    float s1 = dNoise(vec2(u * 16., v * uH * .7 + t * 3.4));
    float s2 = dNoise(vec2(u * 38. + 9., v * uH * 1.4 + t * 5.6));
    float st = s1 * .55 + s2 * .45;
    col = mix(vec3(.26, .62, .8), vec3(.82, .96, 1.), smoothstep(.3, .85, st));
    if (uHas > .5) col = mix(col, texture2D(uTex, vec2(u * .9 + .05, v * uH * .3 + t * .6)).rgb, .5);
    col = mix(col, vec3(1.), smoothstep(.93, 1., v) * .55);
    col = mix(col, vec3(.97, 1., 1.), smoothstep(.22, 0., v) * (.55 + .3 * dNoise(vec2(u * 9., t * 2.))) * (1. - .75 * smoothstep(.55, .3, u)));
    col *= .94 + .1 * dNoise(vec2(u * 3., v * uH * .3 + t));
    // The left half hangs over the cliff face as a side cascade that thins out toward the top; the right half is the river's own drop.
    float off = smoothstep(.55, .42, u);
    a = side * (.93 - .12 * st) * smoothstep(0., .05, v) * (1. - off * smoothstep(.4, .8, v));
  } else {
    // The river on the plateau: v = 0 at the lip, 1 upstream, flowing toward the lip, fading out upstream.
    float side = smoothstep(0., .12, u) * smoothstep(0., .12, 1. - u);
    float r = dFbm(vec2(u * 5., v * uH * .5 + t * 1.2));
    col = mix(vec3(.3, .66, .8), vec3(.86, .97, 1.), smoothstep(.45, .9, r));
    col = mix(col, vec3(1.), smoothstep(.3, 0., v) * .6);
    a = side * smoothstep(1., .5, v) * .93;
  }
  col *= uLight;
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

let rainbowTex: THREE.Texture | null = null;
let fishTex: THREE.Texture | null = null;

/** Frees the textures drawn in code (the scene calls it on shutdown). */
export function disposeFallTextures() {
  rainbowTex?.dispose();
  fishTex?.dispose();
  rainbowTex = fishTex = null;
}

const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
};

/** Seven soft bands of a rainbow, red outside, the upper half of a ring (its centre on the picture's bottom edge). */
function rainbow(): THREE.Texture {
  if (rainbowTex) return rainbowTex;
  const [c, g] = canvas(256, 128);
  const ring = g.createRadialGradient(128, 128, 82, 128, 128, 127);
  const bands = ['rgba(255,255,255,0)', 'rgba(150,90,255,.6)', 'rgba(80,120,255,.65)', 'rgba(80,220,140,.65)', 'rgba(255,238,100,.65)', 'rgba(255,170,80,.65)', 'rgba(255,90,90,.6)', 'rgba(255,90,90,0)'];
  bands.forEach((b, i) => ring.addColorStop(i / (bands.length - 1), b));
  g.fillStyle = ring;
  g.fillRect(0, 0, 256, 128);
  return (rainbowTex = texture(c));
}

/** A small silver fish in profile, facing right. */
function fish(): THREE.Texture {
  if (fishTex) return fishTex;
  const [c, g] = canvas(64, 32);
  g.fillStyle = '#9fb7c4';
  g.beginPath();
  g.ellipse(26, 16, 20, 9, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#e6f2f6';
  g.beginPath();
  g.ellipse(26, 20, 16, 4, 0, 0, Math.PI);
  g.fill();
  g.fillStyle = '#7fa0b0';
  g.beginPath();
  g.moveTo(8, 16);
  g.lineTo(0, 6);
  g.lineTo(0, 26);
  g.closePath();
  g.fill();
  g.fillStyle = '#10202a';
  g.beginPath();
  g.arc(38, 14, 2, 0, Math.PI * 2);
  g.fill();
  return (fishTex = texture(c));
}

interface Mote {
  s: THREE.Sprite;
  i: number;
}

export class Waterfall {
  readonly group = new THREE.Group();
  private readonly time = { value: 0 };
  private readonly spray: Mote[] = [];
  private readonly mist: Mote[] = [];
  private readonly fish: { s: THREE.Sprite; x: number; z: number; i: number; rose: number; landed: number }[] = [];
  private readonly bow: THREE.Mesh;
  private day = 1;
  private readonly foot: THREE.Vector3;
  private readonly tint = new THREE.Color(1, 1, 1);

  private constructor(
    site: FallSite,
    g: Grid,
    light: { value: THREE.Color },
    kit: THREE.Texture | null,
    blob: THREE.Texture,
    quality: number,
  ) {
    const { x0, x1, z1, top } = site;
    // The sheet is twice the river's width: the river's drop and a side cascade on the cliff face to its left.
    const cx = (x0 + x1) / 2 - 0.5;
    this.foot = new THREE.Vector3(cx, -0.1, z1 - 0.4);
    const uniforms = (mode: number, h: number) => ({ uTex: { value: kit }, uHas: { value: kit ? 1 : 0 }, uH: { value: h }, uMode: { value: mode }, uTime: this.time, uLight: light });
    const make = (mode: number, h: number, order: number) => {
      const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: uniforms(mode, h), vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }', fragmentShader: SHEET });
      return { m, order };
    };
    // The sheet leans like the cliff's own face (its foot in front of the drop, its lip over it) and spans it from the pool to the plateau.
    const quad = (p: number[][], order: number, mat: THREE.ShaderMaterial) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(p.flat(), 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
      geo.setIndex([0, 1, 2, 0, 2, 3]);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = order;
      mesh.frustumCulled = false;
      this.group.add(mesh);
    };
    const [xa, xb] = [x0 - 2, x1];
    const lipZ = z1 - 0.6;
    const fall = make(0, top + 0.1, 3);
    quad([[xa, -0.1, this.foot.z], [xb, -0.1, this.foot.z], [xb, top, lipZ], [xa, top, lipZ]], fall.order, fall.m);
    // The river over the lip: it lies on the plateau, a little below its top, and fades out upstream.
    const len = 9;
    const river = make(1, len, 3);
    const ry = top - 0.1;
    quad([[x0 + 0.15, ry, lipZ + 0.02], [x1 - 0.15, ry, lipZ + 0.02], [x1 - 0.15, ry, lipZ - len], [x0 + 0.15, ry, lipZ - len]], river.order, river.m);

    const soft = (color: number, n: number, into: Mote[], additive = false) => {
      for (let i = 0; i < n; i += 1) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: blob, color, transparent: true, depthWrite: false, opacity: 0, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
        s.renderOrder = 6;
        into.push({ s, i });
        this.group.add(s);
      }
    };
    soft(0xffffff, Math.round(22 * quality), this.spray);
    soft(0xe4f4f8, Math.round(14 * quality), this.mist);

    // The rainbow: a card leaning like the trees, over the falls and the cliff beside them, by day.
    const bowW = 6.4;
    this.bow = new THREE.Mesh(new THREE.PlaneGeometry(bowW, bowW / 2).translate(0, bowW / 4, 0), new THREE.MeshBasicMaterial({ map: rainbow(), transparent: true, depthWrite: false, opacity: 0, side: THREE.DoubleSide }));
    this.bow.position.set(cx + 0.9, 0.1, this.foot.z + 0.7);
    this.bow.rotation.x = -TILT;
    this.bow.renderOrder = 5;
    this.group.add(this.bow);

    // Fish of the pool: a few fixed spots on its deep water, each jumping now and then.
    const spots: { x: number; z: number; h: number }[] = [];
    for (let z = z1 + 1; z < z1 + 7; z += 0.5)
      for (let x = x0 - 4; x < x1 + 8; x += 0.5) if (weightsAt(g, x, z)[2] > 0.97) spots.push({ x, z, h: hash2(Math.round(x * 2), Math.round(z * 2), 61) });
    spots.sort((a, b) => a.h - b.h);
    spots.slice(0, 6).forEach((p, i) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fish(), transparent: true, alphaTest: 0.3 }));
      s.visible = false;
      this.fish.push({ s, x: p.x, z: p.z, i, rose: -1, landed: -1 });
      this.group.add(s);
    });
  }

  /** Builds the falls at `site`; `kit`: the kit's waterfall picture's water column (a tiling texture), when the manifest has it. */
  static create(site: FallSite, g: Grid, light: { value: THREE.Color }, kit: THREE.Texture | null, blob: THREE.Texture, quality: number): Waterfall {
    return new Waterfall(site, g, light, kit, blob, quality);
  }

  /** The hour (the rainbow shows by day, half at dusk) and the water's light colour (the spray is unlit, so it takes it). */
  setMood(time: TimeOfDay, water: readonly [number, number, number]) {
    this.day = time === 'day' ? 1 : time === 'golden' ? 0.5 : 0;
    this.tint.setRGB(Math.min(1, 0.35 + water[0]), Math.min(1, 0.35 + water[1]), Math.min(1, 0.35 + water[2]));
    for (const m of [...this.spray, ...this.mist]) m.s.material.color.copy(this.tint);
  }

  /** Poses everything at time `t` (s). `motion` false: reduced motion, the falls stand still but whole. `at`: the party's feet. */
  update(t: number, at: THREE.Vector3, motion: boolean, ripple: (x: number, z: number, size: number) => void) {
    this.time.value = motion ? t : 3.7;
    (this.bow.material as THREE.MeshBasicMaterial).opacity = 0.25 * this.day;
    const { foot } = this;
    const away = (x: number, z: number) => smooth(1.4, 3.8, Math.hypot(x - at.x, z - at.z));
    for (const { s, i } of this.spray) {
      const r = (k: number) => hash2(i + 5, 17, k);
      const life = 1.3 + r(1) * 0.9;
      const f = motion ? ((t / life + r(2)) % 1) : r(2);
      const x = foot.x + (r(3) - 0.5) * 3.4 + (f - 0.4) * (r(4) - 0.5) * 1.2;
      const z = foot.z + 0.25 + f * (0.3 + r(5) * 0.9);
      s.position.set(x, foot.y + 0.1 + f * (0.7 + r(6) * 1.1), z);
      s.scale.setScalar(0.28 + f * 0.5 + r(7) * 0.2);
      s.material.opacity = (motion ? 0.5 : 0.3) * Math.sin(Math.PI * f) ** 0.7 * away(x, z);
    }
    for (const { s, i } of this.mist) {
      const r = (k: number) => hash2(i + 9, 23, k);
      const life = 6 + r(1) * 3;
      const f = motion ? ((t / life + r(2)) % 1) : r(2);
      const x = foot.x + (r(3) - 0.5) * 4.4 + Math.sin(t * 0.3 + r(4) * 6) * 0.3 * (motion ? 1 : 0);
      const z = foot.z + 0.6 + r(5) * 1.2;
      s.position.set(x, foot.y + 0.3 + f * 1.9, z);
      s.scale.setScalar(2 + r(6) * 1.4 + f * 0.6);
      s.material.opacity = 0.24 * Math.sin(Math.PI * f) * away(x, z);
    }
    for (const f of this.fish) {
      const period = 3 + f.i * 0.9;
      const k = ((t + f.i * 2.3) % period) / period;
      const cycle = Math.floor((t + f.i * 2.3) / period);
      const jumping = motion && k < 0.22;
      f.s.visible = jumping;
      if (!jumping) continue;
      const q = k / 0.22;
      // Rise, turn and dive on a parabola; a ring spreads where it leaves the water and where it lands.
      const dir = hash2(f.i, cycle, 71) < 0.5 ? -1 : 1;
      const x = f.x + (q - 0.5) * 0.9 * dir;
      f.s.position.set(x, -0.05 + 4 * q * (1 - q) * 0.95, f.z);
      f.s.scale.set(0.8 * dir, 0.38, 1);
      f.s.material.rotation = -dir * (0.5 - q) * 1.4;
      if (f.rose !== cycle) {
        f.rose = cycle;
        ripple(f.x - 0.45 * dir, f.z, 0.6);
      }
      if (q > 0.9 && f.landed !== cycle) {
        f.landed = cycle;
        ripple(f.x + 0.45 * dir, f.z, 0.6);
      }
    }
  }
}
