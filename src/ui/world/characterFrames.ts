// Which picture of the character to show (art row `chr_player`, one file per facing and frame). Pure.
import type { Facing } from '../../core/player/player';

export type CharacterFrame = 'idle' | 'walk1' | 'walk2';

/** Walking alternates the two stride frames with the standing one in between: walk1, idle, walk2, idle. */
const CYCLE: readonly CharacterFrame[] = ['walk1', 'idle', 'walk2', 'idle'];

export function characterFrame(moving: boolean, elapsedMs: number, fps: number): CharacterFrame {
  if (!moving) return 'idle';
  const step = Math.floor((Math.max(0, elapsedMs) / 1000) * fps);
  return CYCLE[step % CYCLE.length]!;
}

/** The manifest state name of a picture, e.g. `left_walk1`. */
export const characterState = (facing: Facing, frame: CharacterFrame): string => `${facing}_${frame}`;
