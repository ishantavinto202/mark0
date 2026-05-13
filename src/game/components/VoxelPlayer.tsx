import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { PLAYER_SIZE } from '@/game/constants';
import type { PlayerModel } from '@/game/types';

const TEXTURE = require('@assets/jump/texture.png');

interface FrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface FrameData {
  frame: FrameRect;
  spriteSourceSize: FrameRect;
  sourceSize: { w: number; h: number };
}

interface AtlasData {
  frames: Record<string, FrameData>;
  meta: { size: { w: number; h: number } };
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ATLAS = require('@assets/jump/Jump.json') as AtlasData;

const ANIMATION_FRAMES: string[] = [
  '1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png', '8.png',
  '9.png', '10.png', '11.png', '12.png', '13.png', '14.png', '15.png', '16.png',
];

const ANIM_FPS = 10;
const FRAME_MS = 1000 / ANIM_FPS;

/**
 * Uniform scale: map the standard 322 px source-canvas height to PLAYER_SIZE.h.
 * This keeps the sprite at exactly the hitbox height for all non-outlier frames,
 * and is consistent across every frame so sizes never jump mid-animation.
 */
const SCALE = PLAYER_SIZE.h / 322;

/** Full texture dimensions in scaled (display) pixels — constant for all frames. */
const TEX_W = Math.round(ATLAS.meta.size.w * SCALE);
const TEX_H = Math.round(ATLAS.meta.size.h * SCALE);

type Props = {
  player: PlayerModel;
  screenX: number;
  screenY: number;
};

/**
 * Renders the player using the Jump atlas (texture.png + Jump.json).
 *
 * Rendering approach (React Native has no canvas ctx.drawImage, so we use
 * nested Views with overflow:hidden to crop the atlas):
 *
 *   Outer View  — sized to scaled sourceSize, positioned so the sprite is
 *                 horizontally centered and bottom-aligned with the hitbox.
 *     Crop View — positioned at scaled spriteSourceSize offset, sized to the
 *                 scaled frame rect, overflow:hidden clips to the frame area.
 *       Image   — the full texture.png, shifted by -frame.x/-frame.y (scaled)
 *                 so the correct frame area is visible inside the crop view.
 *
 * The collision hitbox (player.w × player.h) is never modified.
 */
export function VoxelPlayer({ player, screenX, screenY }: Props) {
  const { w, h, facing } = player;
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setFrameIndex(i => (i + 1) % ANIMATION_FRAMES.length),
      FRAME_MS,
    );
    return () => clearInterval(id);
  }, []);

  const d = ATLAS.frames[ANIMATION_FRAMES[frameIndex]];

  // Scaled source-canvas dimensions for this frame
  const srcW = Math.round(d.sourceSize.w * SCALE);
  const srcH = Math.round(d.sourceSize.h * SCALE);

  // Position of the cropped frame inside the source canvas (spriteSourceSize offset)
  const cropX = Math.round(d.spriteSourceSize.x * SCALE);
  const cropY = Math.round(d.spriteSourceSize.y * SCALE);

  // Size of the cropped frame in display pixels
  const cropW = Math.round(d.frame.w * SCALE);
  const cropH = Math.round(d.frame.h * SCALE);

  // Texture offset inside the crop view so frame.x/y aligns at (0,0)
  const imgLeft = -Math.round(d.frame.x * SCALE);
  const imgTop  = -Math.round(d.frame.y * SCALE);

  // Place the source canvas:
  //   • horizontally centered on the hitbox
  //   • bottom-aligned with the hitbox (feet stay on the platform)
  const left = Math.round(screenX + w / 2 - srcW / 2);
  const top  = Math.round(screenY + h - srcH);

  return (
    <View
      style={[
        styles.root,
        {
          left,
          top,
          width: srcW,
          height: srcH,
          // Flip the sprite for left-facing without touching physics state
          transform: [{ scaleX: facing }],
        },
      ]}
    >
      {/* Crop window — visible area = one frame from the atlas */}
      <View
        style={{
          position: 'absolute',
          left: cropX,
          top: cropY,
          width: cropW,
          height: cropH,
          overflow: 'hidden',
        }}
      >
        {/* Full texture, offset so the target frame sits at (0,0) of the crop */}
        <Image
          source={TEXTURE}
          style={{
            position: 'absolute',
            left: imgLeft,
            top: imgTop,
            width: TEX_W,
            height: TEX_H,
          }}
          resizeMode="stretch"
          fadeDuration={0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
  },
});
