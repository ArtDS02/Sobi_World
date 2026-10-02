// Breeding view-model (spec §10.2, §8.8): valid partners for one pig, the chances and the
// pregnancy length of each pairing. Availability comes from dry-running the real breedPigs.
// Hidden discovery (PS-2): a species not yet in the collection shows as "???" + its rarity, and
// the pair's compatibility shows as hearts; the engine (breedingOdds) decides, the UI only shows.
import { breedPigs } from '../core/actions/breedPigs';
import { BALANCE } from '../core/config/balance';
import { BREEDING_RULES } from '../core/config/breedingRules';
import { breedingOutcomes, compatibility, type BreedingOutcome } from '../core/engine/breedingOdds';
import { freeSlots, pigCapacity, waitingPigs } from '../core/engine/derived';
import { BREEDS } from '../core/config/breeds';
import type { ErrorCode } from '../core/config/errors';
import type { Pig, SaveGame } from '../core/types';
import { formatDuration, formatInt, formatPercent, t } from '../i18n/format';
import { vi } from '../i18n/vi';
import { probe, reasonFor, type ActionVm } from './actionsVm';

export interface PartnerVm {
  pigId: string;
  label: string;
  /** "Heo Hồng Đất 90%" per possible child breed, most likely first; "??? (Hiếm) 2%" if unseen. */
  chances: string[];
  /** "Độ hợp: ♥♥♥♡♡" (compatibility 0..1 as five hearts). */
  compat: string;
  /** Shown when this exact species pair was bred before (a known recipe). */
  known: string | null;
  duration: string;
  confirm: ActionVm;
}

export interface BreedingVm {
  /** The panel button: opens the partner picker; disabled with a reason when nobody fits. */
  button: Pick<ActionVm, 'label' | 'reason'>;
  partners: PartnerVm[];
  fee: string;
  /** "Chỗ trong trại: 7/20" (pigs + reserved / capacity): breeding needs a free slot. */
  capacity: string;
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
  for (const farmWide of ['NURSERY_FULL', 'INSUFFICIENT_GOLD'] as const) {
    if (errors.length > 0 && errors.every((e) => e === farmWide)) return reasonFor(farmWide);
  }
  return vi.disabled.noPartner;
}

/** Top results by name (unseen species as ??? + rarity), the long tail as one "other" line. */
function chanceLines(outcomes: readonly BreedingOutcome[], seen: ReadonlySet<string>): string[] {
  const shown = outcomes.slice(0, BREEDING_RULES.CHANCES_SHOWN);
  const rest = outcomes.slice(shown.length).reduce((sum, o) => sum + o.weight, 0);
  const name = (o: BreedingOutcome) =>
    seen.has(o.breed)
      ? BREEDS[o.breed].nameVi
      : t(vi.breed.unknown, { rarity: vi.rarity[BREEDS[o.breed].rarity] });
  const lines = shown.map((o) => `${name(o)} ${t(vi.ui.percent, { n: formatPercent(o.weight) })}`);
  return rest > 0 ? [...lines, t(vi.breed.otherChance, { n: formatPercent(rest) })] : lines;
}

/** Compatibility 0..1 → "♥♥♥♡♡". */
const hearts = (c: number) => {
  const n = Math.max(1, Math.round(c * 5));
  return t(vi.breed.compat, { hearts: '♥'.repeat(n) + '♡'.repeat(5 - n) });
};

export function breedingVm(save: SaveGame, pig: Pig, now: number): BreedingVm {
  const partners: PartnerVm[] = [];
  const seen = new Set<string>([...save.collection.discoveredBreeds, ...save.pigs.map((p) => p.breed)]);
  const bredPairs = new Set(save.breedingRecords.map((r) => [r.motherBreed, r.fatherBreed].sort().join('+')));
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
      chances: chanceLines(outcomes, seen),
      compat: hearts(compatibility(pig.breed, other.breed)),
      known: bredPairs.has([pig.breed, other.breed].sort().join('+')) ? vi.breed.known : null,
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
    capacity: t(vi.breed.capacity, {
      used: save.pigs.length,
      max: pigCapacity(save),
      free: Math.max(0, freeSlots(save)),
      waiting: waitingPigs(save),
      nurseryMax: BALANCE.NURSERY_MAX,
    }),
  };
}
