// Farm frame on screen (farm layout rework): the fixed design frame is scaled to cover the stage,
// but never cropped by more than `maxCrop.x` of its width (centred) or `maxCrop.y` of its height —
// past that it letterboxes. A vertical crop comes off the bottom: the back row of buildings sits
// right under the HUD pills and must stay clear of them. Pure.
export interface StageBox {
  width: number;
  height: number;
  left: number;
  top: number;
}

export function stageFit(
  stageW: number,
  stageH: number,
  designW: number,
  designH: number,
  maxCrop: { x: number; y: number },
): StageBox {
  const cover = Math.max(stageW / designW, stageH / designH);
  const limit = Math.min(
    stageW / (designW * (1 - maxCrop.x)),
    stageH / (designH * (1 - maxCrop.y)),
  );
  const scale = Math.min(cover, limit);
  const width = designW * scale;
  const height = designH * scale;
  return {
    width,
    height,
    left: (stageW - width) / 2,
    top: height > stageH ? 0 : (stageH - height) / 2,
  };
}
