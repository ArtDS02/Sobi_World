// Pig name plates under the feet (U05). One Phaser text per pig, created once; positions follow
// the pigs every frame through layoutNameplates (no overlap between plates).
import * as Phaser from 'phaser';
import { FARM_VIEW } from '../config/farmView';
import { layoutNameplates, type PlateRequest } from '../view/nameplateLayout';

/** Where a pig's plate hangs right now; null while it has no position or is leaving. */
export interface PlateAnchor {
  x: number;
  feetY: number;
  depth: number;
  alpha: number;
}

export class Nameplates {
  private readonly texts = new Map<string, Phaser.GameObjects.Text>();

  constructor(private readonly scene: Phaser.Scene) {}

  /** Keeps one plate per pig id with its current name; removes plates of pigs gone. */
  sync(names: ReadonlyMap<string, string>) {
    for (const [id, text] of this.texts) {
      if (names.has(id)) continue;
      text.destroy();
      this.texts.delete(id);
    }
    const n = FARM_VIEW.NAMEPLATE;
    for (const [id, name] of names) {
      const text = this.texts.get(id);
      if (text) {
        if (text.text !== name) text.setText(name);
        continue;
      }
      const made = this.scene.add
        .text(0, 0, name, {
          color: n.color,
          stroke: n.stroke,
          strokeThickness: n.strokePx,
          fontSize: `${n.fontPx}px`,
          fontFamily: FARM_VIEW.LABEL.fontFamily,
          fontStyle: 'bold',
          padding: { x: n.padX, y: n.padY },
          shadow: {
            offsetX: n.shadow.x,
            offsetY: n.shadow.y,
            color: n.shadow.color,
            blur: n.shadow.blur,
            fill: true,
          },
        })
        .setOrigin(0.5, 0);
      this.texts.set(id, made);
    }
  }

  /** Called every frame with each pig's anchor. */
  update(anchorOf: (id: string) => PlateAnchor | null) {
    const n = FARM_VIEW.NAMEPLATE;
    const requests: PlateRequest[] = [];
    const anchors = new Map<string, PlateAnchor>();
    for (const [id, text] of this.texts) {
      const a = anchorOf(id);
      text.setVisible(a !== null);
      if (!a) continue;
      anchors.set(id, a);
      requests.push({ id, x: a.x, y: a.feetY + n.gapPx, w: text.width, h: text.height });
    }
    for (const [id, place] of layoutNameplates(requests, n.rowGapPx, n.maxShift)) {
      const a = anchors.get(id)!;
      this.texts
        .get(id)!
        .setPosition(place.x, place.y)
        .setDepth(a.depth + n.depthAbove)
        .setAlpha(a.alpha);
    }
  }

  destroy() {
    for (const t of this.texts.values()) t.destroy();
    this.texts.clear();
  }
}
