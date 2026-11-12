// Parts of the lightning effects (prototype, decision 059): a jagged bolt with a glow and two forks, its flicker, and a glowing sigil that
// turns on the air. Pure functions of time, like every effect.
import * as THREE from 'three';
import { clamp, rng, smooth, sprite } from './effectParts';

/** A curve of straight pieces through `pts` (a bolt has corners, not smooth bends). */
class Poly extends THREE.Curve<THREE.Vector3> {
  constructor(private readonly pts: THREE.Vector3[]) {
    super();
  }
  override getPoint(t: number, target = new THREE.Vector3()) {
    const f = t * (this.pts.length - 1);
    const i = Math.min(this.pts.length - 2, Math.floor(f));
    return target.lerpVectors(this.pts[i]!, this.pts[i + 1]!, f - i);
  }
}

export interface Bolt {
  /** `op` 0..1: the whole bolt's brightness. */
  set(op: number): void;
}
/** A bolt from `a` to `b` with a bright core, a soft glow round it and two forks; its jagged shape is fixed by `seed`. */
export function bolt(parent: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, seed: number, color = 0xcfe0ff, thick = 0.05, jitter = 0.7): Bolt {
  const rand = rng(seed);
  const dir = b.clone().sub(a);
  const len = dir.length();
  const side = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
  const pts: THREE.Vector3[] = [];
  const n = 16;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = new THREE.Vector3().lerpVectors(a, b, t);
    const k = i === 0 || i === n ? 0 : (rand() - 0.5) * jitter * Math.min(2, len * 0.35);
    p.addScaledVector(side, k).y += i === 0 || i === n ? 0 : (rand() - 0.5) * jitter * 0.6;
    pts.push(p);
  }
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const group = new THREE.Group();
  const tube = (pp: THREE.Vector3[], r: number, m: THREE.Material) => group.add(new THREE.Mesh(new THREE.TubeGeometry(new Poly(pp), (pp.length - 1) * 2, r, 5), m));
  tube(pts, thick, coreMat);
  tube(pts, thick * 2.4, glowMat);
  for (let f = 0; f < 2; f++) {
    const from = pts[3 + Math.floor(rand() * 5)]!;
    const to = from.clone().add(new THREE.Vector3((rand() - 0.5) * len * 0.5, -len * 0.25 * rand(), (rand() - 0.5) * len * 0.3));
    const mid = from.clone().lerp(to, 0.5).add(new THREE.Vector3((rand() - 0.5) * 0.4, (rand() - 0.5) * 0.3, 0));
    tube([from, mid, to], thick * 0.5, coreMat);
  }
  group.visible = false;
  parent.add(group);
  return {
    set(op) {
      group.visible = op > 0.01;
      coreMat.opacity = op;
      glowMat.opacity = 0.3 * op;
    },
  };
}

/** A flickering brightness for a flash starting at `t0` and lasting `dur` ms (a few quick pulses, fading). */
export function flick(ms: number, t0: number, dur: number): number {
  const k = (ms - t0) / dur;
  if (k <= 0 || k >= 1) return 0;
  return (0.55 + 0.45 * Math.sin(k * 38)) * (1 - k) ** 0.7 * smooth(0, 0.04, k);
}

/** A soft flash at a point: `set(at, sec, size)` (sec since it began; it dies in a fraction of a second). */
export function glare(parent: THREE.Object3D, color = 0xfff4c0) {
  const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite(), color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
  parent.add(f);
  return (at: THREE.Vector3, sec: number, size: number) => {
    const b = sec > 0 ? Math.exp(-sec / 0.12) : 0;
    f.position.copy(at);
    f.scale.setScalar(Math.max(0.001, size * (0.4 + b)));
    (f.material as THREE.SpriteMaterial).opacity = b;
    f.visible = b > 0.01;
  };
}

const SIGIL_FRAG = `
varying vec2 vUv; uniform float uT, uFade;
void main(){
  vec2 p=(vUv-.5)*2.; float r=length(p); float a=atan(p.y,p.x)+uT*.9;
  float ring=smoothstep(.035,0.,abs(r-.93))+smoothstep(.03,0.,abs(r-.66));
  float bolts=smoothstep(.07,0.,abs(sin(a*3.)*.5+(r-.5)*.6))*step(.25,r)*step(r,.66);
  float zig=smoothstep(.05,0.,abs(fract(a*1.9099)-.5+sin(r*14.)*.18)-.18)*step(.66,r)*step(r,.93);
  float g=clamp(ring+bolts*.8+zig*.7,0.,1.);
  float edge=1.-smoothstep(.95,1.,r);
  vec3 col=mix(vec3(1.,.82,.25),vec3(1.,1.,.8),g);
  gl_FragColor=vec4(col,(g*.95+smoothstep(1.,0.,r)*.12)*edge*uFade);
}`;
/** A turning sigil of lightning drawn flat in the air. */
export function sigil(parent: THREE.Object3D) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uFade: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: SIGIL_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.visible = false;
  parent.add(mesh);
  const u = mat.uniforms as Record<string, { value: number }>;
  return {
    mesh,
    set(width: number, depth: number, sec: number, fade: number) {
      mesh.visible = fade > 0.01;
      mesh.scale.set(Math.max(0.001, width), Math.max(0.001, depth), 1);
      u.uT!.value = sec;
      u.uFade!.value = clamp(fade);
    },
  };
}
