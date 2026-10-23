// What the Adventure's view-models share: the button that says why it is off, the dry-run of an action, the names of the elements,
// statuses, classes and lines, and the art ids of their icons (GĐ14 batches adventure-03/04/08–10; the views fall back to a badge).
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

export const elementArt = (e: Element): string => `ui_icon_elem_${e.toLowerCase()}`;
export const elementName = (e: Element): string => ELEMENT_NAMES[e]?.nameVi ?? e;
export const elementLabel = (e: Element): string => elementName(e);

/** A status's icon: its own badge, or for a raised / lowered stat the stat's badge and which way it went. */
export function statusArt(id: StatusId): { art: string; arrow: 'up' | 'down' | null } {
  const def = STATUSES[id];
  if (def?.kind === 'stat' && def.stat) return { art: `ui_icon_stat_${def.stat.key}`, arrow: id.endsWith('Up') ? 'up' : 'down' };
  return { art: `ui_icon_status_${id === 'autoRevive' ? 'revive' : id}`, arrow: null };
}
export const statusName = (id: StatusId): string => STATUSES[id]?.nameVi ?? id;
export const statusDesc = (id: StatusId): string => STATUSES[id]?.descVi ?? '';

/** A skill's own icon (`ui_` + its id). */
export const skillArt = (skillId: string): string => `ui_${skillId}`;
export const reactionArt = (reactionId: string): string => `ui_icon_${reactionId.replace(/^reaction_/, 'react_')}`;
/** The icons of the battle's plain actions (and of an enemy's intent). */
export const ACTION_ART = {
  attack: 'ui_icon_adv_attack',
  skill: 'ui_icon_adv_skill',
  guard: 'ui_icon_adv_guard',
  ultimate: 'ui_icon_adv_ultimate',
  flee: 'ui_icon_adv_flee',
  auto: 'ui_icon_adv_auto',
  speed: 'ui_icon_adv_speed',
  map: 'ui_icon_adv_map',
  camp: 'ui_icon_adv_camp',
  formation: 'ui_icon_adv_formation',
  sweep: 'ui_icon_adv_sweep',
  interact: 'ui_icon_adv_interact',
} as const;

export const classArt = (id: ClassId): string => `ui_icon_class_${id}`;
export const className = (id: ClassId): string => CLASSES[id]?.nameVi ?? id;
export const classLabel = (id: ClassId): string => className(id);
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
