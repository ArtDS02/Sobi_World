// Ground details of the diorama (G0) the height field alone does not show: painted cliff faces stood along every drop of high ground
// (the kit's cliff strip, so a plateau reads as a cliff and not a smudge), and lily pads with a few flowers floating on calm water.
import * as THREE from 'three';
import { heightAt, weightsAt, type Grid } from './field';
import { hash2, noise2 } from './noise';
import { texture } from './textures';

/** Where the ground drops by more than this between a tile and the one below it, a cliff face stands. */
const DROP = 0.7;
/** Width of one face piece, and texture u per world unit (the strip is 4:1 and a face about 2 units tall). */
const STEP = 0.5;
const U_PER = 0.126;

export function buildCliffs(g: Grid, strip: THREE.Texture): THREE.Mesh {
  strip.wrapS = THREE.RepeatWrapping;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const quad = (x0: number, x1: number, z0: number, z1: number, yTop0: number, yTop1: number, yBot: number, u: number) => {
    const b = pos.length / 3;
    pos.push(x0, yBot, z0, x1, yBot, z1, x1, yTop1, z1, x0, yTop0, z0);
    uv.push(u, 0, u + STEP * U_PER, 0, u + STEP * U_PER, 1, u, 1);
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  };
  for (let y = 0; y < g.rows; y += 1)
    for (let x = 0; x < g.cols; x += STEP) {
      const top = heightAt(g, x + STEP / 2, y + 0.2);
      const low = heightAt(g, x + STEP / 2, y + 1.8);
      if (top - low < DROP) continue;
      // The face stands where the ground crosses half way down, sampled at both ends of the piece so it follows the edge.
      const edgeZ = (cx: number) => {
        for (let z = y + 0.2; z < y + 1.8; z += 0.05) if (heightAt(g, cx, z) < (top + low) / 2) return z;
        return y + 1;
      };
      const za = edgeZ(x);
      const zb = edgeZ(x + STEP);
      quad(x, x + STEP, za + 0.18, zb + 0.18, heightAt(g, x, za - 0.25) + 0.08, heightAt(g, x + STEP, zb - 0.25) + 0.08, low - 0.05, x * U_PER);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ map: strip, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
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
