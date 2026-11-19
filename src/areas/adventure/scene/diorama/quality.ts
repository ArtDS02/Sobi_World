// How hard the diorama may work on this device (design B, MAP_SCENE_STANDARD §7). Pure: the host feeds it the graphics card's name and
// the time of each frame. A software renderer cannot run the diorama (2–4 FPS measured): the classic 2D map for the session. Otherwise
// `auto` starts at full, measures 3 s after a 2 s warm-up and goes light under 45 FPS; light under 24 FPS for 5 s goes classic. What
// was learned stays in memory for the session (never written anywhere).
import type { MapQuality } from '../../../../core/settings/settings';

export type Level = 'full' | 'light' | 'classic';

export const SOFTWARE_GPU = /SwiftShader|llvmpipe|Software|Basic Render/i;
export const WARM_UP_MS = 2000;
export const FULL_WINDOW_MS = 3000;
export const LIGHT_WINDOW_MS = 5000;
export const FULL_MIN_FPS = 45;
export const LIGHT_MIN_FPS = 24;

/** True for a graphics card string that is software drawing. */
export const isSoftwareGpu = (name: string): boolean => SOFTWARE_GPU.test(name);

/** What the session learned: the level it must not go above (null: nothing yet). */
let learned: 'light' | 'classic' | null = null;

export const sessionLimit = (): 'light' | 'classic' | null => learned;
/** The map style fell back to the classic 2D for this session because of the device. */
export const dioramaFellBack = (): boolean => learned === 'classic';
export const forgetSession = () => {
  learned = null;
};
const learn = (to: 'light' | 'classic') => {
  if (learned !== 'classic') learned = to;
};

/** The level to start at: the setting, lowered by what the session learned and by the card. */
export function startLevel(setting: MapQuality, gpu: string): Level {
  if (learned === 'classic' || isSoftwareGpu(gpu)) {
    learn('classic');
    return 'classic';
  }
  if (learned === 'light') return 'light';
  return setting === 'light' ? 'light' : 'full';
}

/** Measures the frame rate of the running diorama and says when to step down. */
export class FpsGate {
  private warmFrom = -1;
  private winFrom = -1;
  private frames = 0;
  private settled: boolean;

  /** `measure`: false for a fixed `full` setting (never stepped down). */
  constructor(
    private level: Level,
    measure: boolean,
  ) {
    this.settled = !measure || level === 'classic';
  }

  get current(): Level {
    return this.level;
  }

  /** One frame at `now` (ms); returns the level to draw at (it changes at most once per window). */
  frame(now: number): Level {
    if (this.settled) return this.level;
    if (this.warmFrom < 0) this.warmFrom = now;
    if (now - this.warmFrom < WARM_UP_MS) return this.level;
    if (this.winFrom < 0) {
      this.winFrom = now;
      this.frames = 0;
    }
    this.frames += 1;
    const span = this.level === 'full' ? FULL_WINDOW_MS : LIGHT_WINDOW_MS;
    if (now - this.winFrom < span) return this.level;
    const fps = (this.frames * 1000) / (now - this.winFrom);
    this.winFrom = -1;
    if (this.level === 'full') {
      if (fps < FULL_MIN_FPS) {
        this.level = 'light';
        learn('light');
        // The light level is measured in its own time, after the picture was rebuilt smaller.
        this.warmFrom = now;
      } else this.settled = true;
    } else if (fps < LIGHT_MIN_FPS) {
      this.level = 'classic';
      learn('classic');
      this.settled = true;
    } else this.settled = true;
    return this.level;
  }
}

/** The diorama failed for good (it errored, took too long to build or lost its WebGL context): the classic map for the session. */
export const giveUp = () => learn('classic');
