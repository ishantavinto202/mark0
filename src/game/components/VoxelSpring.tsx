import { Image, StyleSheet, View } from 'react-native';
import { SPRING } from '@/game/constants';

type Props = {
  /** Screen-space left edge of the platform tile row. */
  platformScreenX: number;
  /** Screen-space top edge of the platform tile row. */
  platformScreenY: number;
  /** Platform width in logical pixels — used to center the spring. */
  platformWidth: number;
  /**
   * Animation phase: 0 = idle (full height), 1 = just activated.
   * Counts down 1→0 over SPRING.animDuration seconds.
   *
   * Curve: sin(phase × π) produces a bell — peak compression at mid-animation
   * — which reads as the spring compressing then bouncing back after the player
   * has already launched off it.
   */
  animPhase: number;
};

const { spriteW, spriteH } = SPRING;

export function VoxelSpring({
  platformScreenX,
  platformScreenY,
  platformWidth,
  animPhase,
}: Props) {
  // sin bell: 0 at both ends, peak 1 at the middle → most compressed mid-anim.
  const compression = Math.sin(animPhase * Math.PI);
  // scaleY: 1.0 idle, down to ~0.35 at peak compression.
  const scaleY = 1 - compression * 0.65;
  // Keep the spring bottom-anchored to the platform surface.
  const visH = spriteH * scaleY;
  const left = platformScreenX + (platformWidth - spriteW) / 2;
  // Spring sits ON TOP of the platform — bottom edge at platformScreenY.
  const top = platformScreenY - visH;

  return (
    <View
      pointerEvents="none"
      style={[styles.abs, { left, top, width: spriteW, height: visH }]}
    >
      <Image
        source={require('@assets/sprites/SPRING.png')}
        style={styles.img}
        resizeMode="stretch"
        fadeDuration={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  abs: {
    position: 'absolute',
    overflow: 'hidden',
  },
  img: {
    width: '100%',
    height: '100%',
  },
});
