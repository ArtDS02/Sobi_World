// The puppets of the game (decision 050), read from content/anim/rigs/*.json and checked once. A creature whose art id has a rig is
// drawn as a puppet (body parts, bones, clips); every other creature keeps its pictures (key poses + tween) until its rig is made.
import { rigProblems, rigSchema, type RigData } from '../../../content/schemas/anim/rig';
import fishBetta from '../../../content/anim/rigs/fish_betta.json';
import fishPufferfish from '../../../content/anim/rigs/fish_pufferfish.json';
import octopus from '../../../content/anim/rigs/octopus.json';
import pigBoar from '../../../content/anim/rigs/pig_boar.json';
import pigCrystal from '../../../content/anim/rigs/pig_crystal.json';
import pigDragon from '../../../content/anim/rigs/pig_dragon.json';
import pigGalaxy from '../../../content/anim/rigs/pig_galaxy.json';
import pigHedgehog from '../../../content/anim/rigs/pig_hedgehog.json';
import pigKnight from '../../../content/anim/rigs/pig_knight.json';
import pigNinja from '../../../content/anim/rigs/pig_ninja.json';
import pigPhoenix from '../../../content/anim/rigs/pig_phoenix.json';
import pigPirate from '../../../content/anim/rigs/pig_pirate.json';
import pigPoseidon from '../../../content/anim/rigs/pig_poseidon.json';
import pigRobot from '../../../content/anim/rigs/pig_robot.json';
import pigSamurai from '../../../content/anim/rigs/pig_samurai.json';
import pigSunflower from '../../../content/anim/rigs/pig_sunflower.json';
import pigThienlong from '../../../content/anim/rigs/pig_thienlong.json';
import pigTiger from '../../../content/anim/rigs/pig_tiger.json';
import pigTurtle from '../../../content/anim/rigs/pig_turtle.json';
import pigUnicorn from '../../../content/anim/rigs/pig_unicorn.json';
import pigValkyrie from '../../../content/anim/rigs/pig_valkyrie.json';
import pigVampire from '../../../content/anim/rigs/pig_vampire.json';

const RAW: readonly unknown[] = [fishBetta, fishPufferfish, octopus, pigBoar, pigCrystal, pigDragon, pigGalaxy, pigHedgehog, pigKnight, pigNinja, pigPhoenix, pigPirate, pigPoseidon, pigRobot, pigSamurai, pigSunflower, pigThienlong, pigTiger, pigTurtle, pigUnicorn, pigValkyrie, pigVampire];

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
