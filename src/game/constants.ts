import type { PlatformKind } from '@/game/types';

export const PHYSICS = {
  /**
   * Doodle-Jump-style floaty arc.
   * jumpHeight  = jumpVelocity^2 / (2 * gravity)  ≈ 900^2 / 3200 ≈ 253 px
   * timeToPeak  = |jumpVelocity| / gravity        ≈ 0.563 s
   * totalAir    ≈ 1.125 s — slow, readable, controllable.
   */
  gravity: 1600,
  jumpVelocity: -900,
  /** Terminal fall speed — keeps frames from tunneling through platforms. */
  maxFallSpeed: 1200,
  maxRunSpeed: 440,
  runAccel: 3200,
  airControl: 0.92,
  groundFriction: 0.88,
} as const;

export const CAMERA = {
  /** Player stays near this fraction from top of screen when scrolling. */
  followRatio: 0.32,
  lerp: 0.14,
} as const;

export const PLAYER_SIZE = { w: 42, h: 54 } as const;

export const PLATFORM = {
  height: 18,
  minWidth: 76,
  maxWidth: 112,
  /** Side margin from screen edges when placing platforms. */
  edgeMargin: 16,
  blueMoveRange: 56,
  blueMoveSpeed: 1.15,
} as const;

/**
 * Spawner constraints. Vertical gaps must stay below the player's peak jump
 * height (≈253 px) with a safety margin so every platform is reachable.
 * Horizontal step from one platform to the next must stay within the practical
 * sideways reach during airtime.
 */
export const SPAWN = {
  /** After a brown, require this many spawn steps before another brown. */
  brownCooldownRows: 3,
  /** Min vertical step between consecutive platforms (small hop). */
  minJumpGap: 72,
  /** Max vertical step — roughly 67% of peak jump height for safety margin. */
  maxJumpGap: 170,
  /**
   * Max horizontal distance (platform-center to platform-center) between
   * consecutive platforms. Player can comfortably cover this within airtime.
   */
  maxHorizontalStep: 210,
  /** Soft minimum so adjacent platforms don't fully overlap horizontally. */
  minHorizontalStep: 24,
} as const;

export const COLORS = {
  skyTop: '#6ec8ff',
  skyBottom: '#b8e8ff',
  greenTop: '#5ecf6a',
  greenBottom: '#2d9a3d',
  brownTop: '#a67c52',
  brownBottom: '#5c3d22',
  blueTop: '#4da3ff',
  blueBottom: '#1e6fd4',
  redTop: '#ff6b6b',
  redBottom: '#c0392b',
  hudBg: 'rgba(12, 18, 28, 0.72)',
};

export const PLATFORM_WEIGHTS: Record<PlatformKind, number> = {
  green: 0.62,
  brown: 0.14,
  blue: 0.24,
};
