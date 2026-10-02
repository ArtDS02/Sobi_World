// Farm camera (responsive layout): the whole 1600×900 design frame is always visible (fit, nothing
// is cropped), centred; the rest of the screen shows more world around it — the painted backdrop
// is drawn over that wider view (FARM_VIEW.VIEW_MAX_EXTEND caps it). Pure.
export interface WorldRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function farmCamera(
  stageW: number,
  stageH: number,
  designW: number,
  designH: number,
): { zoom: number; view: WorldRect } {
  const zoom = Math.max(1e-6, Math.min(stageW / designW, stageH / designH));
  const width = stageW / zoom;
  const height = stageH / zoom;
  return {
    zoom,
    view: { x: (designW - width) / 2, y: (designH - height) / 2, width, height },
  };
}

/** The view grown to whole pixels and capped at `maxExtend` × the design size per axis. */
export function backdropRect(
  view: WorldRect,
  designW: number,
  designH: number,
  maxExtend: number,
): WorldRect {
  const width = Math.ceil(Math.min(view.width, designW * maxExtend)) + 2;
  const height = Math.ceil(Math.min(view.height, designH * maxExtend)) + 2;
  return {
    x: Math.floor((designW - width) / 2),
    y: Math.floor((designH - height) / 2),
    width,
    height,
  };
}
