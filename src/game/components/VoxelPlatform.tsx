import { StyleSheet, View } from 'react-native';
import { VoxelSlab } from '@/game/components/VoxelSlab';
import { COLORS } from '@/game/constants';
import type { PlatformModel } from '@/game/types';

type Props = {
  platform: PlatformModel;
  screenX: number;
  screenY: number;
};

export function VoxelPlatform({ platform, screenX, screenY }: Props) {
  const { width, height, kind, breaking, broken, shakePhase } = platform;
  const shake =
    breaking && !broken ? Math.sin(shakePhase) * 3.5 : 0;

  let top = COLORS.greenTop;
  let bottom = COLORS.greenBottom;
  if (kind === 'brown') {
    top = COLORS.brownTop;
    bottom = COLORS.brownBottom;
  } else if (kind === 'blue') {
    top = COLORS.blueTop;
    bottom = COLORS.blueBottom;
  }

  return (
    <View
      style={[
        styles.abs,
        {
          width,
          height,
          left: screenX + shake,
          top: screenY,
          opacity: broken ? 0 : breaking ? 0.85 : 1,
        },
      ]}
    >
      <VoxelSlab width={width} height={height} topColor={top} bottomColor={bottom} />
      {kind === 'brown' && !broken && (
        <View style={styles.crack} pointerEvents="none">
          <View style={[styles.crackLine, { left: '18%', top: 4, transform: [{ rotate: '12deg' }] }]} />
          <View style={[styles.crackLine, { left: '55%', top: 2, transform: [{ rotate: '-8deg' }] }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  abs: {
    position: 'absolute',
  },
  crack: {
    ...StyleSheet.absoluteFillObject,
  },
  crackLine: {
    position: 'absolute',
    width: 2,
    height: '70%',
    backgroundColor: 'rgba(20,12,8,0.55)',
    borderRadius: 1,
  },
});
