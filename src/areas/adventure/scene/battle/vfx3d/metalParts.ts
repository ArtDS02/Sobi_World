// Parts of the metal effects (prototype, decision 059): steel and bronze, a slash arc that sweeps and fades, and a burst of sparks.
// Pure functions of time, like every effect.
import * as THREE from 'three';
import { clamp, cloud, park, type Cloud } from './effectParts';

export const steelMat = () => new THREE.MeshStandardMaterial({ color: 0xdfe4f0, metalness: 0.7, roughness: 0.3, emissive: 0x8a9ac0, emissiveIntensity: 0.55, transparent: true, flatShading: true });
export const bronzeMat = () => new THREE.MeshStandardMaterial({ color: 0xe6b25e, metalness: 0.6, roughness: 0.34, emissive: 0xc08030, emissiveIntensity: 0.75, transparent: true, flatShading: true });

const ARC_VERT = `varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const ARC_FRAG = `
varying vec3 vP; uniform float uReveal, uFade, uLen; uniform vec3 uCol;
void main(){
  float a=atan(vP.y,vP.x); float r=length(vP.xy);
  float t=clamp(a/uLen,0.,1.);
  float head=smoothstep(uReveal-.55,uReveal,t)*step(t,uReveal+.001);
  float width=1.-smoothstep(0.,.17,abs(r-.89));
  vec3 col=mix(uCol,vec3(1.),width*width);
  gl_FragColor=vec4(col,head*width*uFade);
}`;
export interface SlashArc {
  mesh: THREE.Mesh;
  /** `reveal` 0..1: how far the cut has swept (the bright head), `fade` 0..1. */
  set(reveal: number, fade: number): void;
}
/** A curved cut of light (an arc of `len` radians, radius 1 in its own plane); scale and rotate the mesh to place it. */
export function slashArc(parent: THREE.Object3D, len: number, color: number): SlashArc {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uReveal: { value: 0 }, uFade: { value: 0 }, uLen: { value: len }, uCol: { value: new THREE.Color(color) } },
    vertexShader: ARC_VERT,
    fragmentShader: ARC_FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(new THREE.RingGeometry(0.72, 1.06, 56, 1, 0, len), mat);
  mesh.visible = false;
  parent.add(mesh);
  const u = mat.uniforms as Record<string, { value: number }>;
  return {
    mesh,
    set(reveal, fade) {
      mesh.visible = fade > 0.01 && reveal > 0;
      u.uReveal!.value = reveal;
      u.uFade!.value = fade;
    },
  };
}

/** Sparks: additive white-yellow points thrown from `at`, living `life` seconds. */
export function sparks(parent: THREE.Object3D, n: number, size = 0.12): { c: Cloud; set(sec: number, at: THREE.Vector3, power?: number, life?: number): void } {
  const c = cloud(parent, n, size, 0xffe8b0);
  const seed = Array.from({ length: n }, (_, i) => [((i * 0.6180339) % 1) * 6.2832, 0.6 + ((i * 0.37) % 1) * 2.6, 1.2 + ((i * 0.73) % 1) * 3.2, ((i * 0.29) % 1) * 0.12] as const);
  return {
    c,
    set(sec, at, power = 1, life = 0.7) {
      for (let i = 0; i < n; i++) {
        const [a, vh, vy, d] = seed[i]!;
        const t = sec - d;
        if (t <= 0 || t > life) {
          park(c, i);
          continue;
        }
        c.pos.setXYZ(i, at.x + Math.cos(a) * vh * t * power * 0.8, Math.max(0.03, at.y + (vy * t - 4.9 * t * t) * power * 0.6), at.z + Math.sin(a) * vh * t * power * 0.5);
      }
      c.pos.needsUpdate = true;
      (c.pts.material as THREE.PointsMaterial).opacity = 0.95 * (1 - clamp((sec - life * 0.6) / (life * 0.4)));
    },
  };
}
