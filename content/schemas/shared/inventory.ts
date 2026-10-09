// content/shared/inventory.json — the shared bag (spec §6, GAME_BALANCE §8): slots and stack size.
// Storage upgrades (later) add slots.
import { z } from 'zod';
import { posInt } from '../fields';

export const inventoryFileSchema = z.strictObject({ slots: posInt, stack: posInt });
