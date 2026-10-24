// What the summary of a finished trip shows (spec §17), as plain data: its title and words, the experience, coins, SP, gems and
// level-ups, the exhaustion of a lost trip, the loot. Pure; unit-tested.
import { itemArtId } from '../../../core/config/assetIds';
import type { ItemId } from '../../../core/config/ids';
import { formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { AB } from '../logic/config/content';
import type { Run } from '../logic/state';
import { nameOfItem } from './vmKit';

export interface ResultVm {
  result: 'win' | 'lose' | 'retreat' | 'sweep';
  title: string;
  body: string;
  lines: string[];
  loot: { itemId: string; name: string; count: number; art: string }[];
}

export function resultVm(run: Run, names: ReadonlyMap<string, string>): ResultVm | null {
  if (run.phase !== 'done' || !run.result) return null;
  const lines = [t(vi.adventure.resultExp, { exp: formatInt(run.expGained) }), t(vi.adventure.resultCoins, { coins: formatInt(run.coins) })];
  if (run.spGained > 0) lines.push(t(vi.adventure.resultSp, { sp: run.spGained }));
  if (run.gems > 0) lines.push(t(vi.adventure.resultGems, { gems: run.gems }));
  for (const key of run.levelUps) lines.push(t(vi.adventure.resultLevelUp, { name: names.get(key) ?? key }));
  if (run.result === 'lose') lines.push(t(vi.adventure.resultExhausted, { hours: AB.run.exhaustHours }));
  const rift = run.rift && run.result !== 'lose';
  return {
    result: run.result,
    title: rift ? vi.adventure.engage.rift.resultTitle : vi.adventure.result[run.result].title,
    body: rift ? t(vi.adventure.engage.rift.resultBody, { floor: run.rift!.floor }) : vi.adventure.result[run.result].body,
    lines,
    loot: Object.entries(run.loot).map(([itemId, count]) => ({ itemId, name: nameOfItem(itemId), count, art: itemArtId(itemId as ItemId) })),
  };
}

