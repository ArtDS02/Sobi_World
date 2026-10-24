// The colours of each element's effects on the battle canvas (adventure-big-update-1 §5): the shapes differ by element too
// (elementFx recipes); these are the tints they are drawn in.
import type { Element } from '../../../../systems/combat/types';

export interface Look {
  color: string;
  glow: string;
}

/** The colours of each element's effects (the shapes differ too, not only the colour). */
export const LOOKS: Readonly<Record<Element | 'NEUTRAL' | 'HEAL', Look & { dark: string }>> = {
  FIRE: { color: '#ff7a2a', glow: '#ffd36a', dark: '#b8320c' },
  WATER: { color: '#3fb2ff', glow: '#d8f4ff', dark: '#1660b0' },
  NATURE: { color: '#5cc24e', glow: '#d6ffa8', dark: '#2c7a2a' },
  EARTH: { color: '#c08a50', glow: '#f6deb0', dark: '#6b4524' },
  METAL: { color: '#cfd9e6', glow: '#ffffff', dark: '#6c7b8c' },
  LIGHTNING: { color: '#ffe14a', glow: '#fffbd0', dark: '#c99a00' },
  DARK: { color: '#7a4ed0', glow: '#d9b8ff', dark: '#2a1650' },
  LIGHT: { color: '#ffe98a', glow: '#ffffff', dark: '#d9a520' },
  VOID: { color: '#8c7cff', glow: '#e4dcff', dark: '#2e2470' },
  NEUTRAL: { color: '#ffe7b0', glow: '#ffffff', dark: '#a0703a' },
  HEAL: { color: '#7ef0a0', glow: '#e8fff0', dark: '#2c9a5a' },
};

export const lookOf = (e: Element | null): Look & { dark: string } => (e ? LOOKS[e] : LOOKS.NEUTRAL);

/** A full turn (radians). */
export const TAU = Math.PI * 2;
