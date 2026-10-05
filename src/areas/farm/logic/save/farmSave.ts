// What the farm contributes to the world save (ARCHITECTURE §9, Area Contract): the schema of its
// slice, and its first state in a new world.
import type { AreaSaveSpec } from '../../../../core/save/migrate';
import type { WorldSave } from '../../../../core/save/world';
import { BALANCE } from '../config/balance';
import { changeGold } from '../gold';
import type { ActionContext, FarmGame } from '../types';
import { farmAreaSchema } from './farmSchema';
import { withFarm } from './lens';
import { newGame } from './newFarm';

export const farmSaveSpec: AreaSaveSpec = { schema: farmAreaSchema };

/**
 * The starter farm (D7) in `world`: its slice, starter items and starter coins (an INITIAL_GOLD
 * transaction) added to what the world already has.
 */
export function initFarm(world: WorldSave, ctx: ActionContext): WorldSave {
  const fresh = newGame(ctx, { reduceMotion: world.settings.reduceMotion });
  // The world's own money and history stay; the starter coins are posted through the ledger.
  const farm: FarmGame = {
    ...fresh,
    createdAt: world.meta.createdAt,
    updatedAt: world.meta.updatedAt,
    player: { ...fresh.player, gold: world.wallet.coins },
    transactions: world.transactions as FarmGame['transactions'],
    settings: world.settings,
  };
  const funded = changeGold(farm, BALANCE.START_GOLD, 'INITIAL_GOLD', ctx);
  if (!funded.ok) throw new Error('starter coins cannot fail');
  return withFarm(world, funded.state);
}
