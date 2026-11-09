// Forging a plot skin (decision 056): a world action. The materials leave the bag, the price is paid in Sobi Coin OR Gems (the
// player chooses; both are worth the same, 1 Gem = gemRate coins) through the ledger, the skin joins `cosmetics.plotSkins` for
// good, and the world earns a one-off XP. Instant, never random, never fails once accepted; nothing changes when refused.
import { changeCurrency } from '../economy/ledger';
import { takeFromBag } from '../inventory/bag';
import { addWorldXp, type WorldLevelUp } from '../progression/xp';
import type { LevelTable } from '../progression/levels';
import type { WorldSave } from '../save/world';
import type { ActionContext, ActionResultOf } from '../types';
import { ownsSkin, unlockMet, type SkinRules } from './skins';

export type PlotSkinEvent = {
  type: 'PLOT_SKIN_FORGED';
  skinId: string;
  /** What it was paid with, and how much. */
  pay: 'coins' | 'gems';
  amount: number;
  materials: Readonly<Record<string, number>>;
  xp: number;
};

/** Transaction types of the two ways to pay. */
export const SKIN_FORGE_TX = 'PLOT_SKIN_FORGE';

export function forgePlotSkin(
  world: WorldSave,
  args: { skinId: string; pay: 'coins' | 'gems' },
  ctx: ActionContext,
  rules: SkinRules,
  levels: LevelTable,
): ActionResultOf<WorldSave, PlotSkinEvent | WorldLevelUp> {
  const skin = rules.skins.find((s) => s.id === args.skinId);
  if (!skin || (args.pay !== 'coins' && args.pay !== 'gems')) return { ok: false, error: 'INVALID_REQUEST' };
  if (ownsSkin(world, skin.id)) return { ok: false, error: 'ALREADY_OWNED' };
  if (!unlockMet(world, skin.unlock, levels)) return { ok: false, error: 'SKIN_LOCKED' };
  let items = world.inventory.items;
  const materials: Record<string, number> = {};
  for (const [id, n] of Object.entries(skin.materials)) {
    if (!n) continue;
    const taken = takeFromBag(items, id, n);
    if (!taken.ok) return taken;
    items = taken.items;
    materials[id] = n;
  }
  const amount = args.pay === 'coins' ? skin.coins : skin.gems;
  const paid = changeCurrency({ ...world, inventory: { items } }, args.pay, -amount, { type: SKIN_FORGE_TX, refId: skin.id, note: args.pay }, ctx);
  if (!paid.ok) return paid;
  const owned: WorldSave = { ...paid.state, cosmetics: { ...paid.state.cosmetics, plotSkins: [...paid.state.cosmetics.plotSkins, skin.id] } };
  const xp = addWorldXp(owned, rules.xp, levels);
  return { ok: true, state: xp.state, events: [{ type: 'PLOT_SKIN_FORGED', skinId: skin.id, pay: args.pay, amount, materials, xp: rules.xp }, ...xp.events] };
}
