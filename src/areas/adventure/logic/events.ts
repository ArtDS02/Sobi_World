// The Adventure's own events (the screens and the FeedbackDirector read these; world systems get the standard ones through
// worldEvents.ts).
export type AdventureEvent =
  | { type: 'ADVENTURE_STARTER_CLAIMED'; breed: string }
  | { type: 'ADVENTURE_RUN_STARTED'; zoneId: string; team: string[] }
  | { type: 'ADVENTURE_BATTLE_STARTED'; boss: boolean }
  | { type: 'ADVENTURE_BATTLE_WON'; zoneId: string; boss: boolean; enemies: number; exp: number; coins: number }
  | { type: 'ADVENTURE_CHEST_OPENED'; items: Readonly<Record<string, number>>; coins: number; gems: number }
  | { type: 'ADVENTURE_EVENT'; eventId: string }
  | { type: 'ADVENTURE_LEVEL_UP'; key: string; name: string; level: number }
  | { type: 'ADVENTURE_RUN_ENDED'; zoneId: string; result: 'win' | 'lose' | 'retreat' }
  | { type: 'ADVENTURE_EXHAUSTED'; keys: string[] }
  | { type: 'ADVENTURE_LOOT_COLLECTED'; items: Readonly<Record<string, number>>; left: number }
  | { type: 'ADVENTURE_ITEM_USED'; itemId: string }
  | { type: 'ADVENTURE_EQUIPPED'; key: string; itemId: string }
  | { type: 'ADVENTURE_UNEQUIPPED'; key: string; itemId: string }
  | { type: 'ADVENTURE_LEVEL'; level: number };

export const ADVENTURE_EVENT_TYPES = [
  'ADVENTURE_STARTER_CLAIMED', 'ADVENTURE_RUN_STARTED', 'ADVENTURE_BATTLE_STARTED', 'ADVENTURE_BATTLE_WON', 'ADVENTURE_CHEST_OPENED', 'ADVENTURE_EVENT',
  'ADVENTURE_LEVEL_UP', 'ADVENTURE_RUN_ENDED', 'ADVENTURE_EXHAUSTED', 'ADVENTURE_LOOT_COLLECTED', 'ADVENTURE_ITEM_USED', 'ADVENTURE_EQUIPPED',
  'ADVENTURE_UNEQUIPPED', 'ADVENTURE_LEVEL',
] as const satisfies readonly AdventureEvent['type'][];

export const isAdventureEvent = (e: { type: string }): e is AdventureEvent => (ADVENTURE_EVENT_TYPES as readonly string[]).includes(e.type);
