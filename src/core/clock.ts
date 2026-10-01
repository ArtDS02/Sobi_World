// Injected time source. The real clock lives outside core (DECISIONS A2).

export interface Clock {
  /** Epoch milliseconds. */
  now(): number;
}

export interface FakeClock extends Clock {
  set(ms: number): void;
  advance(ms: number): void;
}

export function fakeClock(start = 0): FakeClock {
  let t = start;
  return {
    now: () => t,
    set: (ms) => {
      t = ms;
    },
    advance: (ms) => {
      t += ms;
    },
  };
}
