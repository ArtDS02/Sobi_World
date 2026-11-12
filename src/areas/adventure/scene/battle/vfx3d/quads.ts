// Particles with a shape (decision 059): instanced quads that face the camera, each with its own atlas frame, size, turn, colour and,
// when it has a velocity, a stretch along it (a spark becomes a streak, a drop a dash). Sizes are world units: no point-size limit and
// no distance fudge. Like every effect of the layer the caller poses all particles from the effect's age; nothing here keeps a clock.
import * as THREE from 'three';
import { ATLAS_GRID, atlas, type Frame } from './atlas';

const VERT = `
attribute vec3 iPos; attribute vec3 iVel; attribute vec4 iCol; attribute vec4 iMisc;
varying vec2 vUv; varying vec4 vCol;
void main(){
  float size=iMisc.x, rot=iMisc.y, frame=iMisc.z, aspect=iMisc.w;
  vec4 mv=modelViewMatrix*vec4(iPos,1.);
  vec3 vv=(modelViewMatrix*vec4(iVel,0.)).xyz;
  float sl=length(vv.xy);
  vec2 ax=sl>1e-4 ? vv.xy/sl : vec2(cos(rot),sin(rot));
  vec2 ay=vec2(-ax.y,ax.x);
  mv.xy+=ax*position.x*(size+sl)+ay*position.y*size*aspect;
  gl_Position=projectionMatrix*mv;
  float fx=mod(frame,${ATLAS_GRID}.), fy=floor(frame/${ATLAS_GRID}.);
  vUv=(vec2(fx,fy)+vec2(uv.x,1.-uv.y))/${ATLAS_GRID}.;
  vCol=iCol;
}`;
const FRAG = `
uniform sampler2D tMap; varying vec2 vUv; varying vec4 vCol;
void main(){
  float a=texture2D(tMap,vec2(vUv.x,1.-vUv.y)).a*vCol.a;
  if(a<.004) discard;
  gl_FragColor=vec4(vCol.rgb,a);
}`;

export interface Quads {
  readonly n: number;
  readonly mesh: THREE.Mesh;
  /** Poses particle `i`: position, world size, colour (0..1; above 1 glows through the bloom), alpha. */
  put(i: number, x: number, y: number, z: number, size: number, r: number, g: number, b: number, a: number): void;
  /** Its atlas frame, turn (radians) and height / width ratio; call once (or per frame for a tumbling particle). */
  look(i: number, frame: Frame, rot?: number, aspect?: number): void;
  /** A stretch along a world vector (its velocity × a short time): the quad lengthens and turns that way. */
  stretch(i: number, vx: number, vy: number, vz: number): void;
  hide(i: number): void;
  flush(): void;
}

/** Light is added to the picture without covering what is behind it (the layer's composite keeps it as light). */
export function lightBlend(m: THREE.Material) {
  m.blending = THREE.CustomBlending;
  m.blendEquation = THREE.AddEquation;
  m.blendSrc = THREE.SrcAlphaFactor;
  m.blendDst = THREE.OneFactor;
  m.blendSrcAlpha = THREE.ZeroFactor;
  m.blendDstAlpha = THREE.OneFactor;
}

/** `n` particles under `root`: `additive` ones are light, the others paint (smoke, leaves, water with a body). */
export function quads(root: THREE.Object3D, n: number, additive = true, frame: Frame = 0): Quads {
  const geo = new THREE.InstancedBufferGeometry();
  const base = new THREE.PlaneGeometry(1, 1);
  geo.index = base.index;
  geo.setAttribute('position', base.attributes.position!);
  geo.setAttribute('uv', base.attributes.uv!);
  const attr = (name: string, size: number) => {
    const a = new THREE.InstancedBufferAttribute(new Float32Array(n * size), size);
    a.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute(name, a);
    return a;
  };
  const pos = attr('iPos', 3);
  const vel = attr('iVel', 3);
  const col = attr('iCol', 4);
  const misc = attr('iMisc', 4);
  for (let i = 0; i < n; i++) misc.setXYZW(i, 0, 0, frame, 1);
  geo.instanceCount = n;
  const mat = new THREE.ShaderMaterial({ uniforms: { tMap: { value: atlas() } }, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, depthTest: false });
  if (additive) lightBlend(mat);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = additive ? 9 : 8;
  root.add(mesh);
  return {
    n,
    mesh,
    put(i, x, y, z, size, r, g, b, a) {
      pos.setXYZ(i, x, y, z);
      col.setXYZW(i, r, g, b, a);
      misc.setX(i, size);
    },
    look(i, f, rot = 0, aspect = 1) {
      misc.setY(i, rot);
      misc.setZ(i, f);
      misc.setW(i, aspect);
    },
    stretch(i, vx, vy, vz) {
      vel.setXYZ(i, vx, vy, vz);
    },
    hide(i) {
      misc.setX(i, 0);
      col.setW(i, 0);
    },
    flush() {
      pos.needsUpdate = true;
      vel.needsUpdate = true;
      col.needsUpdate = true;
      misc.needsUpdate = true;
    },
  };
}

/** Colour channels of a hex number, 0..1 (display-referred, like every colour of the layer). */
export const rgb = (hex: number): [number, number, number] => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
