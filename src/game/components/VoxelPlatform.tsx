import { TILE_SIZE } from '@/game/constants';
import type { PlatformKind, PlatformModel } from '@/game/types';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';

/**
 * Sprites for all platform tile types (84 × 84 px native = 28 × 28 pt at 3×).
 * Every platform kind is built by repeating its tile horizontally — no
 * stretching, no partial tiles.
 */
const TILE_SPRITES: Record<PlatformKind, ImageSourcePropType> = {
  blue:     require('@assets/sprites/BLUE BLOCK.png'),
  darkBlue: require('@assets/sprites/DARK BLUE BLOCK.png'),
  grey:     require('@assets/sprites/GREY ONE.png'),
};

type Props = {
  platform: PlatformModel;
  screenX: number;
  screenY: number;
};

/**
 * Renders all platform kinds using the same block-tiling system:
 *
 *   width = tileCount × TILE_SIZE   (always a whole number of tiles)
 *   Each tile: 28 × 28 pt, placed at exactly tileIndex × TILE_SIZE — no gaps.
 *
 * Gameplay-feedback effects:
 *   - `breaking` (grey after the player touches it): horizontal shake +
 *     slight transparency.
 *   - `broken`: fully invisible so collision and visuals stay in sync.
 */
export function VoxelPlatform({ platform, screenX, screenY }: Props) {
  const { width, kind, breaking, broken, shakePhase } = platform;
  const shake = breaking && !broken ? Math.sin(shakePhase) * 3.5 : 0;
  const opacity = broken ? 0 : breaking ? 0.85 : 1;

  const tileCount = Math.round(width / TILE_SIZE);
  const tileSprite = TILE_SPRITES[kind];

  return (
    <View
      style={[
        styles.abs,
        {
          left: screenX + shake,
          top: screenY,
          width: tileCount * TILE_SIZE,
          height: TILE_SIZE,
          opacity,
        },
      ]}
    >
      {Array.from({ length: tileCount }, (_, i) => (
        <Image
          key={i}
          source={tileSprite}
          style={[styles.tile, { left: i * TILE_SIZE }]}
          resizeMode="stretch"
          fadeDuration={0}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  abs: {
    position: 'absolute',
  },
  tile: {
    position: 'absolute',
    top: 0,
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
});
