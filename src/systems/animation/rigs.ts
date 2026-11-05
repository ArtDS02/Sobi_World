// The puppets of the game (decision 050), read from content/anim/rigs/*.json and checked once. A creature whose art id has a rig is
// drawn as a puppet (body parts, bones, clips); every other creature keeps its pictures (key poses + tween) until its rig is made.
import { rigProblems, rigSchema, type RigData } from '../../../content/schemas/anim/rig';
import fishBetta from '../../../content/anim/rigs/fish_betta.json';
import octopus from '../../../content/anim/rigs/octopus.json';
import pigBoar from '../../../content/anim/rigs/pig_boar.json';
import pigTurtle from '../../../content/anim/rigs/pig_turtle.json';

const RAW: readonly unknown[] = [pigBoar, pigTurtle, fishBetta, octopus];

function load(): ReadonlyMap<string, RigData> {
  const out = new Map<string, RigData>();
  for (const raw of RAW) {
    const r = rigSchema.parse(raw);
    const problems = rigProblems(r);
    if (problems.length > 0) throw new Error(`rig ${r.id}:\n${problems.join('\n')}`);
    out.set(r.id, r);
  }
  return out;
}

export const RIGS: ReadonlyMap<string, RigData> = load();

/** The rig of a creature's art id (`pig_boar`, `fish_betta`…), or null while it has none. */
export const rigOf = (art: string): RigData | null => RIGS.get(art) ?? null;

/** Every picture a rig draws (manifest ids), for loading them before it first appears. */
export const rigImages = (r: RigData): string[] => Object.values(r.parts).map((p) => p.img);
