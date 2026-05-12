import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

type Props = {
  width: number;
  height: number;
  topColor: string;
  bottomColor: string;
  borderRadius?: number;
};

/** Simple beveled “voxel” slab for platforms and body parts. */
export function VoxelSlab({
  width,
  height,
  topColor,
  bottomColor,
  borderRadius = 4,
}: Props) {
  return (
    <View
      style={[
        styles.wrap,
        {
          width,
          height,
          borderRadius,
        },
      ]}
    >
      <LinearGradient
        colors={[topColor, bottomColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.15, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      <View style={[styles.highlight, { borderRadius }]} pointerEvents="none" />
      <View style={[styles.shadowEdge, { borderRadius }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.22)',
  },
  highlight: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  shadowEdge: {
    ...StyleSheet.absoluteFillObject,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
  },
});
