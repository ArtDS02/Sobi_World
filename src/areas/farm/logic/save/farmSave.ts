// What the farm contributes to the world save (ARCHITECTURE §9, Area Contract `migrations`): the schema
// of its slice and the starter world (until the Area registry builds it from every Area's init).
import type { AreaSaveSpec } from '../../../../core/save/migrate';
import { emptyWorld, type WorldSave } from '../../../../core/save/world';
import type { ActionContext } from '../types';
import { farmAreaSchema } from './farmSchema';
import { FARM_AREA_ID, withFarm } from './lens';
import { newGame } from './newFarm';

export const farmSaveSpec: AreaSaveSpec = { schema: farmAreaSchema };

/** A new world with a starter farm (D7). */
export function newFarmWorld(ctx: ActionContext, opts: { reduceMotion?: boolean } = {}): WorldSave {
  const farm = newGame(ctx, opts);
  return withFarm(emptyWorld(ctx.now, farm.settings, FARM_AREA_ID), farm);
}
