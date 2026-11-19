// The enemy groups and chests of the diorama, brought to life without new art: each picture breathes (squash and stretch), hops now
// and then, turns to face the party like a paper cut-out when it comes near (the width runs through zero, so the turn reads as a flip,
// not a pop), and leans in when the party is close. A sleeping group only breathes slowly; a defeated one is gone; a golden one stands
// in a ring of gold; a mimic shows as a closed chest. Chests glint and pulse when the party is near, and show their open picture once
// opened. Soft contact shadows ground them all. The host says each one's state (`setFoe`, `setChest`) from the scene state.
import * as THREE from 'three';
import { cardSprite, setSprite, type CardUniforms } from './cards';
import type { Card } from './textures';

/** The state of an enemy group, from the scene state (decision 045). */
export interface FoeState {
  asleep: boolean;
  defeated: boolean;
  golden: boolean;
  disguised: boolean;
}

export interface Foe {
  id: string;
  mesh: THREE.Mesh;
  /** The closed chest it pretends to be, shown while disguised (null: no picture). */
  mimic: THREE.Mesh | null;
  shadow: THREE.Mesh;
  ring: THREE.Sprite;
  card: Card;
  x: number;
  z: number;
  h: number;
  phase: number;
  /** -1 … 1: which way it faces (the picture's own way = 1). */
  face: number;
  state: FoeState;
}

interface Chest {
  id: string;
  shut: THREE.Mesh;
  open: THREE.Mesh | null;
  card: Card;
  glint: THREE.Sprite;
  x: number;
  z: number;
  phase: number;
  opened: boolean;
}

export interface FoeSpec {
  id: string;
  card: Card;
  mimic: Card | null;
  x: number;
  z: number;
  h: number;
  phase: number;
}

export interface ChestSpec {
  id: string;
  card: Card;
  openCard: Card | null;
  x: number;
  z: number;
  phase: number;
}

const NOTICE = 6.5;
const CHEST_H = 1.05;
const CALM: FoeState = { asleep: false, defeated: false, golden: false, disguised: false };

export class Foes {
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

  private stand(card: Card, x: number, z: number, h: number): THREE.Mesh {
    const mesh = cardSprite(card, this.u);
    setSprite(mesh, card, h);
    mesh.position.set(x, this.ground(x, z) - 0.03, z);
    this.group.add(mesh);
    return mesh;
  }

  addFoe(s: FoeSpec) {
    const mesh = this.stand(s.card, s.x, s.z, s.h);
    const mimic = s.mimic ? this.stand(s.mimic, s.x, s.z, CHEST_H) : null;
    if (mimic) mimic.visible = false;
    const ring = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.blob, color: new THREE.Color(2.0, 1.55, 0.5), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.55 }));
    ring.position.set(s.x, this.ground(s.x, s.z) + 0.08, s.z);
    ring.scale.set(s.h * s.card.aspect * 1.1, s.h * s.card.aspect * 0.5, 1);
    ring.visible = false;
    this.group.add(ring);
    this.foes.push({ id: s.id, mesh, mimic, shadow: this.shadow(s.x, s.z, s.h * s.card.aspect * 0.85), ring, card: s.card, x: s.x, z: s.z, h: s.h, phase: s.phase, face: 1, state: CALM });
  }

  addChest(s: ChestSpec) {
    const shut = this.stand(s.card, s.x, s.z, CHEST_H);
    const open = s.openCard ? this.stand(s.openCard, s.x, s.z, CHEST_H) : null;
    if (open) open.visible = false;
    const glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.blob, color: new THREE.Color(2.2, 1.9, 1.1), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    glint.position.set(s.x, this.ground(s.x, s.z) + 1.15, s.z);
    this.group.add(glint);
    this.shadow(s.x, s.z, CHEST_H * s.card.aspect * 0.9);
    this.chests.push({ id: s.id, shut, open, card: s.card, glint, x: s.x, z: s.z, phase: s.phase, opened: false });
  }

  /** Sets what a group looks like now (asleep, defeated, golden, a mimic still disguised). */
  setFoe(id: string, state: FoeState) {
    const f = this.foes.find((x) => x.id === id);
    if (!f) return;
    f.state = state;
    const shown = !state.defeated;
    f.mesh.visible = shown && !(state.disguised && f.mimic);
    if (f.mimic) f.mimic.visible = shown && state.disguised;
    f.shadow.visible = shown;
    f.ring.visible = shown && state.golden;
  }

  /** Shows a chest shut or opened (its open picture, no glint). */
  setChest(id: string, opened: boolean) {
    const c = this.chests.find((x) => x.id === id);
    if (!c) return;
    c.opened = opened && !!c.open;
    c.shut.visible = !c.opened;
    if (c.open) c.open.visible = c.opened;
    c.glint.visible = !opened;
  }

  /** Poses everything for time `t` (s), `dt` (s) since the last frame, the party at `party`. */
  update(t: number, dt: number, party: THREE.Vector3) {
    for (const f of this.foes) {
      if (f.state.defeated) continue;
      const dist = Math.hypot(party.x - f.x, party.z - f.z);
      const asleep = f.state.asleep;
      const near = asleep ? 0 : Math.max(0, 1 - dist / NOTICE);
      // Pictures face left by default (they face the party in battle from the right): turn toward the party when it is near.
      const want = near > 0 ? (party.x > f.x ? -1 : 1) : f.face > 0 ? 1 : -1;
      f.face += Math.sign(want - f.face) * Math.min(Math.abs(want - f.face), dt * 7);
      const breath = Math.sin(t * (asleep ? 1.1 : 2 + near * 2.5) + f.phase);
      const period = 3.2 + (f.phase % 1.7);
      const k = ((t + f.phase * 1.3) % period) / period;
      const hop = !asleep && k < 0.09 ? Math.sin((k / 0.09) * Math.PI) * (0.16 + near * 0.12) : 0;
      const squash = !asleep && k < 0.09 ? 1 - Math.sin((k / 0.09) * Math.PI) * 0.06 : 1;
      const sy = (1 + breath * (asleep ? 0.05 : 0.035)) * (2 - squash);
      const sx = (1 - breath * 0.025) * squash;
      // A paper turn: the width runs through a thin edge, never fully flat.
      const turn = Math.sign(f.face || 1) * Math.max(0.08, Math.abs(f.face));
      f.mesh.scale.set(f.h * f.card.aspect * sx * turn, f.h * sy, 1);
      f.mesh.position.set(f.x, this.ground(f.x, f.z) - 0.03 + hop, f.z);
      f.mesh.rotation.z = Math.sin(t * 1.3 + f.phase) * 0.03 + near * 0.06 * Math.sign(party.x - f.x);
      f.shadow.scale.set(f.h * f.card.aspect * 0.85 * (1 - hop * 0.8), 1, f.h * f.card.aspect * 0.36 * (1 - hop * 0.8));
      if (f.ring.visible) f.ring.material.opacity = 0.4 + 0.2 * Math.sin(t * 2.2 + f.phase);
    }
    for (const c of this.chests) {
      const near = Math.max(0, 1 - Math.hypot(party.x - c.x, party.z - c.z) / 4);
      const p = Math.max(0, Math.sin(t * 1.6 + c.phase));
      c.glint.scale.setScalar(0.25 + p * 0.35 + near * 0.3);
      c.glint.material.opacity = 0.2 + p * 0.7 + near * 0.3;
      if (c.opened) continue;
      const s = CHEST_H * (1 + near * 0.06 * (0.5 + 0.5 * Math.sin(t * 6)));
      c.shut.scale.set(s * c.card.aspect, s, 1);
    }
  }
}
