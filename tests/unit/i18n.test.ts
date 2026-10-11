// GĐ13: the English string table matches the Vietnamese one (same keys, same {placeholders}), the content texts
// have an English entry each, and choosing a language swaps the shared table in place.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import enContent from '../../content/i18n/en.json';
import { loadContent, setContentLocalizer } from '../../src/core/content/load';
import { localizeRaw, translatableTexts, type ContentTexts } from '../../src/i18n/contentText';
import { en } from '../../src/i18n/en';
import { applyLanguage } from '../../src/i18n/language';
import { currentLocale } from '../../src/i18n/locale';
import { vi } from '../../src/i18n/vi';

const DIACRITICS = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const PLACEHOLDER = /\{(\w+)\}/g;

interface Leaf {
  path: string;
  text: string;
}

function leaves(node: unknown, path: string): Leaf[] {
  if (typeof node === 'string') return [{ path, text: node }];
  if (Array.isArray(node)) return node.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (node !== null && typeof node === 'object') {
    return Object.entries(node).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  }
  return [];
}

const placeholders = (text: string): string[] => [...text.matchAll(PLACEHOLDER)].map((m) => m[1] ?? '').sort();

describe('English string table', () => {
  const viLeaves = leaves(vi, '');
  const enByPath = new Map(leaves(en, '').map((l) => [l.path, l.text]));

  it('has exactly the keys of the Vietnamese table', () => {
    expect([...enByPath.keys()].sort()).toEqual(viLeaves.map((l) => l.path).sort());
  });

  it('keeps the {placeholders} of every string', () => {
    const bad = viLeaves.filter((l) => placeholders(l.text).join() !== placeholders(enByPath.get(l.path) ?? '').join());
    expect(bad.map((l) => l.path)).toEqual([]);
  });

  it('is English: no Vietnamese letters (except the language names)', () => {
    const vietnamese = leaves(en, '')
      .filter((l) => DIACRITICS.test(l.text) && l.path !== 'settings.languages.vi')
      .map((l) => l.path);
    expect(vietnamese).toEqual([]);
  });

  it('has no empty text where Vietnamese has some', () => {
    const empty = viLeaves.filter((l) => l.text !== '' && (enByPath.get(l.path) ?? '') === '').map((l) => l.path);
    expect(empty).toEqual([]);
  });
});

describe('choosing a language', () => {
  afterEach(() => applyLanguage('vi'));

  it('swaps the shared table in place and back', () => {
    const farmName = vi.nav.farm;
    applyLanguage('en');
    expect(vi.nav.farm).toBe('Farm');
    expect(vi.desktop.loadingTips).toHaveLength(en.desktop.loadingTips.length);
    expect(currentLocale()).toBe('en-US');
    applyLanguage('vi');
    expect(vi.nav.farm).toBe(farmName);
    expect(currentLocale()).toBe('vi-VN');
  });
});

describe('content texts', () => {
  const root = join(__dirname, '..', '..', 'content');
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        if (name !== 'schemas' && name !== 'i18n') walk(full);
      } else if (name.endsWith('.json')) files.push(relative(root, full).split(sep).join('/'));
    }
  };
  walk(root);
  const table = enContent as ContentTexts;
  const rawOf = (file: string): unknown => JSON.parse(readFileSync(join(root, file), 'utf8'));

  it('every translatable text has an English entry, and every entry points at a real text', () => {
    const missing: string[] = [];
    const stale: string[] = [];
    for (const file of files) {
      const texts = translatableTexts(file, rawOf(file));
      for (const path of texts.keys()) if (!table[file]?.[path]) missing.push(`${file} ${path}`);
      for (const path of Object.keys(table[file] ?? {})) if (!texts.has(path)) stale.push(`${file} ${path}`);
    }
    for (const file of Object.keys(table)) if (!files.includes(file)) stale.push(file);
    expect(missing).toEqual([]);
    expect(stale).toEqual([]);
  });

  it('keeps the {placeholders} of every text', () => {
    const bad: string[] = [];
    for (const file of files) {
      for (const [path, text] of translatableTexts(file, rawOf(file))) {
        if (placeholders(text).join() !== placeholders(table[file]?.[path] ?? '').join()) bad.push(`${file} ${path}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('is English: no Vietnamese letters in an entry', () => {
    const vietnamese = Object.entries(table).flatMap(([file, entries]) =>
      Object.entries(entries)
        .filter(([, text]) => DIACRITICS.test(text))
        .map(([path]) => `${file} ${path}`),
    );
    expect(vietnamese).toEqual([]);
  });

  it('only changes strings: the shape of every file stays the same', () => {
    const shape = (node: unknown): unknown =>
      Array.isArray(node)
        ? node.map(shape)
        : node !== null && typeof node === 'object'
          ? Object.fromEntries(Object.entries(node).map(([k, v]) => [k, shape(v)]))
          : typeof node;
    for (const file of files) {
      const raw = rawOf(file);
      expect(shape(localizeRaw(file, raw, table)), file).toEqual(shape(raw));
    }
  });

  it('loadContent applies the localizer before the schema check', () => {
    const schema = z.object({ products: z.array(z.object({ id: z.string(), nameVi: z.string() }).passthrough()) }).passthrough();
    setContentLocalizer((file, raw) => localizeRaw(file, raw, table));
    try {
      const got = loadContent('shared/shop.json', schema, rawOf('shared/shop.json'));
      expect(got.products[0]?.nameVi).toBe('Food');
    } finally {
      setContentLocalizer(null);
    }
  });
});
