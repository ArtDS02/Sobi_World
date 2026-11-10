// Decision 057 (B3): when the "harvest hand" pointer shows, and what the pointer picture is.
import { describe, expect, it } from 'vitest';
import { canHarvest, HARVEST_CURSOR, HARVEST_CURSOR_HOTSPOT, HARVEST_CURSOR_SIZE, harvestHandShown } from '../../src/ui/world/harvestCursor';

describe('harvest hand: when it shows', () => {
  it('a plot can be picked when its crop is ripe, and still when it has wilted', () => {
    expect(canHarvest('ripe')).toBe(true);
    expect(canHarvest('wilted')).toBe(true);
    for (const stage of ['empty', 'growing', null, undefined, '']) expect(canHarvest(stage)).toBe(false);
  });

  it('shows only over something to pick, never while a dialog covers the world or the tier / zone is changing', () => {
    expect(harvestHandShown({ over: true, blocked: false })).toBe(true);
    expect(harvestHandShown({ over: true, blocked: true })).toBe(false);
    expect(harvestHandShown({ over: false, blocked: false })).toBe(false);
    expect(harvestHandShown({ over: false, blocked: true })).toBe(false);
  });
});

describe('harvest hand: the pointer picture', () => {
  it('is an inline SVG no larger than 32 × 32 with its hotspot inside, and falls back to the plain pointer', () => {
    expect(HARVEST_CURSOR_SIZE).toBeLessThanOrEqual(32);
    expect(HARVEST_CURSOR_HOTSPOT.x).toBeGreaterThanOrEqual(0);
    expect(HARVEST_CURSOR_HOTSPOT.x).toBeLessThan(HARVEST_CURSOR_SIZE);
    expect(HARVEST_CURSOR_HOTSPOT.y).toBeGreaterThanOrEqual(0);
    expect(HARVEST_CURSOR_HOTSPOT.y).toBeLessThan(HARVEST_CURSOR_SIZE);
    expect(HARVEST_CURSOR).toMatch(/^url\("data:image\/svg\+xml,[^"]+"\) 10 5, pointer$/);
  });

  it('needs no file and no network: nothing in it points outside the picture itself', () => {
    const svg = decodeURIComponent(HARVEST_CURSOR.slice('url("data:image/svg+xml,'.length, HARVEST_CURSOR.indexOf('")')));
    expect(svg.startsWith('<svg ')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
    expect(svg).toContain('width="32" height="32"');
    // The only URL is the SVG namespace; no href, no image, no script.
    expect(svg.match(/https?:\/\//g)).toEqual(['http://']);
    expect(svg).not.toMatch(/href|<image|<script|<use/);
  });
});
