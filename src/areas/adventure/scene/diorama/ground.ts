// The diorama's ground (G0): a height-field mesh over the area and its forest margin, built from the tile grid (field.ts), lit by
// Three's own lights and shadows; its colour is painted once per area (groundPaint.ts) and looked up per pixel, with the cliff faces
// (steep slopes turn to stone) and the drifting cloud shadows live on top. It is cut into chunks so the camera skips the far woods.
import * as THREE from 'three';
import { GLSL_NOISE } from './noise';
import { DECK_TOP, type Deck } from './decks';
import { MARGIN, RES, heightAt, mossAt, weightsAt, type Grid } from './field';
import { paintGround } from './groundPaint';
import { plankTexture, softRectTexture } from './textures';

export interface GroundUniforms {
  uTime: { value: number };
  uCloud: { value: number };
  /** The party on screen (device px) and the radius of the see-through circle: the ground in it is never left in shadow. */
  uSee: { value: THREE.Vector3 };
  /** 1 at night: the dirt paths keep their warm brown under the blue moon (a light of their own hue, as bright as the moon's). */
  uNight: { value: number };
}

export function buildGround(renderer: THREE.WebGLRenderer, g: Grid, grass: THREE.Texture, quality: 'full' | 'light', uniforms: GroundUniforms): THREE.Group {
  const w = g.W * RES;
  const h = g.H * RES;
  const geo = new THREE.PlaneGeometry(g.W, g.H, w, h);
  geo.rotateX(-Math.PI / 2);
  // Plane centred at 0: move it so x, z are area tile coordinates (the margin goes negative).
  geo.translate(g.W / 2 - MARGIN, 0, g.H / 2 - MARGIN);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const splat = new Float32Array(pos.count * 4);
  const moss = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i += 1) {
    const u = pos.getX(i);
    const v = pos.getZ(i);
    pos.setY(i, heightAt(g, u, v));
    const s = weightsAt(g, u, v);
    splat.set(s, i * 4);
    moss[i] = mossAt(g, u, v);
  }
  geo.setAttribute('aSplat', new THREE.BufferAttribute(splat, 4));
  geo.setAttribute('aMoss', new THREE.BufferAttribute(moss, 1));
  geo.computeVertexNormals();
  const painted = paintGround(renderer, geo, g, grass, quality);
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  mat.addEventListener('dispose', () => painted.dispose());
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.tPaint = { value: painted.texture };
    sh.uniforms.uSize = { value: new THREE.Vector2(g.W, g.H) };
    sh.uniforms.uTime = uniforms.uTime;
    sh.uniforms.uCloud = uniforms.uCloud;
    sh.uniforms.uSee = uniforms.uSee;
    sh.uniforms.uNight = uniforms.uNight;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 aSplat;\nvarying vec3 vGW;\nvarying vec3 vGN;\nvarying float vPath;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGW = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvGN = normalize(mat3(modelMatrix) * objectNormal);\nvPath = aSplat.x;');
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform sampler2D tPaint; uniform vec2 uSize; uniform float uTime; uniform float uCloud; uniform vec3 uSee; uniform float uNight;
varying vec3 vGW; varying vec3 vGN; varying float vPath;
${GLSL_NOISE}
vec3 srgb(vec3 c){ return pow(c, vec3(2.2)); }`,
      )
      .replace(
        '#include <opaque_fragment>',
        `// Under the crowns the party is seen through, the ground it reveals is lit like the open ground, with a soft edge (no dark disc).
