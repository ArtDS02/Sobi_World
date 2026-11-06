// systems/animation (decision 050): the puppet runtime shared by every Area — clips, beat warping, the life layer (breath, blink,
// springs, chain waves), the performer state machine and the skeleton solve. Pure; the Phaser drawing lives in src/ui/puppet/.
export { clipTime, EASE, mixPose, sampleClip, sampleFaces, sampleTrack, type Local, type LocalPose } from './clip';
export { blinkAt, hashOf, noise } from './life';
export { FALLBACK, Performer, type Frame, type Want } from './performer';
export { RIGS, rigImages, rigOf } from './rigs';
export type { BodyPlan, ClipData, RigData } from '../../../content/schemas/anim/rig';
export { buildSkin, deformSkin, type SkinMesh } from './skin';
export { solve, waveBend, type Drawn, type DrawnChain, type DrawnPart, type World } from './skeleton';
export { warpPairs, warpTime, type ActionTiming } from './warp';
