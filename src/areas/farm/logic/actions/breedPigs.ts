// breedPigs (spec §8.8): validation in the spec's exact order; the child (breed + gender) is
// drawn now from the injected rng and stored on the mother, so it can never change later.
import { BALANCE } from '../config/balance';
import { isPet } from '../bond';
import { breedingOutcomes } from '../breedingOdds';
import { BREEDS } from '../config/breeds';
import { SAVE } from '../../../../core/config/save';
import type { ErrorCode } from '../../../../core/config/errors';
import { rollChild } from '../breeding';
import { bornHeredity, isRareBreed } from '../heredity';
import { BREEDING_RULES_DEFAULT, nextPity } from '../../../../systems/breeding';
import { generationOf, waitingPigs } from '../derived';
import { changeGold } from '../gold';
import { addXP } from '../xp';
import { randomId } from '../../../../core/rng';
import type { ActionContext, ActionResult, BreedingRecord, Pig, FarmGame } from '../types';
import { ok, runAction } from './runAction';

/** Pity is stored only while it is above zero (absent = 0): a save that never missed a Rare+ stays as it was. */
const pityField = (pity: number) => (pity > 0 ? { breedingPity: pity } : { breedingPity: undefined });

export interface BreedPigsArgs {
  pigAId: string;
  pigBId: string;
}

/** First failing rule of §8.8 steps 1–7 for a pair, or null; the gold check (8) is changeGold. */
export function breedingError(
  s: FarmGame,
  a: Pig | undefined,
  b: Pig | undefined,
): ErrorCode | null {
  if (!a || !b || a.id === b.id) return 'INVALID_BREEDING_PARTNERS';
  if (isPet(a) || isPet(b)) return 'PIG_IS_PET';
  if (a.growthProgress < 100 || b.growthProgress < 100) return 'PIG_NOT_MATURE';
  if (a.isSick || b.isSick) return 'PIG_IS_SICK';
  if (a.pregnancy || b.pregnancy) return 'PIG_IS_PREGNANT';
  if (a.gender === b.gender) return 'INVALID_BREEDING_PARTNERS';
  if (!breedingOutcomes(a.breed, b.breed)) return 'BREEDING_COMBINATION_NOT_SUPPORTED';
  // BR-1: the child waits in the nursery (no pen slot needed); the nursery has a cap.
  if (waitingPigs(s) >= BALANCE.NURSERY_MAX) return 'NURSERY_FULL';
  return null;
}

export function breedPigs(state: FarmGame, args: BreedPigsArgs, ctx: ActionContext): ActionResult {
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

    const pity = paid.state.breedingPity ?? 0;
    const child = rollChild(ctx.rng, mother.breed, father.breed, pity);
    const heredity = bornHeredity(mother, father, child.breed, ctx.now);
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
      ...(heredity.mutated ? { mutated: true } : {}),
      bornAt: null,
    };
    const bred: FarmGame = {
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
                childTraits: heredity.traits,
                ...(heredity.hiddenTrait ? { childHidden: heredity.hiddenTrait } : {}),
                ...(heredity.mutated ? { childMutated: true } : {}),
                childLineage: heredity.lineage,
              },
            }
          : p,
      ),
      breedingRecords: [record, ...paid.state.breedingRecords].slice(0, SAVE.BREEDING_RECORDS_MAX),
      ...pityField(nextPity(pity, BREEDING_RULES_DEFAULT, child.couldBeRare, isRareBreed(child.breed))),
    };
    const xp = addXP(bred, BALANCE.XP.BREED);
    return ok(
      xp.state,
      [{ type: 'BREEDING_STARTED', motherId: mother.id, fatherId: father.id, endsAt }],
      xp.events,
    );
  });
}
