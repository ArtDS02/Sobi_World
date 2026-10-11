// Translating the texts that live in content/*.json (names of breeds, NPC dialogue, skills...). The files stay
// Vietnamese; `content/i18n/en.json` maps "<file>" → "<path to the text>" → English, and `localizeRaw` swaps them in
// before the schema checks the file (core/content/load.ts calls it). A text without an entry stays Vietnamese.
//
// A path is made of property names; an array element is named by its `id` when it has one, else by its index.
const DIACRITICS = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

/** Files whose every string in a list is a name or a line to show (no diacritics needed to recognize them). */
const WHOLE_LIST_FILES = new Set(['farm/names.json', 'aquarium/names.json']);

export type ContentTexts = Record<string, Record<string, string>>;

const isTranslatable = (file: string, namedBy: string, text: string): boolean =>
  namedBy.endsWith('Vi') || DIACRITICS.test(text) || WHOLE_LIST_FILES.has(file);

function visit(file: string, node: unknown, path: string[], namedBy: string, fn: (path: string, text: string) => string | void): unknown {
  if (typeof node === 'string') {
    if (!isTranslatable(file, namedBy, node)) return node;
    const out = fn(path.join('/'), node);
    return typeof out === 'string' ? out : node;
  }
  if (Array.isArray(node)) {
    return node.map((item, i) => {
      const id = item !== null && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string' ? (item as { id: string }).id : String(i);
      return visit(file, item, [...path, id], namedBy, fn);
    });
  }
  if (node !== null && typeof node === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node)) {
      // `id` and `artId` style fields are identifiers, never text.
      out[key] = key === 'id' || key.endsWith('Id') ? value : visit(file, value, [...path, key], key, fn);
    }
    return out;
  }
  return node;
}

/** Every translatable text of a content file: path → Vietnamese text. */
export function translatableTexts(file: string, raw: unknown): Map<string, string> {
  const found = new Map<string, string>();
  visit(file, raw, [], '', (path, text) => {
    found.set(path, text);
  });
  return found;
}

/** `raw` with the English texts swapped in; the same object when the file has no entries. */
export function localizeRaw(file: string, raw: unknown, table: ContentTexts): unknown {
  const entries = table[file];
  if (!entries) return raw;
  return visit(file, raw, [], '', (path, text) => entries[path] ?? text);
}
