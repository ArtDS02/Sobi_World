// The seam between the Garden Area's hooks (AreaModule.onEnter / onExit) and its canvas scene: the app binds the
// scene here when the canvas is built, and the hooks act on whatever is bound (nothing, in tests).
export interface GardenStage {
  enter(): void;
  exit(): void;
}

let bound: GardenStage | null = null;

export const bindGardenStage = (stage: GardenStage | null): void => {
  bound = stage;
};

export const gardenStage: GardenStage = {
  enter: () => bound?.enter(),
  exit: () => bound?.exit(),
};
