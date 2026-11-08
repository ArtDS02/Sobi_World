import { describe, expect, it } from 'vitest';
import { applyCsv, csvColumns, parseCsv, toCsv } from '../../tools/admin/contentCsv';

const rows = [
  { id: 'a', price: 10, stats: { hp: 5, atk: 2 }, name: 'Cỏ, xanh', tags: ['x'], on: true },
  { id: 'b', price: 7, stats: { hp: 9, atk: 1 }, name: 'He said "hi"', tags: [], on: false },
];

describe('content CSV (plan 8.4)', () => {
  it('exports flat fields with id first, nested numbers as a.b, arrays left out, quotes escaped', () => {
    expect(csvColumns(rows)).toEqual(['id', 'price', 'stats.hp', 'stats.atk', 'name', 'on']);
    const csv = toCsv(rows);
    expect(csv.split('\n')[0]).toBe('id,price,stats.hp,stats.atk,name,on');
    expect(csv).toContain('"Cỏ, xanh"');
    expect(csv).toContain('"He said ""hi"""');
  });
  it('parses quotes, commas and newlines inside cells, CRLF and a BOM', () => {
    expect(parseCsv('a,b\r\n"x,1","l1\nl2"\r\n')).toEqual([['a', 'b'], ['x,1', 'l1\nl2']]);
    expect(parseCsv('﻿id,n\n1,2')).toEqual([['id', 'n'], ['1', '2']]);
  });
  it('a round trip changes nothing', () => {
    const r = applyCsv(rows, toCsv(rows));
    expect(r.errors).toEqual([]);
    expect(r.changed).toBe(0);
    expect(r.added).toBe(0);
    expect(r.rows).toEqual(rows);
  });
  it('a field some rows do not have stays absent after a round trip (an empty cell creates nothing)', () => {
    const mixed = [{ id: 'a', n: 1, extra: 5 }, { id: 'b', n: 2 }];
    const r = applyCsv(mixed, toCsv(mixed));
    expect(r.changed).toBe(0);
    expect(r.rows).toEqual(mixed);
    expect('extra' in r.rows[1]!).toBe(false);
  });
  it('edits cells of existing rows keeping their types, leaves arrays alone, appends new ids', () => {
    const csv = 'id,price,stats.hp,on,name\na,12,6,false,Cỏ\nc,3,1,true,Mới\n';
    const r = applyCsv(rows, csv);
    expect(r.errors).toEqual([]);
    expect(r.changed).toBe(1);
    expect(r.added).toBe(1);
    expect(r.rows[0]).toMatchObject({ id: 'a', price: 12, stats: { hp: 6, atk: 2 }, on: false, name: 'Cỏ', tags: ['x'] });
    expect(r.rows[1]).toEqual(rows[1]);
    expect(r.rows[2]).toEqual({ id: 'c', price: 3, stats: { hp: 1 }, on: true, name: 'Mới' });
  });
  it('refuses a file without an id column, a row without id, and a bad number', () => {
    expect(applyCsv(rows, 'price\n1\n').errors[0]).toContain('id');
    expect(applyCsv(rows, 'id,price\n,5\n').errors[0]).toContain('thiếu id');
    expect(applyCsv(rows, 'id,price\na,abc\n').errors[0]).toContain('không phải số');
  });
});
