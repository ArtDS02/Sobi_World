// The things standing in an Aquarium place (decision 030): the "Bể cá" sign and the name plaque (both open the tank
// card), the rod at the fishing spot (or a hit area over the spot the backdrop paints) with a "!" while a cast is
// ready, the eggs and the pile of scales on the sand, and pearls for the look. Positions come from the place.
import * as Phaser from 'phaser';
import { vi } from '../../../i18n/vi';
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
  private sign: Img;
  private signText: Phaser.GameObjects.Text;
  private plaque: Img;
  private plaqueText: Phaser.GameObjects.Text;
  private rod: Img;
  private dock: Phaser.GameObjects.Zone;
  private ready: Phaser.GameObjects.Text;
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
    this.sign = this.image(v.sign.art, v.sign.width).setOrigin(0.5, 1).setDepth(v.depth.sign);
    this.signText = scene.add
      .text(0, 0, vi.aquarium.scene.sign, { fontFamily: t.fontFamily, fontSize: `${t.signPx}px`, fontStyle: 'bold', color: t.color })
      .setOrigin(0.5)
      .setDepth(v.depth.sign + 1);
    this.plaque = this.image(v.plaque.art, v.plaque.width).setDepth(v.depth.sign);
    this.plaqueText = scene.add
      .text(0, 0, '', { fontFamily: t.fontFamily, fontSize: `${t.plaquePx}px`, fontStyle: 'bold', color: t.color })
      .setOrigin(0.5)
      .setDepth(v.depth.sign + 1);
    this.rod = this.image(v.rod.art, 0).setOrigin(0.5, 1).setDepth(v.depth.dock);
    this.dock = scene.add.zone(0, 0, 1, 1).setDepth(v.depth.dock);
    this.ready = scene.add
      .text(0, 0, '!', { fontFamily: t.fontFamily, fontSize: `${v.ready.fontPx}px`, fontStyle: 'bold', color: v.ready.color, backgroundColor: v.ready.background, padding: { x: 12, y: 0 } })
      .setOrigin(0.5)
      .setDepth(v.depth.badge - 1)
      .setVisible(false);
    this.pile = this.image(v.scalePile.art, v.scalePile.width).setOrigin(0.5, 1).setDepth(v.depth.egg).setVisible(false);
    this.pileBadge = scene.add
      .text(0, 0, '', { fontFamily: t.fontFamily, fontSize: `${v.badge.fontPx}px`, fontStyle: 'bold', color: v.badge.color, backgroundColor: v.badge.background, padding: { x: 8, y: 0 } })
      .setOrigin(0.5)
      .setDepth(v.depth.badge)
      .setVisible(false);

    const tank = () => deps.onPick({ kind: 'tank' });
    this.clickable(this.sign, tank, this.signText);
    this.clickable(this.plaque, tank, this.plaqueText);
    this.clickable(this.rod, () => deps.onPick({ kind: 'dock' }));
    this.dock.setInteractive({ useHandCursor: true }).on(Phaser.Input.Events.POINTER_DOWN, () => deps.onPick({ kind: 'dock' }));
    this.ready.setInteractive({ useHandCursor: true }).on(Phaser.Input.Events.POINTER_DOWN, () => deps.onPick({ kind: 'dock' }));
    this.clickable(this.pile, () => deps.onPick({ kind: 'scales' }));
    this.pileBadge.setInteractive({ useHandCursor: true }).on(Phaser.Input.Events.POINTER_DOWN, () => deps.onPick({ kind: 'scales' }));
  }

  /** Puts everything where `place` has it; `name` goes on the plaque. */
  layout(place: AquariumPlace, name: string) {
    this.place = place;
    const v = AQUARIUM_VIEW;
    this.sign.setPosition(place.sign.x, place.sign.y);
    this.signText.setPosition(place.sign.x, place.sign.y - this.sign.displayHeight * 0.66);
    this.plaque.setPosition(place.plaque.x, place.plaque.y);
    this.plaqueText.setPosition(place.plaque.x, place.plaque.y + 1).setText(name);
    const rod = place.rod;
    this.rod.setVisible(Boolean(rod));
    if (rod) this.rod.setPosition(rod.x, rod.y).setScale(rod.scale).setData('scale', rod.scale);
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

  /** Shows what the state says: the scales and their count, the eggs, the "!" while a cast is ready. */
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
    // Beside the fishing spot, not over it: the top-right corner belongs to the HUD buttons.
    const x = place.dock.x - place.dock.width / 2 - 18;
    const y = place.dock.y;
    this.scene.tweens.killTweensOf(this.ready);
    this.ready.setPosition(x, y).setVisible(state.castReady);
    if (state.castReady && !this.deps.reduceMotion()) {
      this.scene.tweens.add({ targets: this.ready, y: y - 8, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  /** A texture arrived: images still on the fallback take it. */
  retexture(key: string) {
    for (const [img, id, width] of this.art) {
      if (textureKey(id) !== key) continue;
      img.setTexture(key);
      if (width > 0) img.setData('scale', width / img.width);
      img.setScale((img.getData('scale') as number | undefined) ?? 1);
    }
    if (this.place) this.signText.setY(this.place.sign.y - this.sign.displayHeight * 0.66);
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
  private clickable(img: Img, onClick: () => void, label?: Phaser.GameObjects.Text) {
    img.setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 20 });
    img.on(Phaser.Input.Events.POINTER_DOWN, onClick);
    label?.setInteractive({ useHandCursor: true }).on(Phaser.Input.Events.POINTER_DOWN, onClick);
    const grow = (on: boolean) => {
      if (this.deps.reduceMotion()) return;
      const k = on ? AQUARIUM_VIEW.hoverScale : 1;
      const s = ((img.getData('scale') as number | undefined) ?? 1) * k;
      this.scene.tweens.add({ targets: img, scaleX: s, scaleY: s, duration: 120 });
      if (label) this.scene.tweens.add({ targets: label, scale: k, duration: 120 });
    };
    for (const target of label ? [img, label] : [img]) {
      target.on(Phaser.Input.Events.POINTER_OVER, () => grow(true));
      target.on(Phaser.Input.Events.POINTER_OUT, () => grow(false));
    }
  }
}
