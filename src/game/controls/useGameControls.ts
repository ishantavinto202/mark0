import { useCallback, useEffect, useRef } from 'react';

export type ControlInputRef = {
  horizontal: number;
};

/**
 * Movement input driven by an on-screen touch overlay.
 *
 * The hook owns the press state for the left/right buttons and exposes:
 *   - `getInput()`           — frame-rate read accessor for the game loop.
 *   - `onLeftDown`/`onLeftUp`/`onRightDown`/`onRightUp` — handlers the overlay
 *     wires to its `Pressable`'s `onPressIn`/`onPressOut` props.
 *
 * No keyboard, gyro, or pan-gesture input — buttons only — so behavior is
 * identical on touch (iOS/Android, simulators) and mouse (desktop web). The
 * RN `Pressable` events map to both pointer/touch and mouse-down/-up on web.
 *
 * When `enabled` flips false (pause / gameover) any held press is cleared
 * immediately so a stranded "down" can't drift the player after the game
 * stops accepting input. Releases are always honored, even while disabled,
 * so toggling state back on starts cleanly from a zero baseline.
 */
export function useGameControls(enabled: boolean): {
  getInput: () => ControlInputRef;
  onLeftDown: () => void;
  onLeftUp: () => void;
  onRightDown: () => void;
  onRightUp: () => void;
} {
  const leftDown = useRef(false);
  const rightDown = useRef(false);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
    if (!enabled) {
      leftDown.current = false;
      rightDown.current = false;
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
    if (!enabledRef.current) return { horizontal: 0 };
    const left = leftDown.current ? -1 : 0;
    const right = rightDown.current ? 1 : 0;
    return { horizontal: left + right };
  }, []);

  return { getInput, onLeftDown, onLeftUp, onRightDown, onRightUp };
}
