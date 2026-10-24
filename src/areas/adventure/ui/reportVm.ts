// What the battle board shows (adventure-big-update-1 §10, §13), as plain data: its title, the experience, coins and gems the battle gave,
// the items found and a guardian's gift, and for every fighter of the team its bar before and after (with each level crossed on the
// way, so the bar can fill, empty and fill again) and whether it rose. Pure; unit-tested.
import { itemArtId } from '../../../core/config/assetIds';
import type { ItemId } from '../../../core/config/ids';
import { formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { LEVEL_RULES } from '../logic/config/content';
import type { BattleReport, Run } from '../logic/state';
import { nameOfItem } from './vmKit';

export interface BoardItemVm {
  itemId: string;
  name: string;
  count: number;
  art: string;
}

export interface BoardFighterVm {
  key: string;
  name: string;
  art: string;
  gained: string;
  levels: string;
  /** The bar's widths in order: from where it stood, through every level crossed (0 → 100), to where it stands (whole percent). */
  legs: { from: number; to: number }[];
  leveledUp: boolean;
  maxed: boolean;
}

export interface BoardVm {
  key: string;
  kind: BattleReport['kind'];
  title: string;
  quick: boolean;
  rewards: string[];
  items: BoardItemVm[];
  gift: BoardItemVm[];
  fighters: BoardFighterVm[];
}

const itemsOf = (counts: Readonly<Record<string, number>>): BoardItemVm[] =>
  Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([itemId, count]) => ({ itemId, name: nameOfItem(itemId), count, art: itemArtId(itemId as ItemId) }));

/** The bar's legs from one mark to the next: within a level, or up to the top, through full levels, then from empty. */
export function barLegs(from: { level: number; share: number }, to: { level: number; share: number }): { from: number; to: number }[] {
  if (to.level <= from.level) return [{ from: from.share, to: Math.max(from.share, to.share) }];
  const legs = [{ from: from.share, to: 100 }];
  for (let l = from.level + 1; l < to.level; l += 1) legs.push({ from: 0, to: 100 });
  legs.push({ from: 0, to: to.level >= LEVEL_RULES.maxLevel ? 100 : to.share });
  return legs;
}

export function boardVm(run: Pick<Run, 'report' | 'rift' | 'seed' | 'encounters'>): BoardVm | null {
  const r = run.report;
  if (!r) return null;
  const B = vi.adventure.board;
  const rewards = [t(B.exp, { exp: formatInt(r.exp) }), t(B.coins, { coins: formatInt(r.coins) })];
  if (r.gems > 0) rewards.push(t(B.gems, { gems: r.gems }));
  return {
    key: `${run.seed}:${run.encounters}:${r.kind}:${run.rift?.floor ?? 0}`,
    kind: r.kind,
    title: r.kind === 'rift' ? t(B.rift, { floor: run.rift?.floor ?? 0 }) : B[r.kind],
    quick: r.quick,
    rewards,
    items: itemsOf(r.items),
    gift: itemsOf(r.gift),
    fighters: r.fighters.map((f) => ({
      key: f.key,
      name: f.name,
      art: f.art,
      gained: t(B.gained, { exp: formatInt(f.gained) }),
      levels: f.to.level > f.from.level ? t(B.levels, { from: f.from.level, to: f.to.level }) : f.to.level >= LEVEL_RULES.maxLevel ? B.maxLevel : t(vi.adventure.battle.level, { level: f.to.level }),
      legs: barLegs(f.from, f.to),
      leveledUp: f.to.level > f.from.level,
      maxed: f.to.level >= LEVEL_RULES.maxLevel,
    })),
  };
}
