// The battle board (adventure-big-update-1 §10, §13): a won battle leaves a board with its rewards and each fighter's experience before
// and after (the bar's legs through every level crossed), a guardian is beaten for good and gives its gift on the board, the board
// is closed before the party walks on.
import { describe, expect, it } from 'vitest';
import { battleAct, closeReport, engage, startRun } from '../../src/areas/adventure/logic/actions/run';
import { MAPS } from '../../src/areas/adventure/logic/config/content';
import { tileCenter } from '../../src/areas/adventure/logic/maps';
import { adventureOf } from '../../src/areas/adventure/logic/save/lens';
import { barLegs, boardVm } from '../../src/areas/adventure/ui/reportVm';
import { T0, adventureWorld, ctxAt, err, keys, ok, squad, strong } from './adventureKit';
import type { WorldSave } from '../../src/core/save/world';

const F1 = MAPS.map_forest_edge!;
const start = (w: WorldSave) => ok(startRun(w, { zoneId: 'zone_forest', keys, roster: squad }, ctxAt(T0)));
const play = (w0: WorldSave) => {
  let w = w0;
  for (let i = 0; i < 400 && adventureOf(w).run?.phase === 'battle'; i += 1) w = ok(battleAct(w, { action: 'auto' }, ctxAt(T0, 1 + i)));
  return w;
};

describe('the battle board', () => {
  it('a won battle leaves its board: rewards, every fighter before and after, the last step to replay; nothing starts until it is closed', () => {
    const g = F1.groups.find((x) => x.kind === 'normal')!;
    let w = play(ok(engage(start(strong(adventureWorld())), { ...tileCenter(F1, g.x, g.y), groupId: g.id, quick: false }, ctxAt(T0))));
    const run = adventureOf(w).run!;
    expect(run.report).not.toBeNull();
    expect(run.report!.kind).toBe('normal');
    expect(run.report!.fighters).toHaveLength(3);
    expect(run.report!.exp).toBeGreaterThan(0);
    expect(run.report!.battle?.outcome).toBe('win');
    const other = F1.groups.filter((x) => x.kind === 'normal')[1]!;
    expect(err(engage(w, { ...tileCenter(F1, other.x, other.y), groupId: other.id }, ctxAt(T0)))).toBe('WRONG_PHASE');
    const vm = boardVm(run)!;
    expect(vm.fighters[0]!.legs.length).toBeGreaterThan(0);
    w = ok(closeReport(w, ctxAt(T0)));
    expect(adventureOf(w).run!.report).toBeNull();
    expect(err(closeReport(w, ctxAt(T0)))).toBe('WRONG_PHASE');
  });

  it('the guardian is beaten for good and its gift lands on the board; it never stands again, even on the next trip', () => {
    const g = F1.groups.find((x) => x.kind === 'elite')!;
    let w = play(ok(engage(start(strong(adventureWorld(), 14)), { ...tileCenter(F1, g.x, g.y), groupId: g.id }, ctxAt(T0))));
    const a = adventureOf(w);
    expect(a.beaten).toContain(`${F1.id}/${g.id}`);
    expect(a.run!.report!.gift).toEqual(g.gift);
    for (const [id, n] of Object.entries(g.gift ?? {})) expect(a.run!.loot[id]).toBeGreaterThanOrEqual(n);
    w = ok(closeReport(w, ctxAt(T0)));
    expect(err(engage(w, { ...tileCenter(F1, g.x, g.y), groupId: g.id }, ctxAt(T0)))).toBe('ALREADY_OPENED');
  });

  it('a bar crossing levels fills to the top, through full levels, then from empty', () => {
    expect(barLegs({ level: 3, share: 40 }, { level: 3, share: 70 })).toEqual([{ from: 40, to: 70 }]);
    expect(barLegs({ level: 3, share: 40 }, { level: 5, share: 20 })).toEqual([
      { from: 40, to: 100 },
      { from: 0, to: 100 },
      { from: 0, to: 20 },
    ]);
  });
});
