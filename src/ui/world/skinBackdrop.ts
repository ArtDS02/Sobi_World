// Paints a scene's backdrop for the skin its tier / zone wears (decision 056): the skin's own picture when it exists and is loaded,
// else the plain backdrop tinted by the skin's mood (or by the tier's own tint when no skin is worn). When the look of the SAME
// tier / zone changes (a skin applied, or the automatic skin of decision 057, B7 following the hour or the season) the old picture
// fades out over the new one instead of snapping, unless effects are off or motion is reduced.
import type * as Phaser from 'phaser';
import { skinTheme } from '../../core/config/plotSkins';
import { effectsWith, type EffectsMode } from '../../systems/animation/rankAtmosphere';
import { textureKey } from './keys';

/** Which tier / zone the backdrop is painted for, and the settings that allow a soft change. */
export interface BackdropFade {
  group: number;
  mode: EffectsMode;
  /** "Giảm chuyển động", or the scene is in the middle of a move of its own. */
  still: boolean;
}

export const BACKDROP_FADE_MS = 900;

const PAINTED = new WeakMap<Phaser.GameObjects.Image, number>();

export function paintBackdrop(img: Phaser.GameObjects.Image, base: string, skinArt: string | null, skin: string | null | undefined, plainTint: number, fade: BackdropFade | null = null) {
  const before = { key: img.texture.key, tint: img.tintTopLeft, tinted: img.isTinted, width: img.displayWidth, height: img.displayHeight };
  if (skinArt && img.scene.textures.exists(textureKey(skinArt))) img.setTexture(textureKey(skinArt)).clearTint();
  else {
    if (img.scene.textures.exists(textureKey(base))) img.setTexture(textureKey(base));
    img.setTint(skinTheme(skin)?.backdrop ?? plainTint);
  }
  const sameGroup = fade !== null && PAINTED.get(img) === fade.group;
  if (fade) PAINTED.set(img, fade.group);
  const changed = img.texture.key !== before.key || img.isTinted !== before.tinted || (img.isTinted && img.tintTopLeft !== before.tint);
  if (!fade || !sameGroup || !changed || !effectsWith(fade.mode, fade.still).crossfade) return;
  // The old look, laid over the new one and faded away.
  const ghost = img.scene.add.image(img.x, img.y, before.key).setOrigin(img.originX, img.originY).setDisplaySize(before.width, before.height).setDepth(img.depth);
  if (before.tinted) ghost.setTint(before.tint);
  img.scene.tweens.add({ targets: ghost, alpha: 0, duration: BACKDROP_FADE_MS, ease: 'Sine.easeInOut', onComplete: () => ghost.destroy() });
}
