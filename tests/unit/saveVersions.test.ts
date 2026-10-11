// GĐ13: a save written by every earlier version still opens, keeps what the player had, and plays on.
// v1 and v7 are Sobi Farm saves; v8, v9 and v10 are real world saves taken from the dev farm just before each migration.
import { describe, expect, it } from 'vitest';
import v1 from '../fixtures/save-v1.json';
import v7 from '../fixtures/save-v7-real.json';
import v8 from '../fixtures/save-v8-real.json';
import v9 from '../fixtures/save-v9-real.json';
import v10 from '../fixtures/save-v10-real.json';
import { AREAS } from '../../src/app/areas';
import { parseWorldSave, SAVE_CODEC } from '../../src/app/saveCodec';
import { mulberry32 } from '../../src/core/rng';
import { migrate } from '../../src/core/save/migrate';
import { WORLD_SAVE_VERSION, type WorldSave } from '../../src/core/save/world';

const DAY = 86_400_000;

const FIXTURES: [string, number, unknown][] = [
  ['v1 (Sobi Farm)', 1, v1],
  ['v7 (Sobi Farm)', 7, v7],
  ['v8 (world)', 8, v8],
  ['v9 (world + player)', 9, v9],
  ['v10 (world + goals)', 10, v10],
];

function migrated(input: unknown): { save: WorldSave; fromVersion: number } {
  const r = migrate(structuredClone(input), SAVE_CODEC);
  if (!r.ok) throw new Error(`migration failed: ${r.error}`);
  return r;
}

describe('saves of every earlier version', () => {
  for (const [name, version, fixture] of FIXTURES) {
    describe(name, () => {
      it('migrates to the current format without losing the wallet or the farm', () => {
        const { save, fromVersion } = migrated(fixture);
        expect(fromVersion).toBe(version);
        expect(save.schemaVersion).toBe(WORLD_SAVE_VERSION);
        expect(save.live).toBeDefined();
        expect(save.goals).toBeDefined();
        expect(save.areas.sobi_farm).toBeDefined();
        if (version >= 8) {
          const old = fixture as { wallet: { coins: number }; areas: { sobi_farm: { pigs: unknown[] } } };
          expect(save.wallet.coins).toBe(old.wallet.coins);
          expect((save.areas.sobi_farm as { pigs: unknown[] }).pigs).toHaveLength(old.areas.sobi_farm.pigs.length);
        }
      });

      it('survives write → read (the migrated save is a valid current save)', () => {
        const { save } = migrated(fixture);
        const again = parseWorldSave(JSON.stringify(save));
        expect(again.ok).toBe(true);
        if (again.ok) {
          expect(again.fromVersion).toBe(WORLD_SAVE_VERSION);
          expect(again.save).toEqual(save);
        }
      });

      it('plays on: 30 days away resolve without error and nothing becomes invalid', () => {
        const { save } = migrated(fixture);
        const from = Math.min(AREAS.simulatedAt(save), save.meta.lastSavedAt ?? Infinity);
        const result = AREAS.advance(save, from + 30 * DAY, mulberry32(7), 0, 'offline');
        expect(result.rewound).toBe(false);
        const again = parseWorldSave(JSON.stringify(result.state));
        expect(again.ok).toBe(true);
        expect(result.state.wallet.coins).toBeGreaterThanOrEqual(0);
      });
    });
  }

  it('a save from a newer version is refused, not damaged', () => {
    const r = migrate({ ...(v10 as object), schemaVersion: WORLD_SAVE_VERSION + 1 }, SAVE_CODEC);
    expect(r).toEqual({ ok: false, error: 'SAVE_TOO_NEW' });
  });
});
