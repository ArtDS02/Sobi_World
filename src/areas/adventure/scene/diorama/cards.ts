// Standing cards of the diorama (G0): painted pictures stood in the 3D ground — trees, bushes, rocks, grass, and the party, the
// enemy groups, the chests. A card leans back toward the camera (so the picture is not squashed by the view from above), is lit like
// the ground with a rounded normal map (a lit side and a shaded side, like a volume), sways in travelling gusts from the top, bends
// away from the party (grass, bushes), and opens a see-through circle around the party when it stands in front of it. Shadows come
// from invisible round stand-ins (a crown, a trunk), never from the flat picture. One InstancedMesh per picture for the many; one
// Mesh each for the few that move.
import * as THREE from 'three';
import type { Card } from './textures';

export interface CardUniforms {
  uTime: { value: number };
  uWind: { value: number };
  /** The party's feet, world units. */
  uPlayer: { value: THREE.Vector3 };
  /** The party on screen: x, y (device px, from the bottom) and the radius of the see-through circle. */
  uSee: { value: THREE.Vector3 };
}

export const newCardUniforms = (): CardUniforms => ({
  uTime: { value: 0 },
  uWind: { value: 1 },
  uPlayer: { value: new THREE.Vector3() },
  uSee: { value: new THREE.Vector3(-1e4, -1e4, 0) },
});

export interface CardLook {
  /** Wind sway (0 = still). */
  sway: number;
  /** Lean back toward the camera, radians. */
  tilt: number;
  /** Bend away from the party, world units at the top. */
  push?: number;
  /** Opens the see-through circle when in front of the party. */
  see?: boolean;
  /** How far this layer's foot was moved along z from the real foot (layered trees), so all layers are cut alike. */
  shift?: number;
  /**
   * Depth pull toward the camera, world units (the party): the picture stays where it is on screen, only its depth is nearer, so a
   * foe or a companion standing within that distance in front never covers it.
   */
  near?: number;
}

/** Lean of the cards toward the camera (the camera looks down 52°): a picture keeps ~93 % of its height on screen. */
export const TILT = THREE.MathUtils.degToRad(26);

/** A card plane 1 × 1 with its foot at the origin. */
const PLANE = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
const BLOB = new THREE.IcosahedronGeometry(1, 1);
const STICK = new THREE.CylinderGeometry(1, 1.2, 1, 5).translate(0, 0.5, 0);

const VERTEX = /* glsl */ `
#ifdef USE_INSTANCING
  mat4 cardM = instanceMatrix;
#else
  mat4 cardM = modelMatrix;
#endif
vec3 cardAt = vec3(cardM[3]);
float cardW = length(cardM[0].xyz) * sign(cardM[0][0]);
float cardH = length(cardM[1].xyz);
float cardTop = uv.y * uv.y;
// Layered wind (each layer its own rhythm, so it never reads as one jelly wobble): a gust front travelling west to east over the map
// leans the tops downwind while it passes, a steady sway rides on it, and a quicker flutter on top moves the leaves and blades between
// frames 0.1 s apart. Short cards (grass, reeds) sway as if a little taller, so a blade's motion is seen at all.
float front = uTime * .75 - cardAt.x * .16 - cardAt.z * .07;
float gust = smoothstep(.25, 1., .5 + .5 * sin(front)) * (.65 + .35 * sin(front * .37 + 1.3));
float swayW = .066 * uWind * uSway * cardTop * max(cardH, .75) / max(.3, abs(cardW));
transformed.x += sin(uTime * 2.1 + cardAt.x * .7 + cardAt.z * 1.3) * swayW * (.55 + .8 * gust);
transformed.x += gust * swayW * 1.1 * sign(cardW);
transformed.x += sin(uTime * 5.7 + cardAt.x * 2.1 + cardAt.z * .6 + uv.x * 2.4) * swayW * (.22 + .3 * gust);
transformed.z += sin(uTime * 1.7 + cardAt.x * .5 + cardAt.z * 1.1) * swayW * .18;
vec2 away = cardAt.xz - uPlayer.xz;
float near = smoothstep(1.4, .15, length(away));
transformed.x += sign(away.x + 1e-4) * sign(cardW) * uPush * cardTop * near / max(.3, abs(cardW));
transformed.y *= 1. - .18 * uPush * near * cardTop;
float lean = transformed.y;
transformed.y = lean * cos(uTilt);
transformed.z -= lean * sin(uTilt) * cardH;
vFootZ = cardAt.z - uShift;
`;

