// The farm's pig life simulation (DECISIONS PL-1): ONE central AI step every PIG_LIFE.tickMs for
// every pig (no timer per pig, nothing per frame), driven from the scene's update. Each pig has a
// PigBrain (needs → priority → activity → target); this class feeds the brains the world (care
// data from the store, trough / sleep / friend targets) and turns their commands into PigMover /
// PigSprite calls. World events (a trough meal) arrive through the FeedbackDirector (`onEvent`).
import { PIG_HOUSE_PROP_ID } from '../../../../core/config/assetIds';
import { PIG_LIFE } from '../../../../core/config/pigLife';
import type { GameEvent } from '../../../../core/events';
import type { Pig } from '../../logic/types';
import type { PigSprite } from '../prefabs/PigSprite';
import { othersOf } from '../prefabs/crowd';
import { msSinceDawn } from './DayNightDirector';
import type { BrainCommand, BrainWorld, Point } from '../state/brainWorld';
import { PigBrain } from '../state/pigBrain';
import type { PigRestState } from '../state/sleepCycle';
import { clampToEllipse, walkEllipse, wanderTarget } from '../state/wander';
import type { Rect } from '../view/giftPlacement';
import type { FarmLayout } from '../view/pigView';

export interface LifeEnv {
  layout: FarmLayout;
  now(): number;
  night(): boolean;
  reduceMotion(): boolean;
  pigs(): ReadonlyMap<string, PigSprite>;
  /** The pigs' data right now (hunger, cleanliness, sickness, pregnancy). */
  data(): readonly Pig[];
  trough(): Rect | null;
}

const F = PIG_LIFE.feed;

export class PigLife {
  private readonly brains = new Map<string, PigBrain>();
  /** Trough place index reserved by each eating pig (light reservation, PL-1). */
  private readonly feedSpots = new Map<string, number>();
  private acc = 0;
  private night: boolean;
  private dayStartedAt = -Infinity;
  /** The pigs' data of the current step. */
  private data = new Map<string, Pig>();

  constructor(private readonly env: LifeEnv) {
    this.night = env.night();
  }

  /** A pig appears (spawn, birth, load): its brain, and the pose it appears in. */
  add(pigId: string): PigRestState {
    let brain = this.brains.get(pigId);
    if (!brain) {
      brain = new PigBrain(pigId, this.env.now(), this.env.night(), msSinceDawn(this.env.now()));
      this.brains.set(pigId, brain);
    }
    return brain.restPose();
  }

  remove(pigId: string) {
    this.brains.delete(pigId);
    this.feedSpots.delete(pigId);
  }

  /** Brain of a pig (tests, dev tools). */
  brain(pigId: string): PigBrain | undefined {
    return this.brains.get(pigId);
  }

  /** Scene update: accumulate frame time, step the AI on the central interval only. */
  update(deltaMs: number) {
    this.acc += deltaMs;
    if (this.acc < PIG_LIFE.tickMs) return;
    this.acc = 0;
    this.step();
  }

  /** Day ↔ night switched (the one farm signal): remember when the day began, re-evaluate now. */
  nightChanged() {
    const night = this.env.night();
    if (this.night && !night) this.dayStartedAt = this.env.now();
    this.night = night;
    this.step();
  }

  onEvent(e: GameEvent) {
    if (e.type !== 'PIG_ATE_FROM_TROUGH') return;
    this.brains.get(e.pigId)?.onMeal(e.meals, e.hungerBefore, this.env.now());
  }

  private step() {
    const now = this.env.now();
    const night = this.env.night();
    const data = new Map(this.env.data().map((p) => [p.id, p]));
    this.data = data;
    const sprites = this.env.pigs();
    const order = new Map([...sprites.keys()].sort().map((id, i) => [id, i]));
    for (const [id, sprite] of sprites) {
      const brain = this.brains.get(id);
      const pig = data.get(id);
      const body = sprite.body();
      if (!brain || !pig || !body?.pos) continue;
      const world = this.world(id, sprite, pig, now, night, order.get(id) ?? 0);
      if (!world) continue;
      this.exec(sprite, brain.tick(world));
      if (brain.state === 'EATING') sprite.eatAtTrough(); // keeps the eat state going
    }
  }

