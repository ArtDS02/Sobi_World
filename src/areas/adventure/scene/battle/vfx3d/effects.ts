// The 3D effects of the battle (prototype, decision 059), by the id a script's `vfx3d` act names (VFX3D_IDS of the script schema).
import type { VFX3D_IDS } from '../../../../../../content/schemas/adventure/battleScript';
import { boulderSmash, quakeSpikes, rockFist, tuskCharge } from './stoneFx';
import { sealQuake } from './stoneSeal';
import { lightRay, luminaRay, runeBeam } from './glowFx';
import { callThunder, thunderCommand, thunderRush } from './stormArea';
import { chainLightning, lightningDive, sparkPeck, thunderStrike } from './stormFx';
import { bronzeFist } from './steelFist';
import { armorBreak, metalClaw, steelCharge, steelSlash } from './steelFx';
import { steelCavalry } from './steelUlt';
import { curseEyes, nightNet, nightWeave } from './shadeArea';
import { inkSpray, nightmare, shadowBite, wraithTouch } from './shadeFx';
import { voidFist, voidVortex } from './riftFx';
import { dawnMend, mendCross, secondWind, sproutMend, wardMend, waveMend } from './mendFx';
import { auraRegen, blossomRegen, healingRain, purify, tideSong } from './mendArea';
import { doomSigil, mpStream, voidVeil } from './boonSpecial';
import { aimFocus, cheerBurst, focusCharge, forgeFire, phaseShift, windDash } from './boonUp';
import { guidingLamp, howlWave, inkVeil, rallyWave, roarWave, swiftBolt } from './boonTeam';
import { barkSkin, bronzeWall, fortress, holdFast, ironShell, stoneSkin, tauntCall } from './guardFx';
import { mountainShell, shieldWall, stoneGuard, undyingSpark } from './guardTeam';
import { armorCrush, comboSlash, finisherX, powerCleave, rendTear, vitalPierce } from './classHit';
import { energyOrb, sealStamp, spellLance } from './classCast';
import { elementRain, shadowDance, spellStorm, starFall, stompQuake, tremorHeave } from './classArea';
import { holyMountain, moonLanterns, motherForest, oceanSong } from './supportUlts';
import { dawnSpears, glareFlash, haloBurst, prismLance, prismSplit } from './glowExtra';
import { nullGaze, nullWard, riftPulse, voidDrain, voidStars } from './riftExtra';
import { greatWhirlpool, risingTide, tideSlap, whirlpoolRow } from './waterExtra';
import { ironOath, shieldBash, spikeBarrage, spikeRain } from './steelExtra';
import { boulderRoll, boulderToss, dustCloud, sandVeil } from './stoneExtra';
import { mythicAwakening, skyBellUlt } from './riftUlts';
import { flamePillars, lavaFlood, magmaCone, meteorRain } from './fireArea';
import { clawClamp, hammerSlam, jawFlame, lavaGlob } from './fireHits';
import { forgeUlt } from './fireUlts';
import { phoenixRebirth } from './phoenixFx';
import { frostBreath, iceBloom } from './frostFx';
import { corruptBloom, rootBind, rootQuake, thornStorm } from './plantArea';
import { sporeCone, thornVolley, vineWhip } from './plantHits';
import type { Vfx3dFactory } from './stage3d';
import { tridentSea } from './tridentSea';
import { bubbleShot, bubbleSpray, tsunamiSweep } from './waterFx';

