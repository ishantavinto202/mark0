import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { tickGame } from '@/game/systems/gameTick';
import type { ControlInput, GameModel } from '@/game/types';

type Args = {
  gameRef: MutableRefObject<GameModel | null>;
  isPlaying: boolean;
  getInput: () => ControlInput;
  onFrame: () => void;
};

export function useGameLoop({
  gameRef,
  isPlaying,
  getInput,
  onFrame,
}: Args): void {
  const getInputRef = useRef(getInput);
  getInputRef.current = getInput;

  useEffect(() => {
    let frameId = 0;
    let last = globalThis.performance.now();

    const loop = (now: number): void => {
      frameId = requestAnimationFrame(loop);
      const dt = Math.min(0.034, (now - last) / 1000);
      last = now;
      const g = gameRef.current;
      if (g && isPlaying) {
        tickGame(g, dt, getInputRef.current());
        onFrame();
      }
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [gameRef, isPlaying, onFrame]);
}
