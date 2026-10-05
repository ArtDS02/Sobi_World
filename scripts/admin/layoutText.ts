// Manifest text of the layout the admin dashboard edits (DECISIONS R05C-1): the placements array is
// rewritten in the file's own JSON style, the rest of the manifest kept byte for byte. Pure, unit-tested.

/**
 * Manifest text with `layout.placements` replaced, in the file's own JSON style (2-space indent,
 * one key per line). Everything outside the array is kept byte for byte.
 */
export function replacePlacementsText(manifest: string, placements: readonly object[]): string {
  const key = '"placements": [';
  const start = manifest.indexOf(key, manifest.indexOf('"layout": {'));
  if (start < 0) throw new Error('manifest: layout.placements not found');
  let depth = 0;
  let end = -1;
  for (let i = start + key.length - 1; i < manifest.length; i++) {
    const c = manifest[i];
    if (c === '"') {
      i = manifest.indexOf('"', i + 1);
      while (manifest[i - 1] === '\\') i = manifest.indexOf('"', i + 1);
    } else if (c === '[') depth++;
    else if (c === ']' && --depth === 0) {
      end = i + 1;
      break;
    }
  }
  if (end < 0) throw new Error('manifest: unterminated placements array');
  const body = JSON.stringify(placements, null, 2).replace(/\n/g, '\n    ');
  return `${manifest.slice(0, start)}"placements": ${body}${manifest.slice(end)}`;
}
