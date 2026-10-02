// What a canvas click hit (spec §11.2): the top game object under the pointer → FarmPick.
import type * as Phaser from 'phaser';
import type { FarmAction } from '../../core/config/assetIds';
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
