// Technologies (GĐ11, spec §3.3): upgrades the world buys with Sobi Coin and the Adventure's materials. A level is a count kept in
// `progression.stats` (`tech.<id>`), so no save migration is needed; an Area reads what it gains with `techValue`.
// Pure: the tech table comes in as an argument.
import { changeCurrency } from '../economy/ledger';
import { takeFromBag } from '../inventory/bag';
import type { WorldSave } from '../save/world';
import type { ActionContext, ActionResultOf } from '../types';

export type TechEffectId = 'productionSpeed' | 'maxBatches' | 'prepSlots' | 'adventureEnergy';

export interface TechLevelDef {
  value: number;
  coins: number;
  items: Readonly<Partial<Record<string, number>>>;
}

export interface TechDef {
  id: string;
  nameVi: string;
  descVi: string;
  effect: TechEffectId;
  levels: readonly TechLevelDef[];
}

export type TechTable = readonly TechDef[];

export type TechEvent = { type: 'TECH_UPGRADED'; techId: string; level: number; coins: number; items: Readonly<Record<string, number>> };

const statKey = (id: string) => `tech.${id}`;

/** The level of a technology (0 = not bought). */
export const techLevel = (world: Pick<WorldSave, 'progression'>, id: string): number => Math.floor(world.progression.stats[statKey(id)] ?? 0);

/** What the world gains from an effect now: the value of the bought level of the technology that gives it, 0 when none. */
export function techValue(world: Pick<WorldSave, 'progression'>, effect: TechEffectId, techs: TechTable): number {
  const def = techs.find((t) => t.effect === effect);
  if (!def) return 0;
  const level = Math.min(techLevel(world, def.id), def.levels.length);
  return level > 0 ? def.levels[level - 1]!.value : 0;
}

/** The next level's price, or null at the top. */
export const nextTechLevel = (world: Pick<WorldSave, 'progression'>, def: TechDef): (TechLevelDef & { level: number }) | null => {
  const level = techLevel(world, def.id);
  return level >= def.levels.length ? null : { ...def.levels[level]!, level: level + 1 };
};

/** Buys the next level of a technology: the coins and materials leave now. Nothing changes when anything is refused. */
export function buyTech(world: WorldSave, args: { techId: string }, ctx: ActionContext, techs: TechTable): ActionResultOf<WorldSave, TechEvent> {
  const def = techs.find((t) => t.id === args.techId);
  if (!def) return { ok: false, error: 'INVALID_REQUEST' };
  const next = nextTechLevel(world, def);
  if (!next) return { ok: false, error: 'TECH_MAX_LEVEL' };
  let items = world.inventory.items;
  for (const [id, n] of Object.entries(next.items)) {
    const taken = takeFromBag(items, id, n ?? 0);
    if (!taken.ok) return taken;
    items = taken.items;
  }
  const paid = changeCurrency({ ...world, inventory: { items } }, 'coins', -next.coins, { type: 'TECH_UPGRADE', refId: def.id, note: `level ${next.level}` }, ctx);
  if (!paid.ok) return paid;
  const stats = { ...paid.state.progression.stats, [statKey(def.id)]: next.level };
  return { ok: true, state: { ...paid.state, progression: { ...paid.state.progression, stats } }, events: [{ type: 'TECH_UPGRADED', techId: def.id, level: next.level, coins: next.coins, items: next.items as Record<string, number> }] };
}

/** The technology gate of a recipe: true while its level is not bought. */
export const recipeLocked = (world: Pick<WorldSave, 'progression'>, recipe: { requires?: { tech: string; level: number } }): boolean =>
  recipe.requires !== undefined && techLevel(world, recipe.requires.tech) < recipe.requires.level;
