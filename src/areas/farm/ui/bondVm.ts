// What the pig panel shows about Bond and purpose: hearts, the favourite food, the purpose chips. Pure.
import { BOND } from '../../../core/config/bond';
import { heartsOf } from '../../../systems/bond/bond';
import type { Purpose } from '../../../systems/creature/types';
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { pigFavorite } from '../logic/bond';
import { bondLifted } from '../logic/pricing';
import { setPurpose } from '../logic/actions/setPurpose';
import type { BoundAction } from '../store';
import type { FarmGame, Pig } from '../logic/types';
import { probe, reasonFor } from './actionsVm';

const HEART_FULL = '♥';
const HEART_EMPTY = '♡';

export interface PurposeChip {
  id: Purpose;
  label: string;
  title: string;
  active: boolean;
  /** Why it cannot be picked, null when it can. */
  reason: string | null;
  run: BoundAction;
}

export interface BondVm {
  hearts: number;
  /** "♥♥♥♡♡" */
  heartsText: string;
  /** "3/5 tim" */
  summary: string;
  favorite: string;
  /** Bond lifted the quality one tier (shown near the quality line). */
  qualityLift: string | null;
  purposes: PurposeChip[];
}

const PURPOSES: readonly Purpose[] = ['SHIP', 'BREED', 'PET', 'ADVENTURE'];

export function bondVm(save: FarmGame, pig: Pig, now: number, penBonus = 0): BondVm {
  const hearts = heartsOf(pig.bond, BOND);
  return {
    hearts,
    heartsText: HEART_FULL.repeat(hearts) + HEART_EMPTY.repeat(5 - hearts),
    summary: t(vi.bond.hearts, { hearts }),
    favorite: t(vi.bond.favorite, { item: vi.shop[pigFavorite(pig)] }),
    qualityLift: bondLifted(pig, penBonus) ? vi.bond.qualityLift : null,
    purposes: PURPOSES.map((id): PurposeChip => {
      const run: BoundAction = (s, c) => setPurpose(s, { pigId: pig.id, purpose: id }, c);
      const error = probe(save, run, now);
      const active = pig.purpose === id;
      return {
        id,
        label: vi.purpose[id].name,
        title: vi.purpose[id].desc,
        active,
        reason: active ? null : error === 'PIG_NOT_MATURE' ? vi.purpose.needAdult : error === 'PURPOSE_LOCKED' ? vi.purpose.ADVENTURE.desc : error ? reasonFor(error) : null,
        run,
      };
    }),
  };
}
