// Hidden places, the explored ground and element puzzles on a walk (decision 045): stepping under an overhead cover finds its hidden
// place, the ground along the walk is seen for good (the area map's fog), and a puzzle lit by a companion of its element opens its gate
// once its whole set is lit.
import type { ErrorCode } from '../../../../core/config/errors';
import type { Vec } from '../../../../systems/character';
import type { AreaMap } from '../config/content';
import { revealWalk } from '../fog';
import { coverAt } from '../maps';
import type { Step } from './trip';

const here = (st: Step): Vec => ({ x: st.run.x, y: st.run.y });

/** The ground along the walk since the last saved spot is seen for good (decision 045, the area map's fog). */
export function seeGround(st: Step, map: AreaMap, from: Vec) {
  const before = st.a.explored[map.id] ?? '';
  const after = revealWalk(map, before, from, here(st));
  if (after !== before) st.a = { ...st.a, explored: { ...st.a.explored, [map.id]: after } };
}

/** Standing under an overhead cover for the first time finds the hidden place (decision 045). */
export function findCover(st: Step, map: AreaMap) {
  const cover = coverAt(map, here(st));
  if (!cover || st.a.foundSecrets.includes(cover.id)) return;
  st.a = { ...st.a, foundSecrets: [...st.a.foundSecrets, cover.id] };
  st.events.push({ type: 'ADVENTURE_SECRET_FOUND', mapId: map.id, secretId: cover.id, kind: 'cover' });
}

/** Lights a puzzle with a companion of its element; the last of its set opens its gate. */
export function lightPuzzle(st: Step, map: AreaMap, puzzleId: string): { ok: true } | { ok: false; error: ErrorCode } {
  const { run } = st;
  if (st.a.litPuzzles.includes(puzzleId)) return { ok: false, error: 'ALREADY_OPENED' };
  const puzzle = map.puzzles.find((p) => p.id === puzzleId)!;
  const lighter = run.team.find((m) => m.hp > 0 && (m.element === puzzle.element || m.element2 === puzzle.element));
  if (!lighter) return { ok: false, error: 'GATE_NEEDS_ELEMENT' };
  st.a = { ...st.a, litPuzzles: [...st.a.litPuzzles, puzzle.id] };
  const set = map.puzzles.filter((p) => p.gate === puzzle.gate);
  const lit = set.filter((p) => st.a.litPuzzles.includes(p.id)).length;
  st.events.push({ type: 'ADVENTURE_PUZZLE_LIT', mapId: map.id, puzzleId: puzzle.id, gateId: puzzle.gate, lit, of: set.length });
  // The last one lit opens its gate.
  const gate = map.gates.find((g) => g.id === puzzle.gate);
  if (gate && lit === set.length && !st.a.openedGates.includes(gate.id)) {
    st.a = { ...st.a, openedGates: [...st.a.openedGates, gate.id] };
    st.events.push({ type: 'ADVENTURE_GATE_OPENED', gateId: gate.id, element: gate.element, by: lighter.key });
    if (gate.look === 'crack') st.events.push({ type: 'ADVENTURE_SECRET_FOUND', mapId: map.id, secretId: gate.id, kind: 'wall' });
  }
  return { ok: true };
}
