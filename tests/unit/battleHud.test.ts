import { describe, expect, it } from 'vitest';
import { HUD_LAYOUT, HUD_MOVE_MS, hudMoving, hudPhase, hudTracker } from '../../src/areas/adventure/ui/battleHud';

const base = { resolving: false, ended: false, aiming: false, turn: null } as const;

describe('battle HUD phases (ANIM-010)', () => {
  it('picks the phase by priority: result, resolving, aiming, our turn, their turn, idle', () => {
    expect(hudPhase({ ...base, ended: true, resolving: true })).toBe('result');
    expect(hudPhase({ ...base, resolving: true, aiming: true, turn: 'ally' })).toBe('resolving');
    expect(hudPhase({ ...base, aiming: true, turn: 'ally' })).toBe('aiming');
    expect(hudPhase({ ...base, turn: 'ally' })).toBe('choosing');
    expect(hudPhase({ ...base, turn: 'enemy' })).toBe('turnStart');
    expect(hudPhase(base)).toBe('idle');
  });

  it('the dock leaves while a skill plays and is open while we choose', () => {
    expect(HUD_LAYOUT.resolving.dock).toBe('hidden');
    expect(HUD_LAYOUT.choosing.dock).toBe('open');
    expect(HUD_LAYOUT.resolving.plates).toBe('hp-only');
  });

  it('moves for a short while after a change, and never with reduced motion', () => {
    const track = hudTracker();
    const a = track('choosing', 1000);
    expect(track('choosing', 1500).changedAt).toBe(a.changedAt);
    const b = track('resolving', 2000);
    expect(hudMoving(b.changedAt, 2000 + HUD_MOVE_MS - 1, false)).toBe(true);
    expect(hudMoving(b.changedAt, 2000 + HUD_MOVE_MS, false)).toBe(false);
    expect(hudMoving(b.changedAt, 2001, true)).toBe(false);
  });
});
