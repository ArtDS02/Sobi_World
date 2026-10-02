import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { replaceDayNightBlock } from '../../scripts/admin/dayNightText';
import { DAY_NIGHT } from '../../src/core/config/dayNight';

describe('admin day / night block (DN)', () => {
  it('rewrites only the marked block and round-trips the shipped file', () => {
    const text = readFileSync('src/core/config/dayNight.ts', 'utf8');
    expect(replaceDayNightBlock(text, DAY_NIGHT)).toBe(text);
    const next = replaceDayNightBlock(text, { ...DAY_NIGHT, enabled: false, blendMinutes: 30 });
    expect(next).toContain('enabled: false,');
    expect(next).toContain('blendMinutes: 30,');
    expect(next.replace(/\/\/ <admin:dayNight>[\s\S]*\/\/ <\/admin:dayNight>/, '')).toBe(
      text.replace(/\/\/ <admin:dayNight>[\s\S]*\/\/ <\/admin:dayNight>/, ''),
    );
    expect(() => replaceDayNightBlock('no markers', DAY_NIGHT)).toThrow();
  });
});
