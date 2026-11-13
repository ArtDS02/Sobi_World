// Parts of the nature effects (decision 059): a living stem (vine, root, whip: a ribbon that always faces the camera, shaded as if
// round, whose path is given anew every frame so it can grow, lash and coil), leaves and petals thrown about, a flower that opens,
// and a hanging cloud of spores. Painted in a few flat greens; nothing here glows except pollen.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, smooth } from './effectParts';
import { burst, h, rise, type Rgb } from './fxKit';
import type { Quads } from './quads';

export const LEAF: Rgb = [0.36, 0.76, 0.3];
export const LEAF_PALE: Rgb = [0.72, 0.95, 0.45];
export const BARK: Rgb = [0.42, 0.27, 0.14];
export const POISON: Rgb = [0.62, 0.3, 0.82];
export const SAP: Rgb = [0.6, 0.9, 0.25];

const STEM_VERT = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const STEM_FRAG = `
varying vec2 vUv; uniform float uFade, uGrow, uRings; uniform vec3 uDark, uLight;
void main(){
  if(vUv.x>uGrow) discard;
  float a=vUv.y;
  // Shaded as a round stalk lit from above: a dark underside, a body tone, a pale stripe along the top.
  float n=sqrt(max(0.,1.-a*a));
  float l=n*.55+a*.45;
  vec3 col=mix(uDark,uLight,smoothstep(-.1,.35,l));
  col=mix(col,uLight*1.35,smoothstep(.62,.8,l));
  // Joints: a darker ring every so often along the stem.
  float ring=smoothstep(.42,.5,abs(fract(vUv.x*uRings)-.5));
  col*=1.-.28*ring;
  gl_FragColor=vec4(col,smoothstep(1.,.86,abs(a))*uFade);
}`;

export interface Stem {
  mesh: THREE.Mesh;
  /**
   * Lays the stem along `path(u)` (u 0..1 from root to tip), `width(u)` its half width there; only the part up to `grow` is drawn
   * and it tapers to a point at its growing end.
   */
  set(path: (u: number, out: THREE.Vector3) => THREE.Vector3, width: (u: number) => number, grow: number, fade: number): void;
}
/** The stage's camera looks down this way (fixed): a ribbon is laid flat across it. */
const VIEW = new THREE.Vector3(0, 23.7, 36.4).normalize();

