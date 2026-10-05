/** Used by buyPig and by birth. Pick with the injected rng, never a global random source. */
import { CONTENT } from './content';

export const PIG_NAME_POOL: readonly string[] = CONTENT.names.pigNames;