outgoingLight = max(outgoingLight, diffuseColor.rgb * (.8 * seeLift));
// At night a dirt path is lit by a light of its own warm hue, as bright as the moon and the lantern there (with a floor), so it stays a
// dark warm brown a step lighter than the grass, instead of the flat grey-blue the moon makes of it.
if (uNight > 0.) {
  float pathK = smoothstep(.3, .62, vPath) * step(.9, vGN.y) * uNight;
  vec3 lw = vec3(.2126, .7152, .0722);
  float lit = dot(outgoingLight, lw) / max(1e-3, dot(diffuseColor.rgb, lw));
  outgoingLight = mix(outgoingLight, diffuseColor.rgb * max(lit * 1.15, .17) * vec3(1.08, .94, .76), pathK);
}
#include <opaque_fragment>`,
      )
      .replace(
        '#include <map_fragment>',
        `vec2 wp = vGW.xz;
vec3 col = texture2D(tPaint, (wp + ${MARGIN}.) / uSize).rgb;
// In the see-through circle the dark forest floor is shown as leafy grass, so it is no dark disc round the party.
float seeLift = uSee.z > 0. ? 1. - smoothstep(uSee.z * .5, uSee.z * 1.25, distance(gl_FragCoord.xy, uSee.xy)) : 0.;
col = mix(col, max(col, srgb(vec3(.38, .54, .26)) * (.8 + .4 * dFbm(wp * 1.3))), seeLift);
// Cliff faces show the stone: strata, vertical cracks, dark at the foot, a grass lip on top (only where the ground is steep).
if (vGN.y < .9) {
  float steep = 1. - smoothstep(.45, .8, vGN.y);
  float strata = .8 + .2 * smoothstep(.3, .7, dNoise(vec2(wp.x * .6 + wp.y * .4, vGW.y * 5.)));
  float crack = smoothstep(.75, .9, dNoise(vec2((wp.x + wp.y) * 3.5, vGW.y * .8)));
  vec3 face = mix(srgb(vec3(.6, .53, .45)), srgb(vec3(.72, .66, .57)), dFbm(vec2(wp.x + wp.y, vGW.y * 2.5) * 1.5)) * strata * (1. - crack * .35);
  face *= .62 + .38 * smoothstep(.0, .9, vGW.y);
  col = mix(col, face, steep);
  col = mix(col, srgb(vec3(.5, .7, .3)), smoothstep(.62, .78, vGN.y) * (1. - smoothstep(.78, .9, vGN.y)) * step(.5, vGW.y) * .6);
}
// Drifting cloud shadows.
float cl = smoothstep(.56, .74, dFbm(wp * .045 + vec2(uTime * .006, uTime * .004)));
col *= 1. - uCloud * cl;
diffuseColor.rgb *= col;`,
      );
  };
  return chunkGround(geo, mat, w, h);
}

/** Tiles per side of a ground chunk: each chunk is culled by the camera on its own. */
const GROUND_CHUNK = 12;

/** The ground as chunks sharing one vertex buffer (each with its own index range and bounds), so the off-screen woods cost nothing. */
function chunkGround(geo: THREE.PlaneGeometry, mat: THREE.Material, w: number, h: number): THREE.Group {
  const group = new THREE.Group();
  const src = geo.index!.array;
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const step = GROUND_CHUNK * RES;
  for (let y0 = 0; y0 < h; y0 += step)
    for (let x0 = 0; x0 < w; x0 += step) {
      const x1 = Math.min(w, x0 + step);
      const y1 = Math.min(h, y0 + step);
      const idx: number[] = [];
      for (let y = y0; y < y1; y += 1) for (let i = (y * w + x0) * 6; i < (y * w + x1) * 6; i += 1) idx.push(src[i]!);
      const part = new THREE.BufferGeometry();
      part.setAttribute('position', pos);
      part.setAttribute('normal', geo.attributes.normal!);
      part.setAttribute('uv', geo.attributes.uv!);
      part.setAttribute('aSplat', geo.attributes.aSplat!);
      part.setAttribute('aMoss', geo.attributes.aMoss!);
      part.setIndex(idx);
      const box = new THREE.Box3();
      const p = new THREE.Vector3();
      for (let y = y0; y <= y1; y += 1) for (let x = x0; x <= x1; x += 1) box.expandByPoint(p.fromBufferAttribute(pos, y * (w + 1) + x));
      part.boundingBox = box;
      part.boundingSphere = box.getBoundingSphere(new THREE.Sphere());
      const mesh = new THREE.Mesh(part, mat);
      mesh.receiveShadow = true;
      group.add(mesh);
    }
  return group;
}

