// content/shared/inventory.json — the shared bag (spec §6, GAME_BALANCE §8): stack size and an optional slot limit.
// The bag has no limit since decision 038; `slots` stays so a limit can come back from content alone.
import { z } from 'zod';
import { posInt } from '../fields';

export const inventoryFileSchema = z.strictObject({ slots: posInt.optional(), stack: posInt });
