import { StyleSheet, View } from 'react-native';
import { VoxelSlab } from '@/game/components/VoxelSlab';
import type { PlayerModel } from '@/game/types';

type Props = {
  player: PlayerModel;
  screenX: number;
  screenY: number;
};

/** Blocky side-view human (voxel-inspired, 2D). */
export function VoxelPlayer({ player, screenX, screenY }: Props) {
  const { w, h, facing, grounded } = player;
  const dir = facing;

  return (
    <View
      style={[
        styles.abs,
        {
          width: w,
          height: h,
          left: screenX,
          top: screenY,
        },
      ]}
    >
      <View style={[styles.head, { transform: [{ scaleX: dir }] }]}>
        <VoxelSlab width={w * 0.55} height={h * 0.22} topColor="#ffd4a8" bottomColor="#e0a070" borderRadius={6} />
      </View>
      <View style={[styles.body, { transform: [{ scaleX: dir }] }]}>
        <VoxelSlab width={w * 0.62} height={h * 0.38} topColor="#4eb8ff" bottomColor="#1f7fd4" borderRadius={5} />
      </View>
      <View style={[styles.legs, { transform: [{ scaleX: dir }] }]}>
        <VoxelSlab width={w * 0.22} height={h * 0.28} topColor="#2a4a7a" bottomColor="#1a2f55" borderRadius={3} />
        <VoxelSlab width={w * 0.22} height={h * 0.28} topColor="#2a4a7a" bottomColor="#1a2f55" borderRadius={3} />
      </View>
      {!grounded && (
        <View style={styles.armL} pointerEvents="none">
          <VoxelSlab width={8} height={22} topColor="#ffd4a8" bottomColor="#c98b5a" borderRadius={2} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  abs: {
    position: 'absolute',
  },
  head: {
    position: 'absolute',
    left: '22%',
    top: 0,
  },
  body: {
    position: 'absolute',
    left: '18%',
    top: '24%',
  },
  legs: {
    position: 'absolute',
    bottom: 0,
    left: '12%',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  armL: {
    position: 'absolute',
    right: -2,
    top: '32%',
  },
});
