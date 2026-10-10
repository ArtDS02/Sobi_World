// The farm's side of the world's creature roster (GĐ10): which pigs the other Areas may use (Adventure's fighters), and the
// gift of a pig from another Area (the Adventure's starter quest). The farm never learns what they are used for.
import type { CreatureGift, GiftResult, RosterEntry } from '../../../core/area-registry/registry';
import { BOND } from '../../../core/config/bond';
import type { WorldSave } from '../../../core/save/world';
import type { ActionContext } from '../../../core/types';
import { randomId } from '../../../core/rng';
import { heartsOf } from '../../../systems/bond/bond';
import { lowestFreeSlot } from './breeding';
import { discoverBreed } from './collection';
import { BALANCE } from './config/balance';
import { BREEDS } from './config/breeds';
import { freeSlots } from './derived';
import { FARM_AREA_ID, farmOf, withFarm } from './save/lens';
import { pickPigName } from './pigNames';
import type { Pig } from './types';

export const FARM_ID = FARM_AREA_ID;

export function farmRoster(world: WorldSave): RosterEntry[] {
  return farmOf(world).pigs.map((p) => ({
    key: `${FARM_AREA_ID}:${p.id}`,
    areaId: FARM_AREA_ID,
    id: p.id,
    kind: 'pig',
    name: p.name,
    speciesId: p.breed,
    family: BREEDS[p.breed].family,
    rarity: BREEDS[p.breed].rarity,
    hearts: heartsOf(p.bond, BOND),
    sick: p.isSick,
    adult: p.growthProgress >= BALANCE.STAGE_ADULT_AT,
    purpose: p.purpose ?? null,
    artId: BREEDS[p.breed].artId,
  }));
}

/** A grown pig of the gift's species, in the pen, raised for the gift's purpose. A full pen refuses (nothing is lost). */
export function farmReceiveGift(world: WorldSave, gift: CreatureGift, ctx: ActionContext): GiftResult {
  const def = (BREEDS as Record<string, (typeof BREEDS)[keyof typeof BREEDS] | undefined>)[gift.species];
  if (gift.kind !== 'creature' || !def || !def.enabled) return { ok: false, error: 'INVALID_REQUEST' };
  if (gift.purpose !== 'ADVENTURE' && gift.purpose !== 'SHIP' && gift.purpose !== 'BREED' && gift.purpose !== 'PET') return { ok: false, error: 'INVALID_REQUEST' };
  const farm = farmOf(world);
  if (freeSlots(farm) < 1) return { ok: false, error: 'NO_PIG_SLOT' };
  const pig: Pig = {
    id: randomId(ctx.rng),
    slotIndex: lowestFreeSlot(farm.pigs),
    breed: def.id,
    name: pickPigName(ctx.rng, [...farm.pigs, ...farm.nursery]),
    gender: ctx.rng.next() < 0.5 ? 'FEMALE' : 'MALE',
    growthProgress: 100,
    hunger: BALANCE.HUNGER_MAX,
    cleanliness: BALANCE.CLEAN_MAX,
    isSick: false,
    pregnancy: null,
    purpose: gift.purpose,
    lastTickedAt: ctx.now,
    createdAt: ctx.now,
  };
  const found = discoverBreed({ ...farm, pigs: [...farm.pigs, pig] }, def.id, ctx);
  return { ok: true, state: withFarm(world, found.state) };
}
