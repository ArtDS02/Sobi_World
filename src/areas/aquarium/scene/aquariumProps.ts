// The things standing in an Aquarium place (decision 030): the name plaque (opens the tank card), the rod at the
// fishing spot (or a hit area over the spot the backdrop paints) — while a cast is ready a fish bites: the float is cut
// out of the rod's picture and jerks down, the rod tugs (decision 033); where the backdrop paints the spot, the scene
// rings the water by its float or makes the deep sea's lantern glow — the eggs and the pile of scales on the sand, and pearls for
// the look. Positions come from the place.
import * as Phaser from 'phaser';
import { stallKey } from '../../../ui/world/codeStall';
import { setSignText } from '../../../ui/world/signText';
import { FALLBACK_PROP_KEY, textureKey } from '../../../ui/world/keys';
import type { SceneState } from '../logic/derived';
import type { AquariumPick } from './AquariumScene';
import { AQUARIUM_VIEW, eggSpot, type AquariumPlace } from './aquariumView';

type Img = Phaser.GameObjects.Image;

export interface AquariumPropsDeps {
  onPick: (pick: AquariumPick) => void;
  reduceMotion: () => boolean;
}

export class AquariumProps {
  private plaque: Img;
  private shop: Img;
  private plaqueText: Phaser.GameObjects.Text;
  /** The rod's picture in three cuts of the same texture: the rod and line above the float, the handle beside it,
   *  and the float, which can move on its own. All three share position, origin, scale and rotation. */
  private rod: Img;
  private rodLow: Img;
  private rodFloat: Img;
  private dock: Phaser.GameObjects.Zone;
  private pile: Img;
  private pileBadge: Phaser.GameObjects.Text;
  private eggs: Img[] = [];
  private decor: Img[] = [];
  private place: AquariumPlace | null = null;
  /** Images of fixed art and the width they are drawn at, re-pointed when their texture arrives late. */
  private art: [Img, string, number][] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly deps: AquariumPropsDeps,
  ) {
    const v = AQUARIUM_VIEW;
    const t = v.text;
    this.plaque = this.image(v.plaque.art, v.plaque.width).setDepth(v.depth.sign);
    this.shop = scene.add.image(0, 0, FALLBACK_PROP_KEY).setOrigin(0.5, 1).setDepth(v.depth.sign);
    this.plaqueText = scene.add
      .text(0, 0, '', { fontFamily: t.fontFamily, fontSize: `${t.plaquePx}px`, fontStyle: 'bold', color: t.color })
      .setOrigin(0.5)
      .setDepth(v.depth.sign + 1);
    this.rod = this.image(v.rod.art, 0).setOrigin(0.5, 1).setDepth(v.depth.dock);
    this.rodLow = this.image(v.rod.art, 0).setOrigin(0.5, 1).setDepth(v.depth.dock);
    this.rodFloat = this.image(v.rod.art, 0).setOrigin(0.5, 1).setDepth(v.depth.dock + 1);
    this.cutRod();
    this.dock = scene.add.zone(0, 0, 1, 1).setDepth(v.depth.dock);
    this.pile = this.image(v.scalePile.art, v.scalePile.width).setOrigin(0.5, 1).setDepth(v.depth.egg).setVisible(false);
    this.pileBadge = scene.add
      .text(0, 0, '', { fontFamily: t.fontFamily, fontSize: `${v.badge.fontPx}px`, fontStyle: 'bold', color: v.badge.color, backgroundColor: v.badge.background, padding: { x: 8, y: 0 } })
      .setOrigin(0.5)
      .setDepth(v.depth.badge)
      .setVisible(false);

    const tank = () => deps.onPick({ kind: 'tank' });
    this.clickable(this.plaque, tank, this.plaqueText);
    this.clickable(this.shop, () => deps.onPick({ kind: 'shop' }));
    this.clickable(this.rod, () => deps.onPick({ kind: 'dock' }), undefined, [this.rodLow, this.rodFloat]);
    this.dock.setInteractive({ useHandCursor: true }).on(Phaser.Input.Events.POINTER_DOWN, () => deps.onPick({ kind: 'dock' }));
    this.clickable(this.pile, () => deps.onPick({ kind: 'scales' }));
    this.pileBadge.setInteractive({ useHandCursor: true }).on(Phaser.Input.Events.POINTER_DOWN, () => deps.onPick({ kind: 'scales' }));
  }

  /** Puts everything where `place` has it; `name` goes on the plaque. */
  layout(place: AquariumPlace, name: string) {
    this.place = place;
    const v = AQUARIUM_VIEW;
    this.plaque.setPosition(place.plaque.x, place.plaque.y);
    this.shop.setPosition(place.shop.x, place.shop.y);
    this.dressShop();
    const p = v.plaque;
    setSignText(this.plaqueText, { x: place.plaque.x + ((p.face.from + p.face.to) / 2 - 0.5) * p.width, y: place.plaque.y, width: (p.face.to - p.face.from) * p.width, height: p.face.height * p.height }, name, { fontFamily: v.text.fontFamily, minPx: p.px[0], maxPx: p.px[1], look: 'carved' });
    const rod = place.rod;
    for (const part of this.rodParts()) {
      part.setVisible(Boolean(rod)).setRotation(0);
      if (rod) part.setPosition(rod.x, rod.y).setScale(rod.scale).setData('scale', rod.scale);
    }
    this.cutRod();
    const d = place.dock;
    this.dock.setPosition(d.x, d.y).setSize(d.width, d.height);
    this.dock.input?.hitArea.setTo(0, 0, d.width, d.height);
    this.pile.setPosition(place.scales.x, place.scales.y);
    this.pileBadge.setPosition(place.scales.x + v.scalePile.width * 0.42, place.scales.y - v.scalePile.width * 0.55);
    for (const img of this.decor) img.destroy();
    this.art = this.art.filter(([img]) => !this.decor.includes(img));
    this.decor = place.decor.map((d) => this.image(d.art, v.decorWidth[d.art] ?? 64).setOrigin(0.5, 1).setPosition(d.x, d.y).setDepth(v.depth.decor));
    this.eggs.forEach((egg, i) => egg.setPosition(eggSpot(place, i).x, eggSpot(place, i).y));
  }

  /** Shows what the state says: the scales and their count, the eggs. */
  show(state: SceneState) {
    const place = this.place;
    if (!place) return;
    const v = AQUARIUM_VIEW;
    this.pile.setVisible(state.scales > 0);
    this.pileBadge.setText(String(state.scales)).setVisible(state.scales > 0);
    while (this.eggs.length < state.eggs) {
      const at = eggSpot(place, this.eggs.length);
      this.eggs.push(this.image(v.egg.art, v.egg.width).setOrigin(0.5, 1).setPosition(at.x, at.y).setDepth(v.depth.egg));
    }
    this.eggs.forEach((egg, i) => egg.setVisible(i < state.eggs));
  }

  /**
   * A fish bites (while a cast is ready): the float jerks down twice and the rod tugs on its handle. Where the backdrop
   * paints the spot, the answer is where the scene rings the water or makes the lantern glow (null: nothing to add).
   */
  bite(): { x: number; y: number; kind: 'ripple' | 'glow' } | null {
    const place = this.place;
    if (!place) return null;
    if (place.bite) return place.bite;
    const rod = place.rod;
    if (!rod) return null;
    const b = AQUARIUM_VIEW.bite;
    if (this.scene.tweens.isTweening(this.rodFloat)) return null;
    const parts = this.rodParts();
    this.scene.tweens.add({ targets: parts, rotation: b.tugRad, duration: 90, yoyo: true, repeat: 1, ease: 'Sine.easeInOut', onComplete: () => parts.forEach((p) => p.setRotation(0)) });
    this.scene.tweens.add({ targets: this.rodFloat, y: rod.y + b.dipPx, duration: 110, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: () => this.rodFloat.setY(rod.y) });
    return null;
  }

  private rodParts(): Img[] {
    return [this.rod, this.rodLow, this.rodFloat];
  }

  /** Cuts the rod's texture into its three pieces (again when the real picture arrives late). */
  private cutRod() {
    const f = AQUARIUM_VIEW.bite.cut;
    const w = this.rod.width;
    const h = this.rod.height;
    // Measured on the 200 × 300 picture; a stand-in texture of another size is just drawn whole.
    if (w !== f.width || h !== f.height) {
      this.rod.setCrop();
      this.rodLow.setCrop(0, 0, 0, 0);
      this.rodFloat.setCrop(0, 0, 0, 0);
      return;
    }
    this.rod.setCrop(0, 0, w, f.floatTop);
    this.rodLow.setCrop(0, f.floatTop, f.floatLeft, h - f.floatTop);
    this.rodFloat.setCrop(f.floatLeft, f.floatTop, w - f.floatLeft, h - f.floatTop);
  }

  /** A texture arrived: images still on the fallback take it. */
  retexture(key: string) {
    for (const [img, id, width] of this.art) {
      if (textureKey(id) !== key) continue;
      img.setTexture(key);
      if (width > 0) img.setData('scale', width / img.width);
      img.setScale((img.getData('scale') as number | undefined) ?? 1);
    }
    this.cutRod();
    this.dressShop();
  }

  /** The stall: the painted one when loaded, else the code stall, drawn `shop.width` wide. */
  private dressShop() {
    const v = AQUARIUM_VIEW.shop;
    const art = this.place?.shop.art;
    if (!art) return;
    this.shop.setTexture(this.scene.textures.exists(textureKey(art)) ? textureKey(art) : stallKey(this.scene, art, v.colours));
    const s = v.width / this.shop.width;
    this.shop.setData('scale', s).setScale(s);
  }

  /** An image of `id` drawn `width` wide (0 = its own size, or the scale set later). */
  private image(id: string, width: number): Img {
    const key = this.scene.textures.exists(textureKey(id)) ? textureKey(id) : FALLBACK_PROP_KEY;
    const img = this.scene.add.image(0, 0, key);
    if (width > 0) img.setData('scale', width / img.width).setScale(width / img.width);
    this.art.push([img, id, width]);
    return img;
  }

  /** A click opens something; hover grows the image (and its label) a little. */
  private clickable(img: Img, onClick: () => void, label?: Phaser.GameObjects.Text, also: Img[] = []) {
    for (const part of [img, ...also]) {
      part.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 20 });
      part.on(Phaser.Input.Events.POINTER_DOWN, onClick);
    }
    label?.setInteractive({ useHandCursor: true }).on(Phaser.Input.Events.POINTER_DOWN, onClick);
    const grow = (on: boolean) => {
      if (this.deps.reduceMotion()) return;
      const k = on ? AQUARIUM_VIEW.hoverScale : 1;
      const s = ((img.getData('scale') as number | undefined) ?? 1) * k;
      this.scene.tweens.add({ targets: [img, ...also], scaleX: s, scaleY: s, duration: 120 });
      if (label) this.scene.tweens.add({ targets: label, scale: k, duration: 120 });
    };
    for (const target of label ? [img, label] : [img, ...also]) {
      target.on(Phaser.Input.Events.POINTER_OVER, () => grow(true));
      target.on(Phaser.Input.Events.POINTER_OUT, () => grow(false));
    }
  }
}
