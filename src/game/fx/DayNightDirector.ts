// Day / night clock of the farm (DN): reads the player's local time (device clock through the
// injected `now`, so dev time travel moves it too), picks the look and hands it to DayNightLayer.
// Checked on a slow poll and on store syncs; nothing runs per frame unless a look is tweening.
// It is also the one source of the pigs' sleep time (DECISIONS PS-1): a change of `isNight()`
// is announced once through `onNightChange`, and every pig follows it.
import * as Phaser from 'phaser';
import { DAY_NIGHT, DAY_NIGHT_VIEW, type DayPhase } from '../../core/config/dayNight';
import { isSleepPhase } from '../state/sleepCycle';
import { dayScene, minuteOf } from '../../core/engine/dayNight';
import type { DayNightLayer } from '../prefabs/DayNightLayer';

/** Minute of the local day for an epoch-ms timestamp (device time zone). */
export const localMinute = (now: number) => {
  const d = new Date(now);
  return minuteOf(d.getHours(), d.getMinutes());
};

export class DayNightDirector {
  private skyKey = '';
  private night = false;
  private shown: DayPhase = 'day';

  constructor(
    scene: Phaser.Scene,
    private readonly layer: DayNightLayer,
    private readonly now: () => number,
    /** Admin / dev preview phase, never saved; null = follow the clock. */
    private readonly preview: () => DayPhase | null,
    /** Called when sleep time starts or ends (not on the first update). */
    private readonly onNightChange: (night: boolean) => void = () => {},
  ) {
    const timer = scene.time.addEvent({
      delay: DAY_NIGHT_VIEW.pollMs,
      loop: true,
      callback: () => this.update(),
    });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => timer.remove());
    this.update(true);
  }

  /** Re-reads the clock; the first call shows the look at once (the farm fades in anyway). */
  update(instant = false) {
    const next = dayScene(localMinute(this.now()), DAY_NIGHT, this.preview());
    this.shown = next.phase;
    const night = isSleepPhase(next.phase);
    if (night !== this.night) {
      this.night = night;
      if (!instant) this.onNightChange(night);
    }
    const { from, to, t } = next.blend;
    const skyKey = `${from}:${to}:${t.toFixed(2)}`;
    if (skyKey !== this.skyKey) {
      this.skyKey = skyKey;
      this.layer.setSkyArt(next.blend);
    }
    this.layer.show(next.look, instant ? 0 : DAY_NIGHT.transitionMs);
  }

  /** The phase shown (clock or admin preview): seasonal FX conditions read it (MU-2). */
  phase(): DayPhase {
    return this.shown;
  }

  /** Sleep time on the farm (the shown phase, so the admin preview puts pigs to bed too). */
  isNight(): boolean {
    return this.night;
  }
}
