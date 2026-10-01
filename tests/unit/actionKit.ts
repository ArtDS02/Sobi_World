import { expect } from 'vitest';
import { mulberry32, type Rng } from '../../src/core/rng';
import { newGame } from '../../src/core/save/newGame';
import type { ActionResult, Pig, SaveGame } from '../../src/core/types';

export const ctx = (now = 0, rng: Rng = mulberry32(7)) => ({ now, rng });

/** newGame at t=0 (5,000 gold, 10 food, 1 medicine) with the given pigs. */
export function farm(pigs: Pig[] = [], patch: Partial<SaveGame> = {}): SaveGame {
  return { ...newGame(ctx()), pigs, ...patch };
}

export function expectOk(r: ActionResult): Extract<ActionResult, { ok: true }> {
  if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
  return r;
}

/** Failure must leave the input untouched and return only the error. */
export function expectError(run: (s: SaveGame) => ActionResult, s: SaveGame, error: string) {
  const before = structuredClone(s);
  expect(run(s)).toEqual({ ok: false, error });
  expect(s).toEqual(before);
}
