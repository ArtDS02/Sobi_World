// The goals' events (the order board, the daily goals, achievements, the Codex, the login reward and the world
// level) and how they read as standard world events (ARCHITECTURE §7). The presentation (toasts, sounds) is
// ui/goals/feedback.ts.
import type { CodexEvent } from '../collection/codex';
import type { EventBase, WorldEvent } from '../events';
import type { PlotSkinEvent } from '../plots/forge';
import type { WorldLevelReward, WorldLevelUp } from '../progression/xp';
import type { FestivalEvent } from '../live/festival';
import type { MerchantEvent } from '../live/merchant';
import type { TechEvent } from '../tech/tech';
import type { AchievementEvent } from './achievements';
import type { DailyEvent } from './daily';
import type { WeeklyEvent } from './weekly';
import type { LoginEvent } from './loginReward';
import type { BoardEvent } from './orders';

export type GoalsEvent = BoardEvent | DailyEvent | WeeklyEvent | AchievementEvent | CodexEvent | LoginEvent | WorldLevelUp | WorldLevelReward | PlotSkinEvent | TechEvent | FestivalEvent | MerchantEvent;

export const GOALS_EVENT_TYPES = [
  'BOARD_ORDER_NEW',
  'BOARD_ORDER_DONE',
  'BOARD_ORDER_REROLLED',
  'DAILY_GOAL_REACHED',
  'DAILY_GOAL_CLAIMED',
  'DAILY_BONUS_CLAIMED',
  'WEEKLY_GOAL_REACHED',
  'WEEKLY_GOAL_CLAIMED',
  'WEEKLY_BONUS_CLAIMED',
  'ACHIEVEMENT_REACHED',
  'ACHIEVEMENT_CLAIMED',
  'CODEX_DISCOVERED',
  'CODEX_MILESTONE_REACHED',
  'CODEX_MILESTONE_CLAIMED',
  'DAILY_CLAIMED',
  'WORLD_LEVEL_UP',
  'WORLD_LEVEL_REWARD',
  'PLOT_SKIN_FORGED',
  'TECH_UPGRADED',
  'FESTIVAL_TOKENS',
  'FESTIVAL_GIFT',
  'FESTIVAL_BOUGHT',
  'MERCHANT_DELIVERED',
] as const satisfies readonly GoalsEvent['type'][];

type Missing = Exclude<GoalsEvent['type'], (typeof GOALS_EVENT_TYPES)[number]>;
export const GOALS_EVENT_TYPES_COMPLETE: Missing extends never ? true : Missing = true;

export const isGoalsEvent = (e: EventBase): e is GoalsEvent => (GOALS_EVENT_TYPES as readonly string[]).includes(e.type);

const WORLD = 'world';
const coins = (amount: number): WorldEvent[] => (amount === 0 ? [] : [{ type: 'currency.changed', area: WORLD, currency: 'coins', amount }]);

/** The standard world events of the goals' events. */
export function goalsWorldEvents(e: GoalsEvent): WorldEvent[] {
  switch (e.type) {
    case 'BOARD_ORDER_DONE':
      return [{ type: 'order.completed', area: WORLD, orderId: e.orderId }, ...coins(e.coins)];
    case 'ACHIEVEMENT_REACHED':
      return [{ type: 'achievement.unlocked', area: WORLD, achievementId: e.id }];
    case 'CODEX_DISCOVERED':
      return [{ type: 'codex.discovered', area: WORLD, kind: e.kind, id: e.id }, ...coins(e.coins)];
    case 'WORLD_LEVEL_UP':
      return [{ type: 'area.levelUp', area: WORLD, level: e.level }];
    case 'WORLD_LEVEL_REWARD':
      return [...coins(e.coins), ...(e.gems > 0 ? [{ type: 'currency.changed', area: WORLD, currency: 'gems', amount: e.gems } satisfies WorldEvent] : [])];
    case 'PLOT_SKIN_FORGED':
      return [
        { type: 'plot.skinForged', area: WORLD, skinId: e.skinId },
        { type: 'currency.changed', area: WORLD, currency: e.pay, amount: -e.amount },
        ...Object.entries(e.materials).map(([itemId, quantity]): WorldEvent => ({ type: 'item.removed', area: WORLD, itemId, quantity })),
      ];
    case 'DAILY_GOAL_CLAIMED':
    case 'DAILY_BONUS_CLAIMED':
    case 'CODEX_MILESTONE_CLAIMED':
      return coins(e.coins);
    case 'DAILY_CLAIMED':
      return coins(e.gold);
    case 'WEEKLY_GOAL_CLAIMED':
      return [...coins(e.coins), { type: 'currency.changed', area: WORLD, currency: 'gems', amount: e.gems }];
    case 'WEEKLY_BONUS_CLAIMED':
      return [
        ...coins(e.coins),
        { type: 'currency.changed', area: WORLD, currency: 'gems', amount: e.gems },
        { type: 'currency.changed', area: WORLD, currency: 'eventTokens', amount: e.eventTokens },
      ];
    case 'TECH_UPGRADED':
      return [
        { type: 'tech.upgraded', area: WORLD, techId: e.techId, level: e.level },
        ...coins(-e.coins),
        ...Object.entries(e.items).map(([itemId, quantity]): WorldEvent => ({ type: 'item.removed', area: WORLD, itemId, quantity })),
      ];
    case 'FESTIVAL_TOKENS':
    case 'FESTIVAL_GIFT':
      return [{ type: 'currency.changed', area: WORLD, currency: 'eventTokens', amount: e.tokens }];
    case 'FESTIVAL_BOUGHT':
      return [
        { type: 'currency.changed', area: WORLD, currency: 'eventTokens', amount: -e.cost },
        e.reward.kind === 'item'
          ? { type: 'item.added', area: WORLD, itemId: e.reward.itemId, quantity: e.reward.quantity }
          : { type: 'currency.changed', area: WORLD, currency: 'gems', amount: e.reward.amount },
      ];
    case 'MERCHANT_DELIVERED':
      return [
        ...coins(e.coins),
        ...(e.tokens > 0 ? [{ type: 'currency.changed', area: WORLD, currency: 'eventTokens', amount: e.tokens } satisfies WorldEvent] : []),
      ];
    default:
      return [];
  }
}

export const goalsEventsToWorld = (events: readonly EventBase[]): WorldEvent[] => events.filter(isGoalsEvent).flatMap(goalsWorldEvents);
