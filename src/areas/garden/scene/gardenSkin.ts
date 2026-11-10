// The Garden's buildings in the theme of the skin the zone on screen wears (decision 056): mill, composter and shop swap to their
// `<art>_<skin>` picture when that skin's themed set was delivered; otherwise they keep the plain art.
import type * as Phaser from 'phaser';
import { skinBuildingArt } from '../../../core/config/plotSkins';
import { textureKey } from '../../../ui/world/keys';

export function themeBuildings(textures: Phaser.Textures.TextureManager, parts: ReadonlyMap<string, { img: Phaser.GameObjects.Image } | undefined>, plain: ReadonlyMap<string, string>, skin: string | null) {
  for (const [id, base] of plain) {
    const key = textureKey(skinBuildingArt(base, skin, 'garden'));
    const img = parts.get(id)?.img;
    if (img && img.texture.key !== key && textures.exists(key)) img.setTexture(key);
  }
}
