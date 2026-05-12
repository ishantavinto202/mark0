import { PHYSICS } from '@/game/constants';

export type JumpReach = {
  /** Maximum vertical jump height in world units. */
  peakHeight: number;
  /** Seconds from launch to apex. */
  timeToPeak: number;
  /** Seconds from launch back to launch altitude. */
  totalAirtime: number;
  /**
   * Theoretical max horizontal distance covered during a full airtime while
   * holding full tilt the entire time.
   */
  maxHorizontalReach: number;
  /**
   * Practical horizontal reach allowing for accel ramp-up and air control.
   * Roughly 60% of theoretical — what a real player can reliably cover.
   */
  practicalHorizontalReach: number;
};

/**
 * Derive jump capabilities from physics constants. Used by the spawner so
 * platform spacing always stays inside reachable bounds — change the physics
 * and the level remains beatable without retuning the spawner.
 */
export function computeJumpReach(physics = PHYSICS): JumpReach {
  const { gravity, jumpVelocity, maxRunSpeed } = physics;
  const peakHeight = (jumpVelocity * jumpVelocity) / (2 * gravity);
  const timeToPeak = Math.abs(jumpVelocity) / gravity;
  const totalAirtime = timeToPeak * 2;
  const maxHorizontalReach = totalAirtime * maxRunSpeed;
  const practicalHorizontalReach = maxHorizontalReach * 0.6;
  return {
    peakHeight,
    timeToPeak,
    totalAirtime,
    maxHorizontalReach,
    practicalHorizontalReach,
  };
}

export const JUMP_REACH = computeJumpReach();
