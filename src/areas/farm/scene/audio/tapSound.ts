// Pig tap sound (spec §12): hungry (< 30) first, since it asks for care; happy (>= 50) otherwise;
// a pig that is neither stays quiet. Pure.
import { happiness } from '../../logic/happiness';
import type { AudioKey } from '../../../../core/config/assetIds';
import { FEEDBACK } from '../../../../core/config/feedback';
import type { Pig } from '../../logic/types';

export function tapSound(pig: Pick<Pig, 'hunger' | 'cleanliness' | 'isSick'>): AudioKey | null {
  if (pig.hunger < FEEDBACK.TAP_SOUND.hungryBelow) return 'pig_oink_hungry';
  if (happiness(pig) >= FEEDBACK.TAP_SOUND.happyFrom) return 'pig_oink_happy';
  return null;
}
