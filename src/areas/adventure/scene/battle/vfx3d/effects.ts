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
import { classCombo, classMeteor, classOrb, classRain, classStrike, groundStomp } from './classFx';
import { ultParty } from './partyUlt';
import { buffUp, cleanse, doomMark, healBloom, mpChannel, shieldDome } from './supportFx';
import { voidFist, voidVortex } from './riftFx';
import { dawnMend, mendCross, secondWind, sproutMend, wardMend, waveMend } from './mendFx';
import { auraRegen, blossomRegen, healingRain, purify, tideSong } from './mendArea';
import { doomSigil, mpStream, voidVeil } from './boonSpecial';
import { aimFocus, cheerBurst, focusCharge, forgeFire, phaseShift, windDash } from './boonUp';
import { guidingLamp, howlWave, inkVeil, rallyWave, roarWave, swiftBolt } from './boonTeam';
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
  heal_bloom: healBloom,
  buff_up: buffUp,
  shield_dome: shieldDome,
  cleanse,
  mp_channel: mpChannel,
  doom_mark: doomMark,
  ground_stomp: groundStomp,
  class_strike: classStrike,
  class_combo: classCombo,
  class_orb: classOrb,
  class_rain: classRain,
  class_meteor: classMeteor,
  ult_party: ultParty,
};
