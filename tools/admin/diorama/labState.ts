// A plain scene state for the diorama lab: every group awake, every chest shut, gates shut, a team of three pigs. The lab has no game
// behind it; this is what the game would hand the view.
import { ENEMIES, type AreaMap } from '../../../src/areas/adventure/logic/config/content';
import type { AdventureSceneState, SceneGroup } from '../../../src/areas/adventure/scene/sceneState';

const SIZE: Record<string, number> = { normal: 1.7, elite: 2.3, mutant: 2.0, subboss: 2.6, boss: 3.2, special: 2.2 };

/** Team shown in the lab (art ids from the manifest). */
export const LAB_TEAM = ['pig_knight', 'pig_ninja', 'pig_robot'];

export function labGroups(map: AreaMap): SceneGroup[] {
  return map.groups.map((gr) => ({
    id: gr.id,
    kind: gr.kind ?? 'normal',
    size: SIZE[gr.kind ?? 'normal'] ?? 1.7,
    corruption: 0,
    asleep: false,
    disguised: false,
    title: null,
    art: ENEMIES[gr.pool[0]?.enemies[0] ?? '']?.art ?? '',
    elements: [],
    count: 1,
    defeated: false,
    affix: null,
  }));
}

export function labState(map: AreaMap): AdventureSceneState {
  return {
    mode: 'explore',
    mapId: map.id,
    placeKey: `lab:${map.id}`,
    pos: { x: 0, y: 0, facing: 'down' },
    leader: 'so',
    followers: LAB_TEAM.map((art) => ({ art, down: false })),
    groups: labGroups(map),
    exits: map.exits.map((e) => ({ id: e.id, open: true, lock: null, forward: true })),
    openedGates: [],
    openedChests: [],
    litPuzzles: [],
    corruption: 0,
    foundSecrets: [],
    usedSpots: [],
    springUsed: false,
    portalLit: false,
    now: 0,
    graceUntil: 0,
    sky: 'day',
    backdrop: '',
    paused: false,
  };
}
