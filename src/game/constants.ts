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
  // 26 px matches the native vertical of the platform sprites in
  // `assets/sprites/platform_*.png` so they render 1:1 on the Y axis. The
  // spawner places platforms by top-y, so taller blocks don't change jump
  // gaps or reachability — only the visible thickness below the landing
  // surface. See gameTick.ts: collision uses p.y (top) for landing.
  height: 26,
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
  /**
   * Blue-platform difficulty ramp. Each blue locks its moveSpeed at spawn so
   * already-on-screen platforms stay predictable; only newly spawned ones get
   * faster. Multiplier is linear in score from 1.0 to `blueSpeedMaxMultiplier`
   * over [0, `blueSpeedRampScore`] and held flat past the cap.
   *
   * At the cap: peak linear velocity = 1.15 rad/s × 2.2 × 56 px ≈ 142 px/s,
   * which is comfortably below the player's 440 px/s run cap and below the
   * per-frame travel that would risk tunneling against the 5 px EDGE_GRAB
   * tolerance in gameTick.ts.
   */
  blueSpeedMaxMultiplier: 2.2,
  blueSpeedRampScore: 6000,
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

// Distribution: green stays dominant; brown bumped from a rare hazard
// (~1-in-7) up to an occasional one (~1-in-5). Combined with the
// `brownCooldownRows` floor in SPAWN, minimum spacing between browns is
// unchanged (≥4 platforms apart) — only the average density rises.
export const PLATFORM_WEIGHTS: Record<PlatformKind, number> = {
  green: 0.56,
  brown: 0.20,
  blue: 0.24,
};
