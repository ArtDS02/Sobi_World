// Parts of the lightning effects (decision 059): a storm cloud with a body (dark, billowing, lit from inside when it fires), a strike
// that re-draws its forked path every few frames while it lasts (the jitter is what makes lightning violent), and what a strike
// leaves where it lands: a glare, a ring of light tearing over the ground, sparks, crawling arcs, a scorch and a wisp of smoke.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, smooth } from './effectParts';
import { burst, h, rise, type Rgb } from './fxKit';
import { NOISE, UV_VERT } from './glsl';
import { forked, lines, type Lines } from './lines';
import { lightBlend, quads, type Quads } from './quads';

type U = Record<string, { value: number }>;
export const BOLT: Rgb = [1, 0.8, 0.16];
export const BOLT_HOT: Rgb = [1.6, 1.45, 0.9];

const CLOUD_FRAG = `
${NOISE}
varying vec2 vUv; uniform float uT, uFade, uFlash, uGrow;
void main(){
  vec2 p=(vUv-.5)*vec2(2.,2.);
  // A flat-bottomed heap of billows: the outline is an ellipse eaten by noise, taller in the middle.
  float n=fbm(vec2(p.x*2.2+uT*.25, p.y*2.6-uT*.12));
  float n2=fbm(vec2(p.x*5.+uT*.5, p.y*5.+7.));
  float shape=1.-length(vec2(p.x*.95, (p.y+.15)*1.7-.25*abs(p.x)));
  float d=shape*uGrow+(n-.5)*.75+(n2-.5)*.22;
  float body=smoothstep(.02,.16,d);
  // Three painted tones: a dark belly, a slate body, pale rolled tops.
  float lightUp=clamp(p.y*.9+.45+(n2-.5)*.9,0.,1.);
  vec3 col=mix(vec3(.13,.12,.24),vec3(.3,.31,.47),smoothstep(.25,.5,lightUp));
  col=mix(col,vec3(.62,.66,.82),smoothstep(.68,.86,lightUp)*smoothstep(.02,.3,d));
  // Fired from inside: the belly and the cracks between billows light up.
  float veins=smoothstep(.5,.2,abs(n-.5)*4.)*.6+smoothstep(.35,.0,d)*.5;
  col+=vec3(1.3,1.05,.45)*uFlash*(veins*.55+(1.-lightUp)*.22)*smoothstep(.75,-.2,p.y);
  gl_FragColor=vec4(col,body*uFade);
}`;
/** A storm cloud: a plane facing the camera. `set(sec, fade, flash, grow 0..1)`. */
export function stormCloud(root: THREE.Object3D, width: number, height: number) {
  const mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uFade: { value: 0 }, uFlash: { value: 0 }, uGrow: { value: 1 } }, vertexShader: UV_VERT, fragmentShader: CLOUD_FRAG, transparent: true, depthWrite: false, depthTest: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
  // Tilted back to face the stage's raised camera.
  mesh.rotation.x = -0.55;
  mesh.visible = false;
  mesh.renderOrder = 2;
  root.add(mesh);
  const u = mat.uniforms as U;
  return {
    mesh,
    set(sec: number, fade: number, flash: number, grow = 1) {
      mesh.visible = fade > 0.01;
      u.uT!.value = sec;
      u.uFade!.value = fade;
      u.uFlash!.value = flash;
      u.uGrow!.value = grow;
    },
  };
}

/** How bright a strike is `age` ms after it began (lasting `dur`): a blinding leader, then re-strikes that die away. */
export function strikeGain(age: number, dur: number): number {
  if (age < 0 || age >= dur) return 0;
  const k = age / dur;
  const beat = [1, 1, 0.5, 0.95, 0.35, 0.7, 0.3, 0.5][Math.min(7, Math.floor(k * 8))]!;
  return beat * (1 - k * k * 0.6);
}

/**
 * Writes one strike from `a` to `b` into `out` (from segment `n`; returns the next free one): its path changes every 45 ms, its
 * leader runs down in the first 40 ms. Nothing is written outside `t0 .. t0 + dur`.
 */
export function strike(out: Lines, n: number, a: THREE.Vector3, b: THREE.Vector3, ms: number, t0: number, dur: number, seed: number, width = 0.14, forks = 5, color: Rgb = BOLT): number {
  const age = ms - t0;
  const gain = strikeGain(age, dur);
  if (gain <= 0) return n;
  return forked(out, n, a, b, seed + Math.floor(age / 45) * 17, { width: width * (0.75 + 0.5 * gain), color, forks, reveal: clamp(age / 40 + 0.15), gain: gain * 1.5 });
}

