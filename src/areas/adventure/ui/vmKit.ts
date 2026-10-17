// What the Adventure's view-models share: the button that says why it is off, the dry-run of an action, the icons and names of the
// elements, statuses, classes and lines (placeholders until the art of GĐ14: an art id is tried first, the emoji is the fallback).
import type { ErrorCode } from '../../../core/config/errors';
import type { ItemId } from '../../../core/config/ids';
import { mulberry32 } from '../../../core/rng';
import type { WorldSave } from '../../../core/save/world';
import type { ActionContext, ActionResultOf } from '../../../core/types';
import { formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import type { Element, StatKey, StatusId } from '../../../systems/combat/types';
import { CLASSES, ELEMENT_NAMES, LINEAGES, STATUSES, type ClassId, type LineageId } from '../logic/config/content';

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

export const errorText = (e: ErrorCode | null): string | null => (e ? vi.error[e] : null);

export const ELEMENT_ICON: Record<Element, string> = { METAL: '⚙️', NATURE: '🌿', WATER: '💧', FIRE: '🔥', EARTH: '⛰️', LIGHTNING: '⚡', DARK: '🌙', LIGHT: '☀️', VOID: '✨' };
export const elementArt = (e: Element): string => `ui_element_${e.toLowerCase()}`;
export const elementName = (e: Element): string => ELEMENT_NAMES[e]?.nameVi ?? e;
export const elementLabel = (e: Element): string => `${ELEMENT_ICON[e]} ${elementName(e)}`;

export const STATUS_ICON: Record<StatusId, string> = {
  poison: '☠️', burn: '🔥', wet: '💦', freeze: '❄️', stun: '💫', disable: '🔇', doom: '💀',
  atkUp: '⚔▲', atkDown: '⚔▼', defUp: '🛡▲', defDown: '🛡▼', matkUp: '✦▲', matkDown: '✦▼', mdefUp: '❖▲', mdefDown: '❖▼',
  accUp: '◎▲', accDown: '◎▼', evaUp: '↯▲', evaDown: '↯▼', spdUp: '»▲', spdDown: '»▼',
  shield: '🔰', taunt: '📣', regen: '💚', autoRevive: '🕯️',
};
export const statusName = (id: StatusId): string => STATUSES[id]?.nameVi ?? id;
export const statusDesc = (id: StatusId): string => STATUSES[id]?.descVi ?? '';

export const CLASS_ICON: Record<ClassId, string> = { tanker: '🛡️', striker: '⚔️', mage: '🔮', support: '💗' };
export const className = (id: ClassId): string => CLASSES[id]?.nameVi ?? id;
export const classLabel = (id: ClassId): string => `${CLASS_ICON[id]} ${className(id)}`;
export const lineageName = (id: LineageId): string => LINEAGES[id]?.nameVi ?? id;

export const STAT_ORDER: readonly StatKey[] = ['hp', 'mp', 'atk', 'def', 'matk', 'mdef', 'spd', 'acc', 'eva', 'crit'];
export const statName = (k: StatKey): string => vi.adventure.stat[k];

export const nameOfItem = (id: string): string => vi.shop[id as ItemId] ?? id;

/** "+5 Công, +3 Thủ" for a partial stat block. */
export const bonusText = (stats: Partial<Record<StatKey, number>>): string =>
  STAT_ORDER.filter((k) => (stats[k] ?? 0) !== 0)
    .map((k) => `+${formatInt(stats[k] ?? 0)} ${statName(k)}`)
    .join(', ');

export const pct = (share: number): string => `${Math.round(share * 100)}`;

export { t };
