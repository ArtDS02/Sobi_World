// Ground details of the diorama (G0) the height field alone does not show: painted cliff faces stood along every drop of high ground
// (the kit's cliff strip, with its two end pieces where a face stops, so a plateau reads as a cliff and not a smudge), the flights of
// stone steps where a path climbs onto it, and lily pads with a few flowers floating on calm water.
import * as THREE from 'three';
import { heightAt, weightsAt, type Grid } from './field';
import { TREAD, stairHeight, type Stair } from './plateau';
import { hash2, noise2 } from './noise';
import { texture } from './textures';

/** Where the ground drops by more than this between a tile and the one below it, a cliff face stands. */
const DROP = 0.7;
/** Width of one face piece, and the strip picture's width / height (a face keeps the picture's shape at its own height). */
const STEP = 0.5;
const STRIP_ASPECT = 4.13;
/** Width / height of an end piece's picture, and the widest it is drawn (world units). */
const END_ASPECT = 1.73;
const END_MAX = 2.4;

export interface CliffArt {
  strip: THREE.Texture;
  endL: THREE.Texture | null;
  endR: THREE.Texture | null;
}

interface Piece {
  x: number;
  za: number;
  zb: number;
  top0: number;
  top1: number;
  low: number;
}

/** `tall`: the faces are very high (a map of big cliffs): the end pieces keep their own shape and sit on the lip as caps, never stretched down the face. */
export function buildCliffs(g: Grid, art: CliffArt, tall = false): THREE.Group {
  const group = new THREE.Group();
  art.strip.wrapS = THREE.RepeatWrapping;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const runs: { first: Piece; last: Piece; list: Piece[] }[] = [];
  // The last row that stood a face at each column: a drop seen again by the next row's window is the same drop.
  const lastRow = new Map<number, number>();
  const inStairs = (x: number, z: number) => g.stairs.some((s) => stairHeight(s, x, z) !== null);
  for (let y = 0; y < g.rows; y += 1) {
    let run: { first: Piece; last: Piece; list: Piece[] } | null = null;
    for (let x = 0; x < g.cols; x += STEP) {
      const top = heightAt(g, x + STEP / 2, y + 0.2);
      const low = heightAt(g, x + STEP / 2, y + 1.8);
      if (top - low < DROP || inStairs(x + STEP / 2, y + 0.5) || inStairs(x + STEP / 2, y + 1.5) || lastRow.get(Math.round(x / STEP)) === y - 1) {
        run = null;
        if (top - low >= DROP && lastRow.get(Math.round(x / STEP)) === y - 1) lastRow.set(Math.round(x / STEP), y);
        continue;
      }
      lastRow.set(Math.round(x / STEP), y);
      // The face stands where the ground crosses half way down, sampled at both ends of the piece so it follows the edge.
      const edgeZ = (cx: number) => {
        for (let z = y + 0.2; z < y + 1.8; z += 0.05) if (heightAt(g, cx, z) < (top + low) / 2) return z;
        return y + 1;
      };
      const za = edgeZ(x);
      const zb = edgeZ(x + STEP);
      const piece: Piece = { x, za, zb, top0: heightAt(g, x, za - 0.25) + 0.08, top1: heightAt(g, x + STEP, zb - 0.25) + 0.08, low: low - 0.05 };
      if (run) {
        run.last = piece;
        run.list.push(piece);
      } else {
        run = { first: piece, last: piece, list: [piece] };
        runs.push(run);
      }
    }
  }
  // A face of less than two tiles is a nick in the ground, not a cliff: it is left to the ground's own stone.
  runs.splice(0, runs.length, ...runs.filter((r) => r.list.length >= 4));
  for (const r of runs)
    for (const piece of r.list) {
      const { x, za, zb } = piece;
      // One picture over a whole face keeps its shape: u runs with the width at the face's own height.
      const perU = 1 / (Math.max(0.8, Math.max(piece.top0, piece.top1) - piece.low) * STRIP_ASPECT);
      const b = pos.length / 3;
      // The face leans back a little (its foot in front of the drop, its lip over it), so it stands clear of the sloped ground.
      pos.push(x, piece.low, za + 0.45, x + STEP, piece.low, zb + 0.45, x + STEP, piece.top1, zb + 0.12, x, piece.top0, za + 0.12);
      uv.push(x * perU, 0, (x + STEP) * perU, 0, (x + STEP) * perU, 1, x * perU, 1);
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: art.strip, side: THREE.DoubleSide }));
  mesh.castShadow = mesh.receiveShadow = true;
  group.add(mesh);

  // Where a face stops: the kit's end pieces, a little in front of the strip, so it ends rounded instead of cut.
  for (const [tex, left] of [[art.endL, true], [art.endR, false]] as const) {
    if (!tex || tall) continue;
    const p: number[] = [];
    const t: number[] = [];
    const ix: number[] = [];
    for (const r of runs) {
      const e = left ? r.first : r.last;
      const x = left ? e.x : e.x + STEP;
      const z = (left ? e.za : e.zb) + 0.3;
      const top = left ? e.top0 : e.top1;
      const hh = tall ? Math.min(top - e.low, END_MAX / END_ASPECT) : top - e.low;
      const w = Math.min(END_MAX, hh * END_ASPECT);
      const [xa, xb] = left ? [x - w * 0.3, x + w * 0.7] : [x - w * 0.7, x + w * 0.3];
      const b = p.length / 3;
      p.push(xa, top - hh, z, xb, top - hh, z, xb, top, z, xa, top, z);
      t.push(0, 0, 1, 0, 1, 1, 0, 1);
      ix.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    if (!ix.length) continue;
    const eg = new THREE.BufferGeometry();
    eg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    eg.setAttribute('uv', new THREE.Float32BufferAttribute(t, 2));
    eg.setIndex(ix);
    eg.computeVertexNormals();
    const em = new THREE.Mesh(eg, new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide }));
    em.castShadow = em.receiveShadow = true;
    group.add(em);
  }
  return group;
}

