// What a canvas click hit (spec §11.2): the top game object under the pointer → FarmPick.
import type * as Phaser from 'phaser';
import type { FarmAction } from '../../core/config/assetIds';
import { FARM_VIEW } from '../../core/config/farmView';
import { vi } from '../../i18n/vi';
import type { FarmPick } from '../farmView';
import { GIFT_ID_DATA } from '../prefabs/GiftBoxes';
import { PIG_ID_DATA } from '../prefabs/PigSprite';

export const ACTION_DATA = 'farmAction';

/** The top object under the pointer → what was clicked. */
export function pickOf(top: Phaser.GameObjects.GameObject | undefined): FarmPick {
  const pigId: unknown = top?.getData(PIG_ID_DATA);
  if (typeof pigId === 'string') return { kind: 'pig', pigId };
  const giftId: unknown = top?.getData(GIFT_ID_DATA);
  if (typeof giftId === 'string') return { kind: 'gift', giftId };
  const action: unknown = top?.getData(ACTION_DATA);
  if (typeof action === 'string') return { kind: 'action', action: action as FarmAction };
  return { kind: 'ground' };
}

/**
 * Hand cursor + pixel-perfect hit + an always-visible name tag (no hover-only cue, §10.4); art
 * with its own painted sign needs no tag (`tag` false). Returns the tag, if any.
 */
export function makeClickable(
  scene: Phaser.Scene,
  img: Phaser.GameObjects.Image,
  action: FarmAction,
  tag: boolean,
): Phaser.GameObjects.Text | null {
  img.setData(ACTION_DATA, action).setInteractive({
    pixelPerfect: true,
    alphaTolerance: FARM_VIEW.HIT_ALPHA,
    useHandCursor: true,
  });
  if (!tag) return null;
  const l = FARM_VIEW.LABEL;
  const bottom = img.y + img.displayHeight * (1 - img.originY);
  return scene.add
    .text(img.x, bottom + l.offsetY, vi.farm[action], {
      color: l.color,
      backgroundColor: l.background,
      fontSize: `${l.fontPx}px`,
      fontFamily: l.fontFamily,
      fontStyle: 'bold',
      padding: { x: l.padX, y: l.padY },
    })
    .setOrigin(0.5, 0)
    .setDepth(img.depth + l.depthAbove)
    .setData(ACTION_DATA, action)
    .setInteractive({ useHandCursor: true });
}
