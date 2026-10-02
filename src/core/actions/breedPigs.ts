// breedPigs (spec §8.8): validation in the spec's exact order; the child (breed + gender) is
// drawn now from the injected rng and stored on the mother, so it can never change later.
import { BALANCE } from '../config/balance';
import { breedingOutcomes } from '../engine/breedingOdds';
import { BREEDS } from '../config/breeds';
import { SAVE } from '../config/save';
import type { ErrorCode } from '../config/errors';
import { rollChild } from '../engine/breeding';
import { generationOf, waitingPigs } from '../engine/derived';
import { changeGold } from '../engine/gold';
import { addXP } from '../engine/xp';
import { randomId } from '../rng';
import type { ActionContext, ActionResult, BreedingRecord, Pig, SaveGame } from '../types';
import { ok, runAction } from './runAction';

export interface BreedPigsArgs {
  pigAId: string;
  pigBId: string;
}

/** First failing rule of §8.8 steps 1–7 for a pair, or null; the gold check (8) is changeGold. */
export function breedingError(
  s: SaveGame,
  a: Pig | undefined,
  b: Pig | undefined,
): ErrorCode | null {
  if (!a || !b || a.id === b.id) return 'INVALID_BREEDING_PARTNERS';
  if (a.growthProgress < 100 || b.growthProgress < 100) return 'PIG_NOT_MATURE';
  if (a.isSick || b.isSick) return 'PIG_IS_SICK';
  if (a.pregnancy || b.pregnancy) return 'PIG_IS_PREGNANT';
  if (a.gender === b.gender) return 'INVALID_BREEDING_PARTNERS';
  if (!breedingOutcomes(a.breed, b.breed)) return 'BREEDING_COMBINATION_NOT_SUPPORTED';
  // BR-1: the child waits in the nursery (no pen slot needed); the nursery has a cap.
  if (waitingPigs(s) >= BALANCE.NURSERY_MAX) return 'NURSERY_FULL';
  return null;
}

export function breedPigs(state: SaveGame, args: BreedPigsArgs, ctx: ActionContext): ActionResult {
  return runAction(state, ctx, (s) => {
    const a = s.pigs.find((p) => p.id === args.pigAId);
    const b = s.pigs.find((p) => p.id === args.pigBId);
    const error = breedingError(s, a, b);
    if (error || !a || !b) return { ok: false, error: error ?? 'INVALID_BREEDING_PARTNERS' };
    const mother = a.gender === 'FEMALE' ? a : b;
    const father = mother === a ? b : a;
    const pregnancySec = BREEDS[mother.breed].pregnancySec;
    if (pregnancySec === null) return { ok: false, error: 'BREEDING_COMBINATION_NOT_SUPPORTED' };

    const paid = changeGold(s, -BALANCE.BREEDING_FEE, 'BREEDING_FEE', ctx, {
      refId: mother.id,
      note: `${mother.breed} x ${father.breed}`,
    });
    if (!paid.ok) return paid;

    const child = rollChild(ctx.rng, mother.breed, father.breed);
    const endsAt = ctx.now + pregnancySec * 1000; // D22: the mother's breed
    const childGeneration = Math.max(generationOf(mother), generationOf(father)) + 1;
    const record: BreedingRecord = {
      id: randomId(ctx.rng),
      at: ctx.now,
      motherId: mother.id,
      fatherId: father.id,
      motherBreed: mother.breed,
      fatherBreed: father.breed,
      childBreed: child.breed,
      childGender: child.gender,
      childGeneration,
      bornAt: null,
    };
    const bred: SaveGame = {
      ...paid.state,
      pigs: paid.state.pigs.map((p) =>
        p.id === mother.id
          ? {
              ...p,
              pregnancy: {
                startedAt: ctx.now,
                endsAt,
                fatherId: father.id,
                childBreed: child.breed,
                childGender: child.gender,
                childGeneration,
              },
            }
          : p,
      ),
      breedingRecords: [record, ...paid.state.breedingRecords].slice(0, SAVE.BREEDING_RECORDS_MAX),
    };
    const xp = addXP(bred, BALANCE.XP.BREED);
    return ok(
      xp.state,
      [{ type: 'BREEDING_STARTED', motherId: mother.id, fatherId: father.id, endsAt }],
      xp.events,
    );
  });
}