const MARK_FRAG = `
${NOISE}
varying vec2 vUv; uniform float uFade, uHeat;
void main(){
  vec2 p=(vUv-.5)*2.; float r=length(p); float a=atan(p.y,p.x);
  float jag=fbm(vec2(a*3.,2.))*.35;
  float burn=1.-smoothstep(.35+jag,.75+jag,r);
  // Cracks of fire running out of the burn while it is hot.
  float rays=smoothstep(.75,.95,fbm(vec2(a*7.,r*2.5)))*smoothstep(.95,.3,r);
  vec3 col=mix(vec3(.07,.05,.07),vec3(1.4,.9,.25),uHeat*(rays+smoothstep(.5,.0,r)*.4));
  gl_FragColor=vec4(col,clamp(burn*.8+rays*uHeat,0.,1.)*uFade);
}`;
/** The scorch a strike leaves on the ground: call it with `(fade, heat 0..1)`. */
export function scorch(root: THREE.Object3D, at: THREE.Vector3, size: number) {
  const mat = new THREE.ShaderMaterial({ uniforms: { uFade: { value: 0 }, uHeat: { value: 0 } }, vertexShader: UV_VERT, fragmentShader: MARK_FRAG, transparent: true, depthWrite: false, depthTest: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size * 1.5, size), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(at.x, 0.02, at.z);
  mesh.visible = false;
  mesh.renderOrder = -1;
  root.add(mesh);
  const u = mat.uniforms as U;
  return (fade: number, heat: number) => {
    mesh.visible = fade > 0.01;
    u.uFade!.value = fade;
    u.uHeat!.value = heat;
  };
}

const SHOCK_FRAG = `
${NOISE}
varying vec2 vUv; uniform float uK, uFade; uniform vec3 uCol;
void main(){
  vec2 p=(vUv-.5)*2.; float r=length(p); float a=atan(p.y,p.x);
  float front=uK*.92;
  float w=.05+.1*uK;
  float ring=smoothstep(w,0.,abs(r-front))*(.6+.4*fbm(vec2(a*5.,uK*3.)));
  float fill=smoothstep(front,front-.5,r)*(1.-uK)*.35;
  gl_FragColor=vec4(uCol*(ring*2.2+fill),(ring+fill)*uFade*(1.-smoothstep(.9,1.,r)));
}`;
/** A ring of light racing out over the ground from a hit: call it with `(k 0..1, fade)`. */
export function shock(root: THREE.Object3D, at: THREE.Vector3, size: number, color: Rgb = BOLT) {
  const mat = new THREE.ShaderMaterial({ uniforms: { uK: { value: 0 }, uFade: { value: 0 }, uCol: { value: new THREE.Vector3(...color) } }, vertexShader: UV_VERT, fragmentShader: SHOCK_FRAG, transparent: true, depthWrite: false, depthTest: false });
  lightBlend(mat);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size * 1.4, size), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(at.x, 0.03, at.z);
  mesh.visible = false;
  root.add(mesh);
  const u = mat.uniforms as U;
  return (k: number, fade: number) => {
    mesh.visible = fade > 0.01 && k > 0;
    u.uK!.value = clamp(k);
    u.uFade!.value = fade;
  };
}

const TMP = new THREE.Vector3();
const A = new THREE.Vector3();
const B = new THREE.Vector3();
/**
 * What a strike does where it lands at `p` (`age` ms since it hit): a glare and a star, sparks thrown as streaks, embers, a puff of
 * smoke (`smoke`, paint) and arcs crawling over the ground (written into `out`). Uses `count` particles of `light` from `from`.
 */