/**
 * The flights of stone steps: a tread and a riser per step, from the kit's stairs picture, standing exactly where the walker's feet
 * stand (`stairHeight`), so the party climbs real steps. The lowest riser reaches below the ground, the top tread meets the high ground.
 */
export function buildStairs(stairs: readonly Stair[], stone: THREE.Texture, shaded = true): THREE.Group {
  const group = new THREE.Group();
  for (const s of stairs) {
    const along = Math.abs(s.dx) * (s.x1 - s.x0) + Math.abs(s.dz) * (s.z1 - s.z0);
    const wide = Math.abs(s.dz) * (s.x1 - s.x0) + Math.abs(s.dx) * (s.z1 - s.z0);
    const n = Math.max(1, Math.round(along / TREAD));
    const depth = along / n;
    // The treads run a little into the rock on both sides, so no ground shows between them and the wall.
    const tuck = 0.3;
    // (along the climb from the foot, across, height) to world.
    const at = (a: number, l: number, y: number): number[] => (s.dz ? [s.x0 + l, y, s.dz < 0 ? s.z1 - a : s.z0 + a] : [s.dx > 0 ? s.x0 + a : s.x1 - a, y, s.z0 + l]);
    const pos: number[] = [];
    const nor: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    const quad = (c: number[][], face: number[], u: number, v: number) => {
      const b = pos.length / 3;
      c.forEach((q, i) => {
        pos.push(...q);
        nor.push(...face);
        uv.push(i === 1 || i === 2 ? u : 0, i >= 2 ? v : 0);
      });
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    };
    for (let k = 0; k < n; k += 1) {
      const h = (s.top * (k + 1)) / n;
      const lowH = k === 0 ? -0.25 : (s.top * k) / n;
      const a0 = k * depth;
      const a1 = a0 + depth;
      // Both faces are drawn double-sided with a stated normal, so the corner order does not matter.
      quad([at(a0, -tuck, h), at(a0, wide + tuck, h), at(a1, wide + tuck, h), at(a1, -tuck, h)], [0, 1, 0], (wide + tuck * 2) / 0.8, depth / 0.25);
      quad([at(a0, -tuck, lowH), at(a0, wide + tuck, lowH), at(a0, wide + tuck, h), at(a0, -tuck, h)], [-s.dx, 0, -s.dz], (wide + tuck * 2) / 0.8, (h - lowH) / 0.25);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: stone, side: THREE.DoubleSide, emissive: shaded ? 0x000000 : 0x55603f }));
    mesh.castShadow = mesh.receiveShadow = shaded;
    group.add(mesh);
  }
  return group;
}

function padTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.translate(64, 64);
  g.fillStyle = '#4e9a3c';
  g.beginPath();
  g.moveTo(0, 0);
  g.arc(0, 0, 58, 0.35, Math.PI * 2 - 0.05);
  g.closePath();
  g.fill();
  g.fillStyle = '#6dbb4b';
  g.beginPath();
  g.moveTo(0, 0);
  g.arc(0, 0, 50, 0.4, Math.PI * 2 - 0.1);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(40,90,30,0.55)';
  g.lineWidth = 2;
  for (let i = 0; i < 7; i += 1) {
    const a = 0.6 + (i / 7) * (Math.PI * 2 - 0.9);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(Math.cos(a) * 46, Math.sin(a) * 46);
    g.stroke();
  }
  return texture(c);
}

function flowerTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.translate(32, 32);
  for (let i = 0; i < 6; i += 1) {
    g.rotate(Math.PI / 3);
    g.fillStyle = i % 2 ? '#ffc4dc' : '#ff9ec4';
    g.beginPath();
    g.ellipse(0, -14, 8, 15, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#ffd34a';
  g.beginPath();
  g.arc(0, 0, 7, 0, Math.PI * 2);
  g.fill();
  return texture(c);
}

/** Lily pads (and a flower on some) lying on the calm water, in loose patches. */
export function buildLilies(g: Grid): THREE.Group {
  const group = new THREE.Group();
  const pads: THREE.Matrix4[] = [];
  const flowers: THREE.Matrix4[] = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  for (let z = 0.25; z < g.rows; z += 0.55)
    for (let x = 0.25; x < g.cols; x += 0.55) {
      const jx = x + (hash2(Math.round(x * 9), Math.round(z * 9), 1) - 0.5) * 0.4;
      const jz = z + (hash2(Math.round(x * 9), Math.round(z * 9), 2) - 0.5) * 0.4;
      if (weightsAt(g, jx, jz)[2] < 0.93 || noise2(jx * 0.35, jz * 0.35, 41) < 0.58 || hash2(Math.round(jx * 7), Math.round(jz * 7), 3) < 0.35) continue;
      const s = 0.38 + hash2(Math.round(jx * 7), Math.round(jz * 7), 4) * 0.3;
      q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, hash2(Math.round(jx * 7), Math.round(jz * 7), 5) * Math.PI * 2));
      pads.push(m.clone().compose(new THREE.Vector3(jx, -0.095, jz), q, new THREE.Vector3(s, s, 1)));
      if (hash2(Math.round(jx * 7), Math.round(jz * 7), 6) < 0.18) flowers.push(m.clone().compose(new THREE.Vector3(jx + 0.05, -0.07, jz), q, new THREE.Vector3(s * 0.5, s * 0.5, 1)));
    }
  const plane = new THREE.PlaneGeometry(1, 1);
  for (const [list, tex] of [[pads, padTexture()], [flowers, flowerTexture()]] as const) {
    if (!list.length) continue;
    const mesh = new THREE.InstancedMesh(plane, new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, transparent: false }), list.length);
    list.forEach((mx, i) => mesh.setMatrixAt(i, mx));
    mesh.receiveShadow = true;
    mesh.renderOrder = 3;
    group.add(mesh);
  }
  return group;
}
