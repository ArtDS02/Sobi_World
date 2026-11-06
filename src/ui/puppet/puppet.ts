// A creature drawn as a puppet (decision 050): one Phaser image per part (one per face slot, its picture swapped), one Rope per chain
// (tails, fins, tentacles bend along their points), or the creature's finished picture bent on a grid (skinView.ts) with only the face
// slots on top; all in a Container standing on the creature's feet. Every frame the performer
// (systems/animation) solves the body and this lays the parts where it says. Brightness, grey, glow use the Container's post-FX on
// WebGL (no CSS filter); tint goes on each part. Shared by every Area: it knows nothing of battles.
import * as Phaser from 'phaser';
import { SkinView } from './skinView';
import { Performer, rigImages, type DrawnChain, type DrawnPart, type Frame, type RigData, type Want } from '../../systems/animation';

/** Where and how the whole puppet stands this frame (screen px). */
export interface PuppetPlace {
  x: number;
  y: number;
  /** Screen px per canvas px. */
  scale: number;
  /** Looks left (the rig is drawn looking right). */
  mirrored: boolean;
  /** Extra turn (deg) and squash of the whole body on top of the rig (a battle's tween, already damped by the rig's `feel.root`). */
  rot?: number;
  sx?: number;
  sy?: number;
  depth: number;
  alpha?: number;
}

/** The look of the whole body: brightness (1 = as drawn), grey 0–1, a tint (multiply), a glow colour. */
export interface PuppetLook {
  bright?: number;
  gray?: number;
  tint?: number | null;
  glow?: number | null;
  glowAlpha?: number;
}

/** One part copied into the world (for ghosts, trails, colour splits). */
export interface PartCopy {
  key: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  depth: number;
}

const grey = (k: number) => {
  const c = Math.round(255 - k * 120);
  return (c << 16) | (c << 8) | c;
};

