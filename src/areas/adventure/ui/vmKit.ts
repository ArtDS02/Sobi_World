// What the Adventure's view-models share: the button that says why it is off, the dry-run of an action, the icons of the
// elements and statuses.
import type { ErrorCode } from '../../../core/config/errors';
import type { ItemId } from '../../../core/config/ids';
import { mulberry32 } from '../../../core/rng';
import type { WorldSave } from '../../../core/save/world';
import type { ActionContext, ActionResultOf } from '../../../core/types';
import { vi } from '../../../i18n/vi';
import type { Element, StatusId } from '../../../systems/combat/types';

export type AdventureRun = (world: WorldSave, ctx: ActionContext) => ActionResultOf<WorldSave>;

export interface ButtonVm {
  label: string;
  /** Visible reason when the button is off, null when it works. */
  reason: string | null;
}

/** Dry-runs an action with a throwaway rng. */
export function probe(world: WorldSave, run: AdventureRun, now: number): ErrorCode | null {
  const r = run(world, { now, rng: mulberry32(0) });
  return r.ok ? null : r.error;
}

export const ELEMENT_ICON: Record<Element, string> = { FIRE: '🔥', WIND: '🌪️', EARTH: '⛰️', WATER: '💧' };
export const STATUS_ICON: Record<StatusId, string> = { atkUp: '⚔️', defUp: '🛡️', haste: '💨', slow: '🐌', burn: '🔥', stun: '💫', shield: '🔰' };

export const nameOfItem = (id: string): string => vi.shop[id as ItemId] ?? id;
