// Acting in a battle (adventure-big-update-1 §9): an action runs at once (guard, flee) or waits for a click on its target marker;
// the marker's click sends it to the battle with the target it marks.
import { battleAct, flee } from '../logic/actions/battle';
import type { BattleActionVm, BattleVm } from './battleVm';
import type { ViewCtx } from './viewKit';


export function act(action: BattleActionVm, ctx: ViewCtx, target?: string) {
  ctx.state.aim = null;
  ctx.state.menu = null;
  if (action.kind === 'flee') return ctx.dispatch((ww, c) => flee(ww, c));
  const base =
    action.kind === 'attack'
      ? ({ kind: 'attack', target: target ?? '' } as const)
      : action.kind === 'guard'
        ? ({ kind: 'guard' } as const)
        : action.kind === 'ultimate'
          ? ({ kind: 'ultimate', ...(target ? { target } : {}) } as const)
          : action.kind === 'skill'
            ? ({ kind: 'skill', skillId: action.id, ...(target ? { target } : {}) } as const)
            : ({ kind: 'item', itemId: action.id, ...(target ? { target } : {}) } as const);
  ctx.dispatch((ww, c) => battleAct(ww, { action: base }, c));
}

/** Picks an action: guard and flee run at once; everything else waits for its target marker to be clicked. */
export function choose(action: BattleActionVm, vm: BattleVm, ctx: ViewCtx) {
  if (action.reason) return;
  if (action.aim === null) return act(action, ctx);
  void vm;
  ctx.state.aim = { action };
  ctx.state.menu = null;
  ctx.rerender();
}
