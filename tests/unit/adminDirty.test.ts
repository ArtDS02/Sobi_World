import { describe, expect, it } from 'vitest';
import { dirtyChip, dirtyPages, nextSaveStep, type DirtySource } from '../../tools/admin/dirty';

const src = (page: string, dirty: boolean): DirtySource => ({ page, label: page.toUpperCase(), dirty: () => dirty });

describe('dirty registry (plan 7.1)', () => {
  it('counts and names only the pages with unsaved work', () => {
    const s = [src('users', true), src('content', false), src('layout', true)];
    expect(dirtyPages(s).map((x) => x.page)).toEqual(['users', 'layout']);
    expect(dirtyChip(s)).toBe('● 2 trang chưa lưu: USERS, LAYOUT');
    expect(dirtyChip([src('a', false)])).toBeNull();
  });
  it('Lưu tất cả: species first, then the open page, then the first other dirty page', () => {
    const s = [src('users', true), src('layout', true)];
    expect(nextSaveStep(s, 'users', true)).toEqual({ kind: 'species' });
    expect(nextSaveStep(s, 'layout', false)).toEqual({ kind: 'click' });
    expect(nextSaveStep(s, 'pigs', false)).toEqual({ kind: 'goto', page: 'users' });
    expect(nextSaveStep([src('x', false)], 'x', false)).toBeNull();
  });
});
