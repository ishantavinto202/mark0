import { GREY_PLATFORM_WIDTH, TILE_SIZE } from '@/game/constants';
import type { PlatformKind, PlatformModel } from '@/game/types';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';

/**
 * Sprites for modular tile platforms (28 × 28 px each).
 * These are repeated horizontally — never stretched.
 */
const TILE_SPRITES: Record<'blue' | 'darkBlue', ImageSourcePropType> = {
  blue: require('@assets/sprites/BLUE.png'),
  darkBlue: require('@assets/sprites/DARK BLUE.png'),
};

/**
 * Sprite for the Grey platform — one complete image rendered at its natural
 * 120 × 28 px. Never tiled, never stretched.
 */
const GREY_SPRITE: ImageSourcePropType = require('@assets/sprites/GREY.png');

type Props = {
  platform: PlatformModel;
  screenX: number;
  screenY: number;
};

/**
 * Renders platforms without any sprite scaling or stretching:
 *
 * - Blue / Dark Blue: composed of repeated 28 × 28 px tiles placed side by
 *   side. Width is always an exact multiple of TILE_SIZE so no partial tiles
 *   ever appear.
 *
 * - Grey: rendered as one fixed 120 × 28 px sprite. Never tiled or scaled.
 *
 * Gameplay-feedback effects are preserved:
 *   - `breaking` (grey after the player touches it): horizontal shake and
 *     slight transparency.
 *   - `broken`: fully invisible so collision (which already excludes broken
 *     platforms) and visuals stay in sync.
 */
export function VoxelPlatform({ platform, screenX, screenY }: Props) {
  const { width, height, kind, breaking, broken, shakePhase } = platform;
  const shake = breaking && !broken ? Math.sin(shakePhase) * 3.5 : 0;
  const opacity = broken ? 0 : breaking ? 0.85 : 1;

  if (kind === 'grey') {
    return (
      <View
        style={[
          styles.abs,
          {
            left: screenX + shake,
            top: screenY,
            opacity,
          },
        ]}
      >
        <Image
          source={GREY_SPRITE}
          style={styles.greySprite}
          resizeMode="cover"
          fadeDuration={0}
        />
      </View>
    );
  }

  // Blue and Dark Blue: tile the sprite horizontally using absolute positioning
  // so each tile sits at exactly tileIndex * TILE_SIZE with zero gap.
  // resizeMode="stretch" scales the native 38×36 sprite down to TILE_SIZE×TILE_SIZE
  // so it matches the grey platform block height.
  const tileCount = Math.round(width / TILE_SIZE);
  const tileSprite = TILE_SPRITES[kind as 'blue' | 'darkBlue'];

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
  greySprite: {
    width: GREY_PLATFORM_WIDTH,
    height: 28,
  },
});
