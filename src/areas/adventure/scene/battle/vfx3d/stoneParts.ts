// Parts of the earth effects (decision 059): faceted stone painted in three flat tones (lit from above, a speckle of grit), lumpy
// boulders and crooked spikes whose shapes come from a seed, cracks that run out over the ground, thrown chips and rolling dust.
// Earth is heavy and matt: nothing here glows except the light inside a crack when an effect asks for it.
import * as THREE from 'three';
import { F } from './atlas';
import { clamp, rng } from './effectParts';
import { burst, h, rise, type Rgb } from './fxKit';
import { NOISE, UV_VERT } from './glsl';
import type { Quads } from './quads';

type U = Record<string, { value: number }>;
export const STONE: Rgb = [0.62, 0.5, 0.36];
export const STONE_DARK: Rgb = [0.3, 0.22, 0.15];
export const DUST: Rgb = [0.72, 0.62, 0.47];

const ROCK_VERT = `varying vec3 vV; varying vec3 vP; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vV=mv.xyz; vP=position; gl_Position=projectionMatrix*mv; }`;
const ROCK_FRAG = `
${NOISE}
varying vec3 vV; varying vec3 vP; uniform float uFade, uGlow; uniform vec3 uDark, uMid, uLight, uGlowCol;
void main(){
  // One flat normal per face (the facets are the look).
  vec3 n=normalize(cross(dFdx(vV),dFdy(vV)));
  float l=dot(n,normalize(vec3(.3,.75,.6)));
  vec3 col=mix(uDark,uMid,smoothstep(-.05,.2,l));
  col=mix(col,uLight,smoothstep(.55,.7,l));
  col*=.9+.2*vnoise3(vP*7.);
  // Veins of light in the stone when it is charged.
  float vein=smoothstep(.46,.5,fbm3(vP*2.2))*(1.-smoothstep(.5,.56,fbm3(vP*2.2)));
  col+=uGlowCol*vein*uGlow*2.2;
  gl_FragColor=vec4(col,uFade);
}`;
/** Stone for a mesh: `set(fade, glow)`; `glow` lights veins in the colour `glowCol`. */
export function rock(mid: Rgb = STONE, glowCol: Rgb = [1.2, 0.85, 0.3]) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uFade: { value: 1 }, uGlow: { value: 0 }, uDark: { value: new THREE.Vector3(mid[0] * 0.45, mid[1] * 0.42, mid[2] * 0.45) }, uMid: { value: new THREE.Vector3(...mid) }, uLight: { value: new THREE.Vector3(mid[0] * 1.35, mid[1] * 1.38, mid[2] * 1.4) }, uGlowCol: { value: new THREE.Vector3(...glowCol) } },
    vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG, transparent: true,
  });
  const u = mat.uniforms as U;
  return {
    mat,
    set(fade: number, glow = 0) {
      u.uFade!.value = fade;
      u.uGlow!.value = glow;
      mat.visible = fade > 0.01;
    },
  };
}

/** Pushes every vertex of `geo` in or out a little (the same for vertices that share a place), so a ball becomes a boulder. */
function lump(geo: THREE.BufferGeometry, seed: number, amount: number): THREE.BufferGeometry {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const moved = new Map<string, number>();
  const rand = rng(seed);
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    let k = moved.get(key);
    if (k === undefined) {
      k = 1 + (rand() - 0.5) * 2 * amount;
      moved.set(key, k);
    }
    pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k);
  }
  return geo;
}
/** A boulder of radius about 1. */
export const boulder = (seed: number, detail = 1) => lump(new THREE.IcosahedronGeometry(1, detail), seed, 0.2);
/** A crooked spike of height 1 standing on its base at the origin, `sides` faces round. */
export function spike(seed: number, sides = 5): THREE.BufferGeometry {
  const g = new THREE.ConeGeometry(0.34, 1, sides, 3);
  g.translate(0, 0.5, 0);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const rand = rng(seed);
  const bend = (rand() - 0.5) * 0.3;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    pos.setX(i, pos.getX(i) * (1 + 0.25 * Math.sin(y * 9 + seed)) + bend * y * y);
  }
  return g;
}