export class Puppet {
  readonly performer: Performer;
  readonly container: Phaser.GameObjects.Container;
  private images = new Map<string, Phaser.GameObjects.Image>();
  private ropes = new Map<string, Phaser.GameObjects.Rope | Phaser.GameObjects.Image>();
  private readonly origin = new Map<string, { ox: number; oy: number }>();
  private matrix: Phaser.FX.ColorMatrix | null = null;
  private glowFx: Phaser.FX.Glow | null = null;
  private frame: Frame | null = null;
  private lastRoot: { x: number; y: number } | null = null;
  private ready = false;
  private skin: SkinView | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly rig: RigData,
    unitId: string,
    private readonly want: (id: string) => void,
  ) {
    this.performer = new Performer(rig, unitId);
    this.container = scene.add.container(0, 0).setVisible(false);
    for (const id of rigImages(rig)) want(id);
    // Each picture's origin: the joint of the bone that carries it, inside the picture's box.
    for (const b of rig.bones) {
      const names = b.slot ? Object.values(b.slot.pictures) : b.part ? [b.part] : [];
      for (const n of names) {
        const box = rig.parts[n]!.box;
        this.origin.set(`${b.id}/${n}`, { ox: (b.at[0] - box[0]) / box[2], oy: (b.at[1] - box[1]) / box[3] });
      }
    }
  }

  /** The Container's post-FX, on WebGL. They are added only while a look needs them: a Container drawn through post-FX (even
   *  inactive ones) washes out when it is mirrored, which every enemy is. */
  private get fx(): Phaser.GameObjects.Components.FX | null {
    if (this.scene.game.renderer.type !== Phaser.WEBGL) return null;
    return (this.container as unknown as { postFX?: Phaser.GameObjects.Components.FX }).postFX ?? null;
  }

  /** All its pictures are loaded (until then the caller draws something else). */
  loaded(): boolean {
    if (this.ready) return true;
    this.ready = rigImages(this.rig).every((id) => this.scene.textures.exists(id));
    if (!this.ready) for (const id of rigImages(this.rig)) this.want(id);
    return this.ready;
  }

  private partImage(d: DrawnPart): Phaser.GameObjects.Image {
    const slotKey = `${d.bone}`;
    let img = this.images.get(slotKey);
    const key = this.rig.parts[d.part]!.img;
    if (!img) {
      img = this.scene.add.image(0, 0, key);
      this.container.add(img);
      this.images.set(slotKey, img);
    }
    if (img.texture.key !== key) img.setTexture(key);
    const o = this.origin.get(`${d.bone}/${d.part}`)!;
    img.setOrigin(o.ox, o.oy);
    return img;
  }

  private chainObject(d: DrawnChain): Phaser.GameObjects.Rope | Phaser.GameObjects.Image {
    let obj = this.ropes.get(d.id);
    const key = this.rig.parts[d.part]!.img;
    if (!obj) {
      if (this.scene.game.renderer.type === Phaser.WEBGL) {
        obj = this.scene.add.rope(0, 0, key, undefined, d.points.length as unknown as Phaser.Types.Math.Vector2Like[], true);
      } else obj = this.scene.add.image(0, 0, key).setOrigin(0, 0.5);
      this.container.add(obj);
      this.ropes.set(d.id, obj);
    }
    return obj;
  }

  /** Performs one frame: the action wanted, where the body stands, how it looks. Returns the solved frame. */
  update(now: number, want: Want, place: PuppetPlace, look: PuppetLook = {}): Frame | null {
    if (!this.loaded()) {
      this.container.setVisible(false);
      return null;
    }
    // The root's own travel feeds the springs (in canvas px), so a dash swings the ears.
    const rx = place.x / place.scale;
    const ry = place.y / place.scale;
    if (this.lastRoot) this.performer.nudgeRoot((rx - this.lastRoot.x) * (place.mirrored ? -1 : 1), ry - this.lastRoot.y);
    this.lastRoot = { x: rx, y: ry };
    const f = this.performer.update(now, want);
    this.frame = f;
    const res = this.rig.res;
    const tint = look.gray && look.gray > 0.01 ? grey(look.gray) : (look.tint ?? null);
    for (const d of f.drawn) {
      if (d.kind === 'part') {
        const img = this.partImage(d);
        img.setPosition(d.x, d.y).setRotation(d.rot).setScale(d.sx / res, d.sy / res);
        if (tint !== null) img.setTint(tint);
        else img.clearTint();
      } else {
        const obj = this.chainObject(d);
        if (obj instanceof Phaser.GameObjects.Rope) {
          const pts = obj.points as unknown as { x: number; y: number }[];
          // The strip is as thick as its picture's texture px: the points go in at ×res and the rope is scaled back by 1/res, so its
          // thickness matches the parts around it.
          for (let i = 0; i < pts.length && i < d.points.length; i++) {
            pts[i]!.x = d.points[i]!.x * res;
            pts[i]!.y = d.points[i]!.y * res;
          }
          obj.setScale(1 / res);
          obj.setDirty();
          if (tint !== null) obj.setColors(tint);
          else obj.setColors(0xffffff);
        } else {
          const a = d.points[0]!;
          const b = d.points[d.points.length - 1]!;
          obj.setPosition(a.x, a.y).setRotation(Math.atan2(b.y - a.y, b.x - a.x)).setScale(1 / res);
          if (tint !== null) obj.setTint(tint);
          else obj.clearTint();
        }
      }
    }
    if (this.rig.skin && !this.skin) {
      this.skin = new SkinView(this.scene, this.rig);
      this.container.add(this.skin.object);
    }
    this.skin?.draw(f, tint, now);
    const skinObj = this.skin?.object;
    // Depth order inside the container follows the draw list (the skin at its own depth).
    const order: Phaser.GameObjects.GameObject[] = [];
    const skinZ = this.rig.skin?.z ?? 0;
    let skinPlaced = !skinObj;
    for (const d of f.drawn) {
      if (!skinPlaced && d.z > skinZ) {
        order.push(skinObj!);
        skinPlaced = true;
      }
      const o = d.kind === 'part' ? this.images.get(d.bone) : this.ropes.get(d.id);
      if (o) order.push(o);
    }
    if (!skinPlaced) order.push(skinObj!);
    order.forEach((o, i) => {
      if (this.container.getIndex(o) !== i) this.container.moveTo(o, i);
    });
    const flip = place.mirrored ? -1 : 1;
    this.container
      .setVisible(true)
      .setPosition(place.x, place.y)
      .setScale(place.scale * flip * (place.sx ?? 1), place.scale * (place.sy ?? 1))
      .setAngle(place.rot ?? 0)
      .setDepth(place.depth)
      .setAlpha(place.alpha ?? 1);
    this.applyLook(look);
    return f;
  }

  private applyLook(look: PuppetLook) {
    const fx = this.fx;
    if (!fx) return;
    const bright = look.bright ?? 1;
    const gray = look.gray ?? 0;
    const wantMatrix = bright > 1.01 || gray > 0.01;
    if (wantMatrix && !this.matrix) this.matrix = fx.addColorMatrix();
    if (!wantMatrix && this.matrix) {
      fx.remove(this.matrix as unknown as Phaser.FX.Controller);
      this.matrix = null;
    }
    if (this.matrix) {
      this.matrix.reset();
      if (gray > 0.01) this.matrix.grayscale(gray, true);
      if (bright > 1.01) this.matrix.brightness(bright, true);
    }
    const wantGlow = look.glow !== null && look.glow !== undefined && (look.glowAlpha ?? 0.6) > 0.01;
    if (wantGlow && !this.glowFx) this.glowFx = fx.addGlow(0xffffff, 0, 0, false, 0.1, 10);
    if (!wantGlow && this.glowFx) {
      fx.remove(this.glowFx as unknown as Phaser.FX.Controller);
      this.glowFx = null;
    }
    if (this.glowFx) {
      this.glowFx.color = look.glow!;
      this.glowFx.outerStrength = 4 * (look.glowAlpha ?? 0.6);
    }
  }

  /** The screen point of a bone (its joint), for effects that land on the head or come out of the mouth. */
  point(bone: string, dx = 0, dy = 0): { x: number; y: number } | null {
    const w = this.frame?.worlds.get(bone);
    if (!w || !this.container.visible) return null;
    const m = this.container.getWorldTransformMatrix();
    const p = m.transformPoint(w.x + dx, w.y + dy);
    return { x: p.x, y: p.y };
  }

  /** Every visible part as it stands in the world (ghost copies, trails, colour splits). */
  copies(): PartCopy[] {
    if (!this.container.visible) return [];
    const out: PartCopy[] = [];
    const parent = this.container.getWorldTransformMatrix();
    const local = new Phaser.GameObjects.Components.TransformMatrix();
    const world = new Phaser.GameObjects.Components.TransformMatrix();
    if (this.skin) {
      // A ghost of a skinned body is its picture at rest (the bend of one frame is not worth a copy of the grid).
      const b = this.skin.restBox();
      local.applyITRS(b.x, b.y, 0, b.scale, b.scale);
      parent.multiply(local, world);
      const d = world.decomposeMatrix();
      out.push({ key: b.img, x: d.translateX, y: d.translateY, originX: 0.5, originY: 0.5, scaleX: d.scaleX, scaleY: d.scaleY, rotation: d.rotation, depth: this.container.depth });
    }
    for (const obj of this.container.list) {
      if (!(obj instanceof Phaser.GameObjects.Image) || !obj.visible) continue;
      local.applyITRS(obj.x, obj.y, obj.rotation, obj.scaleX, obj.scaleY);
      parent.multiply(local, world);
      const d = world.decomposeMatrix();
      out.push({ key: obj.texture.key, x: d.translateX, y: d.translateY, originX: obj.originX, originY: obj.originY, scaleX: d.scaleX, scaleY: d.scaleY, rotation: d.rotation, depth: this.container.depth });
    }
    return out;
  }

  hide() {
    this.container.setVisible(false);
  }

  destroy() {
    this.container.destroy(true);
  }
}
