import { expect } from 'vitest';
import { mulberry32, type Rng } from '../../src/core/rng';
import { newGame } from '../../src/areas/farm/logic/save/newFarm';
import type { ActionResult, Pig, FarmGame } from '../../src/areas/farm/logic/types';

export const ctx = (now = 0, rng: Rng = mulberry32(7)) => ({ now, rng });

/** newGame at t=0 (5,000 gold, 10 food, 1 medicine) with the given pigs. */
export function farm(pigs: Pig[] = [], patch: Partial<FarmGame> = {}): FarmGame {
  return { ...newGame(ctx()), pigs, ...patch };
}

export function expectOk(r: ActionResult): Extract<ActionResult, { ok: true }> {
  if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
  return r;
}

/** Failure must leave the input untouched and return only the error. */
export function expectError(run: (s: FarmGame) => ActionResult, s: FarmGame, error: string) {
  const before = structuredClone(s);
  expect(run(s)).toEqual({ ok: false, error });
  expect(s).toEqual(before);
}
