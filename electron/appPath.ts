// Maps an app:// URL path to a file inside dist/ (B7). Pure: a malformed escape (%E0%A4%A) or a path that climbs
// out of the folder gives null, which the protocol handler answers with 404 instead of throwing.
import { join, normalize, sep } from 'node:path';

export function resolveAppPath(distDir: string, pathname: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;
  const file = normalize(join(distDir, decoded));
  return file.startsWith(distDir + sep) ? file : null;
}
