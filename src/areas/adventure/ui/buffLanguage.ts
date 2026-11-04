// The visual language of buffs and debuffs (ANIM-008): what each kind of status looks and moves like, so that six buffs side by side can
// be told apart without their icons. The looks themselves are written in content/adventure/battle_fx.json (`statuses`); this table is
// the standard they follow, and tests/unit/buffLanguage.test.ts holds the content to it. Rules: a buff goes up and opens out in a
// bright additive colour; a debuff goes down and closes in, in a dull colour, and takes at most DEBUFF_MAX_MS to play.
import type { StatusId } from '../../../systems/combat/types';

export type BuffFamily = 'power' | 'guard' | 'heal' | 'speed' | 'evasion' | 'shield' | 'taunt' | 'debuff';

export interface BuffLook {
  family: BuffFamily;
  /** The main colour of its effects and of its lasting layer. */
  color: string;
  /** Up: rises and opens out; down: sinks and closes in. */
  direction: 'up' | 'down';
  /** What the lasting layer is (nothing for a family that only pulses particles). */
  lasting: 'aura' | 'orbit' | 'ring' | 'particles';
}

/** A debuff's own effect never plays longer than this (ms): it must not drag the turn. */
export const DEBUFF_MAX_MS = 400;
/** The dull colour every debuff shares. */
export const DEBUFF_COLOR = '#6b4a8a';

export const BUFF_LANGUAGE: Readonly<Partial<Record<StatusId, BuffLook>>> = {
  atkUp: { family: 'power', color: '#ff5a3c', direction: 'up', lasting: 'aura' },
  matkUp: { family: 'power', color: '#b06aff', direction: 'up', lasting: 'orbit' },
  accUp: { family: 'power', color: '#ffe08a', direction: 'up', lasting: 'orbit' },
  defUp: { family: 'guard', color: '#4aa8ff', direction: 'up', lasting: 'ring' },
  mdefUp: { family: 'guard', color: '#8fe0ff', direction: 'up', lasting: 'ring' },
  shield: { family: 'shield', color: '#9ad0ff', direction: 'up', lasting: 'ring' },
  regen: { family: 'heal', color: '#6ff0a0', direction: 'up', lasting: 'particles' },
  autoRevive: { family: 'heal', color: '#ffd23c', direction: 'up', lasting: 'orbit' },
  spdUp: { family: 'speed', color: '#ffd23c', direction: 'up', lasting: 'particles' },
  evaUp: { family: 'evasion', color: '#b0f0ff', direction: 'up', lasting: 'aura' },
  taunt: { family: 'taunt', color: '#ff4a4a', direction: 'up', lasting: 'orbit' },
  atkDown: { family: 'debuff', color: DEBUFF_COLOR, direction: 'down', lasting: 'particles' },
  defDown: { family: 'debuff', color: DEBUFF_COLOR, direction: 'down', lasting: 'particles' },
  matkDown: { family: 'debuff', color: DEBUFF_COLOR, direction: 'down', lasting: 'particles' },
  mdefDown: { family: 'debuff', color: DEBUFF_COLOR, direction: 'down', lasting: 'particles' },
  accDown: { family: 'debuff', color: DEBUFF_COLOR, direction: 'down', lasting: 'particles' },
  evaDown: { family: 'debuff', color: DEBUFF_COLOR, direction: 'down', lasting: 'particles' },
  spdDown: { family: 'debuff', color: DEBUFF_COLOR, direction: 'down', lasting: 'particles' },
};

/** Statuses that are neither a buff nor a debuff of a stat: conditions with their own looks (ANIM-050..056). */
export const CONDITION_STATUSES: readonly StatusId[] = ['poison', 'burn', 'wet', 'freeze', 'stun', 'disable', 'doom'];
