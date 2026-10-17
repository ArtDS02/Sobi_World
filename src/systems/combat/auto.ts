// Playing turns without a person (spec V2 §15.3–15.4): an enemy does what its intent said (or picks again when that is no longer
// possible), and Auto / the Admin simulation let the AI play a whole battle. Pure.
import { chooseAction } from './ai';
import { act, canAct } from './engine';
import { current } from './rules';
import type { BattleAction, BattleState, CombatContext } from './types';

/** What the one whose turn it is does when nobody chooses for it: its announced intent if it still works, else the AI's pick. */
export function actionFor(state: BattleState, ctx: CombatContext): BattleAction | null {
  const cur = current(state);
  if (!cur) return null;
  if (cur.intent && canAct(state, cur.intent, ctx) === null) return cur.intent;
  return chooseAction(state, ctx);
}

/** Plays the battle to its end with the AI on both sides. Stops at `limit` actions. */
export function autoPlay(state: BattleState, ctx: CombatContext, limit = 600): BattleState {
  let s = state;
  for (let i = 0; i < limit && !s.outcome; i += 1) {
    const action = actionFor(s, ctx);
    if (!action) break;
    const r = act(s, action, ctx);
    if (!r.ok) {
      const fallback = act(s, { kind: 'guard' }, ctx);
      if (!fallback.ok) break;
      s = fallback.state;
      continue;
    }
    s = r.state;
  }
  return s;
}
