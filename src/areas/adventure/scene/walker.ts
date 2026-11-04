// The party on the map (spec §3.3): So or Bi in front, walking with the keys against the area's grid (systems/character: feet box,
// sliding along walls), and the three companions following on the leader's trail, bobbing as they walk. Phaser only.
import * as Phaser from 'phaser';
import { stepCharacter, type Vec, type Walkable } from '../../../systems/character';
import { FALLBACK_PROP_KEY, textureKey } from '../../../ui/world/keys';
import { AB } from '../logic/config/content';
import {
  SETTLE_MS, FOLLOWER_EASE_MS, SQUASH_SHARE, approachVelocity, followerBob, followerFlip, frameRate, leaderBob, pickFace, snapToPixel, unitOf,
  type BodyBob, type FaceState,
} from '../logic/walkMotion';
import type { Facing, ScenePos } from './sceneState';

const CYCLE = ['walk1', 'idle', 'walk2', 'idle'] as const;
const SHADOW_TEX = 'advmap_shadow';
/** Distance (px) between two followers on the trail. */
const GAP = 42;
const LEADER_HEIGHT = 120;
const FOLLOWER_HEIGHT = 74;

export class Walker {
  private pos: ScenePos = { x: 0, y: 0, facing: 'down' };
  private moving = false;
  /** Frames of the walking cycle played so far (the cycle speeds up and slows down with the walking speed, ANIM-091). */
  private frames = 0;
  /** Speed as a share of full speed, per axis: eased, so the party speeds up and slows down (ANIM-090). */
  private vel: Vec = { x: 0, y: 0 };
  private face: FaceState = { shown: 'down', pending: null, pendingMs: 0 };
  private settleMs = SETTLE_MS;
  private clockMs = 0;
  private moveK: number[] = [];
  private flips: boolean[] = [];
  private shadows: Phaser.GameObjects.Image[] = [];
  private trail: Vec[] = [];
  private readonly leader: Phaser.GameObjects.Image;
  private followers: Phaser.GameObjects.Image[] = [];
  /** How far the party has dissolved into a gate's light (0 = solid, 1 = gone). */
  private warp = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.leader = scene.add.image(0, 0, FALLBACK_PROP_KEY).setOrigin(0.5, 1);
  }

  get position(): ScenePos {
    return { ...this.pos };
  }

  get isMoving(): boolean {
    return this.moving;
  }

  place(p: ScenePos) {
    this.pos = { ...p };
    // The followers start in a short line behind the leader (they fall in on its trail once it walks).
    this.trail = Array.from({ length: 120 }, (_, i) => ({ x: p.x - i * 1.5, y: p.y - i * 0.4 }));
    this.moving = false;
    this.vel = { x: 0, y: 0 };
    this.frames = 0;
    this.face = { shown: p.facing, pending: null, pendingMs: 0 };
  }

  /** A soft ellipse on the ground under each walker (made once). */
  private shadow(i: number): Phaser.GameObjects.Image {
    if (!this.scene.textures.exists(SHADOW_TEX)) {
      const tex = this.scene.textures.createCanvas(SHADOW_TEX, 64, 64);
      const c = tex?.getContext();
      if (tex && c) {
        const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(0,0,0,0.5)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, 64, 64);
        tex.refresh();
      }
    }
    while (this.shadows.length <= i) this.shadows.push(this.scene.add.image(0, 0, SHADOW_TEX).setOrigin(0.5, 0.5));
    return this.shadows[i]!;
  }

  /** The followers' pictures (one per team member). */
  setFollowers(arts: { art: string; down: boolean }[]) {
    while (this.followers.length > arts.length) this.followers.pop()!.destroy();
    while (this.followers.length < arts.length) this.followers.push(this.scene.add.image(0, 0, FALLBACK_PROP_KEY).setOrigin(0.5, 1));
    arts.forEach((a, i) => {
      const img = this.followers[i]!;
      const k = this.scene.textures.exists(textureKey(a.art)) ? textureKey(a.art) : FALLBACK_PROP_KEY;
      if (img.texture.key !== k) img.setTexture(k);
      const ratio = img.height > 0 ? img.width / img.height : 1;
      img.setDisplaySize(FOLLOWER_HEIGHT * ratio, FOLLOWER_HEIGHT).setAlpha(a.down ? 0.45 : 1);
    });
  }

  /** One frame: walk along `dir` (keys) on `walk`, then draw. */
  update(dir: Vec, dtMs: number, walk: Walkable, leaderArt: string, bob: boolean) {
    this.clockMs += dtMs;
    // The asked direction becomes a velocity that eases in and out; the collision step gets that direction and a share of the speed.
    this.vel = approachVelocity(this.vel, unitOf(dir), dtMs);
    const share = Math.min(1, Math.hypot(this.vel.x, this.vel.y));
    const was = this.moving;
    const next =
      share > 0
        ? stepCharacter({ x: this.pos.x, y: this.pos.y, facing: this.pos.facing, moving: this.moving }, this.vel, dtMs, AB.explore.speed * share, walk)
        : { ...this.pos, moving: false };
    const covered = Math.hypot(next.x - this.pos.x, next.y - this.pos.y);
    this.moving = next.moving;
    // Against a wall the speed is lost, so the party does not keep pushing.
    if (!this.moving && share > 0) this.vel = { x: 0, y: 0 };
    if (this.moving) this.frames += (frameRate(AB.explore.speed * share) * dtMs) / 1000;
    else if (was) {
      this.frames = 0;
      this.settleMs = 0;
    } else this.settleMs = Math.min(SETTLE_MS, this.settleMs + dtMs);
    this.pos = { x: next.x, y: next.y, facing: next.facing as Facing };
    this.face = pickFace(dir, this.face, dtMs);
    const head = this.trail[0];
    if (covered > 0 && (!head || Math.hypot(this.pos.x - head.x, this.pos.y - head.y) >= 4)) {
      this.trail.unshift({ x: this.pos.x, y: this.pos.y });
      if (this.trail.length > 200) this.trail.length = 200;
    }
    const frame = this.moving ? CYCLE[Math.floor(this.frames) % CYCLE.length]! : 'idle';
    const k = textureKey(leaderArt, `${this.face.shown}_${frame}`);
    this.leader.setTexture(this.scene.textures.exists(k) ? k : FALLBACK_PROP_KEY);
    const ratio = this.leader.height > 0 ? this.leader.width / this.leader.height : 0.66;
    // Two frames make a step (a foot lands on each walk frame); standing, the body settles for a moment.
    const steps = this.frames / 2;
    const vertical = this.face.shown === 'up' || this.face.shown === 'down';
    const body: BodyBob = bob
      ? this.moving
        ? leaderBob(steps, vertical)
        : { lift: 0, sy: 1 - SQUASH_SHARE * 0.5 * (1 - this.settleMs / SETTLE_MS), rot: 0 }
      : { lift: 0, sy: 1, rot: 0 };
    const zoom = this.scene.cameras.main.zoom;
    const px = snapToPixel(this.pos.x, zoom);
    const py = snapToPixel(this.pos.y + 6, zoom);
    this.leader.setDisplaySize(LEADER_HEIGHT * ratio, LEADER_HEIGHT);
    this.leader.setScale(this.leader.scaleX, this.leader.scaleY * body.sy).setAngle(body.rot).setPosition(px, py - body.lift).setDepth(this.pos.y);
    this.drawShadow(0, px, py, LEADER_HEIGHT * ratio * 0.7, body.lift, this.pos.y);
    this.followers.forEach((img, i) => {
      const at = this.pointBehind((i + 1) * GAP);
      const ahead = this.pointBehind(i * GAP + 14);
      this.flips[i] = followerFlip(at, ahead, this.flips[i] ?? false);
      const target = this.moving ? 1 : 0;
      const prev = this.moveK[i] ?? 0;
      const mk = prev + (target - prev) * (1 - Math.exp(-dtMs / FOLLOWER_EASE_MS));
      this.moveK[i] = mk;
      const fb = bob ? followerBob(steps, i, mk, this.clockMs) : { lift: 0, sy: 1, rot: 0 };
      const fx = snapToPixel(at.x, zoom);
      const fy = snapToPixel(at.y + 4, zoom);
      img.setDisplaySize(img.displayWidth, FOLLOWER_HEIGHT);
      img.setScale(img.scaleX, img.scaleY * fb.sy).setPosition(fx, fy - fb.lift).setDepth(at.y - 0.001 * (i + 1));
      img.setFlipX(this.flips[i]!);
      this.drawShadow(i + 1, fx, fy, img.displayWidth * 0.8, fb.lift * 1.5, at.y - 0.001 * (i + 1));
    });
    for (let i = this.followers.length + 1; i < this.shadows.length; i += 1) this.shadows[i]!.setVisible(false);
  }

  /** The shadow stays on the ground; the higher the body, the smaller and fainter it is. */
  private drawShadow(i: number, x: number, y: number, width: number, lift: number, depth: number) {
    const sh = this.shadow(i);
    const k = Math.max(0.6, 1 - lift / 24);
    sh.setVisible(true).setPosition(x, y - 2).setDisplaySize(width * k, width * k * 0.28).setAlpha(k).setDepth(depth - 0.5);
  }

  /** The point `dist` px back along the trail. */
  private pointBehind(dist: number): Vec {
    let left = dist;
    for (let i = 1; i < this.trail.length; i += 1) {
      const a = this.trail[i - 1]!;
      const b = this.trail[i]!;
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      if (d >= left) return { x: a.x + ((b.x - a.x) * left) / Math.max(d, 1e-6), y: a.y + ((b.y - a.y) * left) / Math.max(d, 1e-6) };
      left -= d;
    }
    return this.trail.at(-1) ?? this.pos;
  }

  /** The party dissolving into (or coming out of) a teleport gate's light: thinner, taller, brighter and fading. */
  setWarp(k: number) {
    if (k === this.warp && k === 0) return;
    this.warp = k;
    for (const img of [this.leader, ...this.followers]) {
      // Solid again: the leader is whole, the followers' own alpha is set by setFollowers every frame.
      if (k <= 0) img.clearTint();
      else img.setScale(img.scaleX * (1 - 0.55 * k), img.scaleY * (1 + 0.5 * k)).setAlpha(1 - k).setTint(0xffffff, 0xffffff, 0xbfefff, 0xbfefff);
    }
    if (k <= 0) this.leader.setAlpha(1);
  }

  setVisible(on: boolean) {
    this.leader.setVisible(on);
    for (const f of this.followers) f.setVisible(on);
    if (!on) for (const sh of this.shadows) sh.setVisible(false);
  }
}
