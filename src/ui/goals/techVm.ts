// The technology panel's numbers as plain data (GĐ11): level, what the technology gives now and next, the price with what the
// bag holds, and why the upgrade button is off. Availability comes from dry-running the real action.
import { TECH_LIST } from '../../core/config/tech';
import type { ItemId } from '../../core/config/ids';
import type { ErrorCode } from '../../core/config/errors';
import { mulberry32 } from '../../core/rng';
import type { WorldSave } from '../../core/save/world';
import { buyTech, nextTechLevel, techLevel, type TechDef, type TechEffectId } from '../../core/tech/tech';
import { formatInt, t } from '../../i18n/format';
import { vi } from '../../i18n/vi';

export interface TechCostVm {
  name: string;
  have: number;
  need: number;
}

export interface TechCardVm {
  id: string;
  name: string;
  desc: string;
  level: string;
  now: string;
  next: string | null;
  coins: { have: number; need: number } | null;
  items: TechCostVm[];
  buy: { label: string; reason: string | null };
}

/** "làm nhanh hơn 15%": an effect's value in words (shares are shown as percents). */
export function effectText(effect: TechEffectId, value: number): string {
  const shown = effect === 'maxBatches' || effect === 'prepSlots' ? value : Math.round(value * 100);
  return t(vi.tech.effects[effect], { value: shown });
}

export function techCards(world: WorldSave, now: number, techs: readonly TechDef[] = TECH_LIST): TechCardVm[] {
  return techs.map((def) => {
    const level = techLevel(world, def.id);
    const next = nextTechLevel(world, def);
    const probe: ErrorCode | null = next ? (() => { const r = buyTech(world, { techId: def.id }, { now, rng: mulberry32(0) }, techs); return r.ok ? null : r.error; })() : 'TECH_MAX_LEVEL';
    return {
      id: def.id,
      name: def.nameVi,
      desc: def.descVi,
      level: t(vi.tech.level, { level, max: def.levels.length }),
      now: level > 0 ? effectText(def.effect, def.levels[level - 1]!.value) : vi.tech.none,
      next: next ? effectText(def.effect, next.value) : null,
      coins: next ? { have: world.wallet.coins, need: next.coins } : null,
      items: next ? Object.entries(next.items).map(([id, need]) => ({ name: vi.shop[id as ItemId] ?? id, have: world.inventory.items[id] ?? 0, need: need ?? 0 })) : [],
      buy: { label: next ? `${vi.tech.buy} ${formatInt(next.level)}` : vi.tech.max, reason: probe ? vi.error[probe] : null },
    };
  });
}
