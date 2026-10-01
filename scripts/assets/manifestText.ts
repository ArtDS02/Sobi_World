// Text-level edits of public/assets/manifest/assets.json (used by scripts/process-art.ts).
/**
 * Sets string fields on the row with `id`, editing the hand-formatted manifest text in place so the
 * diff shows only the changed fields (re-serialising would reflow the whole file).
 */
export function patchRowText(
  text: string,
  id: string,
  fields: Record<string, string | null>,
): string {
  const at = text.indexOf(`"id": ${JSON.stringify(id)}`);
  if (at < 0) throw new Error(`manifest: row ${id} not found`);
  const start = text.lastIndexOf('{', at);
  let depth = 0,
    end = start;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) {
      end = i;
      break;
    }
  }
  let body = text.slice(start, end);
  const multiline = body.includes('\n');
  const indent = multiline ? (/\n([ \t]*)"id"/.exec(text.slice(start, at + 4))?.[1] ?? '  ') : '';
  for (const [field, value] of Object.entries(fields)) {
    // Any scalar value: string, null, number or boolean.
    const re = new RegExp(
      `("${field}":\\s*)(?:"(?:[^"\\\\]|\\\\.)*"|null|true|false|-?[0-9][0-9.]*)`,
    );
    if (re.test(body)) {
      body = body.replace(re, (_m, head: string) => `${head}${JSON.stringify(value)}`);
    } else {
      const trimmed = body.replace(/\s+$/, '');
      const tail = body.slice(trimmed.length);
      const sep = multiline ? `,\n${indent}` : ', ';
      body = `${trimmed}${sep}"${field}": ${JSON.stringify(value)}${tail}`;
    }
  }
  return text.slice(0, start) + body + text.slice(end);
}
