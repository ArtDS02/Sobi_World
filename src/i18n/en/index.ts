// The English string table: the same shape as vi.ts, checked by the compiler (a missing or extra key fails the
// typecheck) and by tests/unit/i18n.test.ts ({placeholders} must match).
import type { vi } from '../vi';
import { partA } from './partA';
import { partB } from './partB';
import { partC } from './partC';
import { partD } from './partD';

/** `vi`'s shape with every literal string widened, so another language can fill it in. */
export type Strings<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Strings<U>[]
    : { -readonly [K in keyof T]: Strings<T[K]> };

export const en: Strings<typeof vi> = { ...partA, ...partB, ...partC, ...partD };
