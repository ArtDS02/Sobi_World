// The plaza on screen (spec §3.1, decision 025): a painted sky island with the five doors. No character walks here: a
// click on a door (its building or its name plank) goes in; hovering one swells it, wakes its plank and shows its name or
// what it still needs. Draws only — the doors' state and the trip to an Area come from the app through WorldHost, so the
// scene never reaches the store or another Area. What moves by itself lives in PlazaAmbient, the evening light in PlazaLight.
import * as Phaser from 'phaser';
import type { PlazaLayout, PlazaPlacement } from '../../../../content/schemas/plaza/layout';
import type { AssetRegistry } from '../../../core/assets/registry';
import { fitCamera } from '../../../ui/world/fitCamera';
import type { WorldHost } from '../../../ui/world/host';
import { FALLBACK_PROP_KEY, textureKey } from '../../../ui/world/keys';
import { ensureSoftTextures } from '../../../ui/world/softTextures';
import { areaIconId } from '../logic/art';
import { portalPrompt, stationDoorId, type PortalView } from '../logic/portals';
import { paintGround } from './GroundPainter';
import { PlazaAmbient, type DrawnPlacement } from './PlazaAmbient';
import { PlazaLight } from './PlazaLight';
import { PLAZA_VIEW } from './plazaView';

export const PLAZA_SCENE_KEY = 'plaza';
const LOCK_ICON = 'ui_icon_lock';

export interface PlazaDeps {
  layout: PlazaLayout;
  assets: AssetRegistry;
  host: WorldHost;
  /** The doors now (a new object when something about them changed). */
  portals: () => ReadonlyMap<string, PortalView>;
  /** The scene is drawn (every texture loaded): the HUD may lead into an Area from now on. */
  ready: () => void;
}

