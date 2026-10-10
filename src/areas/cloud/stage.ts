// The seam between the Cloud Area's hooks (AreaModule.onEnter / onExit) and its canvas scene: the app binds the scene
// here when the canvas is built, and the hooks act on whatever is bound (nothing, in tests).
export interface CloudStage {
  enter(): void;
  exit(): void;
}

let bound: CloudStage | null = null;

export const bindCloudStage = (stage: CloudStage | null): void => {
  bound = stage;
};

export const cloudStage: CloudStage = {
  enter: () => bound?.enter(),
  exit: () => bound?.exit(),
};
