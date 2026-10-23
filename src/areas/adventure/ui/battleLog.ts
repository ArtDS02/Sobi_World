// The battle log in words (spec §15.5): one line per battle event, with the names, skills, statuses and reactions it mentions. Pure.
import { formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import type { BattleEvent } from '../../../systems/combat/types';
import { COMBAT_CONTEXT, REACTIONS, SKILLS } from '../logic/config/content';
import { statusName } from './vmKit';

/** A line of the battle log in words. */
export function logLine(e: BattleEvent, nameOf: (id: string) => string): string | null {
  const L = vi.adventure.battle.log;
  switch (e.type) {
    case 'round':
      return t(L.round, { round: e.round });
    case 'use':
      return e.skillId ? t(e.ultimate ? L.ultimate : L.use, { actor: nameOf(e.actor), skill: SKILLS[e.skillId]?.nameVi ?? '' }) : t(L.use, { actor: nameOf(e.actor), skill: L.attack });
    case 'damage': {
      const how = e.mult > 1 ? ` ${L.strong}` : e.mult < 1 ? ` ${L.weak}` : '';
      return t(e.crit ? L.crit : L.damage, { target: nameOf(e.target), amount: formatInt(e.amount) }) + how;
    }
    case 'miss':
      return t(L.miss, { actor: nameOf(e.actor), target: nameOf(e.target) });
    case 'heal':
      return t(L.heal, { target: nameOf(e.target), amount: formatInt(e.amount) });
    case 'status':
      return t(COMBAT_CONTEXT.statuses[e.status]?.positive ? L.buff : L.status, { target: nameOf(e.target), status: statusName(e.status) });
    case 'resist':
      return t(L.resist, { target: nameOf(e.target), status: statusName(e.status) });
    case 'cleanse':
      return t(L.cleanse, { target: nameOf(e.target), statuses: e.statuses.map(statusName).join(', ') });
    case 'tick':
      return t(L.tick, { target: nameOf(e.target), status: statusName(e.status), amount: e.status === 'regen' ? `+${e.amount}` : e.status === 'doom' ? String(e.amount) : `-${e.amount}` });
    case 'reaction':
      return t(L.reaction, { reaction: REACTIONS[e.reaction]?.nameVi ?? e.reaction, target: nameOf(e.target) });
    case 'guard':
      return t(L.guard, { actor: nameOf(e.actor) });
    case 'skip':
      return t(L.skip, { actor: nameOf(e.actor), reason: statusName(e.reason) });
    case 'revive':
      return t(L.revive, { target: nameOf(e.target), amount: formatInt(e.amount) });
    case 'phase':
      return t(L.phase, { target: nameOf(e.target) });
    case 'ready':
      return t(L.ready, { actor: nameOf(e.actor) });
    case 'defeat':
      return t(L.defeat, { target: nameOf(e.target) });
    case 'end':
      return e.outcome === 'win' ? L.win : L.lose;
    default:
      return null;
  }
}
