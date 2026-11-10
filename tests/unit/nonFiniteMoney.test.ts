// A1: a non-finite amount must never reach a balance, and valuation never yields NaN/Infinity.
import { describe, expect, it } from 'vitest';
import { changeCurrency, postTransaction, type TransactionRecord } from '../../src/core/economy/ledger';
import { mulberry32 } from '../../src/core/rng';
import { emptyWorld } from '../../src/core/save/world';
import { valueOf, weightFactor } from '../../src/systems/valuation/value';

const none: TransactionRecord[] = [];
const ctx = () => ({ now: 1_000, rng: mulberry32(7) });
const settings = { musicOn: true, sfxOn: true, reduceMotion: false, effects: 'full' as const, tutorialDone: false, lastExportAt: null };

describe('ledger refuses non-finite numbers', () => {
  it.each([NaN, Infinity, -Infinity])('amount %s is rejected', (amount) => {
    expect(postTransaction(10, none, amount, { type: 'X' }, ctx())).toEqual({ ok: false, error: 'INVALID_REQUEST' });
  });
  it.each([NaN, Infinity])('balance %s is rejected', (balance) => {
    expect(postTransaction(balance, none, 1, { type: 'X' }, ctx())).toEqual({ ok: false, error: 'INVALID_REQUEST' });
  });
  it('an overflowing sum is rejected, a huge finite one is accepted', () => {
    expect(postTransaction(Number.MAX_VALUE, none, Number.MAX_VALUE, { type: 'X' }, ctx()).ok).toBe(false);
    expect(postTransaction(1e15, none, 1e15, { type: 'X' }, ctx())).toMatchObject({ ok: true, balance: 2e15 });
  });
  it('-0 is normalised and accepted', () => {
    const r = postTransaction(5, none, -0, { type: 'X' }, ctx());
    expect(r.ok && Object.is(r.transactions[0]!.amount, 0)).toBe(true);
  });
  it('changeCurrency leaves the wallet untouched on NaN', () => {
    const w = emptyWorld(0, settings, 'sobi_farm');
    expect(changeCurrency(w, 'coins', NaN, { type: 'X' }, ctx())).toEqual({ ok: false, error: 'INVALID_REQUEST' });
  });
});

describe('valuation stays finite', () => {
  it('valueOf clamps NaN/Infinity results to 0', () => {
    expect(valueOf(NaN)).toBe(0);
    expect(valueOf(100, { a: Infinity })).toBe(0);
    expect(valueOf(100, { a: NaN })).toBe(0);
    expect(valueOf(1200, { care: 0.95 })).toBe(1140);
  });
  it('weightFactor clamps non-finite to 0', () => {
    expect(weightFactor(10, 0, 2)).toBe(2); // x/0 = Infinity, capped by min
    expect(weightFactor(NaN, 10, 2)).toBe(0);
    expect(weightFactor(0, 0, 2)).toBe(0); // 0/0 = NaN
    expect(weightFactor(5, 10, 2)).toBe(0.5);
  });
});
