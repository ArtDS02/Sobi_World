// Parts of the support effects (decision 059): the signs a boon is read by — a plus that floats up (healing), a chevron that
// climbs (a stat raised, in the stat's colour), a dome of hexagon cells (a shield), a soft column of light standing on someone,
// and a ring stamped on the ground. Support is light, warm and rising: nothing here shakes or smokes, and it never covers the
// one it helps for long. Colours of the stats follow SKILL_DESCRIPTION_STANDARD §4.
import * as THREE from 'three';
import { F } from './atlas';
import { h, type Rgb } from './fxKit';
import { NOISE, UV_VERT } from './glsl';
import type { Quads } from './quads';
import { smooth } from './effectParts';

export const HEAL: Rgb = [0.6, 1.35, 0.55];
export const ATK: Rgb = [1.5, 0.62, 0.3];
export const DEF: Rgb = [0.75, 0.95, 1.5];
export const MATK: Rgb = [1.1, 0.55, 1.5];
export const ACC: Rgb = [1.5, 1.4, 0.8];
export const EVA: Rgb = [0.5, 1.4, 1.2];
export const SPD: Rgb = [1.5, 1.3, 0.4];
export const MP: Rgb = [0.55, 0.9, 1.6];
export const rgbOf = (hex: number | null, d: Rgb): Rgb => (hex === null ? d : [((hex >> 16) & 255) / 200, ((hex >> 8) & 255) / 200, (hex & 255) / 200]);

/** A plus at a point: two bars (particles `i`, `i + 1` of `q`). */
export function plus(q: Quads, i: number, x: number, y: number, z: number, s: number, c: Rgb, a: number) {
  q.put(i, x, y, z, s, c[0], c[1], c[2], a);
  q.look(i, F.disc, 0, 0.3);
  q.put(i + 1, x, y, z, s, c[0], c[1], c[2], a);
  q.look(i + 1, F.disc, Math.PI / 2, 0.3);
}
/** A chevron pointing up (particles `i`, `i + 1`). */
export function chevron(q: Quads, i: number, x: number, y: number, z: number, s: number, c: Rgb, a: number) {
  const d = s * 0.27;
  q.put(i, x - d, y, z, s, c[0], c[1], c[2], a);
  q.look(i, F.disc, 0.8, 0.26);
  q.put(i + 1, x + d, y, z, s, c[0], c[1], c[2], a);
  q.look(i + 1, F.disc, -0.8, 0.26);
}
/**
 * `count` signs (each two particles) floating up over a unit standing at `feet`, born over `dur` s, each living `life` s:
 * `kind` 'plus' for healing, 'up' for a raised stat. Uses `2 × count` particles of `q` from `from`.
 */
export function signsUp(q: Quads, from: number, count: number, seed: number, sec: number, feet: THREE.Vector3, tall: number, color: Rgb, kind: 'plus' | 'up', dur = 0.5, life = 0.9, size = 0.26) {
  for (let k = 0; k < count; k++) {
    const i = from + k * 2;
    const t = sec - h(k, 0, seed) * dur;
    if (t <= 0 || t >= life) {
      q.hide(i);
      q.hide(i + 1);
      continue;
    }
    const l = t / life;
    const x = feet.x + (h(k, 1, seed) - 0.5) * (0.6 + tall * 0.5);
    const y = tall * (0.15 + 0.5 * h(k, 2, seed)) + l * tall * 0.7;
    const a = smooth(0, 0.15, l) * (1 - smooth(0.6, 1, l));
    const s = size * (0.7 + 0.5 * h(k, 3, seed)) * (kind === 'up' ? 1.2 : 1);
    (kind === 'plus' ? plus : chevron)(q, i, x, y, feet.z + 0.25, s, color, a);
  }
}

