// Starter state (D7) with an INITIAL_GOLD transaction (spec §9.1).
import { ITEM_ID_VALUES } from '../../../../core/config/ids';
import { BALANCE } from '../config/balance';
import { FARM_DOC_VERSION } from './legacyConfig';
import { changeGold } from '../gold';
import type { ActionContext, FarmGame } from '../types';

/** `reduceMotion`: the OS preference at first launch (prefers-reduced-motion, read by the store). */
export function newGame(ctx: ActionContext, opts: { reduceMotion?: boolean } = {}): FarmGame {
  const empty: FarmGame = {
    schemaVersion: FARM_DOC_VERSION,
    createdAt: ctx.now,
    updatedAt: ctx.now,
    player: {
      gold: 0,
      xp: 0,
      unlockedSlots: BALANCE.START_SLOTS,
    },
    pigs: [],
    nursery: [],
    trough: { food: 0, capacity: BALANCE.TROUGH_LEVELS[0]!.capacity, level: 1, lastResolvedAt: ctx.now },
    inventory: Object.fromEntries(ITEM_ID_VALUES.map((id) => [id, BALANCE.START_INVENTORY[id] ?? 0])) as FarmGame['inventory'],
    orders: [],
    collection: { discoveredBreeds: [] },
    transactions: [],
    breedingRecords: [],
    gifts: { nextAt: null, boxes: [] },
    progress: { stats: {}, claimed: {}, daily: { lastDay: null, streak: 0 } },
    decor: [],
    settings: {
      musicOn: true,
      sfxOn: true,
      reduceMotion: opts.reduceMotion ?? false,
      tutorialDone: false,
      lastExportAt: null,
    },
  };
  const funded = changeGold(empty, BALANCE.START_GOLD, 'INITIAL_GOLD', ctx);
  if (!funded.ok) throw new Error('starter gold cannot fail');
  return funded.state;
}
