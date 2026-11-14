// Parts of the light effects (decision 059): a ray between two points (a white heart, a golden body with fine streaks running
// along it, a warm wash painted under it so it reads on a bright sky), a halo with sun rays, a ring of rune marks, and the gentle
// motes light leaves behind. Light is clean, warm and straight: it opens and fades smoothly, nothing here shakes or smokes.
import * as THREE from 'three';
import { F } from './atlas';
import { burst, h, rise, type Rgb } from './fxKit';
import { UV_VERT } from './glsl';
import { lightBlend, type Quads } from './quads';

type U = Record<string, { value: number }>;
export const GOLD: Rgb = [1.5, 1.2, 0.5];
export const SUN: Rgb = [1.8, 1.7, 1.3];
export const WARM: Rgb = [1, 0.86, 0.45];
/** The stage's camera looks down this way (fixed): a ray is laid flat across it. */
const VIEW = new THREE.Vector3(0, 23.7, 36.4).normalize();

const RAY_FRAG = `
varying vec2 vUv; uniform float uHead, uTail, uT, uFade, uLen, uPaint; uniform vec3 uCol;
void main(){
  float a=abs(vUv.y-.5)*2.;
  float along=step(vUv.x,uHead)*smoothstep(uTail-.01,uTail+.06,vUv.x);
  // Fine streaks run down the ray; its head is the brightest part.
  float streak=.72+.28*sin(vUv.x*uLen*7.-uT*42.+sin(vUv.y*17.)*2.2);
  float tip=smoothstep(uHead-.08,uHead,vUv.x);
  if(uPaint>.5){ gl_FragColor=vec4(uCol,pow(1.-a,1.5)*.34*along*uFade); return; }
  float core=smoothstep(.36,.04,a);
  float glow=pow(1.-a,2.2);
  vec3 col=uCol*glow*streak*1.15+vec3(1.55,1.5,1.4)*core*(1.+.8*tip);
  gl_FragColor=vec4(col,along*uFade*clamp(glow*1.4,0.,1.));
}`;
export interface Ray {
  /**
   * Lays the ray from `a` to `b` with half width `width`; `head` 0..1 is how far it has reached, `tail` 0..1 how much of its start
   * has already gone, `sec` drives its streaks.
   */
  set(a: THREE.Vector3, b: THREE.Vector3, width: number, head: number, tail: number, sec: number, fade: number): void;
}
/** A ray of light in the colour `color` (the wash under it is `wash`). */
export function ray(root: THREE.Object3D, color: Rgb = GOLD, wash: Rgb = WARM): Ray {
  const mk = (paint: boolean) => {
    const mat = new THREE.ShaderMaterial({ uniforms: { uHead: { value: 0 }, uTail: { value: 0 }, uT: { value: 0 }, uFade: { value: 0 }, uLen: { value: 1 }, uPaint: { value: paint ? 1 : 0 }, uCol: { value: new THREE.Vector3(...(paint ? wash : color)) } }, vertexShader: UV_VERT, fragmentShader: RAY_FRAG, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
    if (!paint) lightBlend(mat);
    const geo = new THREE.PlaneGeometry(1, 1);
    (geo.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.visible = false;
    mesh.renderOrder = paint ? 5 : 7;
    root.add(mesh);
    return { mesh, mat, pos: geo.attributes.position as THREE.BufferAttribute };
  };
  const parts = [mk(true), mk(false)];
  const side = new THREE.Vector3();
  const dir = new THREE.Vector3();
  return {
    set(a, b, width, head, tail, sec, fade) {
      dir.subVectors(b, a);
      side.crossVectors(dir, VIEW);
      if (side.lengthSq() < 1e-8) side.set(0, 1, 0);
      side.normalize();
      parts.forEach((p, i) => {
        const w = width * (i === 0 ? 1.7 : 1);
        // PlaneGeometry's corners: (0,1) (1,1) (0,0) (1,0) in uv.
        p.pos.setXYZ(0, a.x + side.x * w, a.y + side.y * w, a.z + side.z * w);
        p.pos.setXYZ(1, b.x + side.x * w, b.y + side.y * w, b.z + side.z * w);
        p.pos.setXYZ(2, a.x - side.x * w, a.y - side.y * w, a.z - side.z * w);
        p.pos.setXYZ(3, b.x - side.x * w, b.y - side.y * w, b.z - side.z * w);
        p.pos.needsUpdate = true;
        const u = p.mat.uniforms as U;
        u.uHead!.value = head;
        u.uTail!.value = tail;
        u.uT!.value = sec;
        u.uFade!.value = fade;
        u.uLen!.value = dir.length() / Math.max(0.05, width);
        p.mesh.visible = fade > 0.01 && head > tail;
      });
    },
  };
}

const HALO_FRAG = `
varying vec2 vUv; uniform float uT, uFade, uRays, uRune; uniform vec3 uCol;
void main(){
  vec2 p=(vUv-.5)*2.; float r=length(p); float a=atan(p.y,p.x);
  // Thin rings, and between them either sun rays or a band of rune marks.
  float rings=smoothstep(.022,0.,abs(r-.62))+smoothstep(.014,0.,abs(r-.5))*.7+smoothstep(.016,0.,abs(r-.9))*.8;
  float rays=pow(.5+.5*cos((a+uT*.5)*12.),6.)*smoothstep(.62,.66,r)*smoothstep(1.,.7,r)*uRays;
  float fine=pow(.5+.5*cos((a-uT*.3)*30.),10.)*smoothstep(.62,.66,r)*smoothstep(.86,.7,r)*.5*uRays;
  // Rune marks: a turning band of cells, each a different stroke pattern.
  float cell=floor((a+uT*.8)*2.546); float inCell=fract((a+uT*.8)*2.546);
  float kind=fract(sin(cell*91.7)*43758.5);
  float rr=(r-.66)/.2;
  float stroke=smoothstep(.09,.04,abs(inCell-.5))*step(.1,rr)*step(rr,.9)*step(.3,kind)
    +smoothstep(.07,.03,abs(rr-.5+ (inCell-.5)*(kind-.5)*1.6))*step(.2,inCell)*step(inCell,.8)
    +smoothstep(.07,.03,abs(rr-.25))*step(.55,kind)*step(.3,inCell)*step(inCell,.7);
  float runes=clamp(stroke,0.,1.)*step(.66,r)*step(r,.86)*uRune;
  float heart=smoothstep(.5,.0,r)*.35;
  float g=clamp(rings+rays+fine+runes,0.,1.);
  gl_FragColor=vec4(uCol*(g*1.5+heart),(g+heart)*uFade*(1.-smoothstep(.95,1.,r)));
}`;
export interface Halo {
  mesh: THREE.Mesh;
  /** `sec` turns it, `fade` 0..1; scale and place the mesh yourself (it is a plane facing +z). */
  set(sec: number, fade: number): void;
}
/** A halo of light: `rays` 0..1 gives it sun rays, `runes` 0..1 a band of rune marks. */
export function halo(root: THREE.Object3D, color: Rgb = GOLD, rays = 1, runes = 0): Halo {
  const mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uFade: { value: 0 }, uRays: { value: rays }, uRune: { value: runes }, uCol: { value: new THREE.Vector3(...color) } }, vertexShader: UV_VERT, fragmentShader: HALO_FRAG, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
  lightBlend(mat);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.visible = false;
  mesh.renderOrder = 4;
  root.add(mesh);
  const u = mat.uniforms as U;
  return {
    mesh,
    set(sec, fade) {
      mesh.visible = fade > 0.01;
      u.uT!.value = sec;
      u.uFade!.value = fade;
    },
  };
}

const P = new THREE.Vector3();
/**
 * What light does where it lands at `at`, `sec` after: a soft bloom and a long-armed star that open and fade, glints thrown gently
 * outward, motes drifting up. Uses `count` particles of the additive set `light` from `from` (the first three are the bloom).
 */
export function dazzle(light: Quads, from: number, count: number, seed: number, sec: number, at: THREE.Vector3, power = 1, color: Rgb = GOLD) {
  const g = sec >= 0 ? Math.exp(-sec / 0.16) : 0;
  const open = sec >= 0 ? 1 - Math.exp(-sec / 0.05) : 0;
  light.put(from, at.x, at.y, at.z + 0.15, (0.9 + 1.5 * open) * power, color[0], color[1], color[2], g * 0.6);
  light.look(from, F.soft);
  light.put(from + 1, at.x, at.y, at.z + 0.2, (1.6 + 2.6 * open) * power, SUN[0], SUN[1], SUN[2], g * 0.9);
  light.look(from + 1, F.star, 0.2);
  light.put(from + 2, at.x, at.y, at.z + 0.2, (1.4 + 2 * open) * power, SUN[0], SUN[1], SUN[2], g * 0.7);
  light.look(from + 2, F.star, 0.2 + Math.PI / 4);
  const half = Math.floor((count - 3) / 2);
  P.copy(at);
  burst(light, from + 3, half, seed, { sec, at: P, life: 0.7, speed: 3.4 * power, up: 2.2 * power, grav: 0.5, drag: 3, size: 0.2, color: SUN, to: color, frame: F.star, alpha: 0.9 });
  rise(light, from + 3 + half, count - 3 - half, seed + 1, { sec, dur: 0.5, life: 0.9, at: (_b, k) => P.set(at.x + (h(k, 8, seed) - 0.5) * 1.4 * power, at.y + (h(k, 9, seed) - 0.6) * 1.2, at.z), rise: 1.1, jitter: 0.1, size: 0.13, color: SUN, to: color, frame: F.soft, grow: 0.3, sway: 0.12 });
}
