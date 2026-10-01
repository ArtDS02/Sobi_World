// Real, non-deterministic time and randomness. Injected into core; never imported by core.
import type { Clock } from '../core/clock';
import type { Rng } from '../core/rng';

export const realClock: Clock = { now: () => Date.now() };

export const defaultRng: Rng = { next: () => Math.random() };
