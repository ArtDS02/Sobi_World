// A puppet's want on the battle stage (decision 050): read from the step's beats and reactions, timed so the clip lands on the beat.
import { describe, expect, it } from 'vitest';
import type { PlayingStep } from '../../src/areas/adventure/ui/battleFxView';
import { perfOf } from '../../src/areas/adventure/ui/battlePerf';

const beat = { actor: 'a', pose: 'attack', delivery: 'melee', element: null, skillId: null, targets: ['f'], circle: false, start: 0, cast: 0, release: 220, impact: 330, end: 650 };
const step = (extra: Partial<PlayingStep['motion']> = {}) =>
  ({ key: 's1', at: 0, enter: false, motion: { beats: [beat], reactions: [{ unit: 'f', kind: 'hit', at: 330 }], marks: [], eventAt: [], total: 650, speed: 1, ...extra } }) as unknown as PlayingStep;

describe('battle perf (puppets on the battle stage)', () => {
  it('a melee beat is an attack with its release, contact and end', () => {
    const w = perfOf('a', step(), 100, 'attack', false);
    expect(w.action).toBe('attack');
    expect(w.timing).toEqual({ t: 100, marks: { release: 220, contact: 330, end: 650 } });
  });

  it('the target is hurt from the impact, for as long as the reaction plays, then idles', () => {
    expect(perfOf('f', step(), 300, 'idle', false).action).toBe('idle');
    const w = perfOf('f', step(), 400, 'hurt', false);
    expect(w.action).toBe('hurt');
    expect(w.timing?.t).toBe(70);
    expect(perfOf('f', step(), 2000, 'idle', false).action).toBe('idle');
  });

  it('a reaction wins over the unit’s own beat; a unit that is out lies down; the winners celebrate', () => {
    const s = step({ reactions: [{ unit: 'a', kind: 'hit-crit', at: 200 }] });
    expect(perfOf('a', s, 250, 'hurt', false).action).toBe('hurt_crit');
    expect(perfOf('a', step(), 100, 'idle', true).action).toBe('ko');
    const won = step({ marks: [{ unit: 'a', kind: 'victory', id: 'win', at: 650, from: null }] });
    expect(perfOf('a', won, 900, 'idle', false).action).toBe('victory');
  });
});
