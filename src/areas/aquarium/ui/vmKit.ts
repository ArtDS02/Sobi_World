// Helpers every view-model of the Aquarium's screens shares: the button shape, the dry run that finds why a button is
// off, and the small formatters. Pure.
import type { ErrorCode } from '../../../core/config/errors';
import type { ItemId } from '../../../core/config/ids';
import { mulberry32 } from '../../../core/rng';
import type { WorldSave } from '../../../core/save/world';
import type { ActionContext, ActionResultOf } from '../../../core/types';
import { formatInt } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';

export type AquariumRun = (world: WorldSave, ctx: ActionContext) => ActionResultOf<WorldSave>;

export interface ButtonVm {
  label: string;
  /** Visible reason when the button is off, null when it works. */
  reason: string | null;
}

/** Dry-runs an action with a throwaway rng. */
export function probe(world: WorldSave, run: AquariumRun, now: number, dayOffsetMs = 0): ErrorCode | null {
  const r = run(world, { now, rng: mulberry32(0), dayOffsetMs });
  return r.ok ? null : r.error;
}

/** The player-facing sentence of an error code. */
export const reasonFor = (error: ErrorCode): string => vi.error[error];

export const gold = (n: number): string => formatInt(n);
export const nameOfItem = (id: string): string => vi.shop[id as ItemId] ?? id;
/** 1,1 / 25 / 3,5: up to two decimals, none trailing (Vietnamese comma). */
export const num = (n: number): string => String(Math.round(n * 100) / 100).replace('.', ',');

export const button = (label: string, error: ErrorCode | null, override?: Partial<Record<ErrorCode, string>>): ButtonVm => ({
  label,
  reason: error === null ? null : (override?.[error] ?? reasonFor(error)),
});
