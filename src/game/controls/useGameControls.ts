import { useCallback, useEffect, useMemo, useRef } from 'react';
import { DeviceMotion } from 'expo-sensors';
import { Platform, PanResponder, type GestureResponderEvent } from 'react-native';

const TILT_SMOOTH = 0.22;
const MAX_TILT = 0.5;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export type ControlInputRef = {
  horizontal: number;
  gyroActive: boolean;
};

/**
 * Gyro tilt (DeviceMotion rotation gamma) on iOS + touch position fallback.
 * Read `getInput()` each frame from the game loop for lowest latency.
 */
export function useGameControls(width: number, enabled: boolean): {
  getInput: () => ControlInputRef;
  panHandlers: ReturnType<typeof PanResponder.create>['panHandlers'];
} {
  const smoothedGyro = useRef(0);
  const touchTilt = useRef(0);
  const gyroActive = useRef(false);
  const widthRef = useRef(width);

  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  useEffect(() => {
    if (!enabled) return;

    let sub: { remove: () => void } | undefined;

    const start = async (): Promise<void> => {
      if (Platform.OS !== 'ios') {
        gyroActive.current = false;
        return;
      }
      const avail = await DeviceMotion.isAvailableAsync();
      if (!avail) {
        gyroActive.current = false;
        return;
      }
      DeviceMotion.setUpdateInterval(16);
      sub = DeviceMotion.addListener((evt) => {
        const g = evt.rotation;
        if (g == null) return;
        const raw = clamp((g.gamma ?? 0) / MAX_TILT, -1, 1);
        smoothedGyro.current += (raw - smoothedGyro.current) * TILT_SMOOTH;
        gyroActive.current = true;
      });
    };

    void start();

    return () => {
      sub?.remove();
    };
  }, [enabled]);

  const getInput = useCallback((): ControlInputRef => {
    const g = gyroActive.current ? smoothedGyro.current : 0;
    const t = touchTilt.current;
    const h = gyroActive.current
      ? clamp(g * 0.7 + t * 0.3, -1, 1)
      : t;
    return { horizontal: h, gyroActive: gyroActive.current };
  }, []);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => enabled,
        onMoveShouldSetPanResponder: () => enabled,
        onPanResponderGrant: (e: GestureResponderEvent) => {
          const w = widthRef.current || 1;
          const x = e.nativeEvent.locationX;
          touchTilt.current = clamp((x / w) * 2 - 1, -1, 1);
        },
        onPanResponderMove: (e: GestureResponderEvent) => {
          const w = widthRef.current || 1;
          const x = e.nativeEvent.locationX;
          touchTilt.current = clamp((x / w) * 2 - 1, -1, 1);
        },
        onPanResponderRelease: () => {
          touchTilt.current = 0;
        },
        onPanResponderTerminate: () => {
          touchTilt.current = 0;
        },
      }),
    [enabled],
  );

  return { getInput, panHandlers: pan.panHandlers };
}
