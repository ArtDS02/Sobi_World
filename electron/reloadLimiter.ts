// Bounded auto-reload (A2): a crashing or hung renderer is reloaded at most `max` times per `windowMs`,
// so a deterministic crash cannot loop forever.
export interface ReloadLimiter {
  /** True (and counted) when another reload is allowed right now. */
  allow(): boolean;
}

export function createReloadLimiter(max: number, windowMs: number, now: () => number): ReloadLimiter {
  let stamps: number[] = [];
  return {
    allow() {
      const t = now();
      stamps = stamps.filter((s) => t - s < windowMs);
      if (stamps.length >= max) return false;
      stamps.push(t);
      return true;
    },
  };
}