export function landing(light: Quads, from: number, count: number, smoke: Quads, sFrom: number, sCount: number, out: Lines, n: number, p: THREE.Vector3, age: number, seed: number, power = 1): number {
  const sec = age / 1000;
  const at = TMP.set(p.x, 0.25, p.z);
  const sparks = Math.floor(count * 0.6);
  burst(light, from + 2, sparks, seed, { sec, at, life: 0.55, speed: 6.5 * power, up: 6 * power, grav: 14, drag: 2.2, size: 0.13, color: BOLT_HOT, to: [1, 0.5, 0.05], frame: F.streak, stretch: 0.05, alpha: 1 });
  burst(light, from + 2 + sparks, count - sparks - 2, seed + 1, { sec, at, life: 0.9, speed: 2.4 * power, up: 3.2 * power, grav: 3, drag: 1.5, size: 0.11, color: [1.4, 1.1, 0.4], to: [0.8, 0.3, 0.02], frame: F.ember, alpha: 0.9 });
  // The glare: a hot disc and a four-point star that snap open and die in a tenth of a second.
  const g = age >= 0 ? Math.exp(-age / 90) : 0;
  const big = Math.sqrt(power);
  light.put(from, p.x, 0.5, p.z, (1.2 + 1.5 * g) * big, 1.5, 1.3, 0.7, g * 0.85);
  light.look(from, F.soft);
  light.put(from + 1, p.x, 0.5, p.z, (2 + 2.2 * g) * big, 1.8, 1.7, 1.3, g * 0.9);
  light.look(from + 1, F.star, 0.4);
  rise(smoke, sFrom, sCount, seed + 2, { sec: sec - 0.08, dur: 0.25, life: 0.9, at: () => at, rise: 1.3, jitter: 0.5, size: 0.7 * power, color: [0.3, 0.29, 0.36], to: [0.16, 0.15, 0.2], frame: F.smoke, grow: 2, alpha: 0.5 });
  // Arcs crawling out over the ground for a moment after the hit.
  if (age > 20 && age < 420) {
    const step = Math.floor(age / 55);
    for (let k = 0; k < 4; k++) {
      const ang = h(k + step * 4, 0, seed) * 6.2832;
      const len = (0.5 + 0.9 * h(k + step * 4, 1, seed)) * power;
      n = forked(out, n, A.set(p.x, 0.06, p.z), B.set(p.x + Math.cos(ang) * len * 1.3, 0.05 + 0.25 * h(k, 2, seed + step), p.z + Math.sin(ang) * len * 0.6), seed * 13 + step * 7 + k, { width: 0.045, color: BOLT, forks: 1, jag: 0.3, gain: 1.1 * (1 - smooth(200, 420, age)) }, 1);
    }
  }
  return n;
}

export interface StormRig {
  bolts: Lines;
  light: Quads;
  /** Next free segment of `bolts`: effects write their strikes from here and move it on. */
  n: number;
  /** Starts a frame (no segment written yet). */
  begin(): void;
  /** Everything hit number `i` leaves at `p`, `age` ms after it landed (create the spots first with `spot`). */
  hit(i: number, age: number, power?: number): void;
  /** Declares hit `i` at ground point `p` (its scorch and ring are built once). */
  spot(i: number, p: THREE.Vector3, ringSize?: number): THREE.Vector3;
  /** Ends the frame: shows the segments written and uploads the particles. */
  end(): void;
  /** First free particle of `light` after the hits' own. */
  spare: number;
}
/** The shared furniture of a lightning effect with up to `hits` strikes: the bolt lines, the particles and each strike's ground marks. */
export function stormRig(root: THREE.Object3D, hits: number, quality: number, spare = 0): StormRig {
  const per = Math.max(24, Math.round(90 * quality));
  const bolts = lines(root, 400 + hits * 260);
  const light = quads(root, hits * per + spare, true);
  const smoke = quads(root, hits * 10, false, F.smoke);
  const spots: { p: THREE.Vector3; mark: ReturnType<typeof scorch>; ring: ReturnType<typeof shock> }[] = [];
  const rig: StormRig = {
    bolts,
    light,
    n: 0,
    spare: hits * per,
    begin() {
      rig.n = 0;
    },
    spot(i, p, ringSize = 3.4) {
      const g = p.clone().setY(0);
      spots[i] = { p: g, mark: scorch(root, g, 1.15), ring: shock(root, g, ringSize) };
      return g;
    },
    hit(i, age, power = 1) {
      const s = spots[i]!;
      rig.n = landing(light, i * per, per, smoke, i * 10, 10, bolts, rig.n, s.p, age, 20 + i, power);
      s.mark(age > 0 ? smooth(0, 40, age) * (1 - smooth(450, 800, age)) : 0, Math.exp(-Math.max(0, age) / 260));
      s.ring(age / 380, age > 0 ? 1 - smooth(200, 380, age) : 0);
    },
    end() {
      bolts.show(rig.n, 1);
      bolts.flush();
      light.flush();
      smoke.flush();
    },
  };
  return rig;
}
