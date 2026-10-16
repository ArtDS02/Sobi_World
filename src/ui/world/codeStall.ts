// A small market stall drawn in code (decision 029), standing in for an Area's shop art (bld_shop_*) until it is painted:
// a wooden counter with goods, two posts and a striped awning in the Area's colours. Same Farm look: warm brown outline.
import type * as Phaser from 'phaser';
import { textureKey } from './keys';

export interface StallColours {
  stripe: number;
  stripe2: number;
  goods: readonly number[];
}

const W = 200;
const H = 190;

/** The stall's texture: its art when loaded, else the code stall in these colours (made once per key). */
export function stallKey(scene: Phaser.Scene, art: string, c: StallColours): string {
  if (scene.textures.exists(textureKey(art))) return textureKey(art);
  const key = `fx_stall_${art}`;
  if (scene.textures.exists(key)) return key;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const ink = 0x6b4423;
  // Posts.
  g.fillStyle(0xb98a55, 1).fillRect(26, 50, 12, 120).fillRect(162, 50, 12, 120);
  g.lineStyle(3, ink, 1).strokeRect(26, 50, 12, 120).strokeRect(162, 50, 12, 120);
  // Awning: six stripes and a scalloped hem.
  for (let k = 0; k < 6; k += 1) g.fillStyle(k % 2 === 0 ? c.stripe : c.stripe2, 1).fillRect(14 + k * 29, 22, 29, 40);
  for (let k = 0; k < 6; k += 1) g.fillStyle(k % 2 === 0 ? c.stripe : c.stripe2, 1).fillCircle(28 + k * 29, 62, 14);
  g.lineStyle(3, ink, 1).strokeRoundedRect(12, 18, 176, 46, 10);
  // Counter with goods on top.
  g.fillStyle(0xd9a86a, 1).fillRoundedRect(16, 112, 168, 62, 8);
  g.fillStyle(0xc08d52, 1).fillRect(16, 130, 168, 6);
  g.lineStyle(3, ink, 1).strokeRoundedRect(16, 112, 168, 62, 8);
  c.goods.forEach((colour, k) => {
    const x = 40 + k * 40;
    g.fillStyle(colour, 1).fillRoundedRect(x - 14, 90, 28, 24, 6);
    g.lineStyle(2, ink, 1).strokeRoundedRect(x - 14, 90, 28, 24, 6);
  });
  // Grass at its foot.
  g.fillStyle(0x7cc46a, 1).fillEllipse(W / 2, 178, 190, 20);
  g.generateTexture(key, W, H);
  g.destroy();
  return key;
}
