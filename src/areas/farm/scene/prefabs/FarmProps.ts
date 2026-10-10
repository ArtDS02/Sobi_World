// Save-driven state of static farm props: the trough's fill texture and which decorations show
// (spec §20.2, DECISIONS PG-3). The scene creates the images; this only toggles them.
import type * as Phaser from 'phaser';
import type { DecorId } from '../../logic/config/ids';
import type { FarmGame } from '../../logic/types';
import { FALLBACK_PROP_KEY, troughTextureKey } from '../view/textureKeys';

type Visible = Phaser.GameObjects.Components.Visible;

export class FarmProps {
  private readonly decor: { id: string; spot: number; parts: Visible[] }[] = [];

  /** A decoration placement: its art (and shadow) show only while the save owns `id` and stands it on this `spot`. */
  addDecor(id: string, spot: number, ...parts: (Visible | null)[]) {
    this.decor.push({ id, spot, parts: parts.filter((p): p is Visible => p !== null) });
  }

  sync(
    textures: Phaser.Textures.TextureManager,
    trough: Phaser.GameObjects.Image | null,
    save: FarmGame | null,
  ) {
    const owned = new Set<string>(save?.decor ?? []);
    for (const d of this.decor) {
      const plan = save?.decorPlan?.[d.id as DecorId] ?? { spot: 0, stored: false };
      const shown = owned.has(d.id) && !plan.stored && plan.spot === d.spot;
      for (const part of d.parts) part.setVisible(shown);
    }
    if (!trough || !save) return;
    const key = troughTextureKey(save.trough.food, save.trough.capacity);
    const next = textures.exists(key) ? key : FALLBACK_PROP_KEY;
    if (trough.texture.key !== next) trough.setTexture(next);
  }
}