const DOME_FRAG = `
${NOISE}
varying vec2 vUv; uniform float uFade, uT, uGrow, uHit; uniform vec3 uCol;
void main(){
  vec2 p=(vUv-.5)*2.; float r=length(p);
  // A dome seen from the front: a disc whose rim is brightest, filled with a lattice of hexagon cells that light up in passing.
  vec2 q=p*vec2(5.,5.77); q.x+=mod(floor(q.y),2.)*.5;
  vec2 f=fract(q)-.5; float cell=max(abs(f.x)*1.,abs(f.y)*.87+abs(f.x)*.5);
  float edge=smoothstep(.42,.5,cell);
  float flick=step(.7,hash21(floor(q)+floor(uT*6.)))*.6;
  float inside=smoothstep(uGrow,uGrow-.03,r);
  float rim=smoothstep(.12,0.,abs(r-uGrow+.02))*step(.01,uGrow);
  float a=inside*(.1+.32*edge+.18*flick*edge+.25*uHit)+rim*.9;
  gl_FragColor=vec4(uCol*(1.+rim*.6+uHit*.5),clamp(a,0.,1.)*uFade);
}`;
/** A dome of hexagon cells (a plane facing +z): `set(grow 0..1, fade, sec, hit 0..1)`; give it the colour once. */
export function dome(root: THREE.Object3D, color: Rgb) {
  const mat = new THREE.ShaderMaterial({ uniforms: { uFade: { value: 0 }, uT: { value: 0 }, uGrow: { value: 0 }, uHit: { value: 0 }, uCol: { value: new THREE.Vector3(...color) } }, vertexShader: UV_VERT, fragmentShader: DOME_FRAG, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.visible = false;
  mesh.renderOrder = 5;
  root.add(mesh);
  const u = mat.uniforms as Record<string, { value: number }>;
  return {
    mesh,
    set(grow: number, fade: number, sec: number, hit = 0) {
      mesh.visible = fade > 0.01 && grow > 0.02;
      u.uGrow!.value = grow;
      u.uFade!.value = fade;
      u.uT!.value = sec;
      u.uHit!.value = hit;
    },
  };
}

const PILLAR_FRAG = `
${NOISE}
varying vec2 vUv; uniform float uFade, uT; uniform vec3 uCol;
void main(){
  // A column of light: soft at the sides, brightest at its foot, fading upward, with streaks running up it.
  float x=abs(vUv.x-.5)*2.;
  float side=smoothstep(1.,.2,x);
  float up=pow(1.-vUv.y,1.4);
  float streak=smoothstep(.55,.9,vnoise(vec2(vUv.x*14.,vUv.y*3.-uT*2.5)));
  gl_FragColor=vec4(uCol*(1.+streak*.8),side*up*(.45+.4*streak)*uFade);
}`;
/** A soft column of light standing on its mesh's position (foot at the origin, 1 wide, 1 tall): `set(fade, sec)`. */
export function pillar(root: THREE.Object3D, color: Rgb) {
  const mat = new THREE.ShaderMaterial({ uniforms: { uFade: { value: 0 }, uT: { value: 0 }, uCol: { value: new THREE.Vector3(...color) } }, vertexShader: UV_VERT, fragmentShader: PILLAR_FRAG, transparent: true, depthWrite: false, depthTest: false });
  mat.blending = THREE.AdditiveBlending;
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.translate(0, 0.5, 0);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.visible = false;
  mesh.renderOrder = 4;
  root.add(mesh);
  const u = mat.uniforms as Record<string, { value: number }>;
  return {
    mesh,
    set(fade: number, sec: number) {
      mesh.visible = fade > 0.01;
      u.uFade!.value = fade;
      u.uT!.value = sec;
    },
  };
}

const SIGIL_FRAG = `
varying vec2 vUv; uniform float uFade, uT, uDraw, uMarks; uniform vec3 uCol;
void main(){
  vec2 p=(vUv-.5)*2.; float r=length(p); float a=atan(p.y,p.x);
  // Two rings drawn round as uDraw goes 0 → 1, a band of ticks between them that turns, a star of thin spokes.
  float drawn=step(fract((a/6.2832)+.25),uDraw);
  float rings=(smoothstep(.04,0.,abs(r-.92))+smoothstep(.03,0.,abs(r-.7)))*drawn;
  float ticks=step(.5,fract((a+uT)*uMarks/6.2832))*smoothstep(.05,0.,abs(r-.81))*step(.2,uDraw);
  float spokes=smoothstep(.03,0.,abs(sin(a*3.+uT*.5))*r)*step(r,.7)*step(.15,r)*smoothstep(.5,1.,uDraw);
  float v=clamp(rings+ticks*.8+spokes*.6,0.,1.);
  gl_FragColor=vec4(uCol*(1.+v*.4),v*uFade);
}`;
/** A ring sigil (a plane facing +z; lay it flat for the ground): `set(draw 0..1, fade, sec)`; `marks` ticks round it. */
export function sigil(root: THREE.Object3D, color: Rgb, marks = 24) {
  const mat = new THREE.ShaderMaterial({ uniforms: { uFade: { value: 0 }, uT: { value: 0 }, uDraw: { value: 0 }, uMarks: { value: marks }, uCol: { value: new THREE.Vector3(...color) } }, vertexShader: UV_VERT, fragmentShader: SIGIL_FRAG, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
  mat.blending = THREE.AdditiveBlending;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.visible = false;
  mesh.renderOrder = 4;
  root.add(mesh);
  const u = mat.uniforms as Record<string, { value: number }>;
  return {
    mesh,
    set(draw: number, fade: number, sec: number) {
      mesh.visible = fade > 0.01 && draw > 0.01;
      u.uDraw!.value = draw;
      u.uFade!.value = fade;
      u.uT!.value = sec;
    },
  };
}