/** A stem of `n` joints in two tones (`dark` underside, `light` top), with `rings` joints painted along it. */
export function stem(root: THREE.Object3D, n: number, dark: Rgb, light: Rgb, rings = 9): Stem {
  const geo = new THREE.BufferGeometry();
  const pos = new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3);
  pos.setUsage(THREE.DynamicDrawUsage);
  const uv = new Float32Array(n * 2 * 2);
  const idx: number[] = [];
  for (let i = 0; i < n; i++) {
    uv.set([i / (n - 1), -1, i / (n - 1), 1], i * 4);
    if (i < n - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  geo.setAttribute('position', pos);
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const mat = new THREE.ShaderMaterial({ uniforms: { uFade: { value: 0 }, uGrow: { value: 0 }, uRings: { value: rings }, uDark: { value: new THREE.Vector3(...dark) }, uLight: { value: new THREE.Vector3(...light) } }, vertexShader: STEM_VERT, fragmentShader: STEM_FRAG, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.visible = false;
  mesh.renderOrder = 5;
  root.add(mesh);
  const pts = Array.from({ length: n }, () => new THREE.Vector3());
  const tan = new THREE.Vector3();
  const side = new THREE.Vector3();
  return {
    mesh,
    set(path, width, grow, fade) {
      mesh.visible = fade > 0.01 && grow > 0.01;
      if (!mesh.visible) return;
      for (let i = 0; i < n; i++) path(i / (n - 1), pts[i]!);
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1);
        tan.subVectors(pts[Math.min(n - 1, i + 1)]!, pts[Math.max(0, i - 1)]!);
        side.crossVectors(tan, VIEW);
        if (side.lengthSq() < 1e-8) side.set(1, 0, 0);
        side.normalize().multiplyScalar(width(u) * clamp((grow - u) / 0.14));
        const p = pts[i]!;
        pos.setXYZ(i * 2, p.x - side.x, p.y - side.y, p.z - side.z);
        pos.setXYZ(i * 2 + 1, p.x + side.x, p.y + side.y, p.z + side.z);
      }
      pos.needsUpdate = true;
      mat.uniforms.uGrow!.value = grow;
      mat.uniforms.uFade!.value = fade;
    },
  };
}

const P = new THREE.Vector3();
/** Leaves torn loose at `at`, `sec` after it happened: they fly out, tumble and sink. Uses `count` particles of the painted set `q`. */
export function leafBurst(q: Quads, from: number, count: number, seed: number, sec: number, at: THREE.Vector3, power = 1, color: Rgb = LEAF, to: Rgb = LEAF_PALE) {
  P.copy(at);
  burst(q, from, count, seed, { sec, at: P, life: 1.1, speed: 3.6 * power, up: 3.8 * power, grav: 5, drag: 2.2, size: 0.22, color, to, frame: F.leaf, alpha: 0.95, shrink: 0.7 });
}

/** A cloud that hangs and rolls round `at` from `sec` 0 for `dur` seconds (spores, poison): painted puffs, a few bright motes in `light`. */
export function hangCloud(q: Quads, from: number, count: number, light: Quads | null, lFrom: number, lCount: number, seed: number, sec: number, dur: number, at: THREE.Vector3, radius: number, color: Rgb, mote: Rgb = SAP) {
  for (let k = 0; k < count; k++) {
    const i = from + k;
    const t = sec - h(k, 0, seed) * 0.25;
    if (t <= 0 || t >= dur) {
      q.hide(i);
      continue;
    }
    const l = t / dur;
    const a = h(k, 1, seed) * 6.2832 + t * (0.8 + h(k, 2, seed)) * (k % 2 ? 1 : -1);
    const r = radius * (0.25 + 0.75 * h(k, 3, seed)) * smooth(0, 0.25, l);
    const c = 0.8 + 0.3 * h(k, 4, seed);
    q.put(i, at.x + Math.cos(a) * r, at.y + (h(k, 5, seed) - 0.4) * radius * 0.9 + 0.25 * l, at.z + Math.sin(a) * r * 0.5, radius * (0.5 + 0.6 * h(k, 6, seed)) * (0.7 + 0.5 * l), color[0] * c, color[1] * c, color[2] * c, 0.42 * smooth(0, 0.15, l) * (1 - smooth(0.6, 1, l)));
    q.look(i, F.smoke, a);
  }
  if (light) rise(light, lFrom, lCount, seed + 7, { sec, dur: dur * 0.8, life: 0.6, at: (_b, k) => P.set(at.x + (h(k, 8, seed) - 0.5) * radius * 1.8, at.y + (h(k, 9, seed) - 0.5) * radius, at.z), rise: 0.5, jitter: 0.2, size: 0.1, color: [mote[0] * 1.6, mote[1] * 1.6, mote[2] * 1.6], frame: F.soft, grow: 0.4, sway: 0.2 });
}

/**
 * A flower facing the viewer at `at`: `petals` petals of world length `size` opening as `open` goes 0 → 1, a heart in the middle.
 * Uses `petals + 1` particles of the painted set `q` from `from`.
 */
export function flower(q: Quads, from: number, petals: number, at: THREE.Vector3, size: number, open: number, spin: number, color: Rgb, heart: Rgb, alpha = 1) {
  for (let k = 0; k < petals; k++) {
    const a = (k / petals) * 6.2832 + spin;
    // Closed: the petals stand together pointing up; open: they fan out all round.
    const dirA = Math.PI / 2 + (a - Math.PI / 2) * open;
    const reach = size * (0.18 + 0.36 * open);
    const shade = 0.82 + 0.18 * Math.cos(k * 2.4);
    q.put(from + k, at.x + Math.cos(dirA) * reach, at.y + Math.sin(dirA) * reach * 0.9, at.z, size * (0.55 + 0.45 * open), color[0] * shade, color[1] * shade, color[2] * shade, alpha);
    q.look(from + k, F.petal, dirA, 0.62);
  }
  q.put(from + petals, at.x, at.y, at.z + 0.02, size * 0.42 * (0.4 + 0.6 * open), heart[0], heart[1], heart[2], alpha);
  q.look(from + petals, F.disc);
}
