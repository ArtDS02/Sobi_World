// The party in the diorama: the leader in front with the four-way walking frames, the companions behind, all standing cards with a soft
// contact shadow. It never walks by itself: the host (the game's Walker, or the lab's driver) says where everyone stands, which way the
// leader faces and whether it moves; this only poses the pictures. World units: one tile = 1 (game px / tile).
import * as THREE from 'three';
import { cardOf, type ArtFn } from './artKit';
import { cardSprite, setSprite, withXray, type CardUniforms } from './cards';
import type { Card } from './textures';

export type Face = 'up' | 'down' | 'left' | 'right';
const FACES: Face[] = ['up', 'down', 'left', 'right'];
const FRAMES = ['idle', 'walk1', 'walk2'] as const;
const CYCLE = ['walk1', 'idle', 'walk2', 'idle'] as const;
const LEADER_H = 1.95;
const FOLLOWER_H = 1.25;

/** Where the party is this frame (game px, feet). */
export interface PartyPose {
  leader: { x: number; y: number; face: Face; moving: boolean };
  /** Share of full walking speed, 0–1 (the walking cycle runs faster with it). */
  share: number;
  /** The companions' feet in order, game px. */
  followers: readonly { x: number; y: number }[];
}

export class Party {
  readonly group = new THREE.Group();
  private frames = 0;
  private leader: THREE.Mesh | null = null;
  private followers: THREE.Mesh[] = [];
  private shadows: THREE.Mesh[] = [];
  private readonly leaderCards = new Map<string, Card>();
  private followerCards: Card[] = [];
  private readonly shadowMat: THREE.MeshBasicMaterial;

  constructor(
    private readonly u: CardUniforms,
    blob: THREE.Texture,
    private readonly tile = 40,
  ) {
    this.shadowMat = new THREE.MeshBasicMaterial({ map: blob, color: 0x000000, transparent: true, opacity: 0.38, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  }

  /** Loads the leader (`chr_so` / `chr_bi`, by state `<face>_<frame>`) and the companions by art id; replaces what was there. */
  async setTeam(art: ArtFn, leaderId: string, followerArts: readonly string[]) {
    this.group.clear();
    this.leaderCards.clear();
    const jobs = FACES.flatMap((f) => FRAMES.map(async (fr) => {
      const c = await cardOf(art, leaderId, true, `${f}_${fr}`);
      if (c) this.leaderCards.set(`${f}_${fr}`, c);
    }));
    await Promise.all(jobs);
    // A frame that is a whole sheet (bigger than the others) is not a frame: stand on the first walking frame instead.
    for (const f of FACES) {
      const idle = this.leaderCards.get(`${f}_idle`);
      const walk = this.leaderCards.get(`${f}_walk1`);
      if (idle && walk && (idle.tex.image as HTMLCanvasElement).width > (walk.tex.image as HTMLCanvasElement).width * 2) this.leaderCards.set(`${f}_idle`, walk);
    }
    const first = this.leaderCards.get('down_idle');
    this.followerCards = (await Promise.all(followerArts.map((id) => cardOf(art, id, true)))).filter((c): c is Card => !!c);
    this.leader = first ? withXray(cardSprite(first, this.u), first, this.u) : null;
    this.followers = this.followerCards.map((c) => withXray(cardSprite(c, this.u), c, this.u));
    const bodies = [...(this.leader ? [this.leader] : []), ...this.followers];
    this.shadows = bodies.map(() => new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), this.shadowMat));
    this.group.add(...bodies, ...this.shadows);
  }

  /** World position of the leader's feet. */
  world(pose: PartyPose, ground: (x: number, z: number) => number): THREE.Vector3 {
    const x = pose.leader.x / this.tile;
    const z = pose.leader.y / this.tile;
    return new THREE.Vector3(x, ground(x, z), z);
  }

  update(pose: PartyPose, dtMs: number, t: number, ground: (x: number, z: number) => number) {
    const { leader, share } = pose;
    if (leader.moving) this.frames += (dtMs / 1000) * 8 * Math.max(0.25, share);
    if (!this.leader) return;
    const frame = leader.moving ? CYCLE[Math.floor(this.frames) % 4]! : 'idle';
    const card = this.leaderCards.get(`${leader.face}_${frame}`);
    if (card) setSprite(this.leader, card, LEADER_H);
    const lift = leader.moving ? Math.abs(Math.sin(this.frames * Math.PI * 0.5)) * 0.08 : 0;
    this.stand(this.leader, this.shadows[0]!, leader.x / this.tile, leader.y / this.tile, ground, lift, leader.moving ? 1 : 1 + Math.sin(t * 2.4) * 0.012, 0.9);
    this.followers.forEach((m, i) => {
      const at = pose.followers[i];
      if (!at) return;
      setSprite(m, this.followerCards[i]!, FOLLOWER_H, leader.moving && leader.x < at.x);
      const hop = leader.moving ? Math.abs(Math.sin(this.frames * Math.PI * 0.5 + i * 0.9)) * 0.1 : 0;
      this.stand(m, this.shadows[i + 1]!, at.x / this.tile, at.y / this.tile, ground, hop, 1 + Math.sin(t * 2.2 + i) * 0.015, 0.75);
    });
  }

  private stand(m: THREE.Mesh, sh: THREE.Mesh, x: number, z: number, ground: (x: number, z: number) => number, lift: number, sy: number, shadowW: number) {
    const y = ground(x, z);
    m.position.set(x, y + lift - 0.03, z);
    m.scale.y *= sy;
    sh.position.set(x, y + 0.03, z - 0.05);
    sh.scale.set(shadowW * (1 - lift), 1, shadowW * 0.42 * (1 - lift));
  }
}
