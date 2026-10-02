// What a PigSprite needs from its scene (MainFarmScene builds one for all pigs).
import type { FarmLayout } from '../view/pigView';

export interface PigEnv {
  layout: FarmLayout;
  /** Trough x in design px (eat turns toward it), or null without a trough. */
  troughX: () => number | null;
  /** settings.reduceMotion right now. */
  reduceMotion: () => boolean;
  /** Where the other pigs stand or head to (strolls keep clear of them). */
  others?: (pigId: string) => { x: number; y: number }[];
  /** Share of rests spent napping by day; WANDER.napChance without it. */
  napChance?: () => number;
  /** Sleep time on the farm right now (DECISIONS PS-1); never without it. */
  night?: () => boolean;
}
