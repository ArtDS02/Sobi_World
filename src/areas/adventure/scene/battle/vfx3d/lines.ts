// Glowing line segments (decision 059): instanced capsules that face the camera, with a white-hot core and a coloured falloff. A bolt
// of lightning and a trail are both a list of segments; they blend by MAX among themselves, so joints and crossings do not bead.
// On top: `forked()` builds a jagged, branching bolt (midpoint displacement, forks that taper), a pure function of its seed.
import * as THREE from 'three';
import { rng } from './effectParts';

const VERT = `
attribute vec3 iA; attribute vec3 iB; attribute vec4 iCol; attribute vec2 iW;
varying vec2 vP; varying float vLen; varying vec4 vCol; varying float vW;
void main(){
  vec4 a=modelViewMatrix*vec4(iA,1.), b=modelViewMatrix*vec4(iB,1.);
  vec2 d=b.xy-a.xy; float len=length(d); vec2 ax=len>1e-5 ? d/len : vec2(1.,0.); vec2 ay=vec2(-ax.y,ax.x);
  float w=mix(iW.x,iW.y,position.x+.5);
  // The quad overshoots both ends by its half width (round caps are cut in the fragment stage).
  float along=(position.x+.5)*len+position.x*2.*w;
  vec4 mv=mix(a,b,position.x+.5);
  mv.xy=a.xy+ax*along+ay*position.y*2.*w;
  gl_Position=projectionMatrix*mv;
  vP=vec2(along,position.y*2.*w); vLen=len; vCol=iCol; vW=w;
}`;
const FRAG = `
varying vec2 vP; varying float vLen; varying vec4 vCol; varying float vW; uniform float uGain;
void main(){
  float dx=max(max(-vP.x,vP.x-vLen),0.);
  float d=length(vec2(dx,vP.y))/max(vW,1e-5);
  float core=smoothstep(.34,.1,d);
  float glow=pow(max(0.,1.-d),2.4);
  vec3 col=vCol.rgb*glow*1.15+vec3(1.)*core*1.6;
  gl_FragColor=vec4(col*vCol.a*uGain,0.);
}`;

export interface Lines {
  readonly max: number;
  readonly mesh: THREE.Mesh;
  /** Writes segment `i` (world points, half widths at both ends, colour, brightness). */
  put(i: number, a: THREE.Vector3, b: THREE.Vector3, wa: number, wb: number, r: number, g: number, bl: number, bright: number): void;
  /** Draws only the first `count` segments, at overall brightness `gain`. */
  show(count: number, gain: number): void;
  flush(): void;
}

export function lines(root: THREE.Object3D, max: number): Lines {
  const geo = new THREE.InstancedBufferGeometry();
  const base = new THREE.PlaneGeometry(1, 1);
  geo.index = base.index;
  geo.setAttribute('position', base.attributes.position!);
  const attr = (name: string, size: number) => {
    const a = new THREE.InstancedBufferAttribute(new Float32Array(max * size), size);
    a.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute(name, a);
    return a;
  };
  const A = attr('iA', 3);
  const B = attr('iB', 3);
  const C = attr('iCol', 4);
  const W = attr('iW', 2);
  geo.instanceCount = 0;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uGain: { value: 1 } }, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 5;
  root.add(mesh);
  return {
    max,
    mesh,
    put(i, a, b, wa, wb, r, g, bl, bright) {
      A.setXYZ(i, a.x, a.y, a.z);
      B.setXYZ(i, b.x, b.y, b.z);
      W.setXY(i, wa, wb);
      C.setXYZW(i, r, g, bl, bright);
    },
    show(count, gain) {
      geo.instanceCount = Math.max(0, Math.min(max, count));
      mat.uniforms.uGain!.value = gain;
      mesh.visible = count > 0 && gain > 0.003;
    },
    flush() {
      A.needsUpdate = true;
      B.needsUpdate = true;
      C.needsUpdate = true;
      W.needsUpdate = true;
    },
  };
}

export interface ForkOpts {
  /** Half width of the trunk (world units). */
  width: number;
  /** Sideways displacement as a share of the bolt's length (0.18 is a lively bolt). */
  jag?: number;
  /** How many forks leave the trunk. */
  forks?: number;
  /** Colour of the falloff, 0..1 channels. */
  color: readonly [number, number, number];
  /** Share of the trunk drawn (a leader running down): 0..1. */
  reveal?: number;
  /** Brightness of the whole bolt (default 1). */
  gain?: number;
}

/**
 * Writes a branching bolt from `a` to `b` into `out`, starting at segment `at`; returns the next free segment. The shape depends only
 * on `seed`: give a new seed every few frames and the bolt re-strikes along a new path, which is what makes lightning look alive.
 */
export function forked(out: Lines, at: number, a: THREE.Vector3, b: THREE.Vector3, seed: number, o: ForkOpts, depth = 0): number {
  const rand = rng(seed * 7919 + depth * 104729 + 13);
  const jag = o.jag ?? 0.18;
  const len = a.distanceTo(b);
  const dir = b.clone().sub(a).normalize();
  // Displace across the bolt in the plane the camera sees best (the stage's camera looks along -z from above): sideways and a little in depth.
  const side = new THREE.Vector3(-dir.y, dir.x, 0);
  if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
  side.normalize();
  const deep = new THREE.Vector3(0, 0, 1);
  let pts = [a.clone(), b.clone()];
  let amp = len * jag;
  const levels = depth === 0 ? 5 : 3;
  for (let l = 0; l < levels; l++) {
    const next: THREE.Vector3[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const mid = pts[i]!.clone().lerp(pts[i + 1]!, 0.35 + rand() * 0.3);
      mid.addScaledVector(side, (rand() - 0.5) * 2 * amp).addScaledVector(deep, (rand() - 0.5) * amp * 0.5);
      next.push(pts[i]!, mid);
    }
    next.push(pts[pts.length - 1]!);
    pts = next;
    amp *= 0.52;
  }
  const n = pts.length - 1;
  const shown = Math.ceil(n * Math.min(1, o.reveal ?? 1));
  const [r, g, bl] = o.color;
  let i = at;
  for (let k = 0; k < shown && i < out.max; k++, i++) {
    const t0 = k / n;
    const t1 = (k + 1) / n;
    // A fork thins to a point; the trunk keeps most of its width down to the ground.
    const taper = (t: number) => o.width * (depth === 0 ? 1 - 0.3 * t : 1 - 0.85 * t);
    out.put(i, pts[k]!, pts[k + 1]!, taper(t0), taper(t1), r, g, bl, (depth === 0 ? 1 : 0.7) * (o.gain ?? 1));
  }
  const forks = depth >= 2 ? 0 : (o.forks ?? 4) - depth * 2;
  for (let f = 0; f < forks && i < out.max; f++) {
    const k = 2 + Math.floor(rand() * (n - 4));
    if (k >= shown) continue;
    const from = pts[k]!;
    const ang = (rand() < 0.5 ? -1 : 1) * (0.35 + rand() * 0.55);
    const d = dir.clone().applyAxisAngle(deep, ang).addScaledVector(deep, (rand() - 0.5) * 0.4).normalize();
    const to = from.clone().addScaledVector(d, len * (0.16 + rand() * 0.26) * (1 - k / n * 0.5));
    i = forked(out, i, from, to, seed + f * 31 + k, { ...o, width: o.width * 0.55, jag: jag * 1.5, forks: forks - 1, reveal: 1 }, depth + 1);
  }
  return i;
}
