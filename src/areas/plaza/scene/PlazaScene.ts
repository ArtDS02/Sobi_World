// The plaza on screen (spec §3.1): a painted square with the five doors, the character and the key hint
// near a door. Draws and walks only — the doors' state, the keys and the trip to an Area come from the app
// through WorldHost, so the scene never reaches the store or another Area.
import * as Phaser from 'phaser';
import type { PlazaLayout, PlazaPlacement } from '../../../../content/schemas/plaza/layout';
import type { CharacterConfig } from '../../../core/config/character';
import type { AssetRegistry } from '../../../core/assets/registry';
import { PLAZA_ID } from '../../../core/player/player';
import type { Rect } from '../../../systems/character';
import { footprintOf, frontOf } from '../../../systems/layout/footprint';
import { CharacterActor, type ActorThing } from '../../../ui/world/CharacterActor';
import { fitCamera } from '../../../ui/world/fitCamera';
import type { WorldHost } from '../../../ui/world/host';
import { FALLBACK_PROP_KEY, textureKey } from '../../../ui/world/keys';
import { arrivalSpot } from '../logic/arrival';
import { portalPrompt, type PortalView } from '../logic/portals';
import { plazaWalkable } from '../logic/walkable';
import { PLAZA_VIEW } from './plazaView';

export const PLAZA_SCENE_KEY = 'plaza';
const LOCK_ICON = 'ui_icon_lock';

export interface PlazaDeps {
  layout: PlazaLayout;
  character: CharacterConfig;
  assets: AssetRegistry;
  host: WorldHost;
  /** The doors now (a new object when something about them changed). */
  portals: () => ReadonlyMap<string, PortalView>;
}

type Door = ActorThing<string>;

export class PlazaScene extends Phaser.Scene {
  private actor!: CharacterActor<string>;
  private readonly obstacles: Rect[] = [];
  private readonly doors: Door[] = [];
  private readonly doorArt = new Map<string, Phaser.GameObjects.Image>();
  private readonly doorBadges = new Map<string, Phaser.GameObjects.Image>();
  private shownPortals: ReadonlyMap<string, PortalView> | null = null;
  private focus: Door | null = null;
  private restedMs = 0;
  private dirty = false;

  constructor(private readonly deps: PlazaDeps) {
    super(PLAZA_SCENE_KEY);
  }

