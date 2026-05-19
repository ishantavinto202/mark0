import { Image, StyleSheet, View } from 'react-native';
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
 * Movement is X-axis only; sprite flips to face travel direction.
 */
export function VoxelEnemy({ enemy, screenX, screenY }: Props) {
  const { dir, w, h } = enemy;
  const scaleX = dir === -1 ? -1 : 1;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.abs,
        {
          left: screenX,
          top: screenY,
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
