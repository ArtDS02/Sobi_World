// The Adventure's own events (the screens and the FeedbackDirector read these; world systems get the standard ones through
// worldEvents.ts). Every successful action emits at least one.
export type AdventureEvent =
  | { type: 'ADVENTURE_STARTER_CLAIMED'; breed: string }
  | { type: 'ADVENTURE_RUN_STARTED'; zoneId: string; team: string[]; prep: string[] }
  | { type: 'ADVENTURE_MOVED'; mapId: string }
  | { type: 'ADVENTURE_AREA_ENTERED'; mapId: string; via: 'exit' | 'portal' }
  | { type: 'ADVENTURE_BATTLE_STARTED'; boss: boolean; elite: boolean; affix?: string | null; rift?: number }
  | { type: 'ADVENTURE_BATTLE_WON'; zoneId: string; boss: boolean; elite: boolean; enemies: number; exp: number; coins: number; quick?: boolean; affix?: string | null; gems?: number; rift?: boolean }
  | { type: 'ADVENTURE_FOE_ESCAPED'; affix: string }
  | { type: 'ADVENTURE_QUIP'; key: string; name: string; lineage: string; trigger: string; n: number }
  | { type: 'ADVENTURE_TITLE_EARNED'; key: string; name: string; titleId: string }
  | { type: 'ADVENTURE_RIFT_STARTED'; ruleId: string; team: string[]; prep: string[] }
  | { type: 'ADVENTURE_RIFT_FLOOR'; floor: number; coins: number; exp: number; gems: number; nightmare: string | null; first: boolean; best: boolean }
  | { type: 'ADVENTURE_TIP_SEEN'; tipId: string }
  | { type: 'ADVENTURE_FLED' }
  | { type: 'ADVENTURE_CHEST_OPENED'; items: Readonly<Record<string, number>>; coins: number; gems: number; treasure: boolean }
  | { type: 'ADVENTURE_HARVESTED'; items: Readonly<Record<string, number>> }
  | { type: 'ADVENTURE_GATE_OPENED'; gateId: string; element: string; by: string }
  | { type: 'ADVENTURE_SPRING'; mapId: string }
  | { type: 'ADVENTURE_EVENT'; eventId: string }
  | { type: 'ADVENTURE_LORE_FOUND'; loreId: string }
  | { type: 'ADVENTURE_SHRINE_BLESSED'; element: string; pct: number }
  | { type: 'ADVENTURE_PORTAL_ACTIVATED'; mapId: string }
  | { type: 'ADVENTURE_ZONE_CLEARED'; zoneId: string; first: boolean }
  | { type: 'ADVENTURE_LEVEL_UP'; key: string; name: string; level: number }
  | { type: 'ADVENTURE_SP_GAINED'; key: string; amount: number; why: 'boss' | 'scroll' }
  | { type: 'ADVENTURE_RUN_ENDED'; zoneId: string; result: 'win' | 'lose' | 'retreat' | 'sweep'; rift?: boolean }
  | { type: 'ADVENTURE_RUN_CLOSED' }
  | { type: 'ADVENTURE_EXHAUSTED'; keys: string[] }
  | { type: 'ADVENTURE_LOOT_COLLECTED'; items: Readonly<Record<string, number>>; left: number }
  | { type: 'ADVENTURE_ITEM_USED'; itemId: string }
  | { type: 'ADVENTURE_EQUIPPED'; key: string; itemId: string }
  | { type: 'ADVENTURE_UNEQUIPPED'; key: string; itemId: string }
  | { type: 'ADVENTURE_NODE_OPENED'; key: string; nodeId: string; level: number }
  | { type: 'ADVENTURE_LOADOUT_SET'; key: string }
  | { type: 'ADVENTURE_CLASS_CHANGED'; key: string; classId: string }
  | { type: 'ADVENTURE_TREE_RESET'; key: string }
  | { type: 'ADVENTURE_FORMATION_SAVED'; index: number }
  | { type: 'ADVENTURE_LEADER_SET'; leader: 'so' | 'bi' }
  | { type: 'ADVENTURE_SWEPT'; zoneId: string; exp: number; coins: number }
  | { type: 'ADVENTURE_LEVEL'; level: number }
  | { type: 'ADVENTURE_BOARD_CLOSED' }
  | { type: 'ADVENTURE_SHOP_BOUGHT'; itemId: string; count: number; coins: number }
  | { type: 'ADVENTURE_FORGED'; recipeId: string; times: number; items: Readonly<Record<string, number>> }
  | { type: 'ADVENTURE_TOME_USED'; key: string; name: string; itemId: string; exp: number };

export const ADVENTURE_EVENT_TYPES = [
  'ADVENTURE_STARTER_CLAIMED', 'ADVENTURE_RUN_STARTED', 'ADVENTURE_MOVED', 'ADVENTURE_AREA_ENTERED', 'ADVENTURE_BATTLE_STARTED', 'ADVENTURE_BATTLE_WON',
  'ADVENTURE_FLED', 'ADVENTURE_CHEST_OPENED', 'ADVENTURE_HARVESTED', 'ADVENTURE_GATE_OPENED', 'ADVENTURE_SPRING', 'ADVENTURE_EVENT', 'ADVENTURE_LORE_FOUND',
  'ADVENTURE_SHRINE_BLESSED', 'ADVENTURE_PORTAL_ACTIVATED', 'ADVENTURE_ZONE_CLEARED', 'ADVENTURE_LEVEL_UP', 'ADVENTURE_SP_GAINED', 'ADVENTURE_RUN_ENDED',
  'ADVENTURE_RUN_CLOSED', 'ADVENTURE_EXHAUSTED', 'ADVENTURE_LOOT_COLLECTED', 'ADVENTURE_ITEM_USED', 'ADVENTURE_EQUIPPED', 'ADVENTURE_UNEQUIPPED', 'ADVENTURE_NODE_OPENED',
  'ADVENTURE_LOADOUT_SET', 'ADVENTURE_CLASS_CHANGED', 'ADVENTURE_TREE_RESET', 'ADVENTURE_FORMATION_SAVED', 'ADVENTURE_LEADER_SET', 'ADVENTURE_SWEPT',
  'ADVENTURE_LEVEL', 'ADVENTURE_FOE_ESCAPED', 'ADVENTURE_QUIP', 'ADVENTURE_TITLE_EARNED', 'ADVENTURE_RIFT_STARTED', 'ADVENTURE_RIFT_FLOOR', 'ADVENTURE_TIP_SEEN',
  'ADVENTURE_BOARD_CLOSED', 'ADVENTURE_SHOP_BOUGHT', 'ADVENTURE_FORGED', 'ADVENTURE_TOME_USED',
] as const satisfies readonly AdventureEvent['type'][];

export const isAdventureEvent = (e: { type: string }): e is AdventureEvent => (ADVENTURE_EVENT_TYPES as readonly string[]).includes(e.type);
