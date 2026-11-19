// The diorama's ground (G0): one height-field mesh over the area and its forest margin, built from the tile grid (field.ts), lit by
// Three's own lights and shadows; its colour is mixed in the shader from painted textures (the kit's grass and path) and the kind
// shares baked on the vertices, with noise on every border so edges curve. Steep slopes turn to rock. Cloud shadows drift over it.
import * as THREE from 'three';
import { GLSL_NOISE } from './noise';
import { DECK_TOP, type Deck } from './decks';
import { MARGIN, RES, heightAt, weightsAt, type Grid } from './field';
import { plankTexture } from './textures';

export interface GroundUniforms {
  uTime: { value: number };
  uCloud: { value: number };
}

export function buildGround(
  g: Grid,
  grass: THREE.Texture,
  path: THREE.Texture,
  uniforms: GroundUniforms,
): THREE.Mesh {
  const w = g.W * RES;
  const h = g.H * RES;
  const geo = new THREE.PlaneGeometry(g.W, g.H, w, h);
  geo.rotateX(-Math.PI / 2);
  // Plane centred at 0: move it so x, z are area tile coordinates (the margin goes negative).
  geo.translate(g.W / 2 - MARGIN, 0, g.H / 2 - MARGIN);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const splat = new Float32Array(pos.count * 4);
  for (let i = 0; i < pos.count; i += 1) {
    const u = pos.getX(i);
    const v = pos.getZ(i);
    pos.setY(i, heightAt(g, u, v));
    const s = weightsAt(g, u, v);
    splat.set(s, i * 4);
  }
  geo.setAttribute('aSplat', new THREE.BufferAttribute(splat, 4));
  geo.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.tGrass = { value: grass };
    sh.uniforms.tPath = { value: path };
    sh.uniforms.uTime = uniforms.uTime;
    sh.uniforms.uCloud = uniforms.uCloud;
    sh.vertexShader = sh.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute vec4 aSplat;\nvarying vec4 vSplat;\nvarying vec3 vGW;\nvarying vec3 vGN;',
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvSplat = aSplat;\nvGW = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvGN = normalize(mat3(modelMatrix) * objectNormal);',
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform sampler2D tGrass; uniform sampler2D tPath; uniform float uTime; uniform float uCloud;
varying vec4 vSplat; varying vec3 vGW; varying vec3 vGN;
${GLSL_NOISE}
float edge(float w, float n, float soft){ return smoothstep(.5 - soft, .5 + soft, w + (n - .5) * .34); }
vec3 srgb(vec3 c){ return pow(c, vec3(2.2)); }`,
      )
      .replace(
        '#include <map_fragment>',
        `vec2 wp = vGW.xz;
float n1 = dFbm(wp * 1.7);
float n2 = dFbm(wp * .23 + 3.1);
float detail = dot(texture2D(tGrass, wp * .21).rgb, vec3(.33));
// Grass in painted patches: three soft tones laid by large noise, the kit's painted grass for the brush texture, light strokes.
float patchA = smoothstep(.38, .62, n2);
float patchB = smoothstep(.52, .7, dFbm(wp * .38 + 9.));
vec3 grass = mix(srgb(vec3(.43, .64, .27)), srgb(vec3(.55, .74, .32)), patchA);
grass = mix(grass, srgb(vec3(.36, .56, .27)), patchB * .7);
grass *= .8 + detail * .5;
float stroke = smoothstep(.72, .8, dNoise(vec2(wp.x * 2.2 + wp.y * .6, wp.y * 7.5)));
grass = mix(grass, srgb(vec3(.66, .8, .4)), stroke * .35);
float bloomDots = step(.93, dHash(floor(wp * 5.))) * step(.5, dNoise(wp * .7 + 4.));
grass = mix(grass, mix(srgb(vec3(1., .96, .82)), srgb(vec3(1., .78, .86)), dHash(floor(wp * 5.) + 2.)), bloomDots * smoothstep(.3, .0, length(fract(wp * 5.) - .5)) * .9);
// Grass darkens and cools near the woods (their shade and their floor).
grass *= mix(1., .72, smoothstep(.05, .45, vSplat.y));
vec3 path = mix(srgb(vec3(.88, .77, .58)), srgb(vec3(.8, .67, .47)), smoothstep(.35, .7, n1));
path *= .95 + .1 * dNoise(wp * 3.);
float pebble = smoothstep(.06, .0, length(fract(wp * 3.1 + dNoise(wp * 2.) * .4) - .5)) * step(.82, dHash(floor(wp * 3.1 + dNoise(wp * 2.) * .4)));
path = mix(path, srgb(vec3(.7, .64, .56)), pebble);
path *= .9 + .1 * smoothstep(.5, .95, vSplat.x);
vec3 floorC = mix(srgb(vec3(.22, .33, .16)), srgb(vec3(.33, .28, .17)), smoothstep(.4, .7, n1));
vec3 bank = mix(srgb(vec3(.78, .68, .5)), srgb(vec3(.56, .5, .38)), n1);
vec3 rock = mix(srgb(vec3(.58, .55, .5)), srgb(vec3(.74, .71, .64)), smoothstep(.3, .7, dFbm(vec2(wp.x + wp.y, vGW.y * 3.))));
vec3 col = grass;
float wp_ = edge(vSplat.x, n1, .1);
col = mix(col, path, wp_);
// A darker rim where path meets grass (worn edge).
col *= 1. - .18 * (1. - abs(wp_ * 2. - 1.)) * step(.02, wp_);
float wf = edge(vSplat.y, n1, .2);
col = mix(col, floorC, wf);
float wb = smoothstep(.15, .55, vSplat.z + (n1 - .5) * .3);
col = mix(col, bank, wb);
// Flat rock tops are mossy ground; the cliff faces show the stone: strata, vertical cracks, dark at the foot, a grass lip on top.
vec3 moss = mix(grass * vec3(.86, .92, .8), srgb(vec3(.5, .55, .4)), .35);
col = mix(col, moss, edge(vSplat.w, n1, .15));
float steep = 1. - smoothstep(.45, .8, vGN.y);
float strata = .8 + .2 * smoothstep(.3, .7, dNoise(vec2(wp.x * .6 + wp.y * .4, vGW.y * 5.)));
float crack = smoothstep(.75, .9, dNoise(vec2((wp.x + wp.y) * 3.5, vGW.y * .8)));
vec3 face = mix(srgb(vec3(.6, .53, .45)), srgb(vec3(.72, .66, .57)), dFbm(vec2(wp.x + wp.y, vGW.y * 2.5) * 1.5)) * strata * (1. - crack * .35);
face *= .62 + .38 * smoothstep(.0, .9, vGW.y);
col = mix(col, face, steep);
col = mix(col, srgb(vec3(.5, .7, .3)), smoothstep(.62, .78, vGN.y) * (1. - smoothstep(.78, .9, vGN.y)) * step(.5, vGW.y) * .6);
// Drifting cloud shadows.
float cl = smoothstep(.56, .74, dFbm(wp * .045 + vec2(uTime * .006, uTime * .004)));
col *= 1. - uCloud * cl;
diffuseColor.rgb *= col;`,
      );
  };
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * One straight deck per group of bridge tiles (its bounding box: today's grids paint bridges with ragged edges), planks across the
 * way, a rail of posts and a beam along both long sides.
 */
export function buildBridges(decks: readonly Deck[]): THREE.Group {
  const group = new THREE.Group();
  const planks = plankTexture();
  const wood = new THREE.MeshLambertMaterial({ color: 0x6a4428 });
  for (const { cx, cz, w, d, along } of decks) {
    const tex = planks.clone();
    tex.repeat.set(along ? w : 1, along ? 1 : d);
    if (!along) tex.rotation = Math.PI / 2;
    tex.needsUpdate = true;
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(w, DECK_TOP, d),
      new THREE.MeshLambertMaterial({ map: tex }),
    );
    deck.position.set(cx, DECK_TOP / 2, cz);
    deck.castShadow = deck.receiveShadow = true;
    group.add(deck);
    for (const side of [-1, 1]) {
      const len = along ? w : d;
      const n = Math.max(2, Math.round(len / 1.1) + 1);
      for (let i = 0; i < n; i += 1) {
        const k = -len / 2 + (len * i) / (n - 1);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.62, 6), wood);
        post.position.set(
          along ? cx + k : cx + side * (w / 2 - 0.06),
          0.3,
          along ? cz + side * (d / 2 - 0.06) : cz + k,
        );
        post.castShadow = true;
        group.add(post);
      }
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(along ? len : 0.09, 0.08, along ? 0.09 : len),
        wood,
      );
      beam.position.set(
        along ? cx : cx + side * (w / 2 - 0.06),
        0.56,
        along ? cz + side * (d / 2 - 0.06) : cz,
      );
      beam.castShadow = true;
      group.add(beam);
    }
  }
  return group;
}