const CRACK_FRAG = `
${NOISE}
varying vec2 vUv; uniform float uGrow, uFade, uGlow, uSeed; uniform vec3 uGlowCol;
void main(){
  vec2 p=(vUv-.5)*2.; float r=length(p); float a=atan(p.y,p.x);
  // Fissures: thin wandering rays from the middle, forking as they go, with a broken hollow at the centre.
  float wander=fbm(vec2(a*2.+uSeed,r*2.5))*1.6;
  float rays=abs(fract((a+wander)*1.2732+uSeed)-.5);
  float width=.05*(1.-r*.75)+.012;
  float line=smoothstep(width,width*.35,rays)*step(r,uGrow*(.75+.25*fbm(vec2(a*5.,uSeed))));
  float pit=smoothstep(.2,.08,r)*smoothstep(0.,.3,uGrow);
  float m=clamp(line+pit,0.,1.);
  vec3 col=mix(vec3(.1,.07,.05),uGlowCol,uGlow*(.5+.5*line));
  // A lighter lip of broken ground beside each fissure.
  float lip=smoothstep(width*3.,width,rays)*(1.-line)*step(r,uGrow*.9)*.35;
  gl_FragColor=vec4(mix(col,vec3(.55,.45,.33),lip/(m+lip+1e-4)),(m*.92+lip)*uFade*(1.-smoothstep(.9,1.,r)));
}`;
/** Cracks running out over the ground from a point: call it with `(grow 0..1, fade, glow 0..1)`. */
export function cracks(root: THREE.Object3D, at: THREE.Vector3, size: number, seed = 0, glowCol: Rgb = [1.3, 0.9, 0.3]) {
  const mat = new THREE.ShaderMaterial({ uniforms: { uGrow: { value: 0 }, uFade: { value: 0 }, uGlow: { value: 0 }, uSeed: { value: seed * 1.37 }, uGlowCol: { value: new THREE.Vector3(...glowCol) } }, vertexShader: UV_VERT, fragmentShader: CRACK_FRAG, transparent: true, depthWrite: false, depthTest: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size * 1.45, size), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(at.x, 0.02, at.z);
  mesh.visible = false;
  mesh.renderOrder = -1;
  root.add(mesh);
  const u = mat.uniforms as U;
  return (grow: number, fade: number, glow = 0) => {
    mesh.visible = fade > 0.01 && grow > 0.01;
    u.uGrow!.value = grow;
    u.uFade!.value = fade;
    u.uGlow!.value = glow;
  };
}

const P = new THREE.Vector3();
/**
 * What breaking ground throws up at `at`, `sec` after the blow: chips of stone flung out and a bank of dust rolling up. `chips` and
 * `dust` are painted sets; each use is given a range of them.
 */
export function rubble(chips: Quads, cFrom: number, cCount: number, dust: Quads, dFrom: number, dCount: number, seed: number, sec: number, at: THREE.Vector3, power = 1) {
  P.set(at.x, Math.max(0.12, at.y), at.z);
  burst(chips, cFrom, cCount, seed, { sec, at: P, life: 0.95, speed: 4.2 * power, up: 6 * power, grav: 14, drag: 1, size: 0.2 * Math.sqrt(power), color: STONE, to: STONE_DARK, frame: F.shard, shrink: 0.8 });
  rise(dust, dFrom, dCount, seed + 3, { sec, dur: 0.18, life: 1.0, at: (_b, k) => P.set(at.x + ((k * 0.618) % 1 - 0.5) * 1.6 * power, 0.2 + ((k * 0.37) % 1) * 0.4, at.z), rise: 0.7, jitter: 0.5, size: 0.85 * Math.sqrt(power), color: DUST, to: [0.5, 0.44, 0.36], frame: F.smoke, grow: 2, alpha: 0.42 });
}

/** A clump of `n` spikes at `at`: call it with `(up 0..1+, fade, glow)`. */
export function spikeClump(root: THREE.Object3D, mat: THREE.Material, at: THREE.Vector3, n: number, height: number, seed: number) {
  const list = Array.from({ length: n }, (_, k) => {
    const m = new THREE.Mesh(spike(seed + k), mat);
    const a = (k / n) * 6.2832 + h(k, 0, seed) * 0.8;
    const r = k === 0 ? 0 : 0.42 + 0.2 * h(k, 1, seed);
    m.position.set(at.x + Math.cos(a) * r, 0, at.z + Math.sin(a) * r * 0.55);
    m.rotation.set(Math.sin(a) * 0.3 * (k ? 1 : 0), h(k, 2, seed) * 6, -Math.cos(a) * 0.38 * (k ? 1 : 0));
    root.add(m);
    return { m, tall: height * (k === 0 ? 1 : 0.5 + 0.35 * h(k, 3, seed)), wide: 0.75 + 0.5 * h(k, 4, seed), late: k * 0.07 };
  });
  return (up: number) => {
    for (const s of list) {
      const k = clamp((up - s.late) / (1 - s.late * 0.5));
      s.m.visible = k > 0.001;
      s.m.scale.set(s.wide, Math.max(0.001, s.tall * k), s.wide);
    }
  };
}
