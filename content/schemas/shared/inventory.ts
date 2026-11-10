// content/shared/inventory.json — the shared bag (spec §6, GAME_BALANCE §8): stack size (display only). The bag has no slot limit (decisions 038, 057).
import { z } from 'zod';
import { posInt } from '../fields';

export const inventoryFileSchema = z.strictObject({ stack: posInt });
