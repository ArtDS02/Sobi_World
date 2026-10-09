// The seam between the Farm Area's hooks (AreaModule.onEnter / onExit) and its canvas: the canvas
// binds itself here when it is built, and the hooks act on whatever is bound (nothing, in tests).
export interface FarmStage {
  /** The player walked in: the farm scene runs (pigs move, the character appears at the entrance). */
  enter(): void;
  /** The player walked out: the farm scene sleeps (numbers keep running; nothing is drawn or animated). */
  exit(): void;
}

let bound: FarmStage | null = null;

export const bindFarmStage = (stage: FarmStage | null): void => {
  bound = stage;
};

export const farmStage: FarmStage = {
  enter: () => bound?.enter(),
  exit: () => bound?.exit(),
};
