import { StyleSheet, View } from 'react-native';
import { VoxelSlab } from '@/game/components/VoxelSlab';
import { COLORS } from '@/game/constants';

type Props = {
  screenX: number;
  screenY: number;
  w: number;
  h: number;
};

/** Red voxel-style human hazard (not a “monster”). */
export function VoxelObstacle({ screenX, screenY, w, h }: Props) {
  return (
    <View style={[styles.abs, { left: screenX, top: screenY, width: w, height: h }]}>
      <View style={styles.head}>
        <VoxelSlab width={w * 0.55} height={h * 0.22} topColor={COLORS.redTop} bottomColor={COLORS.redBottom} borderRadius={6} />
      </View>
      <View style={styles.body}>
        <VoxelSlab width={w * 0.6} height={h * 0.36} topColor="#c0392b" bottomColor="#7b1f18" borderRadius={5} />
      </View>
      <View style={styles.legs}>
        <VoxelSlab width={w * 0.22} height={h * 0.28} topColor="#5c1810" bottomColor="#2a0c08" borderRadius={3} />
        <VoxelSlab width={w * 0.22} height={h * 0.28} topColor="#5c1810" bottomColor="#2a0c08" borderRadius={3} />
      </View>
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
    left: '20%',
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
});
