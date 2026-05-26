import { GameCanvas } from '@/game/components/GameCanvas';
import { GameHUD } from '@/game/components/GameHUD';
import { TouchControls } from '@/game/components/TouchControls';
import { useGameControls } from '@/game/controls/useGameControls';
import { useGameLoop } from '@/game/hooks/useGameLoop';
import { loadHighScore, saveHighScore } from '@/game/storage/highScore';
import type { GameModel } from '@/game/types';
import { resetRunScoring } from '@/game/systems/gameTick';
import { createInitialGame } from '@/game/world/initialWorld';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export function GameScreen() {
  const gameRef = useRef<GameModel | null>(null);
  const [, setFrame] = useState(0);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [uiPhase, setUiPhase] = useState<
    'ready' | 'playing' | 'paused' | 'gameover'
  >('ready');
  const [highScore, setHighScore] = useState(0);
  const savedGameOver = useRef(false);

  const {
    getInput,
    onLeftDown,
    onLeftUp,
    onRightDown,
    onRightUp,
  } = useGameControls(uiPhase === 'playing' || uiPhase === 'ready');

  useEffect(() => {
    void loadHighScore().then(setHighScore);
  }, []);

  const onFrame = useCallback(() => {
    setFrame((n) => n + 1);
    const g = gameRef.current;
    if (!g) return;
    if (g.phase === 'gameover' && !savedGameOver.current) {
      savedGameOver.current = true;
      void saveHighScore(g.score).then(() => loadHighScore().then(setHighScore));
    }
    setUiPhase((prev) => (g.phase !== prev ? g.phase : prev));
  }, []);

  useGameLoop({
    gameRef,
    isPlaying: uiPhase === 'playing',
    getInput,
    onFrame,
  });

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width <= 0 || height <= 0) return;
    setDims({ w: width, h: height });
    if (!gameRef.current) {
      gameRef.current = createInitialGame(width, height);
      setFrame((n) => n + 1);
    }
  }, []);

  const startOrResume = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    if (uiPhase === 'ready') {
      resetRunScoring(g);
      savedGameOver.current = false;
    }
    g.phase = 'playing';
    setUiPhase('playing');
    setFrame((n) => n + 1);
  }, [uiPhase]);

  const pause = useCallback(() => {
    const g = gameRef.current;
    if (!g || g.phase !== 'playing') return;
    g.phase = 'paused';
    setUiPhase('paused');
    setFrame((n) => n + 1);
  }, []);

  const restart = useCallback(() => {
    const { w, h } = dims;
    if (w <= 0 || h <= 0) return;
    savedGameOver.current = false;
    gameRef.current = createInitialGame(w, h);
    gameRef.current.phase = 'playing';
    setUiPhase('playing');
    setFrame((n) => n + 1);
  }, [dims]);

  const g = gameRef.current;

  return (
    <View style={styles.root} onLayout={onLayout}>
        {g && (
          <>
            <GameCanvas game={g} />
            <GameHUD
              score={g.score}
              highScore={highScore}
              onPause={pause}
            />
            <TouchControls
              onLeftDown={onLeftDown}
              onLeftUp={onLeftUp}
              onRightDown={onRightDown}
              onRightUp={onRightUp}
            />
          </>
        )}

        {uiPhase === 'ready' && (
          <Pressable style={styles.overlay} onPress={startOrResume}>
            <Text style={styles.title}>Voxel Jump</Text>
            <Text style={styles.sub}>Tap to start</Text>
          </Pressable>
        )}

        {uiPhase === 'paused' && (
          <View style={styles.overlay}>
            <Text style={styles.title}>Paused</Text>
            <Pressable style={[styles.btn, { backgroundColor: '#3f2cec' }]} onPress={startOrResume}>
              <Text style={[styles.btnTxt, { color: '#ffffff' }]}>Resume</Text>
            </Pressable>
            <Pressable style={styles.btnSecondary} onPress={restart}>
              <Text style={styles.btnTxtDark}>Restart</Text>
            </Pressable>
          </View>
        )}

        {uiPhase === 'gameover' && (
          <View style={styles.overlay}>
            <Text style={[styles.title, { color: '#ffffff' }]}>Run over</Text>
            <Text style={[styles.scoreBig, { color: '#ffffff' }]}>{g?.score ?? 0}</Text>
            <Pressable style={[styles.btn, { backgroundColor: '#3f2cec' }]} onPress={restart}>
              <Text style={[styles.btnTxt, { color: '#ffffff' }]}>Play again</Text>
            </Pressable>
            <Pressable
              style={styles.btnSecondary}
              onPress={() => {
                const { w, h } = dims;
                if (w <= 0 || h <= 0) return;
                gameRef.current = createInitialGame(w, h);
                gameRef.current.phase = 'ready';
                savedGameOver.current = false;
                setUiPhase('ready');
                setFrame((n) => n + 1);
              }}
            >
              <Text style={styles.btnTxtDark}>Menu</Text>
            </Pressable>
          </View>
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0b1020',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 10, 18, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    gap: 14,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
    fontWeight: '600',
  },
  scoreBig: {
    color: '#7dffb3',
    fontSize: 44,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  btn: {
    marginTop: 8,
    backgroundColor: '#3ecf8e',
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 16,
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 16,
  },
  btnTxt: {
    color: '#0b1020',
    fontSize: 17,
    fontWeight: '800',
  },
  btnTxtDark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
