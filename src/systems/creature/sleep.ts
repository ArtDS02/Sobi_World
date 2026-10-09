// Energy and sleep (GAME_BALANCE §2.2): energy falls while awake and recovers asleep. When a creature
// sleeps is the Area's rule (the farm: the night period); it comes in as two functions of time. Pure.

export interface SleepRules {
  /** Is a creature asleep at `t`? Constant until `nextChange(t)`. */
  asleepAt(t: number): boolean;
  /** The first moment after `t` at which `asleepAt` may change. */
  nextChange(t: number): number;
}

export interface EnergyRates {
  awakePerSec: number;
  asleepPerSec: number;
}

const clamp100 = (v: number): number => Math.min(100, Math.max(0, v));

/** Energy after `from` → `to` (epoch ms), segment by segment (each segment is one-directional, so clamping per segment is exact). */
export function energyAfter(energy: number, from: number, to: number, rates: EnergyRates, sleep: SleepRules): number {
  let e = energy;
  for (let t = from; t < to; ) {
    const end = Math.min(sleep.nextChange(t), to);
    const perSec = sleep.asleepAt(t) ? rates.asleepPerSec : -rates.awakePerSec;
    e = clamp100(e + (perSec * (end - t)) / 1000);
    t = end;
  }
  return e;
}
