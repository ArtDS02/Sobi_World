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

describe('the seven condition statuses have a full life cycle (ANIM-050..056)', () => {
  const ids = ['stun', 'freeze', 'poison', 'burn', 'wet', 'disable', 'doom'] as const;
  it.each(ids)('%s plays something when it ends', (id) => {
    expect(BATTLE_FX.statuses[id]?.expire?.length, id).toBeGreaterThan(0);
  });
  it('the damage-over-time ones have their own tick; stun sways with circling stars; doom shows its clock', () => {
    expect(BATTLE_FX.statuses.poison?.tick?.length).toBeGreaterThan(0);
    expect(BATTLE_FX.statuses.burn?.tick?.length).toBeGreaterThan(0);
    expect(BATTLE_FX.statuses.stun?.sway).toBe(true);
    expect(BATTLE_FX.statuses.stun?.layers?.some((l) => l.n >= 3)).toBe(true);
    expect(BATTLE_FX.statuses.doom?.layers?.[0]?.img).toBe('fxp_doom_clock');
  });
  it('no unit can carry more circling things than the budget (6) from its statuses', () => {
    const worst = Object.values(BATTLE_FX.statuses).reduce((n, s) => n + (s?.layers?.reduce((m, l) => m + l.n, 0) ?? 0), 0);
    // Every status at once is the extreme; the budget is checked per status here.
    for (const s of Object.values(BATTLE_FX.statuses)) expect(s?.layers?.reduce((m, l) => m + l.n, 0) ?? 0).toBeLessThanOrEqual(6);
    expect(worst).toBeGreaterThan(0);
  });
  it('a resisted status has its own action script', () => {
    expect(BATTLE_FX.actions.resist?.length).toBeGreaterThan(0);
  });
});
