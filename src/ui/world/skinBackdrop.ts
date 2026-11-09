// Paints a scene's backdrop for the skin its tier / zone wears (decision 056): the skin's own picture when it exists and is loaded,
// else the plain backdrop tinted by the skin's mood (or by the tier's own tint when no skin is worn).
import type * as Phaser from 'phaser';
import { skinTheme } from '../../core/config/plotSkins';
import { textureKey } from './keys';

export function paintBackdrop(img: Phaser.GameObjects.Image, base: string, skinArt: string | null, skin: string | null | undefined, plainTint: number) {
  if (skinArt && img.scene.textures.exists(textureKey(skinArt))) return void img.setTexture(textureKey(skinArt)).clearTint();
  if (img.scene.textures.exists(textureKey(base))) img.setTexture(textureKey(base));
  img.setTint(skinTheme(skin)?.backdrop ?? plainTint);
}
