// Starter state (D7) with an INITIAL_GOLD transaction (spec §9.1).
import { BALANCE } from '../config/balance';
import { SAVE } from '../config/save';
import { changeGold } from '../engine/gold';
import type { ActionContext, SaveGame } from '../types';

/** `reduceMotion`: the OS preference at first launch (prefers-reduced-motion, read by the store). */
export function newGame(ctx: ActionContext, opts: { reduceMotion?: boolean } = {}): SaveGame {
  const empty: SaveGame = {
    schemaVersion: SAVE.SCHEMA_VERSION,
    createdAt: ctx.now,
    updatedAt: ctx.now,
    player: {
      gold: 0,
      xp: 0,
      unlockedSlots: BALANCE.START_SLOTS,
    },
    pigs: [],
    nursery: [],
    trough: { food: 0, capacity: BALANCE.START_TROUGH_CAPACITY, lastResolvedAt: ctx.now },
    inventory: { ...BALANCE.START_INVENTORY },
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