/**
 * One straight deck per group of bridge tiles (its bounding box: today's grids paint bridges with ragged edges), planks across the
 * way, a heavy side beam along each long edge, a row of piles driven into the river bed along both long sides (the posts of the rail,
 * cross-braced under the deck) with the rail beam on top, and the deck's soft shadow on the water (the water is unlit: it takes no real
 * shadow).
 * Everything is made of the code-drawn planks.
 */
export function buildBridges(decks: readonly Deck[]): THREE.Group {
  const group = new THREE.Group();
  const planks = plankTexture();
  const wood = new THREE.MeshLambertMaterial({ color: 0x6a4428 });
  const grain = planks.clone();
  grain.repeat.set(0.25, 1);
  grain.needsUpdate = true;
  // The structure under the deck: the same planks, darker (wet and in shade).
  const under = new THREE.MeshLambertMaterial({ map: grain, color: 0x8a6e58 });
  // A pile: from the river bed up through the deck's edge to the top of the rail.
  const pile = new THREE.CylinderGeometry(0.075, 0.1, 1.55, 7).translate(0, -0.155, 0);
  const shade = new THREE.MeshBasicMaterial({ map: softRectTexture(), color: 0x06121a, transparent: true, opacity: 0.7, depthWrite: false });
  for (const { cx, cz, w, d, along } of decks) {
    const tex = planks.clone();
    tex.repeat.set(along ? w : 1, along ? 1 : d);
    if (!along) tex.rotation = Math.PI / 2;
    tex.needsUpdate = true;
    const deck = new THREE.Mesh(new THREE.BoxGeometry(w, DECK_TOP, d), new THREE.MeshLambertMaterial({ map: tex }));
    deck.position.set(cx, DECK_TOP / 2, cz);
    deck.castShadow = deck.receiveShadow = true;
    group.add(deck);
    // The shadow on the water (drawn after it): under the whole deck, cast out north-east of it (the sun stands south-west by day), and a
    // narrow dark band under its camera side.
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), shade);
    s.position.set(cx + 0.3, -0.105, cz - 0.15);
    s.scale.set(w + 0.6, 1, d + 1.5);
    s.renderOrder = 3;
    group.add(s);
    const len = along ? w : d;
    for (const side of [-1, 1]) {
      const n = Math.max(2, Math.round(len / 1.1) + 1);
      const step = len / (n - 1);
      const edge = (along ? d : w) / 2;
      const at = (k: number, out: number, y: number, m: THREE.Object3D) => m.position.set(along ? cx + k : cx + side * (edge + out), y, along ? cz + side * (edge + out) : cz + k);
      for (let i = 0; i < n; i += 1) {
        const k = -len / 2 + step * i;
        const post = new THREE.Mesh(pile, wood);
        at(k, 0.2, 0, post);
        post.castShadow = true;
        group.add(post);
        // A cross-brace from this pile down to the next, between the deck and the water (and on under it).
        if (i < n - 1) {
          const drop = 0.5;
          const brace = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(step, drop), 0.055, 0.055), under);
          at(k + step / 2, 0.2, -0.04, brace);
          const a = (i % 2 ? 1 : -1) * Math.atan2(drop, step);
          if (along) brace.rotation.z = a;
          else brace.rotation.set(a, Math.PI / 2, 0, 'YXZ');
          group.add(brace);
        }
      }
      // The heavy side beam (stringer) the planks rest on, hanging below the deck's edge down to the water.
      const stringer = new THREE.Mesh(new THREE.BoxGeometry(along ? len + 0.2 : 0.16, 0.28, along ? 0.16 : len + 0.2), under);
      at(0, 0.03, -0.06, stringer);
      stringer.castShadow = true;
      group.add(stringer);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(along ? len : 0.09, 0.08, along ? 0.09 : len), wood);
      at(0, 0.2, 0.56, beam);
      beam.castShadow = true;
      group.add(beam);
    }
  }
  return group;
}
