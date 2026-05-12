import type { PlatformKind, PlatformModel } from '@/game/types';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';

const PLATFORM_SPRITES: Record<PlatformKind, ImageSourcePropType> = {
  green: require('@assets/sprites/platform_green.png'),
  brown: require('@assets/sprites/platform_brown.png'),
  blue: require('@assets/sprites/platform_blue.png'),
};

type Props = {
  platform: PlatformModel;
  screenX: number;
  screenY: number;
};

/**
 * Sprite-backed platform render.
 *
 * Visuals are driven by `assets/sprites/platform_<kind>.png` (native size
 * 110 × 26). The sprite is stretched to the platform's gameplay `width` ×
 * `height`; with `PLATFORM.height = 26` and `width ∈ [76, 112]`, that means
 * 1:1 on the Y axis and ~0.69×–1.02× on the X axis — a modest, uniform
 * horizontal stretch that preserves the asset's silhouette.
 *
 * Gameplay-feedback effects are preserved from the procedural version:
 *   - `breaking` (brown right after the player touches it): horizontal shake
 *     and slight transparency.
 *   - `broken`: fully invisible so collision (which already excludes broken
 *     platforms) and visuals stay in sync.
 *
 * The previous procedural crack overlay was removed — `platform_brown.png`
 * is now the single source of truth for the brown look.
 */
export function VoxelPlatform({ platform, screenX, screenY }: Props) {
  const { width, height, kind, breaking, broken, shakePhase } = platform;
  const shake = breaking && !broken ? Math.sin(shakePhase) * 3.5 : 0;

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
      <Image
        source={PLATFORM_SPRITES[kind]}
        style={styles.fill}
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
  fill: {
    width: '100%',
    height: '100%',
  },
});
