// What a PigSprite needs from its scene (MainFarmScene builds one for all pigs).
import type { FarmLayout } from '../view/pigView';

export interface PigEnv {
  layout: FarmLayout;
  /** Trough x in design px (eat turns toward it), or null without a trough. */
  troughX: () => number | null;
  /** settings.reduceMotion right now. */
  reduceMotion: () => boolean;
}
