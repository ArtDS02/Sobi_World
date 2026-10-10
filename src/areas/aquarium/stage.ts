// The seam between the Aquarium Area's hooks (AreaModule.onEnter / onExit) and its canvas scene: the app binds the
// scene here when the canvas is built, and the hooks act on whatever is bound (nothing, in tests).
export interface AquariumStage {
  enter(): void;
  exit(): void;
}

let bound: AquariumStage | null = null;

export const bindAquariumStage = (stage: AquariumStage | null): void => {
  bound = stage;
};

export const aquariumStage: AquariumStage = {
  enter: () => bound?.enter(),
  exit: () => bound?.exit(),
};
