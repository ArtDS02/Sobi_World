// The player character on a Phaser scene (spec §4): walks with the player's controls (or to a clicked
// spot), stays out of objects, and offers the nearest thing in reach to the interact key. One class for
// every Area: the scene gives it the ground, the things to interact with and what an interaction does.
import * as Phaser from 'phaser';
import type { CharacterConfig } from '../../core/config/character';
import type { Facing, PlayerSave } from '../../core/player/player';
import {
  directionTo,
  inputVector,
  nearestInteractable,
  stepCharacter,
  type CharacterState,
  type Interactable,
  type Vec,
  type Walkable,
} from '../../systems/character';
import { characterFrame, characterState } from './characterFrames';
import type { WorldHost } from './host';
import { ensureSoftTextures, SOFT_SHADOW } from './softTextures';

/** A click-to-walk that cannot move for this long is dropped. */
const STUCK_GIVE_UP_MS = 400;
/** Distance between two footsteps (design px): `onStride` fires once per this much walked. */
const STRIDE_PX = 46;
/** The shadow is this many feet-boxes wide / high. */
const SHADOW_FEET = { w: 3.4, h: 3.2 };

export interface ActorThing<T> extends Interactable {
  payload: T;
}

/** What the actor asks of its scene, read fresh every frame (pigs move, the layout can change). */
export interface ActorWorld<T> {
  walkable(): Walkable;
  things(): readonly ActorThing<T>[];
  onFocus(thing: ActorThing<T> | null): void;
  onInteract(thing: ActorThing<T>): void;
  /** A footstep happened here (every STRIDE_PX walked); the scene decides whether it raises dust. */
  onStride?(x: number, y: number): void;
}

/** Walk to a point or a moving thing, then do something (a click on an object). */
export interface WalkGoal {
  target: () => Vec | null;
  /** Close enough when the target is within this many design px. */
  arrive: number;
  then: () => void;
}

export class CharacterActor<T> {
  private state: CharacterState = { x: 0, y: 0, facing: 'down', moving: false };
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Image;
  private shadowAlpha = 0.28;
  private strideLeft = STRIDE_PX;
  private focus: ActorThing<T> | null = null;
  private goal: WalkGoal | null = null;
  private walkedMs = 0;
  private stuckMs = 0;
  private readonly off: () => void;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly cfg: CharacterConfig,
    private readonly world: ActorWorld<T>,
    private readonly host: WorldHost,
    private readonly fallbackKey: string,
  ) {
    ensureSoftTextures(scene);
    this.shadow = scene.add
      .image(0, 0, SOFT_SHADOW)
      .setDisplaySize(cfg.feetHalfWidth * SHADOW_FEET.w, cfg.feetHalfHeight * SHADOW_FEET.h)
      .setAlpha(this.shadowAlpha);
    this.sprite = scene.add.image(0, 0, fallbackKey).setOrigin(0.5, 1);
    this.off = host.input.onPress('interact', () => {
      if (this.host.paused() || !this.focus) return;
      this.goal = null;
      this.world.onInteract(this.focus);
    });
    this.render();
  }

  position(): Vec {
    return { x: this.state.x, y: this.state.y };
  }

  /** The character as the save keeps it. */
  snapshot(area: string): PlayerSave {
    return { area, x: Math.round(this.state.x), y: Math.round(this.state.y), facing: this.state.facing };
  }

  moving = (): boolean => this.state.moving || this.goal !== null;

  place(x: number, y: number, facing: Facing) {
    this.state = { x, y, facing, moving: false };
    this.goal = null;
    this.setFocus(null);
    this.render();
  }

  goTo(goal: WalkGoal) {
    this.goal = goal;
  }

  /** Stops walking and drops the key hint (the scene goes to sleep). */
  halt() {
    this.goal = null;
    this.state = { ...this.state, moving: false };
    this.setFocus(null);
    this.render();
  }

  update(dtMs: number) {
    const walk = this.world.walkable();
    const paused = this.host.paused();
    const keys = paused ? new Set<never>() : this.host.input.held();
    let dir = inputVector(keys);
    if (dir.x !== 0 || dir.y !== 0) this.goal = null; // the keys take over from a click
    else if (this.goal && !paused) dir = this.dirToGoal();
    const asked = dir.x !== 0 || dir.y !== 0;
    const before = this.state;
    this.state = stepCharacter(this.state, dir, dtMs, this.cfg.speed, walk);
    // The walk cycle follows the ground really covered (not the time), so the feet do not slide when the
    // character rubs along a wall or a frame is long.
    const covered = Math.hypot(this.state.x - before.x, this.state.y - before.y);
    this.walkedMs = this.state.moving ? this.walkedMs + (covered / this.cfg.speed) * 1000 : 0;
    this.stride(covered);
    if (this.goal && !paused) {
      if (!asked) {
        // Arrived: do what the click was for.
        const done = this.goal;
        this.goal = null;
        this.stuckMs = 0;
        done.then();
      } else if (!this.state.moving) {
        // Walled in on the way: give up rather than rub against the wall.
        this.stuckMs += dtMs;
        if (this.stuckMs > STUCK_GIVE_UP_MS) this.goal = null;
      } else {
        this.stuckMs = 0;
      }
    }
    this.setFocus(nearestInteractable(this.world.things(), this.state));
    this.render();
  }

  destroy() {
    this.off();
    this.sprite.destroy();
    this.shadow.destroy();
  }

  /** Light of the day: the shadow follows it (stronger by day, faint at night). */
  setShadowStrength(alpha: number) {
    this.shadowAlpha = alpha;
    this.shadow.setAlpha(alpha);
  }

  private stride(covered: number) {
    if (covered <= 0) {
      this.strideLeft = STRIDE_PX / 2; // the first step of the next walk comes early
      return;
    }
    this.strideLeft -= covered;
    if (this.strideLeft > 0) return;
    this.strideLeft += STRIDE_PX;
    this.world.onStride?.(this.state.x, this.state.y);
  }

  private dirToGoal(): Vec {
    const goal = this.goal!;
    const target = goal.target();
    if (!target) {
      this.goal = null;
      return { x: 0, y: 0 };
    }
    return directionTo(this.state, target, Math.max(goal.arrive, this.cfg.arriveDistance));
  }

  private setFocus(next: ActorThing<T> | null) {
    if ((next?.id ?? null) === (this.focus?.id ?? null)) {
      this.focus = next; // same thing: keep the fresh payload (a pig that moved)
      return;
    }
    this.focus = next;
    this.world.onFocus(next);
  }

  private render() {
    const { x, y, facing, moving } = this.state;
    const frame = characterFrame(moving, this.walkedMs, this.cfg.walkFps);
    const key = `${this.cfg.assets[this.host.character()]}_${characterState(facing, frame)}`;
    const exists = this.scene.textures.exists(key);
    this.sprite.setTexture(exists ? key : this.fallbackKey);
    const h = this.sprite.frame.height || 1;
    this.sprite.setScale(this.cfg.displayHeight / h);
    this.sprite.setPosition(x, y + 4).setDepth(y);
    this.shadow.setPosition(x, y).setDepth(y - 1);
  }
}
