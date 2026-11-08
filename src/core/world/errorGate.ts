// Unexpected-exception reporting for the world store (A2): every error goes to the log sink, but the
// player is told at most once per `minGapMs`. Pure: the clock and sinks are injected.
export interface ErrorGate {
  report(where: string, error: unknown): void;
  /** Runs `fn`; an exception is reported and yields null. */
  safely<T>(where: string, fn: () => T): T | null;
}

export function createErrorGate(
  now: () => number,
  sink: ((where: string, error: unknown) => void) | undefined,
  notify: () => void,
  minGapMs = 60_000,
): ErrorGate {
  let lastToastAt: number | null = null;
  const report = (where: string, error: unknown) => {
    try {
      sink?.(where, error);
    } catch {
      /* a broken log sink must not break the game */
    }
    const t = now();
    if (lastToastAt !== null && t - lastToastAt < minGapMs) return;
    lastToastAt = t;
    notify();
  };
  return {
    report,
    safely<T>(where: string, fn: () => T): T | null {
      try {
        return fn();
      } catch (e) {
        report(where, e);
        return null;
      }
    },
  };
}

/** Message plus stack of anything thrown, as one string for the log. */
export const errorText = (e: unknown): string =>
  e instanceof Error ? `${e.name}: ${e.message}\n${e.stack ?? ''}` : String(e);
