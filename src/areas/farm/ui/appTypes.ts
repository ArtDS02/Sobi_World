// What the app shell takes from main.ts and gives back (spec §4: main.ts is the composition root).
import type { AssetRegistry } from '../../../core/assets/registry';
import type { SummaryLine } from '../../../core/area-registry/registry';
import type { GameEvent } from '../logic/events';
import type { PanelId } from '../../../ui/components/popup';
import type { FileDialogs } from '../../../core/save/port';
import type { ControlInput } from '../../../ui/world/controlInput';
import type { CharacterChoice } from '../../../ui/components/characterPicker';
import type { KeySettings } from '../../../ui/world/keySettings';
import type { Suggestion } from '../../../core/area-registry/registry';
import type { CodexKind } from '../../../core/collection/codex';
import type { Goals, WorldAction } from '../../../core/goals/api';
import type { WorldSave } from '../../../core/save/world';

/** The world's own screens (orders of the plaza, goals, Codex) reach the world through this (spec V2 §9). */
export interface WorldUi {
  save(): WorldSave | null;
  act(run: WorldAction): void;
  goals: Goals;
  codexKinds(): readonly CodexKind[];
  /** What the Areas suggest now (most urgent first). */
  suggest(now: number, dayOffsetMs: number): Suggestion[];
  /** The next Area still closed and the world level it needs; null when every Area is open. */
  nextLocked(): { name: string; level: number } | null;
}

export interface AppOptions {
  /** The world's goals and Codex; absent in DOM tests of the farm alone. */
  world?: WorldUi;
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
  /** Keyboard controls (spec §4): the bag, Codex and menu keys open their screens. Absent in DOM tests. */
  input?: ControlInput;
  /** The HUD button back to the plaza (the farm is played with clicks; spec §4). */
  leave?: () => void;
  /** Changing the keys, shown in the settings screen. */
  keySettings?: KeySettings;
  /** Which character to walk as, shown in the settings screen. */
  characterChoice?: CharacterChoice;
  /** Gems of the wallet (the farm's own state has none); null when unknown. */
  gems?: () => number | null;
  /** The away-screen lines of the other Areas (the Garden, the Aquarium). */
  areaLines?: (events: GameEvent[]) => SummaryLine[];
  /** Goes to another place (the away screen's button to the Garden). */
  goPlace?: (placeId: string) => void;
  /** A layer over the world that the app owns (the Garden's and the Aquarium's HUDs); the shell only places it. */
  overlay?: HTMLElement;
  /** A dialog of the overlay is open: the world stands still like under a panel. */
  overlayModal?: () => boolean;
  /** Mounts the Phaser farm into the stage (main.ts injects src/game; absent in DOM tests). */
  farm?: (host: HTMLElement, onPick: (pick: FarmPick) => void) => FarmCanvas;
}

/** World object actions (manifest layout.placements[].action). */
export type FarmPickAction = 'shop' | 'inventory' | 'orders' | 'collection' | 'trough' | 'cleanAll';
/** A click on the canvas: a pig, a gift box (U06), a world object, or empty ground. */
export type FarmPick =
  | { kind: 'pig'; pigId: string }
  | { kind: 'gift'; giftId: string }
  | { kind: 'action'; action: FarmPickAction }
  | { kind: 'ground' };

/** Where the player is: the plaza shows a lighter HUD (the farm's gauges belong to the farm). */
export type Place = 'plaza' | 'area' | 'garden' | 'aquarium' | 'cloud' | 'adventure';

export interface MountedApp {
  /** Tells the shell which place is on screen. */
  setPlace: (place: Place) => void;
  /** Opens a panel (the bag, the menu) from the app's own HUD. */
  openPanel: (panel: PanelId) => void;
  /** A panel or dialog covers the world (the character stands still then). */
  isModalOpen: () => boolean;
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
