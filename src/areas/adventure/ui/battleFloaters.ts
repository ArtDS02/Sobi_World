// What the last step of a battle shows on the field (decision 039 §1): numbers over the units it touched (damage, critical hits, how
// well the element landed, misses, heals, new statuses), one banner for the moment that matters most (an Ultimate's cut-in, an element
// reaction, a boss changing phase), and whether the field shakes. Each one carries when it plays, from the step's motion
// (battleMotion.ts: the impact of the action that caused it); without times everything plays at once. Presentation only: it reads the
// step's events and never touches the battle. Pure.
import { formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import type { BattleEvent, BattleState } from '../../../systems/combat/types';
import { REACTIONS, SKILLS } from '../logic/config/content';
import { ACTION_ART, reactionArt, statusName } from './vmKit';

export type FloaterTone = 'damage' | 'crit' | 'strong' | 'weak' | 'heal' | 'miss' | 'status' | 'buff';

export interface FloaterVm {
  unit: string;
  text: string;
  tone: FloaterTone;
  /** Order on that unit (stacked upwards, a little later each). */
  index: number;
  /** When it rises (ms from the start of the step). */
  at: number;
}

export interface BannerVm {
  kind: 'ultimate' | 'reaction' | 'phase';
  title: string;
  sub: string | null;
  art: string;
  /** The unit it belongs to (its portrait on an Ultimate's cut-in). */
  unit: string;
  /** When it shows (ms from the start of the step). */
  at: number;
}

export interface StepFx {
  floaters: FloaterVm[];
  banner: BannerVm | null;
  shake: boolean;
  /** When the field shakes (ms from the start of the step). */
  shakeAt: number;
}

const MAX_PER_UNIT = 4;

/** The effect of the events of one step of `battle` (the step that produced `log`); `times[i]` is when event i plays. */
export function stepFx(battle: BattleState | null, log: readonly { type: string }[], times: readonly number[] = []): StepFx {
  const events = log as readonly BattleEvent[];
  const side = new Map((battle?.combatants ?? []).map((c) => [c.id, c.side]));
  const name = new Map((battle?.combatants ?? []).map((c) => [c.id, c.name]));
  const floaters: FloaterVm[] = [];
  const count = new Map<string, number>();
  let now = 0;
  const push = (unit: string, text: string, tone: FloaterTone) => {
    const n = count.get(unit) ?? 0;
    if (n >= MAX_PER_UNIT) return;
    count.set(unit, n + 1);
    floaters.push({ unit, text, tone, index: n, at: now });
  };
  let ultimate: BannerVm | null = null;
  let reaction: BannerVm | null = null;
  let phase: BannerVm | null = null;
  let shake = false;
  let shakeAt = 0;
  const shakeNow = () => {
    if (!shake) shakeAt = now;
    shake = true;
  };
  events.forEach((e, i) => {
    now = times[i] ?? 0;
    switch (e.type) {
      case 'damage': {
        if (e.amount <= 0 && e.absorbed > 0) {
          push(e.target, `${statusName('shield')} -${formatInt(e.absorbed)}`, 'buff');
          break;
        }
        const tone: FloaterTone = e.crit ? 'crit' : e.mult > 1 ? 'strong' : e.mult < 1 ? 'weak' : 'damage';
        const tag = e.crit ? ` ${vi.adventure.engage.floater.crit}` : e.mult > 1 ? ` ${vi.adventure.battle.eff.STRONG}` : e.mult === 0 ? ` ${vi.adventure.battle.eff.IMMUNE}` : e.mult < 1 ? ` ${vi.adventure.battle.eff.WEAK}` : '';
        push(e.target, `-${formatInt(e.amount)}${tag}`, tone);
        if (e.crit) shakeNow();
        break;
      }
      case 'tick':
        if (e.status === 'regen') push(e.target, `+${formatInt(e.amount)}`, 'heal');
        else if (e.status !== 'doom') push(e.target, `-${formatInt(e.amount)} ${statusName(e.status)}`, 'damage');
        break;
      case 'miss':
        push(e.target, vi.adventure.engage.floater.miss, 'miss');
        break;
      case 'heal':
        if (e.amount > 0) push(e.target, `+${formatInt(e.amount)}`, 'heal');
        break;
      case 'revive':
        push(e.target, `+${formatInt(e.amount)}`, 'heal');
        break;
      case 'status':
        push(e.target, statusName(e.status), side.get(e.actor) === side.get(e.target) ? 'buff' : 'status');
        break;
      case 'reaction': {
        const r = REACTIONS[e.reaction];
        reaction ??= { kind: 'reaction', title: r?.nameVi ?? e.reaction, sub: name.get(e.target) ?? null, art: reactionArt(e.reaction), unit: e.target, at: now };
        shakeNow();
        break;
      }
      case 'use':
        if (e.ultimate && e.skillId) {
          ultimate = { kind: 'ultimate', title: SKILLS[e.skillId]?.nameVi ?? e.skillId, sub: `${name.get(e.actor) ?? ''} · ${vi.adventure.engage.floater.ultimate}`, art: ACTION_ART.ultimate, unit: e.actor, at: now };
          shakeNow();
        }
        break;
      case 'phase':
        phase = { kind: 'phase', title: t(vi.adventure.engage.floater.phase, { phase: e.phase + 1 }), sub: name.get(e.target) ?? null, art: ACTION_ART.skill, unit: e.target, at: now };
        shakeNow();
        break;
      default:
        break;
    }
  });
  return { floaters, banner: ultimate ?? phase ?? reaction, shake, shakeAt };
}

/** Rounds left before a golden group runs away, or null (decision 039 §2). */
export function escapeIn(battle: BattleState | null, escapeAfterRounds: number | null): number | null {
  if (!battle || escapeAfterRounds === null) return null;
  return Math.max(0, escapeAfterRounds - battle.round + 1);
}
