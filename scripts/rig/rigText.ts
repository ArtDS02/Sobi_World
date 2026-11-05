// The house layout of a rig file: two-space JSON with short arrays of numbers / strings (keys, boxes, joints) kept on one line, and a
// track (an array of such keys) on one line while it stays short enough to read.
const WIDE = 200;

export function rigText(data: unknown): string {
  const flat = (inner: string) => `[${inner.replace(/,\s+/g, ', ')}]`;
  const leaves = JSON.stringify(data, null, 2).replace(/\[\s+((?:-?[\d.]+|"[^"\n]*"|null)(?:,\s+(?:-?[\d.]+|"[^"\n]*"|null))*)\s+\]/g, (_m, inner: string) => flat(inner));
  const tracks = leaves.replace(/\[\s+(\[[^[\]\n]*\](?:,\s+\[[^[\]\n]*\])*)\s+\]/g, (m, inner: string) => {
    const one = `[${inner.replace(/\],\s+\[/g, '], [')}]`;
    return one.length <= WIDE ? one : m;
  });
  // Small objects (a bone, a key's channels, a slot's pictures) on one line, inner ones first.
  let out = tracks;
  for (let pass = 0; pass < 3; pass++) {
    out = out.replace(/\{\n\s+([^{}]*?)\n\s*\}/g, (m, inner: string) => {
      const one = `{ ${inner.replace(/,\n\s+/g, ', ')} }`;
      return one.length <= WIDE && !one.includes('\n') ? one : m;
    });
  }
  return `${out}\n`;
}
