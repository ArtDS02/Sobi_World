// Production (spec §6 Recipe, ARCHITECTURE core/production): a workshop cooks one recipe at a time, a batch
// every `durationMs` of real time. Closed form of `now`, so the same call serves every simulation mode.
// Pure: it moves no items; the Area takes the inputs and gives the outputs through the shared bag.

export interface Recipe {
  id: string;
  /** The building that cooks it. */
  building: string;
  inputs: Readonly<Record<string, number>>;
  outputs: Readonly<Record<string, number>>;
  durationMs: number;
}

/** The job of one building. */
export interface ProductionJob {
  recipeId: string;
  batches: number;
  startedAt: number;
  /** Batches whose outputs the player already took (the oldest ones). */
  collected: number;
}

/** Batches finished by `now`. */
export const batchesDone = (job: ProductionJob, recipe: Pick<Recipe, 'durationMs'>, now: number): number =>
  Math.max(0, Math.min(job.batches, Math.floor((now - job.startedAt) / recipe.durationMs)));

/** Finished and not yet collected. */
export const batchesReady = (job: ProductionJob, recipe: Pick<Recipe, 'durationMs'>, now: number): number =>
  batchesDone(job, recipe, now) - job.collected;

/** Batches that finished in (from, to]: the events a catch-up reports. */
export const batchesFinishedBetween = (job: ProductionJob, recipe: Pick<Recipe, 'durationMs'>, from: number, to: number): number =>
  Math.max(0, batchesDone(job, recipe, to) - batchesDone(job, recipe, from));

/** When the whole job is finished. */
export const jobEndsAt = (job: ProductionJob, recipe: Pick<Recipe, 'durationMs'>): number => job.startedAt + job.batches * recipe.durationMs;

/** When the next batch finishes, or null when every batch is. */
export function nextBatchAt(job: ProductionJob, recipe: Pick<Recipe, 'durationMs'>, now: number): number | null {
  const done = batchesDone(job, recipe, now);
  return done >= job.batches ? null : job.startedAt + (done + 1) * recipe.durationMs;
}

/** The items `n` batches use or make. */
export const scaled = (counts: Readonly<Record<string, number>>, n: number): Record<string, number> =>
  Object.fromEntries(Object.entries(counts).map(([id, c]) => [id, c * n]));

/** The job after the player took `n` ready batches; null when it is over. */
export function collectBatches(job: ProductionJob, n: number): ProductionJob | null {
  const next = { ...job, collected: job.collected + n };
  return next.collected >= job.batches ? null : next;
}

/** The most batches the items allow. */
export function affordableBatches(recipe: Pick<Recipe, 'inputs'>, items: Readonly<Record<string, number>>): number {
  const counts = Object.entries(recipe.inputs).map(([id, c]) => Math.floor((items[id] ?? 0) / c));
  return counts.length === 0 ? 0 : Math.min(...counts);
}
