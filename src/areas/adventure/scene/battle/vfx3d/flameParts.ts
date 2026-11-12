// Parts of the fire effects rebuilt on noise (decision 059): a tongue of flame with a body (a plane facing the camera whose outline
// is eaten by rising noise, painted in the fire ramp's flat tones with a white-hot heart), and a soft glow. Fire is painted, not only
// added as light: on a bright backdrop an additive flame washes out, a painted one keeps its red edge.
import * as THREE from 'three';
import { sprite } from './effectParts';
import { NOISE, RAMPS, UV_VERT } from './glsl';
import { lightBlend } from './quads';

type U = Record<string, { value: number }>;

const FLAME_FRAG = `
${NOISE}${RAMPS}
varying vec2 vUv; uniform float uT, uFade, uSeed, uLean;
void main(){
  float y=vUv.y; float x=(vUv.x-.5)*2.-uLean*y*y;
  // Noise climbs faster than the flame is tall: tongues tear off the top.
  float n=fbm(vec2(x*2.4+uSeed, y*2.2-uT*2.6));
  float n2=fbm(vec2(x*5.+uSeed*2., y*4.5-uT*4.2));
  float width=(1.-y)*(.55+.45*smoothstep(0.,.25,y))+.08;
  float d=1.-abs(x)/max(width,.001);
  float body=d*.9+(n-.5)*.9+(n2-.5)*.35-y*.35;
  float a=smoothstep(.05,.22,body)*smoothstep(0.,.05,y);
  float heat=clamp(body*.9+(1.-y)*.35,0.,1.2);
  vec3 col=fireRamp(heat)*(1.+smoothstep(.8,1.15,heat)*1.2);
  gl_FragColor=vec4(col,a*uFade);
}`;
export interface Flame {
  mesh: THREE.Mesh;
  /** World width and height, seconds, fade 0..1, lean (the top blown sideways, −1..1). */
  set(width: number, height: number, sec: number, fade: number, lean?: number): void;
}
/** A flame standing at its mesh's position (its foot at the origin). */
export function flame(root: THREE.Object3D, seed = 0): Flame {
  const mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uFade: { value: 0 }, uSeed: { value: seed * 3.7 }, uLean: { value: 0 } }, vertexShader: UV_VERT, fragmentShader: FLAME_FRAG, transparent: true, depthWrite: false, depthTest: false });
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.translate(0, 0.5, 0);
  const mesh = new THREE.Mesh(geo, mat);
  // Tilted back a little toward the raised camera.
  mesh.rotation.x = -0.35;
  mesh.visible = false;
  mesh.renderOrder = 6;
  root.add(mesh);
  const u = mat.uniforms as U;
  return {
    mesh,
    set(width, height, sec, fade, lean = 0) {
      mesh.visible = fade > 0.01 && height > 0.02;
      mesh.scale.set(Math.max(0.001, width), Math.max(0.001, height), 1);
      u.uT!.value = sec;
      u.uFade!.value = fade;
      u.uLean!.value = lean;
    },
  };
}

/** A soft glow of light: call it with `(x, y, z, size, opacity)`. */
export function glow(root: THREE.Object3D, color: number) {
  const m = new THREE.SpriteMaterial({ map: sprite(), color, transparent: true, depthWrite: false, depthTest: false });
  lightBlend(m);
  const s = new THREE.Sprite(m);
  s.visible = false;
  root.add(s);
  return (x: number, y: number, z: number, size: number, opacity: number) => {
    s.visible = opacity > 0.01 && size > 0.01;
    s.position.set(x, y, z);
    s.scale.set(size, size, 1);
    m.opacity = opacity;
  };
}
