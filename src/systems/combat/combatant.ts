// A combatant made from what a side brings into a battle (spec §15): HP / MP / Rage it carries, its skills, the gear's modifiers and a
// boss's phases, all copied so a battle never shares state with its input. Pure.
import { cloneData } from '../../core/clone';
import type { Combatant, CombatantInit, Mods } from './types';

const NO_MODS: Mods = { elementDamage: {}, elementResist: {}, statusChance: {}, statusResist: {}, statusImmune: [], categoryDamage: {}, damage: 0, elementOverrides: {} };

export const emptyMods = (): Mods => cloneData(NO_MODS);

export function combatantOf(init: CombatantInit): Combatant {
  const maxHp = Math.max(1, Math.round(init.stats.hp));
  const maxMp = Math.max(0, Math.round(init.stats.mp));
  const rageMax = init.rageMax ?? 0;
  return {
    id: init.id,
    side: init.side,
    name: init.name,
    element: init.element,
    element2: init.element2 ?? null,
    tags: [...(init.tags ?? [])],
    stats: { ...init.stats, hp: maxHp, mp: maxMp },
    hp: Math.max(0, Math.min(maxHp, Math.round(init.hp ?? maxHp))),
    mp: Math.max(0, Math.min(maxMp, Math.round(init.mp ?? maxMp))),
    rage: Math.max(0, Math.min(rageMax, Math.round(init.rage ?? 0))),
    rageMax,
    skills: init.skills.map((s) => ({ ...s })),
    ultimate: init.ultimate ?? null,
    ultimateUsed: false,
    cooldowns: {},
    statuses: [],
    immune: {},
    guarding: false,
    mods: { ...emptyMods(), ...cloneData(init.mods ?? {}) },
    phases: [...(init.phases ?? [])].map((p) => cloneData(p)),
    phase: 0,
    intent: null,
  };
}

