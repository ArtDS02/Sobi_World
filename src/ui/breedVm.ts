// Breeding view-model (spec §10.2, §8.8): valid partners for one pig, the matrix chances and the
// pregnancy length of each pairing. Availability comes from dry-running the real breedPigs.
import { breedPigs } from '../core/actions/breedPigs';
import { BALANCE } from '../core/config/balance';
import { BREEDING_RULES } from '../core/config/breedingRules';
import { breedingOutcomes, type BreedingOutcome } from '../core/engine/breedingOdds';
import { BREEDS } from '../core/config/breeds';
import type { ErrorCode } from '../core/config/errors';
import type { Pig, SaveGame } from '../core/types';
import { formatDuration, formatInt, formatPercent, t } from '../i18n/format';
import { vi } from '../i18n/vi';
import { probe, reasonFor, type ActionVm } from './actionsVm';

export interface PartnerVm {
  pigId: string;
  label: string;
  /** "Heo Hồng Đất 90%" per possible child breed, most likely first. */
  chances: string[];
  duration: string;
  confirm: ActionVm;
}

export interface BreedingVm {
  /** The panel button: opens the partner picker; disabled with a reason when nobody fits. */
  button: Pick<ActionVm, 'label' | 'reason'>;
  partners: PartnerVm[];
  fee: string;
}

/** Why this pig cannot breed with anyone, in §8.8 order; null when it could. */
function selfReason(pig: Pig): string | null {
  if (!BREEDS[pig.breed].breedable) return vi.disabled.cannotBreed;
  if (pig.growthProgress < 100) return vi.disabled.notMature;
  if (pig.isSick) return vi.disabled.isSick;
  if (pig.pregnancy) return vi.disabled.isPregnant;
  return null;
}

/** All partners fail for the same farm-level reason (slot, gold) → show it; else "no partner". */
function sharedReason(errors: ErrorCode[]): string {
  for (const farmWide of ['NO_PIG_SLOT', 'INSUFFICIENT_GOLD'] as const) {
    if (errors.length > 0 && errors.every((e) => e === farmWide)) return reasonFor(farmWide);
  }
  return vi.disabled.noPartner;
}

/** Top results by name, the long tail as one "other" line. */
function chanceLines(outcomes: readonly BreedingOutcome[]): string[] {
  const shown = outcomes.slice(0, BREEDING_RULES.CHANCES_SHOWN);
  const rest = outcomes.slice(shown.length).reduce((sum, o) => sum + o.weight, 0);
  const lines = shown.map(
    (o) => `${BREEDS[o.breed].nameVi} ${t(vi.ui.percent, { n: formatPercent(o.weight) })}`,
  );
  return rest > 0 ? [...lines, t(vi.breed.otherChance, { n: formatPercent(rest) })] : lines;
}

export function breedingVm(save: SaveGame, pig: Pig, now: number): BreedingVm {
  const partners: PartnerVm[] = [];
  const errors: ErrorCode[] = [];
  for (const other of save.pigs) {
    if (other.id === pig.id || other.gender === pig.gender) continue;
    const run: ActionVm['run'] = (s, c) => breedPigs(s, { pigAId: pig.id, pigBId: other.id }, c);
    const error = probe(save, run, now);
    if (error) {
      errors.push(error);
      continue;
    }
    const mother = pig.gender === 'FEMALE' ? pig : other;
    const outcomes = breedingOutcomes(pig.breed, other.breed) ?? []; // most likely first
    partners.push({
      pigId: other.id,
      label: `${other.name} · ${BREEDS[other.breed].nameVi} · ${vi.gender[other.gender]}`,
      chances: chanceLines(outcomes),
      duration: t(vi.breed.duration, {
        time: formatDuration((BREEDS[mother.breed].pregnancySec ?? 0) * 1000),
      }),
      confirm: { label: vi.breed.confirm, reason: null, run },
    });
  }
  const reason = selfReason(pig) ?? (partners.length > 0 ? null : sharedReason(errors));
  return {
    button: { label: vi.action.breed, reason },
    partners,
    fee: t(vi.breed.fee, { gold: formatInt(BALANCE.BREEDING_FEE) }),
  };
}
