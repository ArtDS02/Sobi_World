import { describe, expect, it } from 'vitest';
import { statusDelta } from '../../src/areas/adventure/ui/statusDelta';
import { BATTLE_FX } from '../../src/areas/adventure/logic/config/content';

describe('statusDelta (ANIM-003)', () => {
  it('a status that is gone has expired, exactly once', () => {
    const first = statusDelta(new Set(['freeze', 'poison']), ['poison'], false);
    expect(first.removed).toEqual(['freeze']);
    expect(first.added).toEqual([]);
    // The next frame compares against the new set: nothing more expires.
    expect(statusDelta(new Set(['poison']), ['poison'], false).removed).toEqual([]);
  });

  it('a unit seen for the first time (a reload) or knocked out plays no expiry', () => {
    expect(statusDelta(null, ['freeze'], false).removed).toEqual([]);
    expect(statusDelta(new Set(['freeze']), [], true).removed).toEqual([]);
  });

  it('a status put on is reported as added', () => {
    expect(statusDelta(new Set(), ['burn'], false).added).toEqual(['burn']);
  });
});

describe('status visuals in battle_fx.json (ANIM-003)', () => {
  it('Freeze holds the body still, outranks the other tints and shatters when it ends', () => {
    const f = BATTLE_FX.statuses.freeze!;
    expect(f.freezeBody).toBe(true);
    expect(f.priority).toBeGreaterThan(0);
    expect(f.expire?.length).toBeGreaterThan(0);
  });
  it('a cleanse has its own action script', () => {
    expect(BATTLE_FX.actions.cleanse?.length).toBeGreaterThan(0);
  });
});
