// Stable text of a content JSON file (admin saves, extraction): 2-space indent; any object or array
// whose one-line form fits the line is written on one line, so a table edit is a one-line diff.
const LINE = 110;

function inline(value: unknown): string {
  if (Array.isArray(value)) return value.length === 0 ? '[]' : `[${value.map(inline).join(', ')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined);
    return entries.length === 0 ? '{}' : `{ ${entries.map(([k, v]) => `${JSON.stringify(k)}: ${inline(v)}`).join(', ')} }`;
  }
  return JSON.stringify(value);
}

function block(value: unknown, indent: string, prefix: string): string {
  const one = inline(value);
  const isContainer = value !== null && typeof value === 'object';
  if (!isContainer || indent.length + prefix.length + one.length <= LINE) return one;
  const inner = `${indent}  `;
  if (Array.isArray(value)) {
    return `[\n${value.map((v) => `${inner}${block(v, inner, '')}`).join(',\n')}\n${indent}]`;
  }
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  const lines = entries.map(([k, v]) => {
    const key = `${JSON.stringify(k)}: `;
    return `${inner}${key}${block(v, inner, key)}`;
  });
  return `{\n${lines.join(',\n')}\n${indent}}`;
}

/** The file text (ends with a newline). JSON.parse(contentJson(v)) deep-equals v. */
export const contentJson = (value: unknown): string => `${block(value, '', '')}\n`;

/** 0xf7a8b8 → "#f7a8b8" (colours are written as hex strings in content files). */
export const hexColor = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;
