// Types of architecture.mjs (plain JS so `npm run guard` runs without a build step).
export interface Layer {
  name: string;
  dir: string;
  /** Every child directory is its own unit that may not import a sibling (src/areas/<id>). */
  isolate?: boolean;
  mayImport?: string[];
}
export interface ForbiddenRule {
  dir?: string;
  match?: RegExp;
  patterns: RegExp[];
  exceptions?: string[];
}
export interface GuardConfig {
  maxFileLines: number;
  maxFileLinesExceptions?: string[];
  layers: Layer[];
  forbidden: ForbiddenRule[];
  bannedFileNames?: string[];
}
export interface SourceFile {
  path: string;
  source: string;
}
export interface Violation {
  rule: 'layer' | 'forbidden' | 'size' | 'name';
  file: string;
  message: string;
}
export function importsOf(source: string): string[];
export function resolveImport(fromPath: string, spec: string): string | null;
export function unitOf(path: string, layers: Layer[]): { layer: Layer; unit: string } | null;
export function findViolations(files: SourceFile[], cfg: GuardConfig): Violation[];
