// The 3D effects of the battle (prototype, decision 059), by the id a script's `vfx3d` act names (VFX3D_IDS of the script schema).
import type { VFX3D_IDS } from '../../../../../../content/schemas/adventure/battleScript';
import { bubbleShot, bubbleSpray } from './bubbles';
import { boulderSmash, quakeSpikes, rockFist, sealQuake, tuskCharge } from './earthFx';
import { lightRay, luminaRay, runeBeam } from './lightFx';
import { callThunder, thunderCommand, thunderRush } from './lightningArea';
import { lightningDive, sparkPeck, thunderStrike } from './lightningFx';
import { chainLightning } from './stormFx';
import { armorBreak, bronzeFist, metalClaw, steelCharge, steelSlash } from './metalFx';
import { steelCavalry } from './metalUlt';
import { curseEyes, nightNet, nightWeave } from './darkArea';
import { inkSpray, nightmare, shadowBite, wraithTouch } from './darkFx';
import { classCombo, classMeteor, classOrb, classRain, classStrike, groundStomp } from './classFx';
import { ultParty } from './partyUlt';
import { buffUp, cleanse, doomMark, healBloom, mpChannel, shieldDome } from './supportFx';
import { voidFist, voidVortex } from './voidFx';
import { mythicAwakening, skyBell } from './voidUlts';
import { flamePillars, lavaFlood, magmaCone, meteorRain } from './fireArea';
import { clawClamp, hammerSlam, jawFlame, lavaGlob } from './fireHits';
import { forgeUlt } from './fireUlts';
import { phoenixRebirth } from './phoenixFx';
import { frostBreath, iceBloom } from './iceFx';
import { corruptBloom, rootBind, rootQuake, thornStorm } from './natureArea';
import { sporeCone, thornVolley, vineWhip } from './natureHits';
import type { Vfx3dFactory } from './stage3d';
import { tridentSea } from './tridentSea';
import { tsunamiSweep } from './tsunami';

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
  sky_bell: skyBell,
  mythic_awakening: mythicAwakening,
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
