// What the app shell takes from main.ts and gives back (spec §4: main.ts is the composition root).
import type { AssetRegistry } from '../core/assets/registry';
import type { GameEvent } from '../core/events';
import type { FileDialogs } from '../core/save/port';

export interface AppOptions {
  /** Dev-only toolbar (time travel), injected by main.ts behind import.meta.env.DEV. */
  devTools?: HTMLElement;
  /** Platform export/import dialogs (§9.3). */
  dialogs?: FileDialogs;
  /** The platform has a save folder to open (desktop). */
  saveFolder?: boolean;
  /** Validated asset manifest (§11.4); the farm canvas and thumbnails resolve ids here. */
  assets?: AssetRegistry;
  /** A pig was clicked (main.ts routes it to the FeedbackDirector for the tap sound, §12). */
  onPigTap?: (pigId: string) => void;
  /** App version for the settings screen (desktop); null in the browser build. */
  version?: string | null;
  /** The platform keeps save backups to list and restore (desktop). */
  hasBackups?: boolean;
  /** Mounts the Phaser farm into the stage (main.ts injects src/game; absent in DOM tests). */
  farm?: (host: HTMLElement, onPick: (pick: FarmPick) => void) => FarmCanvas;
}

/** World object actions (manifest layout.placements[].action). */
export type FarmPickAction = 'shop' | 'inventory' | 'orders' | 'collection' | 'trough' | 'cleanAll';
/** A click on the canvas: a pig, a world object, or empty ground. */
export type FarmPick =
  { kind: 'pig'; pigId: string } | { kind: 'action'; action: FarmPickAction } | { kind: 'ground' };

export interface MountedApp {
  /** The DOM toast host; only the FeedbackDirector calls it (§11.3). */
  toast: (message: string) => void;
  /** §9.5 away summary; only the FeedbackDirector calls it, for a long catch-up. */
  showAway: (events: GameEvent[], awayMs: number) => void;
  dispose: () => void;
}

/** What the shell needs from the farm canvas (implemented by src/game/farmView.ts). */
export interface FarmCanvas {
  setSelected(pigId: string | null): void;
  setVisible(visible: boolean): void;
  destroy(): void;
}
