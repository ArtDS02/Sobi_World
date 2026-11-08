// Admin plan step 3: sidebar preferences, quick-search matching, shortcut helpers (pure parts).
import { describe, expect, it } from 'vitest';
import { isFolded, readPrefs, setAll, toggleGroup, writePrefs } from '../../tools/admin/navState';
import { contentEntries, search, type SearchEntry } from '../../tools/admin/quickSearch';

const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};

describe('nav preferences', () => {
  it('round-trips, tolerates garbage and a throwing storage', () => {
    const s = mem();
    expect(readPrefs(s)).toEqual({ collapsed: [], icons: false });
    writePrefs({ collapsed: ['Sobi Farm'], icons: true }, s);
    expect(readPrefs(s)).toEqual({ collapsed: ['Sobi Farm'], icons: true });
    s.setItem('sobi-admin-nav-v1', '{nope');
    expect(readPrefs(s)).toEqual({ collapsed: [], icons: false });
    const bad = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(readPrefs(bad)).toEqual({ collapsed: [], icons: false });
    expect(() => writePrefs({ collapsed: [], icons: false }, bad)).not.toThrow();
  });

  it('a folded group opens itself when it holds the open page; toggle and fold/open all', () => {
    const p = { collapsed: ['A'], icons: false };
    expect(isFolded('A', p, false)).toBe(true);
    expect(isFolded('A', p, true)).toBe(false);
    expect(isFolded('B', p, false)).toBe(false);
    expect(toggleGroup(p, 'A').collapsed).toEqual([]);
    expect(toggleGroup(p, 'B').collapsed).toEqual(['A', 'B']);
    expect(setAll(p, ['A', 'B', 'C'], true).collapsed).toEqual(['A', 'B', 'C']);
    expect(setAll(p, ['A', 'B'], false).collapsed).toEqual([]);
  });
});

describe('quick search', () => {
  const entries: SearchEntry[] = [
    { label: '🐷 Giống heo', sub: 'Trang', href: '#/pigs', kind: 'page' },
    { label: 'Đá Tảng', sub: 'enemy_rock · adventure/enemies.json', href: '#/content/adventure%2Fenemies.json', kind: 'content' },
    { label: 'Đòn Sấm Sét', sub: 'skill_thunder · adventure/skills.json', href: '#/content/adventure%2Fskills.json', kind: 'content' },
  ];
  it('ignores accents and case, needs every word, finds ids', () => {
    expect(search(entries, 'giong heo').map((e) => e.href)).toEqual(['#/pigs']);
    expect(search(entries, 'da tang').map((e) => e.label)).toEqual(['Đá Tảng']);
    expect(search(entries, 'skill_thunder')).toHaveLength(1);
    expect(search(entries, 'zzz')).toEqual([]);
  });
  it('an empty query lists the pages; label matches rank before id matches', () => {
    expect(search(entries, '').every((e) => e.kind === 'page')).toBe(true);
    const e2: SearchEntry[] = [
      { label: 'Cá', sub: 'x_da · f', href: '#a', kind: 'content' },
      { label: 'Da', sub: 'y · f', href: '#b', kind: 'content' },
    ];
    expect(search(e2, 'da')[0]!.href).toBe('#b');
  });
  it('indexes id + name rows of any content file', () => {
    const rows = contentEntries({ 'a/b.json': { items: [{ id: 'i1', name: { vi: 'Một' } }, { id: 'i2', nameVi: 'Hai' }, { id: 'i3' }, { name: 'no id' }], other: 5 } });
    expect(rows.map((r) => r.label)).toEqual(['Một', 'Hai']);
    expect(rows[0]!.href).toBe('#/content/a%2Fb.json');
  });
});
