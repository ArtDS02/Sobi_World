// What the host hands the diorama view: the options it is built with and the tick it is driven by.
import type { PartyPose } from './party';
import type { TimeOfDay } from './look';

export interface ViewOpts {
  time: TimeOfDay;
  quality: 'full' | 'light';
  /** Wind and ambient life (false: reduced motion, the scene stands still). */
  wind: boolean;
  /** Share of the ambient particles (fireflies, leaves, motes, butterflies) drawn, 0–1 (default 1); read when the area is built. */
  particles?: number;
}

/** One tick of the host: seconds since the last one, the party's pose (game px) and whether the camera jumps there. */
export interface ViewFrame {
  dt: number;
  pose: PartyPose;
  snap?: boolean;
}
