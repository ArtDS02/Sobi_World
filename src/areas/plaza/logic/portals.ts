// The plaza's doors (spec §3.1): one per Area. A door is open when its Area is built and unlocked;
// otherwise it shows why not — the Area is not built yet, or what it still needs. Pure.
import type { AreaInfo } from '../../../core/area-registry/registry';
import type { UnlockGap } from '../../../core/progression/levels';
import { t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { PLAZA_AREA_ICONS, areaIconId, areaKey } from './art';

export type PortalStatus = 'open' | 'locked' | 'soon';

/** The key of a station (the order board…) among the plaza's doors: stations and Area doors share one set of views. */
export const stationDoorId = (station: string): string => `station:${station}`;

export interface PortalView {
  /** A door to an Area, or a station that opens one of the world's panels. */
  kind: 'door' | 'station';
  /** The `portalInPlaza` id of the layout placement. */
  portal: string;
  areaId: string;
  name: string;
  status: PortalStatus;
  /** What the Area still needs to open, as readable lines (empty when open). */
  conditions: string[];
}

function conditionLine(gap: UnlockGap): string {
  const key = gap.kind === 'worldLevel' ? vi.plaza.needWorldLevel : vi.plaza.needWorldDevelopment;
  return t(key, { need: gap.need, have: gap.have });
}

/** The doors by portal id. */
export function portalViews(infos: readonly AreaInfo[]): Map<string, PortalView> {
  return new Map(
    infos.map((info): [string, PortalView] => [
      info.manifest.portalInPlaza,
      {
        portal: info.manifest.portalInPlaza,
        kind: 'door',
        areaId: info.manifest.id,
        name: info.manifest.name.vi,
        status: info.planned ? 'soon' : info.unlocked ? 'open' : 'locked',
        conditions: info.unlocked ? [] : info.gaps.map(conditionLine),
      },
    ]),
  );
}

/** The plaza's stations: always open, they lead to a panel (`areaId` = `panel:<id>`, see start.ts). */
export function stationViews(): Map<string, PortalView> {
  const station = (key: string, panel: string, name: string): [string, PortalView] => [
    stationDoorId(key),
    { portal: stationDoorId(key), kind: 'station', areaId: `panel:${panel}`, name, status: 'open', conditions: [] },
  ];
  return new Map([station('orders', 'orders', vi.plaza.orderBoard), station('market', 'market', vi.plaza.market)]);
}

export interface PortalPrompt {
  /** What the interact key does; null when the door is closed (the key does nothing). */
  action: string | null;
  /** The headline: the action, or why the door is closed. */
  title: string;
  /** Lines under it: the conditions of a closed door. */
  lines: string[];
}

export function portalPrompt(view: PortalView): PortalPrompt {
  if (view.status === 'open') {
    const text = t(view.kind === 'station' ? vi.plaza.see : vi.plaza.enter, { name: view.name });
    return { action: text, title: text, lines: [] };
  }
  const lines = view.conditions.length > 0 ? [vi.plaza.conditions, ...view.conditions] : [];
  const title = view.status === 'soon' ? `${view.name} — ${vi.plaza.soon}` : t(vi.plaza.locked, { name: view.name });
  return { action: null, title, lines };
}

/** The Areas of the plaza HUD's dock (decision 024), in the owner's mock-up order; a closed one says why in one line. */
export function plazaDoors(
  views: ReadonlyMap<string, PortalView>,
): { areaId: string; key: string; icon: string; name: string; status: PortalStatus; why: string }[] {
  const doors = [...views.values()].filter((v) => v.kind === 'door');
  const rank = (id: string) => {
    const i = (PLAZA_AREA_ICONS as readonly string[]).indexOf(areaKey(id));
    return i < 0 ? PLAZA_AREA_ICONS.length : i;
  };
  return doors
    .sort((a, b) => rank(a.areaId) - rank(b.areaId))
    .map((v) => {
      const prompt = portalPrompt(v);
      const why = v.status === 'open' ? '' : [prompt.title, ...prompt.lines.slice(1)].join(' ');
      return { areaId: v.areaId, key: areaKey(v.areaId), icon: areaIconId(v.areaId), name: v.name, status: v.status, why };
    });
}
