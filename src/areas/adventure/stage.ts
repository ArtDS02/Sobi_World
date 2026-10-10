// The seam between the Adventure Area's hooks (AreaModule.onEnter / onExit) and its canvas scene: the app binds the scene
// here when the canvas is built, and the hooks act on whatever is bound (nothing, in tests).
export interface AdventureStage {
  enter(): void;
  exit(): void;
}

let bound: AdventureStage | null = null;

export const bindAdventureStage = (stage: AdventureStage | null): void => {
  bound = stage;
};

export const adventureStage: AdventureStage = {
  enter: () => bound?.enter(),
  exit: () => bound?.exit(),
};