  create(data?: { from?: string | null }) {
    const { layout } = this.deps;
    fitCamera(this, layout.designSize);
    this.paintGround();
    layout.placements.forEach((p, i) => this.drawPlacement(p, i));
    this.actor = new CharacterActor<string>(
      this,
      this.deps.character,
      {
        walkable: () => this.walkable(),
        things: () => this.doors,
        onFocus: (door) => this.onFocus(door),
        onInteract: (door) => this.useDoor(door.payload),
      },
      this.deps.host,
      FALLBACK_PROP_KEY,
    );
    this.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => this.onPointer(p, over),
    );
    this.events.on(Phaser.Scenes.Events.WAKE, (_sys: Phaser.Scenes.Systems, d?: { from?: string | null }) =>
      this.arrive(d?.from ?? null),
    );
    this.events.on(Phaser.Scenes.Events.SLEEP, () => this.leave());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.leave();
      this.actor.destroy();
    });
    this.arrive(data?.from ?? null);
  }

  override update(_time: number, delta: number) {
    this.syncDoors();
    this.actor.update(delta);
    this.rememberWhenResting(delta);
  }

  private walkable() {
    return plazaWalkable(this.deps.layout, this.obstacles, {
      halfW: this.deps.character.feetHalfWidth,
      halfH: this.deps.character.feetHalfHeight,
    });
  }

  /** The character comes in: from the game start (the saved spot), or out of the door of the Area just left. */
  private arrive(from: string | null) {
    const { layout, host } = this.deps;
    const areaOf = (portal: string) => this.deps.portals().get(portal)?.areaId;
    const spot = arrivalSpot(layout, this.walkable(), areaOf, host.player(), from);
    this.actor.place(spot.x, spot.y, spot.facing);
    this.syncDoors(true);
    this.restedMs = 0;
    this.dirty = false;
  }

  private leave() {
    if (this.actor) {
      this.actor.halt();
      if (this.dirty) this.deps.host.remember(this.actor.snapshot(PLAZA_ID));
    }
    this.dirty = false;
    this.focus = null;
    this.deps.host.setPrompt(null);
  }

  /** The spot is written once the character has stood still for a while (and when they leave). */
  private rememberWhenResting(delta: number) {
    if (this.actor.moving()) {
      this.restedMs = 0;
      this.dirty = true;
      return;
    }
    if (!this.dirty) return;
    this.restedMs += delta;
    if (this.restedMs >= this.deps.character.restSaveMs) {
      this.dirty = false;
      this.deps.host.remember(this.actor.snapshot(PLAZA_ID));
    }
  }

  private paintGround() {
    const { layout } = this.deps;
    const { width, height } = layout.designSize;
    const v = PLAZA_VIEW;
    const horizon = layout.walkArea.y * height - v.horizonAbove;
    const wide = width * v.bleed;
    this.add.rectangle(width / 2, horizon - wide / 2, wide, wide, layout.palette.sky).setDepth(v.skyDepth);
    this.add.rectangle(width / 2, horizon + wide / 2, wide, wide, layout.palette.grass).setDepth(v.skyDepth);
    const f = layout.floor;
    this.add
      .ellipse((f.x + f.width / 2) * width, (f.y + f.height / 2) * height, f.width * width, f.height * height, layout.palette.path)
      .setStrokeStyle(v.floorStroke, v.floorStrokeColor, 0.5)
      .setDepth(v.floorDepth);
  }

  private drawPlacement(p: PlazaPlacement, index: number) {
    if (p.visible === false) return;
    const { layout, assets } = this.deps;
    const { width, height } = layout.designSize;
    const key = textureKey(p.id);
    const img = this.add
      .image(p.x * width, p.y * height, this.textures.exists(key) ? key : FALLBACK_PROP_KEY)
      .setOrigin(p.originX ?? 0.5, p.originY ?? 1);
    if (p.width || p.height) {
      const sy = p.height ? p.height / img.height : null;
      const sx = p.width ? p.width / img.width : (sy ?? 1);
      img.setScale(sx, sy ?? sx);
    }
    img.setFlipX(p.flipX ?? false).setAngle(p.rotation ?? 0);
    const environment = assets.resolve(p.id)?.section === 'environment';
    img.setDepth(environment ? PLAZA_VIEW.skyDepth + 1 + index : p.y * height);
    const bounds = img.getBounds();
    if (p.solid) this.obstacles.push(footprintOf(bounds));
    if (!p.portal) return;
    const front = frontOf(bounds);
    this.doors.push({ id: p.portal, x: front.x, y: front.y, reach: layout.portalReach, payload: p.portal });
    this.doorArt.set(p.portal, img);
    img.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: PLAZA_VIEW.hitAlpha });
    img.setData(PLAZA_VIEW.doorData, p.portal);
    const view = this.deps.portals().get(p.portal);
    if (view) {
      const l = PLAZA_VIEW.label;
      this.add
        .text(front.x, front.y + l.offsetY, view.name, {
          color: l.color,
          backgroundColor: l.background,
          fontSize: `${l.fontPx}px`,
          fontFamily: l.fontFamily,
          fontStyle: 'bold',
          padding: { x: l.padX, y: l.padY },
        })
        .setOrigin(0.5, 0)
        .setDepth(img.depth + 1);
    }
    const lockKey = this.textures.exists(LOCK_ICON) ? LOCK_ICON : FALLBACK_PROP_KEY;
    this.doorBadges.set(
      p.portal,
      this.add
        .image(front.x, bounds.y + bounds.height * PLAZA_VIEW.lock.at, lockKey)
        .setDisplaySize(PLAZA_VIEW.lock.size, PLAZA_VIEW.lock.size)
        .setDepth(img.depth + 1)
        .setVisible(false),
    );
  }

  /** Doors look as their Areas are: closed ones dimmed with a padlock, open ones bright. */
  private syncDoors(force = false) {
    const views = this.deps.portals();
    if (!force && views === this.shownPortals) return;
    this.shownPortals = views;
    for (const [portal, img] of this.doorArt) {
      const open = views.get(portal)?.status === 'open';
      img.setTint(open ? 0xffffff : PLAZA_VIEW.closedTint);
      this.doorBadges.get(portal)?.setVisible(!open);
    }
    if (this.focus) this.onFocus(this.focus); // the hint follows the door's new state
  }

  private onFocus(door: Door | null) {
    this.focus = door;
    const view = door ? this.deps.portals().get(door.payload) : undefined;
    if (!door || !view) return this.deps.host.setPrompt(null);
    const prompt = portalPrompt(view);
    this.deps.host.setPrompt({
      control: prompt.action ? 'interact' : null,
      title: prompt.title,
      lines: prompt.lines,
      ...(prompt.action ? {} : { disabled: true }),
    });
  }

  private useDoor(portal: string) {
    const view = this.deps.portals().get(portal);
    if (view?.status === 'open') this.deps.host.go(view.areaId);
    else this.deps.host.denied();
  }

  private onPointer(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) {
    if (this.deps.host.paused()) return;
    const portal: unknown = over[0]?.getData(PLAZA_VIEW.doorData);
    const door = typeof portal === 'string' ? this.doors.find((d) => d.id === portal) : undefined;
    if (door) {
      // Walk to the door, then use it as if the key was pressed.
      this.actor.goTo({
        target: () => ({ x: door.x, y: door.y + this.deps.character.feetHalfHeight * 4 }),
        arrive: door.reach * PLAZA_VIEW.clickArriveShare,
        then: () => this.useDoor(door.payload),
      });
    } else {
      this.actor.goTo({ target: () => ({ x: p.worldX, y: p.worldY }), arrive: 0, then: () => {} });
    }
  }
}
