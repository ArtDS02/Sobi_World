// The puppets of the game (decision 050), read from content/anim/rigs/*.json and checked once. A creature whose art id has a rig is
// drawn as a puppet (body parts, bones, clips); every other creature keeps its pictures (key poses + tween) until its rig is made.
import { rigProblems, rigSchema, type RigData } from '../../../content/schemas/anim/rig';
import enemyAncientGuardian from '../../../content/anim/rigs/enemy_ancient_guardian.json';
import enemyBrambleBoar from '../../../content/anim/rigs/enemy_bramble_boar.json';
import enemyCliffHawk from '../../../content/anim/rigs/enemy_cliff_hawk.json';
import enemyDewFrog from '../../../content/anim/rigs/enemy_dew_frog.json';
import enemyEmberFox from '../../../content/anim/rigs/enemy_ember_fox.json';
import enemyEmberIdol from '../../../content/anim/rigs/enemy_ember_idol.json';
import enemyForestWolf from '../../../content/anim/rigs/enemy_forest_wolf.json';
import enemyGaleSparrow from '../../../content/anim/rigs/enemy_gale_sparrow.json';
import enemyLavaNewt from '../../../content/anim/rigs/enemy_lava_newt.json';
import enemyMagmaDrake from '../../../content/anim/rigs/enemy_magma_drake.json';
import enemyMossling from '../../../content/anim/rigs/enemy_mossling.json';
import enemyOldTreant from '../../../content/anim/rigs/enemy_old_treant.json';
import enemyOreGolem from '../../../content/anim/rigs/enemy_ore_golem.json';
import enemyRockBeetle from '../../../content/anim/rigs/enemy_rock_beetle.json';
import enemyRuneWisp from '../../../content/anim/rigs/enemy_rune_wisp.json';
import enemyShadowPriest from '../../../content/anim/rigs/enemy_shadow_priest.json';
import enemySnowGoat from '../../../content/anim/rigs/enemy_snow_goat.json';
import enemyStoneSentinel from '../../../content/anim/rigs/enemy_stone_sentinel.json';
import enemyThornSprout from '../../../content/anim/rigs/enemy_thorn_sprout.json';
import enemyThunderRam from '../../../content/anim/rigs/enemy_thunder_ram.json';
import enemyTideWraith from '../../../content/anim/rigs/enemy_tide_wraith.json';
import enemyWolfAlpha from '../../../content/anim/rigs/enemy_wolf_alpha.json';
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

const RAW: readonly unknown[] = [enemyAncientGuardian, enemyBrambleBoar, enemyCliffHawk, enemyDewFrog, enemyEmberFox, enemyEmberIdol, enemyForestWolf, enemyGaleSparrow, enemyLavaNewt, enemyMagmaDrake, enemyMossling, enemyOldTreant, enemyOreGolem, enemyRockBeetle, enemyRuneWisp, enemyShadowPriest, enemySnowGoat, enemyStoneSentinel, enemyThornSprout, enemyThunderRam, enemyTideWraith, enemyWolfAlpha, fishBetta, fishPufferfish, octopus, pigBoar, pigCrystal, pigDragon, pigGalaxy, pigHedgehog, pigKnight, pigNinja, pigPhoenix, pigPirate, pigPoseidon, pigRobot, pigSamurai, pigSunflower, pigThienlong, pigTiger, pigTurtle, pigUnicorn, pigValkyrie, pigVampire];

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
