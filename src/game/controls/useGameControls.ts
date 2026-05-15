import { useCallback, useEffect, useRef } from 'react';

export type ControlInputRef = {
  horizontal: number;
};

/**
 * Smoothing factors applied per game-loop call (~60 fps assumed).
 *
 * ACCEL_K — how quickly `smoothed` ramps toward the pressed direction.
 *   0.28 → reaches ≈90 % of full speed in ~8 frames (≈133 ms).
 * DECEL_K — how quickly `smoothed` decays back to zero after release.
 *   0.20 → reaches ≈90 % of a full stop in ~11 frames (≈183 ms).
 *
 * Asymmetric rates give a "responsive press, gentle release" feel that
 * prevents the jittery snap while keeping the controls tight.
 */
const ACCEL_K = 0.28;
const DECEL_K = 0.20;

/**
 * Movement input driven by an on-screen touch overlay.
 *
 * The hook owns the press state for the left/right buttons and exposes:
 *   - `getInput()`           — frame-rate read accessor for the game loop.
 *   - `onLeftDown`/`onLeftUp`/`onRightDown`/`onRightUp` — handlers the overlay
 *     wires to its `Pressable`'s `onPressIn`/`onPressOut` props.
 *
 * `getInput` returns a smoothed `horizontal` value in [-1, 1] rather than a
 * hard -1/0/1 snap. Each call exponentially interpolates the internal
 * `smoothed` ref toward the raw button target, producing gradual acceleration
 * on press and gradual deceleration on release — eliminating the "instant
 * full-speed" feel without adding any perceptible input lag.
 *
 * When `enabled` flips false (pause / gameover) the smoothed value is reset
 * immediately to zero so a stranded press can't drift the player on resume.
 */
export function useGameControls(enabled: boolean): {
  getInput: () => ControlInputRef;
  onLeftDown: () => void;
  onLeftUp: () => void;
  onRightDown: () => void;
  onRightUp: () => void;
} {
  const leftDown    = useRef(false);
  const rightDown   = useRef(false);
  const enabledRef  = useRef(enabled);
  const smoothed    = useRef(0);       // current interpolated horizontal value

  useEffect(() => {
    enabledRef.current = enabled;
    if (!enabled) {
      leftDown.current  = false;
      rightDown.current = false;
      smoothed.current  = 0;
    }
  }, [enabled]);

  const onLeftDown = useCallback((): void => {
    if (!enabledRef.current) return;
    leftDown.current = true;
  }, []);

  const onLeftUp = useCallback((): void => {
    leftDown.current = false;
  }, []);

  const onRightDown = useCallback((): void => {
    if (!enabledRef.current) return;
    rightDown.current = true;
  }, []);

  const onRightUp = useCallback((): void => {
    rightDown.current = false;
  }, []);

  const getInput = useCallback((): ControlInputRef => {
    if (!enabledRef.current) {
      smoothed.current = 0;
      return { horizontal: 0 };
    }

    const target = (leftDown.current ? -1 : 0) + (rightDown.current ? 1 : 0);

    // Use a faster k when accelerating toward a pressed direction, a slower k
    // when decelerating back to zero — asymmetric smoothing feels natural.
    const k = target !== 0 ? ACCEL_K : DECEL_K;
    smoothed.current += (target - smoothed.current) * k;

    // Snap to exact zero when negligibly small to prevent floating-point drift.
    if (Math.abs(smoothed.current) < 0.015) smoothed.current = 0;

    return { horizontal: Math.max(-1, Math.min(1, smoothed.current)) };
  }, []);

  return { getInput, onLeftDown, onLeftUp, onRightDown, onRightUp };
}
