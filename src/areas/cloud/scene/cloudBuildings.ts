// The Cloud's two buildings on the grass banks at the left (decision 023): the spring of pure water and the cauldron, each
// with its wooden name plank and a round counter (water waiting, potions ready). A brewing cauldron swells gently.
// Hover answers differ (owner's ask): drops jump out of the spring; the cauldron hops and bubbles. Hovering a plank wakes
// its building too.
// Draws and reports clicks; CloudScene decides what they do.
import { signText } from '../../../ui/world/signText';
import * as Phaser from 'phaser';
import { vi } from '../../../i18n/vi';
import { CLOUD_BUILDING_ART, CLOUD_DRESSING_ART } from '../logic/art';
import type { SceneState } from '../logic/derived';
import { bubbles, drawBadge, splash, type Badge } from './cloudFx';
import { stallKey } from '../../../ui/world/codeStall';
import { textureKey } from '../../../ui/world/keys';
import { CLOUD_VIEW } from './cloudView';

type Img = Phaser.GameObjects.Image;
export type BuildingId = 'spring' | 'cauldron' | 'shop';

export interface BuildingsDeps {
  fixed: (x: number, y: number, id: string) => Img;
  /** Hover press on a plank. */
  press: (img: Img) => void;
  paused: () => boolean;
  reduceMotion: () => boolean;
  onPick: (building: BuildingId) => void;
}

interface Building {
  img: Img;
  badge: Badge;
  scale: number;
}

export class CloudBuildings {
  private readonly list = new Map<BuildingId, Building>();
  private brew: Phaser.Tweens.Tween | null = null;
  /** The building whose hover answer is repeating, and its timer. */
  private hovered: { id: BuildingId; timer: Phaser.Time.TimerEvent } | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly d: BuildingsDeps,
  ) {
    const v = CLOUD_VIEW;
    this.make('spring', CLOUD_BUILDING_ART.spring, v.spring);
    this.make('cauldron', CLOUD_BUILDING_ART.cauldron, v.cauldron);
    this.make('shop', v.shop.art, v.shop);
    const shop = this.list.get('shop')!.img;
    if (!scene.textures.exists(textureKey(v.shop.art))) shop.setTexture(stallKey(scene, v.shop.art, v.shop.colours));
    this.plank(v.springLabel, vi.cloud.spring, 'spring');
    this.plank(v.cauldronLabel, vi.cloud.cauldron, 'cauldron');
    this.plank(v.shopLabel, vi.cloud.shop, 'shop');
  }

  /** Counters, the unbuilt cauldron's grey, and the brewing swell. */
  draw(state: SceneState) {
    const spring = this.list.get('spring');
    if (spring) drawBadge(spring.badge, state.water > 0 ? `${state.water}` : '', state.water >= state.waterCapacity);
    const cauldron = this.list.get('cauldron');
    if (!cauldron) return;
    cauldron.img.setTint(state.cauldron.built ? 0xffffff : CLOUD_VIEW.unbuilt.tint);
    const text = state.cauldron.ready > 0 ? `✓ ${state.cauldron.ready}` : state.cauldron.busy ? '…' : '';
    drawBadge(cauldron.badge, text, state.cauldron.ready > 0);
    this.setBrewing(cauldron, state.cauldron.busy);
  }

  private make(id: BuildingId, art: string, at: { x: number; y: number; scale: number }) {
    const v = CLOUD_VIEW;
    const img = this.d.fixed(at.x, at.y, art).setOrigin(0.5, 1).setScale(at.scale).setDepth(v.depth.building + at.y * 0.01);
    img.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 20 });
    img.on(Phaser.Input.Events.POINTER_DOWN, () => !this.d.paused() && this.d.onPick(id));
    this.hoverAnswer(img, id);
    const side = id === 'cauldron' ? -0.34 : 0.34;
    const box = this.scene.add.graphics().setDepth(v.depth.badge).setPosition(at.x + img.displayWidth * side, at.y - img.displayHeight * 0.8);
    const text = this.scene.add
      .text(box.x, box.y, '', { fontFamily: v.label.fontFamily, fontSize: `${v.badge.fontPx}px`, fontStyle: 'bold', color: v.badge.color })
      .setOrigin(0.5)
      .setDepth(v.depth.badge + 1);
    this.list.set(id, { img, badge: { box, text }, scale: at.scale });
  }

  /** A wooden plank with the building's name; clicking it is clicking the building. */
  private plank(at: { x: number; y: number }, name: string, id: BuildingId) {
    const v = CLOUD_VIEW;
    const plank = this.d.fixed(at.x, at.y, CLOUD_DRESSING_ART.plank).setDisplaySize(v.plank.width, v.plank.height).setDepth(v.depth.sign).setInteractive({ useHandCursor: true });
    plank.on(Phaser.Input.Events.POINTER_DOWN, () => !this.d.paused() && this.d.onPick(id));
    this.d.press(plank);
    this.hoverAnswer(plank, id);
    const f = v.plankFace;
    const face = { x: at.x + ((f.from + f.to) / 2 - 0.5) * v.plank.width, y: at.y + f.dy * v.plank.height, width: (f.to - f.from) * v.plank.width, height: f.height * v.plank.height };
    signText(this.scene, face, name, { fontFamily: v.label.fontFamily, minPx: v.signPx.plank[0], maxPx: v.signPx.plank[1], look: 'carved' }, v.depth.sign + 1);
  }

  /** While `target` is hovered, its building answers now and every 1.1 s (nothing when motion is reduced). */
  private hoverAnswer(target: Img, id: BuildingId) {
    target.on(Phaser.Input.Events.POINTER_OVER, () => {
      if (this.d.paused() || this.d.reduceMotion() || this.hovered?.id === id) return;
      this.hovered?.timer.remove();
      this.answer(id);
      this.hovered = { id, timer: this.scene.time.addEvent({ delay: 1100, loop: true, callback: () => this.answer(id) }) };
    });
    target.on(Phaser.Input.Events.POINTER_OUT, () => {
      if (this.hovered?.id !== id) return;
      this.hovered.timer.remove();
      this.hovered = null;
    });
  }

  private answer(id: BuildingId) {
    const b = this.list.get(id);
    if (!b) return;
    const top = b.img.y - b.img.displayHeight;
    if (id === 'spring') return void splash(this.scene, b.img.x, top + b.img.displayHeight * 0.55);
    if (id === 'cauldron') bubbles(this.scene, b.img.x + b.img.displayWidth * 0.04, top + b.img.displayHeight * 0.3);
    this.scene.tweens.add({ targets: b.img, y: b.img.y - 6, duration: 130, yoyo: true, ease: 'Quad.easeOut' });
  }

  /** A brewing cauldron swells gently, as if it bubbled; it rests when idle. */
  private setBrewing(c: Building, busy: boolean) {
    if (busy === (this.brew !== null) || this.d.reduceMotion()) return;
    if (busy) {
      const k = CLOUD_VIEW.idle.brewSwell;
      this.brew = this.scene.tweens.add({ targets: c.img, scaleY: c.scale * (1 + k), scaleX: c.scale * (1 - k / 2), duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else {
      this.brew?.remove();
      this.brew = null;
      c.img.setScale(c.scale);
    }
  }
}