  private world(
    id: string,
    sprite: PigSprite,
    pig: Pig,
    now: number,
    night: boolean,
    index: number,
  ): BrainWorld | null {
    const body = sprite.body();
    const pos = body?.pos;
    if (!body || !pos) return null;
    return {
      now,
      night,
      sinceDayMs: now - this.dayStartedAt,
      care: {
        hunger: pig.hunger,
        cleanliness: pig.cleanliness,
        isSick: pig.isSick,
        pregnant: pig.pregnancy !== null,
      },
      paused: sprite.held(),
      still: this.env.reduceMotion(),
      walking: body.walking,
      pos: { ...pos },
      feedSpot: () => this.reserveFeed(id),
      releaseFeed: () => this.feedSpots.delete(id),
      sleepSpot: () => this.sleepSpot(index),
      wanderTo: (step) => wanderTarget(id, step, this.env.layout, othersOf(this.env.pigs(), id)),
      friend: () => this.friendOf(id, pos),
    };
  }

  private exec(sprite: PigSprite, commands: readonly BrainCommand[]) {
    const body = sprite.body();
    if (!body) return;
    for (const c of commands) {
      if (c.kind === 'walk') body.walkTo(c.to, c.speed);
      else if (c.kind === 'stop') body.stop();
      else if (c.kind === 'rest') body.setRest(c.rest);
      else if (c.kind === 'eat') sprite.eatAtTrough();
      else if (c.kind === 'lookAround') body.lookAround();
      else if (c.kind === 'face') body.faceX(c.x);
      else this.callFriend(c.id, body.pos?.x ?? 0);
    }
  }

  private callFriend(friendId: string, fromX: number) {
    const sprite = this.env.pigs().get(friendId);
    const brain = this.brains.get(friendId);
    if (!sprite || !brain) return;
    this.exec(sprite, brain.onVisited(fromX, this.env.now()));
    sprite.body()?.anchor();
  }

  /** Nearest free pig in social range (awake, standing, not held, healthy). */
  private friendOf(id: string, pos: Point): { id: string; at: Point } | null {
    let best: { id: string; at: Point } | null = null;
    let bestD: number = PIG_LIFE.social.rangePx;
    for (const [otherId, sprite] of this.env.pigs()) {
      const at = sprite.body()?.pos;
      const brain = this.brains.get(otherId);
      const pig = this.data.get(otherId);
      if (otherId === id || !at || !brain?.visitable || sprite.held() || !pig || pig.isSick)
        continue;
      const d = Math.hypot(at.x - pos.x, at.y - pos.y);
      if (d < bestD) {
        bestD = d;
        best = { id: otherId, at: { ...at } };
      }
    }
    return best;
  }

  /** The first free place at the trough; overflow pigs queue one row further back. */
  private reserveFeed(id: string): Point | null {
    const b = this.env.trough();
    if (!b) return null;
    const taken = new Set(this.feedSpots.values());
    let i = this.feedSpots.get(id) ?? 0;
    if (!this.feedSpots.has(id)) while (taken.has(i)) i += 1;
    this.feedSpots.set(id, i);
    const spot = F.spots[i % F.spots.length]!;
    const row = Math.floor(i / F.spots.length);
    return { x: b.x + spot.u * b.width, y: b.y + spot.v * b.height - row * F.rowBackPx };
  }

  /** Sleep place `index`: a spiral cluster in the walk area on the pig house's side. */
  private sleepSpot(index: number): Point {
    const e = walkEllipse(this.env.layout);
    const { width, height } = this.env.layout.designSize;
    const p0 = this.env.layout.placements.find((p) => p.id === PIG_HOUSE_PROP_ID);
    const house = p0 ? { x: p0.x * width, y: p0.y * height } : { x: e.cx - e.rx, y: e.cy - e.ry };
    const nx = (house.x - e.cx) / e.rx;
    const ny = (house.y - e.cy) / e.ry;
    const d = Math.hypot(nx, ny) || 1;
    const r = PIG_LIFE.sleepArea.radius;
    const anchor = { x: e.cx + (nx / d) * r * e.rx, y: e.cy + (ny / d) * r * e.ry };
    const angle = index * 2.39996; // golden angle: an even spiral
    const dist = PIG_LIFE.sleepArea.spacingPx * Math.sqrt(index) * 0.8;
    const p = { x: anchor.x + Math.cos(angle) * dist, y: anchor.y + Math.sin(angle) * dist * 0.6 };
    return clampToEllipse(this.env.layout, p);
  }
}
