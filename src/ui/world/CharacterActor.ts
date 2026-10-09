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

/** A click-to-walk that cannot move for this long is dropped. */
const STUCK_GIVE_UP_MS = 400;

export interface ActorThing<T> extends Interactable {
  payload: T;
}

/** What the actor asks of its scene, read fresh every frame (pigs move, the layout can change). */
export interface ActorWorld<T> {
  walkable(): Walkable;
  things(): readonly ActorThing<T>[];
  onFocus(thing: ActorThing<T> | null): void;
  onInteract(thing: ActorThing<T>): void;
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
  private readonly shadow: Phaser.GameObjects.Ellipse;
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
    this.shadow = scene.add.ellipse(0, 0, cfg.feetHalfWidth * 3.2, cfg.feetHalfHeight * 3, 0x000000, 0.22);
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
    this.state = stepCharacter(this.state, dir, dtMs, this.cfg.speed, walk);
    this.walkedMs = this.state.moving ? this.walkedMs + dtMs : 0;
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
    const key = `${this.cfg.assetId}_${characterState(facing, frame)}`;
    const exists = this.scene.textures.exists(key);
    this.sprite.setTexture(exists ? key : this.fallbackKey);
    const h = this.sprite.frame.height || 1;
    this.sprite.setScale(this.cfg.displayHeight / h);
    this.sprite.setPosition(x, y + 4).setDepth(y);
    this.shadow.setPosition(x, y).setDepth(y - 1);
  }
}
