// Day / night clock of the farm (DN): reads the player's local time (device clock through the
// injected `now`, so dev time travel moves it too), picks the look and hands it to DayNightLayer.
// Checked on a slow poll and on store syncs; nothing runs per frame unless a look is tweening.
import * as Phaser from 'phaser';
import { DAY_NIGHT, DAY_NIGHT_VIEW, type DayPhase } from '../../core/config/dayNight';
import { FARM_VIEW } from '../../core/config/farmView';
import { dayScene, minuteOf, type DayScene } from '../../core/engine/dayNight';
import type { DayNightLayer } from '../prefabs/DayNightLayer';

/** Minute of the local day for an epoch-ms timestamp (device time zone). */
export const localMinute = (now: number) => {
  const d = new Date(now);
  return minuteOf(d.getHours(), d.getMinutes());
};

export class DayNightDirector {
  private current: DayScene | null = null;
  private skyKey = '';

  constructor(
    scene: Phaser.Scene,
    private readonly layer: DayNightLayer,
    private readonly now: () => number,
    /** Admin / dev preview phase, never saved; null = follow the clock. */
    private readonly preview: () => DayPhase | null,
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
    this.current = next;
    const { from, to, t } = next.blend;
    const skyKey = `${from}:${to}:${t.toFixed(2)}`;
    if (skyKey !== this.skyKey) {
      this.skyKey = skyKey;
      this.layer.setSkyArt(next.blend);
    }
    this.layer.show(next.look, instant ? 0 : DAY_NIGHT.transitionMs);
  }

  /** Share of rests a pig naps right now: more at night (visual only, DECISIONS R09B-1). */
  napChance(): number {
    // dayScene reports `day` while disabled, so only a real (or previewed) night counts.
    return this.current?.phase === 'night'
      ? DAY_NIGHT_VIEW.nightNapChance
      : FARM_VIEW.WANDER.napChance;
  }
}
