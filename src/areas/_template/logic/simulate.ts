// The template Area's numbers over time: pure (now injected), closed form, the same call for every
// mode (ARCHITECTURE §5–6). Replace with the Area's real rules; keep it free of DOM, clocks, Math.random.
import type { TemplateState } from './state';

/** Growth points per hour (an Area reads this from its content/<id>/balance.json). */
export const GROWTH_PER_HOUR = 50;

export type TemplateEvent = { type: 'TEMPLATE_HARVESTED'; count: number };

export function simulateTemplate(state: TemplateState, now: number): { state: TemplateState; events: TemplateEvent[] } {
  const hours = Math.max(0, now - state.lastTickedAt) / 3_600_000;
  if (hours === 0) return { state: { ...state, lastTickedAt: Math.max(now, state.lastTickedAt) }, events: [] };
  const total = state.growth + hours * GROWTH_PER_HOUR;
  const done = Math.floor(total / 100);
  return {
    state: { ...state, growth: total - done * 100, harvests: state.harvests + done, lastTickedAt: now },
    events: done > 0 ? [{ type: 'TEMPLATE_HARVESTED', count: done }] : [],
  };
}