const DITHER = /* glsl */ `
// Interleaved gradient noise: a fine, even dither (no visible grid like a 4 × 4 pattern).
float ditherAt(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(.06711056, .00583715)))); }
`;

/** The lit, swaying, see-through material of a card picture. */
export function cardMaterial(card: Card, u: CardUniforms, look: CardLook, tint = 0xffffff): THREE.Material {
  const mat = new THREE.MeshLambertMaterial({
    map: card.tex,
    color: tint,
    alphaTest: 0.5,
    alphaToCoverage: true,
    side: THREE.DoubleSide,
  });
  if (card.normal) {
    mat.normalMap = card.normal;
    mat.normalScale.set(1.1, 1.1);
  }
  mat.onBeforeCompile = (sh) => {
    patchVertex(sh, u, look, true);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nuniform vec3 uSee; uniform float uSeeOn; uniform vec3 uPlayer;\nvarying float vFootZ;\n${DITHER}`).replace(
      '#include <clipping_planes_fragment>',
      // A card standing level with the party or in front of it (judged by its foot, not by the depth of each pixel: a tree right
      // beside the party is barely nearer the camera yet hides it) opens a circle around the party on screen.
      `#include <clipping_planes_fragment>
if (uSeeOn > .5 && vFootZ > uPlayer.z - .2) {
  float keep = smoothstep(uSee.z * .5, uSee.z, distance(gl_FragCoord.xy, uSee.xy));
  if (ditherAt(gl_FragCoord.xy) > keep) discard;
}`,
    );
  };
  mat.customProgramCacheKey = () => `card-${look.sway}-${look.tilt}-${look.push ?? 0}-${look.see ? 1 : 0}-${look.shift ?? 0}-${look.near ?? 0}`;
  return mat;
}

/** Puts the card's motion (sway, bend, lean) and its real foot into a material's vertex shader. */
function patchVertex(sh: THREE.WebGLProgramParametersWithUniforms, u: CardUniforms, look: CardLook, lit: boolean) {
  Object.assign(sh.uniforms, u, {
    uSway: { value: look.sway },
    uTilt: { value: look.tilt },
    uPush: { value: look.push ?? 0 },
    uSeeOn: { value: look.see ? 1 : 0 },
    uShift: { value: look.shift ?? 0 },
    uNear: { value: look.near ?? 0 },
  });
  sh.vertexShader = sh.vertexShader
    .replace(
      '#include <common>',
      '#include <common>\nuniform float uTime; uniform float uWind; uniform vec3 uPlayer; uniform float uSway; uniform float uTilt; uniform float uPush; uniform float uShift; uniform float uNear;\nvarying float vFootZ;',
    )
    .replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERTEX}`)
    .replace(
      '#include <project_vertex>',
      // Same place on screen, nearer depth: the projected depth of the point pulled `uNear` toward the camera.
      '#include <project_vertex>\nif (uNear > 0.) { vec4 nearP = projectionMatrix * vec4(mvPosition.xyz + vec3(0., 0., uNear), 1.); gl_Position.z = nearP.z / nearP.w * gl_Position.w; }',
    );
  if (lit) sh.vertexShader = sh.vertexShader.replace('#include <beginnormal_vertex>', 'vec3 objectNormal = normalize(vec3(0., .78, .62));');
}

/**
 * The party seen through what hides it: the same picture drawn only where something nearer covers it (depth test "greater"), as a
 * warm see-through ghost, so the party is never lost in the woods.
 */
export function xrayMaterial(card: Card, u: CardUniforms, near = 0): THREE.MeshBasicMaterial {
  const mat = new THREE.MeshBasicMaterial({
    map: card.tex,
    color: 0xffe2a8,
    transparent: true,
    opacity: 0.5,
    alphaTest: 0.5,
    depthWrite: false,
    depthFunc: THREE.GreaterDepth,
    side: THREE.DoubleSide,
  });
  mat.onBeforeCompile = (sh) => {
    patchVertex(sh, u, { sway: 0, tilt: TILT, near }, false);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vFootZ;');
  };
  mat.customProgramCacheKey = () => `card-xray-${near}`;
  return mat;
}

export interface Placed {
  x: number;
  z: number;
  /** Ground height under the foot. */
  y: number;
  /** Height in world units (width follows the picture). */
  h: number;
  flip?: boolean;
}

