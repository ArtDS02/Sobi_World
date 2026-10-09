// The template Area's slice of the world save (`areas[<id>]`): its own state only. Coins, items and
// XP are world fields (core/economy, core/inventory, core/progression).
import { z } from 'zod';
import type { Raw } from '../../../core/save/migrate';

/** Slice version: bump it and add a migration whenever the shape changes (ARCHITECTURE §9). */
export const TEMPLATE_STATE_VERSION = 2;

export const templateStateSchema = z.strictObject({
  version: z.literal(TEMPLATE_STATE_VERSION),
  /** Example state: something that grows 0..100 over time, and how many times it finished. */
  growth: z.number().min(0).max(100),
  harvests: z.number().int().min(0),
  /** Time the slice was last simulated up to (epoch ms). */
  lastTickedAt: z.number().finite(),
});

export type TemplateState = z.infer<typeof templateStateSchema>;

/** MIGRATIONS[n] upgrades the slice from version n to n + 1 (the driver stamps `version`). */
export const TEMPLATE_MIGRATIONS: Record<number, (slice: Raw) => Raw> = {
  // v1 called the counter `done`.
  1: ({ done, ...rest }) => ({ ...rest, harvests: typeof done === 'number' ? done : 0 }),
};

export const initialState = (now: number): TemplateState => ({
  version: TEMPLATE_STATE_VERSION,
  growth: 0,
  harvests: 0,
  lastTickedAt: now,
});