export const VFX3D: Record<(typeof VFX3D_IDS)[number], Vfx3dFactory> = {
  trident_sea: tridentSea,
  bubble_shot: bubbleShot,
  bubble_spray: bubbleSpray,
  tsunami_sweep: tsunamiSweep,
  ice_bloom: iceBloom,
  frost_breath: frostBreath,
  claw_clamp: clawClamp,
  jaw_flame: jawFlame,
  hammer_slam: hammerSlam,
  lava_glob: lavaGlob,
  lava_flood: lavaFlood,
  magma_cone: magmaCone,
  meteor_rain: meteorRain,
  flame_pillars: flamePillars,
  forge_ult: forgeUlt,
  phoenix_rebirth: phoenixRebirth,
  thorn_volley: thornVolley,
  vine_whip: vineWhip,
  spore_cone: sporeCone,
  root_bind: rootBind,
  root_quake: rootQuake,
  corrupt_bloom: corruptBloom,
  thorn_storm: thornStorm,
  boulder_smash: boulderSmash,
  quake_spikes: quakeSpikes,
  tusk_charge: tuskCharge,
  rock_fist: rockFist,
  seal_quake: sealQuake,
  steel_slash: steelSlash,
  armor_break: armorBreak,
  steel_charge: steelCharge,
  steel_cavalry: steelCavalry,
  metal_claw: metalClaw,
  bronze_fist: bronzeFist,
  thunder_strike: thunderStrike,
  chain_lightning: chainLightning,
  call_thunder: callThunder,
  thunder_command: thunderCommand,
  spark_peck: sparkPeck,
  lightning_dive: lightningDive,
  thunder_rush: thunderRush,
  light_ray: lightRay,
  lumina_ray: luminaRay,
  rune_beam: runeBeam,
  ink_spray: inkSpray,
  night_net: nightNet,
  nightmare,
  night_weave: nightWeave,
  shadow_bite: shadowBite,
  wraith_touch: wraithTouch,
  curse_eyes: curseEyes,
  void_fist: voidFist,
  void_vortex: voidVortex,
  sky_bell: skyBellUlt,
  mythic_awakening: mythicAwakening,
  wave_mend: waveMend,
  dawn_mend: dawnMend,
  sprout_mend: sproutMend,
  mend_cross: mendCross,
  second_wind: secondWind,
  ward_mend: wardMend,
  tide_song: tideSong,
  blossom_regen: blossomRegen,
  healing_rain: healingRain,
  aura_regen: auraRegen,
  purify,
  mp_stream: mpStream,
  doom_sigil: doomSigil,
  void_veil: voidVeil,
  ink_veil: inkVeil,
  guiding_lamp: guidingLamp,
  swift_bolt: swiftBolt,
  forge_fire: forgeFire,
  phase_shift: phaseShift,
  aim_focus: aimFocus,
  wind_dash: windDash,
  focus_charge: focusCharge,
  cheer_burst: cheerBurst,
  rally_wave: rallyWave,
  howl_wave: howlWave,
  roar_wave: roarWave,
  stone_skin: stoneSkin,
  bronze_wall: bronzeWall,
  iron_shell: ironShell,
  taunt_call: tauntCall,
  hold_fast: holdFast,
  fortress,
  bark_skin: barkSkin,
  mountain_shell: mountainShell,
  shield_wall: shieldWall,
  stone_guard: stoneGuard,
  undying_spark: undyingSpark,
  power_cleave: powerCleave,
  armor_crush: armorCrush,
  rend_tear: rendTear,
  vital_pierce: vitalPierce,
  finisher_x: finisherX,
  combo_slash: comboSlash,
  spell_lance: spellLance,
  seal_stamp: sealStamp,
  energy_orb: energyOrb,
  shadow_dance: shadowDance,
  stomp_quake: stompQuake,
  tremor_heave: tremorHeave,
  element_rain: elementRain,
  spell_storm: spellStorm,
  star_fall: starFall,
  ocean_song: oceanSong,
  holy_mountain: holyMountain,
  moon_lanterns: moonLanterns,
  mother_forest: motherForest,
  glare_flash: glareFlash,
  halo_burst: haloBurst,
  prism_lance: prismLance,
  prism_split: prismSplit,
  dawn_spears: dawnSpears,
  void_drain: voidDrain,
  rift_pulse: riftPulse,
  null_gaze: nullGaze,
  void_stars: voidStars,
  null_ward: nullWard,
  tide_slap: tideSlap,
  whirlpool_row: whirlpoolRow,
  great_whirlpool: greatWhirlpool,
  rising_tide: risingTide,
  shield_bash: shieldBash,
  spike_rain: spikeRain,
  spike_barrage: spikeBarrage,
  iron_oath: ironOath,
  boulder_toss: boulderToss,
  sand_veil: sandVeil,
  boulder_roll: boulderRoll,
  dust_cloud: dustCloud,
};
