// core/player + world save v9: the character is part of the world save, v8 saves gain it on load.
import { describe, expect, it } from 'vitest';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { newPlayer, PLAZA_ID, setPlayerSpot } from '../../src/core/player/player';
import { migrate } from '../../src/core/save/migrate';
import { WORLD_SAVE_VERSION } from '../../src/core/save/world';
import { mulberry32 } from '../../src/core/rng';
import { world } from './worldKit';
import { makeState } from './stateFactory';

const ctx = { now: 1_000, rng: mulberry32(1), dayOffsetMs: 0 };

describe('player in the world save', () => {
  it('a new world has the character in the plaza at its entrance', () => {
    const w = world(makeState());
    expect(w.player).toEqual({ area: PLAZA_ID, x: null, y: null, facing: 'down' });
    expect(w.schemaVersion).toBe(WORLD_SAVE_VERSION);
  });

  it('a v8 save gains the character and keeps everything else', () => {
    const w = world(makeState());
    const { player: _player, ...rest } = w;
    const v8 = { ...rest, schemaVersion: 8 };
    const r = migrate(v8, SAVE_CODEC);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.fromVersion).toBe(8);
    expect(r.save.player).toEqual(newPlayer());
    expect(r.save.wallet).toEqual(w.wallet);
    expect(r.save.areas).toEqual(w.areas);
  });

  it('a v8 save that somehow has a player keeps it', () => {
    const w = world(makeState());
    const r = migrate({ ...w, schemaVersion: 8, player: { area: 'plaza', x: 5, y: 6, facing: 'left' } }, SAVE_CODEC);
    expect(r.ok && r.save.player).toEqual({ area: 'plaza', x: 5, y: 6, facing: 'left' });
  });

  it('refuses a broken player', () => {
    const w = world(makeState());
    expect(migrate({ ...w, player: { area: 'plaza', x: 'left', y: 1, facing: 'down' } }, SAVE_CODEC).ok).toBe(false);
    expect(migrate({ ...w, player: { area: 'plaza', x: 1, y: 1, facing: 'sideways' } }, SAVE_CODEC).ok).toBe(false);
  });

  it('setPlayerSpot records the spot and returns the same state when nothing changed', () => {
    const w = world(makeState());
    const moved = setPlayerSpot(w, { area: PLAZA_ID, x: 100, y: 200, facing: 'up' }, ctx);
    expect(moved.ok && moved.state.player).toEqual({ area: PLAZA_ID, x: 100, y: 200, facing: 'up' });
    if (!moved.ok) return;
    const again = setPlayerSpot(moved.state, { area: PLAZA_ID, x: 100, y: 200, facing: 'up' }, ctx);
    expect(again.ok && again.state).toBe(moved.state);
    expect(again.ok && again.events).toEqual([]);
  });
});
