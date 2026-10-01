// Starter state (D7) with an INITIAL_GOLD transaction (spec §9.1).
import { BALANCE } from '../config/balance';
import { SAVE } from '../config/save';
import { STARTER_SKINS } from '../config/skins';
import { changeGold } from '../engine/gold';
import type { ActionContext, SaveGame } from '../types';

export function newGame(ctx: ActionContext): SaveGame {
  const empty: SaveGame = {
    schemaVersion: SAVE.SCHEMA_VERSION,
    createdAt: ctx.now,
    updatedAt: ctx.now,
    player: {
      gold: 0,
      xp: 0,
      unlockedSlots: BALANCE.START_SLOTS,
      ownedSkins: [...STARTER_SKINS],
    },
    pigs: [],
    trough: { food: 0, capacity: BALANCE.START_TROUGH_CAPACITY, lastResolvedAt: ctx.now },
    inventory: { ...BALANCE.START_INVENTORY },
    orders: [],
    collection: { discoveredBreeds: [], discoveredSkins: [] },
    transactions: [],
    breedingRecords: [],
    settings: {
      musicOn: true,
      sfxOn: true,
      reduceMotion: false,
      tutorialDone: false,
      lastExportAt: null,
    },
  };
  const funded = changeGold(empty, BALANCE.START_GOLD, 'INITIAL_GOLD', ctx);
  if (!funded.ok) throw new Error('starter gold cannot fail');
  return funded.state;
}
