// Parts of the metal effects (decision 059): polished metal painted as bands of reflection with a hard highlight (steel or
// bronze), a crescent cut that sweeps and thins away, the white spray of a clang, and a shield built of plates that can hold
// together, crack and fly apart. Metal is sharp and cold: clean edges, short flashes, no smoke.
import * as THREE from 'three';
import { F } from './atlas';
import { smooth } from './effectParts';
import { burst, h, type Rgb } from './fxKit';
import { UV_VERT } from './glsl';
import { lightBlend, type Quads } from './quads';

type U = Record<string, { value: number }>;
export const STEEL: Rgb = [0.62, 0.68, 0.78];
export const BRONZE: Rgb = [0.8, 0.55, 0.26];
export const SPARK: Rgb = [1.7, 1.6, 1.25];

const METAL_VERT = `varying vec3 vN; varying vec3 vP; void main(){ vN=normalize(normalMatrix*normal); vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const METAL_FRAG = `
varying vec3 vN; varying vec3 vP; uniform float uFade, uFlash, uSweep; uniform vec3 uTone;
void main(){
  vec3 n=normalize(vN);
  // Reflection painted as bands: a dark belly, the metal's own tone, a pale sky band, then a hard white highlight.
  float up=n.y*.6+n.x*.25+.62;
  vec3 col=mix(uTone*.32,uTone,smoothstep(.2,.42,up));
  col=mix(col,uTone*1.35+.12,smoothstep(.56,.68,up));
  col=mix(col,vec3(1.25),smoothstep(.8,.86,up));
  col=mix(col,uTone*.5,smoothstep(.9,.97,up)*.6);
  // A glint that travels over the piece.
  float g=smoothstep(.12,0.,abs(vP.x*.7+vP.y-uSweep));
  col+=vec3(1.4)*g*.8;
  col*=1.+uFlash;
  gl_FragColor=vec4(col,uFade);
}`;
/** Polished metal for a mesh: `set(fade, flash, sweep)`; `sweep` moves a glint across it (in the mesh's own units). */
export function metal(tone: Rgb = STEEL) {
  const mat = new THREE.ShaderMaterial({ uniforms: { uFade: { value: 1 }, uFlash: { value: 0 }, uSweep: { value: -9 }, uTone: { value: new THREE.Vector3(...tone) } }, vertexShader: METAL_VERT, fragmentShader: METAL_FRAG, transparent: true, side: THREE.DoubleSide });
  const u = mat.uniforms as U;
  return {
    mat,
    set(fade: number, flash = 0, sweep = -9) {
      u.uFade!.value = fade;
      u.uFlash!.value = flash;
      u.uSweep!.value = sweep;
      mat.visible = fade > 0.01;
    },
  };
}

const CUT_FRAG = `
varying vec2 vUv; uniform float uReveal, uFade, uIn, uBite; uniform vec3 uCol;
void main(){
  vec2 p=(vUv-.5)*2.;
  // A crescent: a disc with a second disc bitten out of it, fat in the middle of the stroke and sharp at both ends.
  float outer=1.-smoothstep(.96,1.,length(p));
  float inner=smoothstep(uIn,uIn+.04,length(p-vec2(-uBite,.0)));
  float shape=outer*inner*step(0.,p.x+.15);
  // It is drawn from one tip to the other; behind the head it thins and cools.
  float ang=atan(p.y,p.x)/1.5708*.5+.5;
  float head=smoothstep(uReveal+.02,uReveal-.03,ang);
  float tail=smoothstep(uReveal-1.1,uReveal-.1,ang);
  float edge=smoothstep(.88,.97,length(p));
  vec3 col=mix(uCol,vec3(1.6),edge*.85+.15);
  gl_FragColor=vec4(col,shape*head*tail*uFade);
}`;
export interface Cut {
  mesh: THREE.Mesh;
  /** `reveal` 0..1.6: how far the cut has been drawn (past 1 its tail fades away), `fade` 0..1. */
  set(reveal: number, fade: number): void;
}
/** A crescent cut of light, size 1 (scale and turn the mesh to place it; it faces +z). `thin`: a claw mark instead of a blade's sweep. */
export function cut(root: THREE.Object3D, color: Rgb = [0.75, 0.9, 1.3], thin = false): Cut {
  const mat = new THREE.ShaderMaterial({ uniforms: { uReveal: { value: 0 }, uFade: { value: 0 }, uIn: { value: thin ? 0.92 : 0.8 }, uBite: { value: thin ? 0.09 : 0.26 }, uCol: { value: new THREE.Vector3(...color) } }, vertexShader: UV_VERT, fragmentShader: CUT_FRAG, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
  lightBlend(mat);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.visible = false;
  mesh.renderOrder = 7;
  root.add(mesh);
  const u = mat.uniforms as U;
  return {
    mesh,
    set(reveal, fade) {
      mesh.visible = fade > 0.01 && reveal > 0;
      u.uReveal!.value = reveal;
      u.uFade!.value = fade;
    },
  };
}

const P = new THREE.Vector3();
/**
 * The spray of a clang at `at`, `sec` after it: white sparks thrown as streaks, a hard four-point glint and a few bits of metal
 * (`chips`, painted). `light` gives `count` particles from `from`; the first two are the glint.
 */
export function clang(light: Quads, from: number, count: number, chips: Quads | null, cFrom: number, cCount: number, seed: number, sec: number, at: THREE.Vector3, power = 1) {
  P.copy(at);
  burst(light, from + 2, count - 2, seed, { sec, at: P, life: 0.5, speed: 8.5 * power, up: 5.5 * power, grav: 13, drag: 2, size: 0.2, color: SPARK, to: [1.2, 0.7, 0.2], frame: F.streak, stretch: 0.06 });
  const g = sec >= 0 ? Math.exp(-sec / 0.07) : 0;
  light.put(from, at.x, at.y, at.z + 0.2, (1.1 + 2.6 * g) * Math.sqrt(power), 1.8, 1.8, 1.9, g);
  light.look(from, F.star, 0.4 + seed);
  light.put(from + 1, at.x, at.y, at.z + 0.2, (0.9 + 1.2 * g) * Math.sqrt(power), 0.9, 1.1, 1.5, g * 0.6);
  light.look(from + 1, F.soft);
  if (chips) burst(chips, cFrom, cCount, seed + 1, { sec, at: P, life: 0.8, speed: 3.6 * power, up: 4.4 * power, grav: 13, size: 0.16, color: [0.85, 0.9, 1], to: [0.45, 0.5, 0.6], frame: F.shard, shrink: 0.8 });
}

export interface Plates {
  g: THREE.Group;
  /** `apart` 0 = one whole shield, growing = the plates fly outward and tumble; `fade` 0..1. */
  set(apart: number, fade: number, flash?: number, sweep?: number): void;
}
/** A shield of `n` plates round a boss, about 2 wide and 2.3 tall, facing +z: kite-shaped, each plate a wedge of it. */
export function plates(tone: Rgb = STEEL, n = 8, seed = 1): Plates {
  const g = new THREE.Group();
  const m = metal(tone);
  const outline = (a: number, out: THREE.Vector2) => {
    // A heater shield: broad shoulders, a point at the bottom.
    const c = Math.cos(a);
    const s = Math.sin(a);
    const r = s > 0 ? 1 / Math.max(Math.abs(c), Math.abs(s) * 0.95 + 0.05) * 0.95 : 1.15 / (Math.abs(c) * 1.25 + Math.abs(s) * 0.82);
    return out.set(c * r, s * r);
  };
  const a2 = new THREE.Vector2();
  const b2 = new THREE.Vector2();
  const list = Array.from({ length: n }, (_, k) => {
    const a0 = (k / n) * 6.2832;
    const a1 = ((k + 1) / n) * 6.2832;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    for (let s = 0; s <= 4; s++) {
      outline(a0 + ((a1 - a0) * s) / 4, a2);
      shape.lineTo(a2.x, a2.y);
    }
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 });
    const mesh = new THREE.Mesh(geo, m.mat);
    g.add(mesh);
    outline((a0 + a1) / 2, b2);
    return { mesh, dx: b2.x, dy: b2.y, spin: (h(k, 0, seed) - 0.5) * 9, lift: 0.6 + h(k, 1, seed) };
  });
  const boss = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 8), m.mat);
  boss.position.z = 0.12;
  boss.scale.z = 0.6;
  g.add(boss);
  return {
    g,
    set(apart, fade, flash = 0, sweep = -9) {
      m.set(fade, flash, sweep);
      for (const p of list) {
        const t = Math.max(0, apart);
        // Thrown outward along its own wedge, then falling.
        p.mesh.position.set(p.dx * t * 2.4, p.dy * t * 2.4 + p.lift * t * 1.8 - 3.2 * t * t, t * 0.6);
        p.mesh.rotation.set(t * p.spin, t * p.spin * 0.7, t * p.spin * 0.5);
      }
      boss.visible = apart <= 0.02;
      g.visible = fade > 0.01;
    },
  };
}

/** A soft pulse 0..1..0 centred on `t0` with half width `w` (ms). */
export const bump = (ms: number, t0: number, w: number) => smooth(t0 - w, t0, ms) * (1 - smooth(t0, t0 + w, ms));
