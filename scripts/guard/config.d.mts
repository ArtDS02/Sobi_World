// Types of config.mjs.
import type { GuardConfig } from './architecture.mjs';

declare const config: GuardConfig & {
  barrels: { index: string; glob: string }[];
  sourceExtensions: string[];
  roots: string[];
};
export default config;