/** Side of a culling chunk, tiles: batches are cut into chunks so what is off screen (or off the sun's shadow box) is skipped. */
const CHUNK = 12;

/** Cuts items into chunks by foot position. */
function chunked(items: readonly Placed[]): Placed[][] {
  const by = new Map<string, Placed[]>();
  for (const it of items) {
    const key = `${Math.floor(it.x / CHUNK)},${Math.floor(it.z / CHUNK)}`;
    const list = by.get(key);
    if (list) list.push(it);
    else by.set(key, [it]);
  }
  return [...by.values()];
}

/** Grows the culling sphere of a chunk: the leaning, swaying pictures reach further than their feet. */
function padSphere(mesh: THREE.InstancedMesh, pad: number) {
  mesh.computeBoundingSphere();
  if (mesh.boundingSphere) mesh.boundingSphere.radius += pad;
}

/** Many copies of one picture, in culling chunks. */
export function cardBatch(card: Card, items: Placed[], u: CardUniforms, look: CardLook, tint?: number): THREE.Group {
  const group = new THREE.Group();
  const mat = cardMaterial(card, u, look, tint);
  const m = new THREE.Matrix4();
  for (const part of chunked(items)) {
    const mesh = new THREE.InstancedMesh(PLANE, mat, part.length);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    part.forEach((it, i) => {
      m.makeScale(it.h * card.aspect * (it.flip ? -1 : 1), it.h, 1).setPosition(it.x, it.y - 0.04, it.z);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    padSphere(mesh, 2);
    group.add(mesh);
  }
  return group;
}

/**
 * Invisible round stand-ins that cast the shadows of a batch: a crown (an ellipsoid where the leaning picture shows its crown, of
 * `crown` = [centre height, half width, half height] as shares of the card's size) and a trunk. Few triangles each: the shadow is soft.
 */
export function shadowStandIns(items: readonly Placed[], aspect: number, crown: [number, number, number], trunk: number): THREE.Group {
  const g = new THREE.Group();
  const hidden = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const v = new THREE.Vector3();
  const sc = new THREE.Vector3();
  for (const part of chunked(items)) {
    const blobs = new THREE.InstancedMesh(BLOB, hidden, part.length);
    const sticks = new THREE.InstancedMesh(STICK, hidden, part.length);
    part.forEach((it, i) => {
      const w = it.h * aspect;
      const c = it.h * crown[0];
      m.compose(v.set(it.x, it.y + c * Math.cos(TILT), it.z - c * Math.sin(TILT)), q, sc.set(w * crown[1], it.h * crown[2], w * crown[1]));
      blobs.setMatrixAt(i, m);
      m.compose(v.set(it.x, it.y, it.z), q, sc.set(w * trunk, it.h * crown[0], w * trunk));
      sticks.setMatrixAt(i, m);
    });
    for (const x of [blobs, sticks]) {
      x.castShadow = true;
      x.instanceMatrix.needsUpdate = true;
      padSphere(x, 1);
      g.add(x);
    }
    if (trunk <= 0) sticks.visible = false;
  }
  return g;
}

/** One moving card (party, enemies, chests): a Mesh whose picture may change. */
export function cardSprite(card: Card, u: CardUniforms, look: CardLook = { sway: 0, tilt: TILT }): THREE.Mesh {
  const mesh = new THREE.Mesh(PLANE, cardMaterial({ tex: card.tex, aspect: card.aspect }, u, look));
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  return mesh;
}

/** Sets a sprite's picture and height (its width follows the picture). */
export function setSprite(mesh: THREE.Mesh, card: Card, h: number, flip = false) {
  const mat = mesh.material as THREE.MeshLambertMaterial;
  if (mat.map !== card.tex) mat.map = card.tex;
  const xray = mesh.userData.xray as THREE.Mesh | undefined;
  if (xray) (xray.material as THREE.MeshBasicMaterial).map = card.tex;
  mesh.scale.set(h * card.aspect * (flip ? -1 : 1), h, 1);
}

/** Gives a sprite its see-through ghost (xrayMaterial), drawn after everything and only where something hides it. */
export function withXray(mesh: THREE.Mesh, card: Card, u: CardUniforms, near = 0): THREE.Mesh {
  const ghost = new THREE.Mesh(PLANE, xrayMaterial(card, u, near));
  ghost.renderOrder = 20;
  mesh.add(ghost);
  mesh.userData.xray = ghost;
  return mesh;
}
