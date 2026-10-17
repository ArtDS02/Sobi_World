// The party on the map (spec §3.3): So or Bi in front, walking with the keys against the area's grid (systems/character: feet box,
// sliding along walls), and the three companions following on the leader's trail, bobbing as they walk. Phaser only.
import * as Phaser from 'phaser';
import { stepCharacter, type Vec, type Walkable } from '../../../systems/character';
import { FALLBACK_PROP_KEY, textureKey } from '../../../ui/world/keys';
import { AB } from '../logic/config/content';
import type { Facing, ScenePos } from './sceneState';

const CYCLE = ['walk1', 'idle', 'walk2', 'idle'] as const;
const WALK_FPS = 8;
/** Distance (px) between two followers on the trail. */
const GAP = 42;
const LEADER_HEIGHT = 120;
const FOLLOWER_HEIGHT = 74;

export class Walker {
  private pos: ScenePos = { x: 0, y: 0, facing: 'down' };
  private moving = false;
  private walkedMs = 0;
  private trail: Vec[] = [];
  private readonly leader: Phaser.GameObjects.Image;
  private followers: Phaser.GameObjects.Image[] = [];

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
    const next = stepCharacter({ x: this.pos.x, y: this.pos.y, facing: this.pos.facing, moving: this.moving }, dir, dtMs, AB.explore.speed, walk);
    const covered = Math.hypot(next.x - this.pos.x, next.y - this.pos.y);
    this.moving = next.moving;
    this.walkedMs = this.moving ? this.walkedMs + dtMs : 0;
    this.pos = { x: next.x, y: next.y, facing: next.facing as Facing };
    const head = this.trail[0];
    if (covered > 0 && (!head || Math.hypot(this.pos.x - head.x, this.pos.y - head.y) >= 4)) {
      this.trail.unshift({ x: this.pos.x, y: this.pos.y });
      if (this.trail.length > 200) this.trail.length = 200;
    }
    const frame = this.moving ? CYCLE[Math.floor((this.walkedMs / 1000) * WALK_FPS) % CYCLE.length]! : 'idle';
    const k = textureKey(leaderArt, `${this.pos.facing}_${frame}`);
    this.leader.setTexture(this.scene.textures.exists(k) ? k : FALLBACK_PROP_KEY);
    const ratio = this.leader.height > 0 ? this.leader.width / this.leader.height : 0.66;
    this.leader.setDisplaySize(LEADER_HEIGHT * ratio, LEADER_HEIGHT).setPosition(this.pos.x, this.pos.y + 6).setDepth(this.pos.y);
    this.followers.forEach((img, i) => {
      const at = this.pointBehind((i + 1) * GAP);
      const hop = bob && this.moving ? Math.abs(Math.sin((this.walkedMs / 1000) * 9 + i)) * 6 : 0;
      img.setPosition(at.x, at.y + 4 - hop).setDepth(at.y - 1);
      img.setFlipX(at.x > this.pos.x + 2);
    });
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

  setVisible(on: boolean) {
    this.leader.setVisible(on);
    for (const f of this.followers) f.setVisible(on);
  }
}
