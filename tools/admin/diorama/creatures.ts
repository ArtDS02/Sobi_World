// The enemy groups and chests of the diorama (G0), brought to life without new art: each picture breathes (squash and stretch), hops
// now and then, turns to face the party like a paper cut-out when it comes near (the width runs through zero, so the turn reads as a
// flip, not a pop), and leans in when the party is close. Chests glint and pulse when the party is near. Soft contact shadows ground
// them all.
import * as THREE from 'three';
import { cardSprite, setSprite, type CardUniforms } from './cards';
import type { Card } from './textures';

interface Foe {
  mesh: THREE.Mesh;
  shadow: THREE.Mesh;
  card: Card;
  x: number;
  z: number;
  h: number;
  phase: number;
  /** -1 … 1: which way it faces (the picture's own way = 1). */
  face: number;
}

interface Chest {
  mesh: THREE.Mesh;
  card: Card;
  glint: THREE.Sprite;
  x: number;
  z: number;
  phase: number;
}

const NOTICE = 6.5;

export class Creatures {
  readonly group = new THREE.Group();
  readonly foes: Foe[] = [];
  private readonly chests: Chest[] = [];
  private readonly shadowMat: THREE.MeshBasicMaterial;

  constructor(
    private readonly u: CardUniforms,
    private readonly blob: THREE.Texture,
    private readonly ground: (x: number, z: number) => number,
  ) {
    this.shadowMat = new THREE.MeshBasicMaterial({ map: blob, color: 0x000000, transparent: true, opacity: 0.42, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  }

  private shadow(x: number, z: number, w: number): THREE.Mesh {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), this.shadowMat);
    s.position.set(x, this.ground(x, z) + 0.03, z - 0.05);
    s.scale.set(w, 1, w * 0.42);
    this.group.add(s);
    return s;
  }

  addFoe(card: Card, x: number, z: number, h: number, phase: number) {
    const mesh = cardSprite(card, this.u);
    setSprite(mesh, card, h);
    mesh.position.set(x, this.ground(x, z) - 0.03, z);
    this.group.add(mesh);
    this.foes.push({ mesh, shadow: this.shadow(x, z, h * card.aspect * 0.85), card, x, z, h, phase, face: 1 });
  }

  addChest(card: Card, x: number, z: number, phase: number) {
    const mesh = cardSprite(card, this.u);
    setSprite(mesh, card, 1.05);
    mesh.position.set(x, this.ground(x, z) - 0.03, z);
    const glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.blob, color: new THREE.Color(2.2, 1.9, 1.1), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    glint.position.set(x, this.ground(x, z) + 1.15, z);
    this.group.add(mesh, glint);
    this.shadow(x, z, 1.05 * card.aspect * 0.9);
    this.chests.push({ mesh, card, glint, x, z, phase });
  }

  /** Poses everything for time `t` (s), `dt` (s) since the last frame, the party at `party`. */
  update(t: number, dt: number, party: THREE.Vector3) {
    for (const f of this.foes) {
      const dist = Math.hypot(party.x - f.x, party.z - f.z);
      const near = Math.max(0, 1 - dist / NOTICE);
      // Pictures face left by default (they face the party in battle from the right): turn toward the party when it is near.
      const want = near > 0 ? (party.x > f.x ? -1 : 1) : f.face > 0 ? 1 : -1;
      f.face += Math.sign(want - f.face) * Math.min(Math.abs(want - f.face), dt * 7);
      const breath = Math.sin(t * (2 + near * 2.5) + f.phase);
      const period = 3.2 + (f.phase % 1.7);
      const k = ((t + f.phase * 1.3) % period) / period;
      const hop = k < 0.09 ? Math.sin((k / 0.09) * Math.PI) * (0.16 + near * 0.12) : 0;
      const squash = k < 0.09 ? 1 - Math.sin((k / 0.09) * Math.PI) * 0.06 : 1;
      const sy = (1 + breath * 0.035) * (2 - squash);
      const sx = (1 - breath * 0.025) * squash;
      // A paper turn: the width runs through a thin edge, never fully flat.
      const turn = Math.sign(f.face || 1) * Math.max(0.08, Math.abs(f.face));
      f.mesh.scale.set(f.h * f.card.aspect * sx * turn, f.h * sy, 1);
      f.mesh.position.set(f.x, this.ground(f.x, f.z) - 0.03 + hop, f.z);
      f.mesh.rotation.z = Math.sin(t * 1.3 + f.phase) * 0.03 + near * 0.06 * Math.sign(party.x - f.x);
      f.shadow.scale.set(f.h * f.card.aspect * 0.85 * (1 - hop * 0.8), 1, f.h * f.card.aspect * 0.36 * (1 - hop * 0.8));
    }
    for (const c of this.chests) {
      const near = Math.max(0, 1 - Math.hypot(party.x - c.x, party.z - c.z) / 4);
      const p = Math.max(0, Math.sin(t * 1.6 + c.phase));
      c.glint.scale.setScalar(0.25 + p * 0.35 + near * 0.3);
      c.glint.material.opacity = 0.2 + p * 0.7 + near * 0.3;
      const s = 1.05 * (1 + near * 0.06 * (0.5 + 0.5 * Math.sin(t * 6)));
      c.mesh.scale.set(s * c.card.aspect, s, 1);
    }
  }
}
