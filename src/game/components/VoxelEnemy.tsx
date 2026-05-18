import { Image, StyleSheet, View } from 'react-native';
import { ENEMY } from '@/game/constants';
import type { EnemyModel } from '@/game/types';

type Props = {
  enemy: EnemyModel;
  /** Screen-space X of the enemy's left edge (world X − cameraX, already computed). */
  screenX: number;
  /** Screen-space Y of the enemy's top edge. */
  screenY: number;
};

/**
 * Renders the Angry Voxel Face enemy.
 *
 * Animations (all driven by model state, no local state):
 *   - Idle bounce: sinusoidal vertical offset from `bouncePhase`.
 *   - Direction flip: sprite is mirrored on the X axis when moving left.
 */
export function VoxelEnemy({ enemy, screenX, screenY }: Props) {
  const { bouncePhase, dir, w, h } = enemy;

  // Vertical bob: ±ENEMY.bounceAmp pixels, smooth sine wave.
  const bobY = Math.sin(bouncePhase) * ENEMY.bounceAmp;

  // Flip sprite to face movement direction.
  const scaleX = dir === -1 ? -1 : 1;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.abs,
        {
          left: screenX,
          top: screenY + bobY,
          width: w,
          height: h,
        },
      ]}
    >
      <Image
        source={require('@assets/sprites/ENEMY_FACE.png')}
        style={[styles.img, { transform: [{ scaleX }] }]}
        resizeMode="stretch"
        fadeDuration={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  abs: {
    position: 'absolute',
  },
  img: {
    width: '100%',
    height: '100%',
  },
});
