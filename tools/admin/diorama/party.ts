// The party in the diorama (G0): So in front with her four-way walking frames, three companions on her trail, all standing cards
// with a soft contact shadow. Walking uses the game's own rules on the area's own grid (systems/character + adventure logic), so
// where one can walk here is exactly where one can walk in the game. World units: one tile = 1 (game px / 40).
import * as THREE from 'three';
import { stepCharacter, type Walkable } from '../../../src/systems/character';
import { AB } from '../../../src/areas/adventure/logic/config/content';
import { approachVelocity, unitOf } from '../../../src/areas/adventure/logic/walkMotion';
import { cardSprite, setSprite, withXray, type CardUniforms } from './cards';
import { loadCard, type Card } from './textures';

type Face = 'up' | 'down' | 'left' | 'right';
const FACES: Face[] = ['up', 'down', 'left', 'right'];
const FRAMES = ['idle', 'walk1', 'walk2'] as const;
const CYCLE = ['walk1', 'idle', 'walk2', 'idle'] as const;
const LEADER_H = 1.95;
const FOLLOWER_H = 1.25;
const GAP = 1.05;

export class Party {
  readonly group = new THREE.Group();
  /** Feet, game px. */
  pos = { x: 0, y: 0 };
  private vel = { x: 0, y: 0 };
  private face: Face = 'down';
  private frames = 0;
  private moving = false;

  get isMoving(): boolean {
    return this.moving;
  }

  /** The eased walking velocity, as a share of full speed per axis (x right, y down the area). */
  get heading(): { x: number; y: number } {
    return this.vel;
  }
  private trail: { x: number; y: number }[] = [];
  private leader!: THREE.Mesh;
  private followers: THREE.Mesh[] = [];
  private shadows: THREE.Mesh[] = [];
  private leaderCards = new Map<string, Card>();
  private followerCards: Card[] = [];

  constructor(private readonly u: CardUniforms, private readonly blob: THREE.Texture) {}

  async load(leaderArt: string, followerUrls: string[]) {
    const jobs = FACES.flatMap((f) => FRAMES.map(async (fr) => this.leaderCards.set(`${f}_${fr}`, await loadCard(`/assets/props/${leaderArt}_${f}_${fr}.png`, true))));
    await Promise.all(jobs);
    // A frame that is a whole sheet (bigger than the others) is not a frame: stand on the first walking frame instead.
    for (const f of FACES) {
      const idle = this.leaderCards.get(`${f}_idle`);
      const walk = this.leaderCards.get(`${f}_walk1`);
      if (idle && walk && (idle.tex.image as HTMLCanvasElement).width > (walk.tex.image as HTMLCanvasElement).width * 2) this.leaderCards.set(`${f}_idle`, walk);
    }
    this.followerCards = await Promise.all(followerUrls.map((url) => loadCard(url, true)));
    this.leader = withXray(cardSprite(this.leaderCards.get('down_idle')!, this.u), this.leaderCards.get('down_idle')!, this.u);
    this.group.add(this.leader);
    this.followers = this.followerCards.map((c) => {
      const m = withXray(cardSprite(c, this.u), c, this.u);
      this.group.add(m);
      return m;
    });
    const shadowMat = new THREE.MeshBasicMaterial({ map: this.blob, color: 0x000000, transparent: true, opacity: 0.38, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    this.shadows = [this.leader, ...this.followers].map(() => {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), shadowMat);
      this.group.add(s);
      return s;
    });
  }

  /** Puts the party at (px, py) game px; the companions line up behind it toward `back` (a unit vector into open ground). */
  place(px: number, py: number, back: { x: number; y: number } = { x: -1, y: 0 }) {
    this.pos = { x: px, y: py };
    this.trail = Array.from({ length: 160 }, (_, i) => ({ x: px + back.x * i * 1.1, y: py + back.y * i * 1.1 }));
  }

  /** World position of the leader's feet. */
  world(ground: (x: number, z: number) => number): THREE.Vector3 {
    const x = this.pos.x / 40;
    const z = this.pos.y / 40;
    return new THREE.Vector3(x, ground(x, z), z);
  }

  update(dir: { x: number; y: number }, dtMs: number, walk: Walkable, t: number, ground: (x: number, z: number) => number) {
    this.vel = approachVelocity(this.vel, unitOf(dir), dtMs);
    const share = Math.min(1, Math.hypot(this.vel.x, this.vel.y));
    const next = share > 0 ? stepCharacter({ x: this.pos.x, y: this.pos.y, facing: this.face, moving: this.moving }, this.vel, dtMs, AB.explore.speed * share, walk) : { ...this.pos, facing: this.face, moving: false };
    const moved = Math.hypot(next.x - this.pos.x, next.y - this.pos.y);
    this.moving = next.moving && moved > 0.01;
    if (!this.moving && share > 0) this.vel = { x: 0, y: 0 };
    this.pos = { x: next.x, y: next.y };
    if (dir.x !== 0 || dir.y !== 0) this.face = Math.abs(dir.x) > Math.abs(dir.y) ? (dir.x > 0 ? 'right' : 'left') : dir.y > 0 ? 'down' : 'up';
    if (this.moving) this.frames += (dtMs / 1000) * 8 * share;
    const head = this.trail[0];
    if (moved > 0 && (!head || Math.hypot(this.pos.x - head.x, this.pos.y - head.y) >= 3)) {
      this.trail.unshift({ ...this.pos });
      if (this.trail.length > 200) this.trail.length = 200;
    }
    const frame = this.moving ? CYCLE[Math.floor(this.frames) % 4]! : 'idle';
    const card = this.leaderCards.get(`${this.face}_${frame}`);
    if (card) setSprite(this.leader, card, LEADER_H);
    const lift = this.moving ? Math.abs(Math.sin(this.frames * Math.PI * 0.5)) * 0.08 : 0;
    const breathe = this.moving ? 1 : 1 + Math.sin(t * 2.4) * 0.012;
    this.stand(this.leader, this.shadows[0]!, this.pos.x / 40, this.pos.y / 40, ground, lift, breathe, 0.9);
    this.followers.forEach((m, i) => {
      const at = this.behind((i + 1) * GAP * 40);
      const ahead = this.behind(i * GAP * 40 + 12);
      setSprite(m, this.followerCards[i]!, FOLLOWER_H, ahead.x < at.x);
      const hop = this.moving ? Math.abs(Math.sin(this.frames * Math.PI * 0.5 + i * 0.9)) * 0.1 : 0;
      this.stand(m, this.shadows[i + 1]!, at.x / 40, at.y / 40, ground, hop, 1 + Math.sin(t * 2.2 + i) * 0.015, 0.75);
    });
  }

  private stand(m: THREE.Mesh, sh: THREE.Mesh, x: number, z: number, ground: (x: number, z: number) => number, lift: number, sy: number, shadowW: number) {
    const y = ground(x, z);
    m.position.set(x, y + lift - 0.03, z);
    m.scale.y *= sy;
    sh.position.set(x, y + 0.03, z - 0.05);
    sh.scale.set(shadowW * (1 - lift), 1, shadowW * 0.42 * (1 - lift));
  }

  /** The point `d` px back along the leader's trail. */
  private behind(d: number): { x: number; y: number } {
    let left = d;
    let prev = this.pos;
    for (const p of this.trail) {
      const seg = Math.hypot(p.x - prev.x, p.y - prev.y);
      if (seg >= left) {
        const k = left / Math.max(1e-6, seg);
        return { x: prev.x + (p.x - prev.x) * k, y: prev.y + (p.y - prev.y) * k };
      }
      left -= seg;
      prev = p;
    }
    return prev;
  }
}
