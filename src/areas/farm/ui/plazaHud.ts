// What the plaza HUD needs beyond the farm's own state (decision 024): the world level, the dock's Areas and whether
// the new art of batch world-01-scene is in.
import { WORLD_LEVELS } from '../../../core/config/progression';
import { levelProgress, worldXp } from '../../../core/progression/levels';
import type { AppOptions, PlazaLevel } from './appTypes';
import type { HudDeps } from './components/hud';

export function plazaHud(opts: AppOptions, toast: (message: string) => void): NonNullable<HudDeps['plaza']> {
  const world = opts.world?.save() ?? null;
  let level: PlazaLevel | null = null;
  if (world) {
    const xp = worldXp(world);
    const p = levelProgress(xp, WORLD_LEVELS);
    level = { level: p.level, xp, next: p.next, percent: p.percent };
  }
  return {
    level,
    doors: opts.plaza?.doors() ?? [],
    hasArt: (id) => {
      const entry = opts.assets?.resolve(id);
      return entry !== undefined && entry.status !== 'placeholder';
    },
    door: (door) => {
      if (door.status === 'open') return opts.goPlace?.(door.areaId);
      opts.plaza?.denied();
      if (door.why) toast(door.why);
    },
  };
}
