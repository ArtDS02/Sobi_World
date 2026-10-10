// What the goals' events say and play (spec §11.3): a sound and a toast per event, handed to the FeedbackDirector, the
// one place that turns events into presentation. A catch-up is never replayed (§9.5): the away summary covers it. Pure.
import type { AudioKey } from '../../core/config/assetIds';
import type { EventBase } from '../../core/events';
import { isGoalsEvent } from '../../core/goals/events';
import { formatInt, t } from '../../i18n/format';
import { vi } from '../../i18n/vi';

export interface Presentation {
  sound: AudioKey | null;
  toast: string | null;
}

const achievementName = (id: string): string => (vi.achievements as Record<string, string>)[id] ?? id;

export function goalsPresentation(e: EventBase, origin: 'action' | 'tick' | 'catchup', names: (kind: string, id: string) => string): Presentation | null {
  if (!isGoalsEvent(e) || origin === 'catchup') return null;
  switch (e.type) {
    case 'BOARD_ORDER_NEW':
      return { sound: 'notify', toast: vi.event.orderNew };
    case 'BOARD_ORDER_DONE':
      return { sound: 'coin_collect', toast: t(vi.board.done, { coins: formatInt(e.coins) }) };
    case 'BOARD_ORDER_REROLLED':
      return { sound: 'ui_click', toast: null };
    case 'DAILY_GOAL_REACHED':
      return { sound: 'level_up', toast: vi.goals.dot };
    case 'DAILY_GOAL_CLAIMED':
      return { sound: 'coin_collect', toast: t(vi.goals.daily.reward, { coins: formatInt(e.coins) }) };
    case 'DAILY_BONUS_CLAIMED':
      return { sound: 'coin_collect', toast: t(vi.goals.daily.bonusReward, { coins: formatInt(e.coins), xp: e.xp }) };
    case 'DAILY_CLAIMED':
      return { sound: 'coin_collect', toast: t(vi.event.dailyClaimed, { streak: e.streak, what: [e.gold > 0 ? `${formatInt(e.gold)} ${vi.plazaBar.coins}` : '', e.food > 0 ? `${e.food} ${vi.shop.FOOD_BASIC}` : '', e.medicine > 0 ? `${e.medicine} ${vi.shop.MEDICINE_COMMON}` : ''].filter(Boolean).join(', ') }) };
    case 'ACHIEVEMENT_REACHED':
      return { sound: 'level_up', toast: t(vi.event.achievementReached, { name: achievementName(e.id) }) };
    case 'ACHIEVEMENT_CLAIMED':
      return { sound: 'coin_collect', toast: t(vi.event.achievementClaimed, { name: achievementName(e.id), gems: e.gems }) };
    case 'CODEX_DISCOVERED':
      return {
        sound: 'coin_collect',
        toast: t(e.coins > 0 ? vi.codex.discoveredBonus : vi.codex.discovered, { name: names(e.kind, e.id), coins: formatInt(e.coins) }),
      };
    case 'CODEX_MILESTONE_REACHED':
      return { sound: 'level_up', toast: t(vi.codex.milestoneReady, { entries: e.id.replace(/\D/g, '') }) };
    case 'CODEX_MILESTONE_CLAIMED':
      return { sound: 'coin_collect', toast: null };
    case 'WORLD_LEVEL_UP':
      return { sound: 'level_up', toast: t(vi.event.levelUp, { level: e.level }) };
  }
}
