// What the summary of a lost trip suggests (decision 039 §5): a look at the team that fell (no healer, no tank, levels under the zone,
// elements the zone resists, Doom without a cure) turned into one to three things to try next time. Pure.
import type { WorldSave } from '../../../core/save/world';
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import type { Element } from '../../../systems/combat/types';
import { ELEMENT_CHART, ZONES } from '../logic/config/content';
import { adventureOf } from '../logic/save/lens';
import type { Run } from '../logic/state';
import { zoneCards } from './campVm';
import { cleansesDoomBy, healsBy } from './fighterVm';
import { elementLabel } from './vmKit';

const A = vi.adventure.engage.advice;
const MAX = 3;

export function lossAdvice(world: WorldSave, run: Run): string[] {
  if (run.result !== 'lose') return [];
  const a = adventureOf(world);
  const out: string[] = [];
  if (run.rift) out.push(A.rift);
  if (!run.team.some((m) => healsBy(m.skills))) out.push(A.heal);
  if (run.team.length >= 3 && !run.team.some((m) => m.classId === 'tanker')) out.push(A.tank);
  const zone = ZONES[run.zoneId];
  if (!run.rift && zone) {
    const levels = run.team.map((m) => a.fighters[m.key]?.level ?? 1);
    const level = Math.round(levels.reduce((n, l) => n + l, 0) / Math.max(1, levels.length));
    const [from, to] = zone.levels;
    if (level < (from + to) / 2) out.push(t(A.level, { level, from, to }));
    const card = zoneCards(world).find((z) => z.id === zone.id);
    if (card) {
      const mine = [...new Set(run.team.flatMap((m) => [m.element, ...(m.element2 ? [m.element2] : [])]))] as Element[];
      const weak = mine.filter((el) => card.foeElements.filter((foe) => ['WEAK', 'RESIST', 'IMMUNE'].includes(ELEMENT_CHART.chart[el]?.[foe] ?? 'NEUTRAL')).length * 2 > card.foeElements.length);
      if (weak.length > 0 && weak.length === mine.length) out.push(t(A.weak, { elements: weak.map(elementLabel).join(', ') }));
      if (card.hasDoom && !run.team.some((m) => cleansesDoomBy(m.skills))) out.push(A.doom);
    }
  }
  return out.length > 0 ? out.slice(0, MAX) : [A.general];
}
