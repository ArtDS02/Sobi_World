// The player's character on the farm (spec §4, GĐ3): walks among the objects and the pigs and uses the
// nearest thing with the interact key, or walks to a clicked thing and uses it. What a use does is the
// farm UI's job (`activate`); leaving the farm is the host's. Draws nothing but the character.
import * as Phaser from 'phaser';
import type { CharacterConfig } from '../../../../core/config/character';
import { t } from '../../../../i18n/format';
import { vi } from '../../../../i18n/vi';
import type { Rect } from '../../../../systems/character';
import { footprintOf, frontOf } from '../../../../systems/layout/footprint';
import { CharacterActor, type ActorThing } from '../../../../ui/world/CharacterActor';
import type { WorldHost } from '../../../../ui/world/host';
import { FARM_VIEW } from '../config/farmView';
import { pickOf } from '../scenes/farmPick';
import type { FarmPick, ScenePick } from '../farmView';
import { farmSpawn, farmWalkable, objectReach } from '../view/playerArea';
import { FALLBACK_PROP_KEY } from '../view/textureKeys';
import type { FarmAction, FarmLayout } from '../config/layout';
import type { GiftBoxes } from './GiftBoxes';
import type { PigSprite } from './PigSprite';

export interface FarmWalkerDeps {
  layout: FarmLayout;
  character: CharacterConfig;
  host: WorldHost;
  /** A thing was used: open its panel, open the gift… (leaving the farm never comes here). */
  activate: (pick: FarmPick) => void;
  pigs: () => ReadonlyMap<string, PigSprite>;
  pigName: (id: string) => string | undefined;
  gifts: () => GiftBoxes;
}

type Thing = ActorThing<ScenePick>;

export class FarmWalker {
  private readonly actor: CharacterActor<ScenePick>;
  private readonly objects: Thing[] = [];
  private readonly obstacles: Rect[] = [];
  private readonly view = FARM_VIEW.REACH;

  constructor(
    scene: Phaser.Scene,
    private readonly deps: FarmWalkerDeps,
  ) {
    this.actor = new CharacterActor<ScenePick>(
      scene,
      deps.character,
      {
        walkable: () =>
          farmWalkable(deps.layout, this.obstacles, {
            halfW: deps.character.feetHalfWidth,
            halfH: deps.character.feetHalfHeight,
          }),
        things: () => this.things(),
        onFocus: (thing) => this.onFocus(thing),
        onInteract: (thing) => this.use(thing.payload),
      },
      deps.host,
      FALLBACK_PROP_KEY,
    );
    this.enter();
    // A canvas click walks to the thing and uses it. The scene sleeping (the player is in the plaza) halts the
    // character; waking puts them at the entrance again.
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) =>
      this.pointer(pickOf(over[0]), { x: p.worldX, y: p.worldY }),
    );
    scene.events.on(Phaser.Scenes.Events.WAKE, () => this.enter());
    scene.events.on(Phaser.Scenes.Events.SLEEP, () => this.sleep());
  }

  /** A clickable world object (placement with an action) the character can use. */
  addObject(img: Phaser.GameObjects.Image, action: FarmAction) {
    const bounds = img.getBounds();
    const front = frontOf(bounds);
    this.objects.push({
      id: `act:${action}`,
      x: front.x,
      y: front.y,
      reach: objectReach(img.displayWidth, this.view.objectMin, this.view.objectPerWidth),
      payload: { kind: 'action', action },
    });
  }

  /** An object that blocks walking (its foot only). */
  addObstacle(img: Phaser.GameObjects.Image) {
    this.obstacles.push(footprintOf(img.getBounds()));
  }

  /** Puts the character at the farm's entrance (the game enters the farm, or comes back to it). */
  enter() {
    const spawn = farmSpawn(this.deps.layout);
    this.actor.place(spawn.x, spawn.y, 'up');
  }

  /** The player left the farm: standing still, no key hint. */
  sleep() {
    this.actor.halt();
    this.deps.host.setPrompt(null);
  }

  update(dtMs: number) {
    this.actor.update(dtMs);
  }

  destroy() {
    this.actor.destroy();
  }

  /** A canvas click on a thing: walk to it, then use it. Ground: walk there. */
  pointer(pick: ScenePick, worldAt: { x: number; y: number }) {
    if (this.deps.host.paused()) {
      // A panel is open: a click on a thing works as before (it swaps the panel), no walking.
      if (pick.kind !== 'ground') this.use(pick);
      return;
    }
    const thing = pick.kind === 'ground' ? null : this.thingOf(pick);
    if (!thing) {
      if (pick.kind === 'ground') this.deps.activate(pick);
      this.actor.goTo({ target: () => worldAt, arrive: 0, then: () => {} });
      return;
    }
    this.actor.goTo({
      target: () => this.thingOf(pick) ?? null,
      arrive: thing.reach * this.view.clickArriveShare,
      then: () => this.use(pick),
    });
  }

  private use(pick: ScenePick) {
    if (pick.kind === 'action' && pick.action === 'plaza') return this.deps.host.go('plaza');
    this.deps.activate(pick as FarmPick);
  }

  private things(): Thing[] {
    const out: Thing[] = [...this.objects];
    for (const [id, sprite] of this.deps.pigs()) {
      const at = sprite.feet();
      out.push({ id: `pig:${id}`, x: at.x, y: at.y, reach: this.view.pig, payload: { kind: 'pig', pigId: id } });
    }
    for (const [id, img] of this.deps.gifts().entries()) {
      out.push({ id: `gift:${id}`, x: img.x, y: img.y, reach: this.view.gift, payload: { kind: 'gift', giftId: id } });
    }
    return out;
  }

  /** The thing a pick stands for, with its position right now (pigs move). */
  private thingOf(pick: ScenePick): Thing | undefined {
    const id = pick.kind === 'pig' ? `pig:${pick.pigId}` : pick.kind === 'gift' ? `gift:${pick.giftId}` : pick.kind === 'action' ? `act:${pick.action}` : null;
    return id ? this.things().find((th) => th.id === id) : undefined;
  }

  private onFocus(thing: Thing | null) {
    if (!thing) return this.deps.host.setPrompt(null);
    const p = thing.payload;
    const title =
      p.kind === 'pig'
        ? t(vi.farm.pig, { name: this.deps.pigName(p.pigId) ?? '' })
        : p.kind === 'gift'
          ? vi.farm.gift
          : p.kind === 'action'
            ? vi.farm[p.action]
            : '';
    this.deps.host.setPrompt({ control: 'interact', title, lines: [] });
  }
}
