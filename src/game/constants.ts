import type { PlatformKind } from '@/game/types';

export const PHYSICS = {
  gravity: 2350,
  jumpVelocity: -640,
  maxRunSpeed: 420,
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
  minGap: 88,
  maxGap: 132,
  blueMoveRange: 56,
  blueMoveSpeed: 1.15,
} as const;

export const SPAWN = {
  /** After a brown, require this many spawn steps before another brown. */
  brownCooldownRows: 3,
  /** Max vertical gap between platforms (reachable jump). */
  maxJumpGap: 128,
  minJumpGap: 92,
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
