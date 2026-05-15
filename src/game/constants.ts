import type { PlatformKind } from '@/game/types';

/** Pixel size of one repeatable tile used by all platform types. */
export const TILE_SIZE = 28;

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
  // 28 px matches the native tile height of all platform sprites so they
  // render 1:1 on the Y axis. The spawner places platforms by top-y, so
  // taller blocks don't change jump gaps or reachability — only the visible
  // thickness below the landing surface. See gameTick.ts: collision uses
  // p.y (top) for landing.
  height: 28,
  /** Minimum number of 28 px tiles for modular (Blue / Dark Blue) platforms. */
  minTiles: 2,
  /** Maximum number of 28 px tiles for modular (Blue / Dark Blue) platforms. */
  maxTiles: 4,
  /** Side margin from screen edges when placing platforms. */
  edgeMargin: 16,
  darkBlueMoveRange: 56,
  darkBlueMoveSpeed: 1.15,
} as const;

/**
 * Spawner constraints. Vertical gaps must stay below the player's peak jump
 * height (≈253 px) with a safety margin so every platform is reachable.
 * Horizontal step from one platform to the next must stay within the practical
 * sideways reach during airtime.
 */
export const SPAWN = {
  /** After a grey, require this many spawn steps before another grey. */
  brownCooldownRows: 3,
  /**
   * Min vertical step between consecutive platforms.
   * 64 px gives ~10 px clearance above the player's head (54 px hitbox) when
   * standing on the platform below — tight but never visually buried.
   */
  minJumpGap: 64,
  /**
   * Max vertical step — ~45% of peak jump height (≈253 px) so even the
   * widest gaps feel reachable and the screen stays comfortably populated.
   * Formerly 170 (67%); reducing this is the primary lever for density.
   */
  maxJumpGap: 115,
  /**
   * Max horizontal distance (platform-center to platform-center) between
   * consecutive platforms. Player can comfortably cover this within airtime.
   */
  maxHorizontalStep: 210,
  /** Soft minimum so adjacent platforms don't fully overlap horizontally. */
  minHorizontalStep: 48,
  /**
   * Dark Blue platform difficulty ramp. Each dark blue locks its moveSpeed at
   * spawn so already-on-screen platforms stay predictable; only newly spawned
   * ones get faster. Multiplier is linear in score from 1.0 to
   * `darkBlueSpeedMaxMultiplier` over [0, `darkBlueSpeedRampScore`] and held
   * flat past the cap.
   *
   * At the cap: peak linear velocity = 1.15 rad/s × 2.2 × 56 px ≈ 142 px/s,
   * which is comfortably below the player's 440 px/s run cap and below the
   * per-frame travel that would risk tunneling against the 5 px EDGE_GRAB
   * tolerance in gameTick.ts.
   */
  darkBlueSpeedMaxMultiplier: 2.2,
  darkBlueSpeedRampScore: 6000,
} as const;

export const COLORS = {
  skyTop: '#6ec8ff',
  skyBottom: '#b8e8ff',
  blueTop: '#5ecf6a',
  blueBottom: '#2d9a3d',
  greyTop: '#a67c52',
  greyBottom: '#5c3d22',
  darkBlueTop: '#4da3ff',
  darkBlueBottom: '#1e6fd4',
  redTop: '#ff6b6b',
  redBottom: '#c0392b',
  hudBg: 'rgba(12, 18, 28, 0.72)',
};

// Distribution: blue stays dominant; grey bumped from a rare hazard
// (~1-in-7) up to an occasional one (~1-in-5). Combined with the
// `brownCooldownRows` floor in SPAWN, minimum spacing between grey platforms
// is unchanged (≥4 platforms apart) — only the average density rises.
export const PLATFORM_WEIGHTS: Record<PlatformKind, number> = {
  blue: 0.56,
  grey: 0.20,
  darkBlue: 0.24,
};