type Pointed = (pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => void;

export class PlazaScene extends Phaser.Scene {
  private ambient!: PlazaAmbient;
  private light!: PlazaLight;
  private readonly drawnAll: DrawnPlacement[] = [];
  private readonly doorArt = new Map<string, Phaser.GameObjects.Image>();
  private readonly doorBadges = new Map<string, Phaser.GameObjects.Image>();
  private shownPortals: ReadonlyMap<string, PortalView> | null = null;
  /** The door under the pointer, or null. */
  private hovered: string | null = null;
  /** The painted backdrop is shown (decision 024) instead of the code-painted ground. */
  private painted = false;

  constructor(private readonly deps: PlazaDeps) {
    super(PLAZA_SCENE_KEY);
  }

  create() {
    const { layout } = this.deps;
    fitCamera(this, layout.designSize);
    ensureSoftTextures(this);
    this.painted = this.showBackdrop();
    if (!this.painted) paintGround(this, layout);
    layout.placements.forEach((p) => this.drawPlacement(p));
    this.ambient = new PlazaAmbient(
      this,
      {
        layout,
        nameOf: (portal) => this.deps.portals().get(portal)?.name,
        iconOf: (portal) => this.areaIcon(portal),
        painted: this.painted,
        calm: () => this.deps.host.reduceMotion(),
      },
      this.drawnAll,
    );
    this.light = new PlazaLight(this, layout.designSize, () => this.deps.host.now(), (level) => this.ambient.setLampLevel(level.lights));
    const over: Pointed = (_p, obj) => this.hover(this.doorOf(obj));
    const out: Pointed = (_p, obj) => {
      if (this.doorOf(obj) === this.hovered) this.hover(null);
    };
    const down: Pointed = (_p, obj) => {
      const door = this.doorOf(obj);
      if (door && !this.deps.host.paused()) this.useDoor(door);
    };
    this.input.on(Phaser.Input.Events.GAMEOBJECT_OVER, over);
    this.input.on(Phaser.Input.Events.GAMEOBJECT_OUT, out);
    this.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, down);
    this.events.on(Phaser.Scenes.Events.WAKE, () => {
      this.syncDoors(true);
      this.light.refresh(true);
    });
    this.events.on(Phaser.Scenes.Events.SLEEP, () => this.hover(null));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.hover(null);
      this.ambient.destroy();
      this.light.destroy();
    });
    this.syncDoors(true);
    this.deps.ready();
  }

  override update(_time: number, delta: number) {
    this.syncDoors();
    this.ambient.update(delta);
  }

  /** Final art of `id` is loaded (not a placeholder of the manifest). */
  private hasArt(id: string): boolean {
    const entry = this.deps.assets.resolve(id);
    return entry !== undefined && entry.status !== 'placeholder' && this.textures.exists(textureKey(id));
  }

  /** The owner's painted island over the whole frame, and flat colours round it for a window of another shape. */
  private showBackdrop(): boolean {
    const b = this.deps.layout.backdrop;
    if (!b || !this.hasArt(b.art)) return false;
    const { width, height } = this.deps.layout.designSize;
    const far = width * PLAZA_VIEW.bleed;
    const band = (x: number, y: number, w: number, h: number, color: number) =>
      this.add.rectangle(x, y, w, h, color).setOrigin(0, 0).setDepth(PLAZA_VIEW.skyDepth);
    band(-far, -far, width + far * 2, far, b.above);
    band(-far, height, width + far * 2, far, b.below);
    band(-far, 0, far, height, b.sides);
    band(width, 0, far, height, b.sides);
    this.add.image(0, 0, textureKey(b.art)).setOrigin(0, 0).setDisplaySize(width, height).setDepth(PLAZA_VIEW.groundDepth);
    return true;
  }

  /** The art a placement shows: its own, or its fallback while its own is a placeholder. */
  private artOf(p: PlazaPlacement): string {
    return p.fallback && !this.hasArt(p.id) ? p.fallback : p.id;
  }

  /** The area icon on a door's plank (`ui_area_<area>`), once that art exists. */
  private areaIcon(portal: string): string | null {
    const area = this.deps.portals().get(portal)?.areaId;
    const id = area ? areaIconId(area) : null;
    return id && this.hasArt(id) ? textureKey(id) : null;
  }

  private drawPlacement(p: PlazaPlacement) {
    if (p.visible === false || (p.paintedGround && this.painted)) return;
    const { layout } = this.deps;
    const { width, height } = layout.designSize;
    const art = this.artOf(p);
    const key = textureKey(art);
    const img = this.add
      .image(p.x * width, p.y * height, this.textures.exists(key) ? key : FALLBACK_PROP_KEY)
      .setOrigin(p.originX ?? 0.5, p.originY ?? 1);
    if (p.width || p.height) {
      const sy = p.height ? p.height / img.height : null;
      const sx = p.width ? p.width / img.width : (sy ?? 1);
      img.setScale(sx, sy ?? sx);
    }
    if (art !== p.id) img.setScale(img.scaleX * (PLAZA_VIEW.fallbackScale[art] ?? 1), img.scaleY * (PLAZA_VIEW.fallbackScale[art] ?? 1));
    img.setFlipX(p.flipX ?? false).setAngle(p.rotation ?? 0);
    img.setDepth(p.y * height);
    const bounds = img.getBounds();
    this.drawnAll.push({ p, art, img, bounds });
    // A door's name plank leads in too.
    const door = p.portal ?? (p.station ? stationDoorId(p.station) : undefined) ?? p.sign;
    if (!door) return;
    img.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: PLAZA_VIEW.hitAlpha });
    img.setData(PLAZA_VIEW.doorData, door);
    if (p.sign) return;
    img.setData(PLAZA_VIEW.baseScaleData, { x: img.scaleX, y: img.scaleY });
    this.doorArt.set(door, img);
    const lockKey = this.textures.exists(LOCK_ICON) ? LOCK_ICON : FALLBACK_PROP_KEY;
    this.doorBadges.set(
      door,
      this.add
        .image(bounds.x + bounds.width / 2, bounds.y + bounds.height * PLAZA_VIEW.lock.at, lockKey)
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
    if (this.hovered) this.showPrompt(this.hovered); // the hint follows the door's new state
  }

  private doorOf(obj: Phaser.GameObjects.GameObject): string | null {
    const door: unknown = obj.getData(PLAZA_VIEW.doorData);
    return typeof door === 'string' ? door : null;
  }

  /** The pointer is over a door (or left it): the building swells a little, its plank bounces, the hint shows. */
  private hover(door: string | null) {
    if (door === this.hovered) return;
    this.swell(this.hovered, false);
    this.hovered = door;
    this.swell(door, !this.deps.host.reduceMotion());
    this.ambient?.setNear(door);
    if (door) this.showPrompt(door);
    else this.deps.host.setPrompt(null);
  }

  private swell(door: string | null, on: boolean) {
    const img = door ? this.doorArt.get(door) : undefined;
    if (!img) return;
    const base = img.getData(PLAZA_VIEW.baseScaleData) as { x: number; y: number };
    const k = on ? PLAZA_VIEW.hover.swell : 1;
    this.tweens.killTweensOf(img);
    this.tweens.add({ targets: img, scaleX: base.x * k, scaleY: base.y * k, duration: PLAZA_VIEW.hover.ms, ease: 'Sine.easeOut' });
  }

  private showPrompt(door: string) {
    const view = this.deps.portals().get(door);
    if (!view) return this.deps.host.setPrompt(null);
    const prompt = portalPrompt(view);
    const img = this.doorArt.get(door);
    const cam = this.cameras.main;
    const anchor = img
      ? { x: (img.x - cam.worldView.x) * cam.zoom, y: (img.getBounds().y - cam.worldView.y) * cam.zoom }
      : undefined;
    this.deps.host.setPrompt({ control: null, title: prompt.title, lines: prompt.lines, ...(prompt.action ? {} : { disabled: true }), ...(anchor ? { anchor } : {}) });
  }

  private useDoor(portal: string) {
    const view = this.deps.portals().get(portal);
    if (view?.status !== 'open') return this.deps.host.denied();
    this.hover(null);
    this.deps.host.go(view.areaId);
  }
}
