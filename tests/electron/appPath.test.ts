import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveAppPath } from '../../electron/appPath';

const DIST = join('C:', 'app', 'dist');

describe('resolveAppPath (B7)', () => {
  it('maps a normal path inside dist', () => {
    expect(resolveAppPath(DIST, '/index.html')).toBe(join(DIST, 'index.html'));
    expect(resolveAppPath(DIST, '/assets/a%20b.png')).toBe(join(DIST, 'assets', 'a b.png'));
  });
  it('a malformed percent escape is null (404), not an exception', () => {
    expect(resolveAppPath(DIST, '/%E0%A4%A')).toBeNull();
    expect(resolveAppPath(DIST, '/%')).toBeNull();
  });
  it('refuses paths that leave dist or hold a NUL', () => {
    expect(resolveAppPath(DIST, '/../secret.txt')).toBeNull();
    expect(resolveAppPath(DIST, '/%2e%2e/secret.txt')).toBeNull();
    expect(resolveAppPath(DIST, '/a%00b')).toBeNull();
  });
});
