import { useRef } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { TwinklingStars } from '@/game/components/TwinklingStars';

const BG1 = require('@assets/BG/BG_1.png');
const BG2 = require('@assets/BG/BG_2.png');

/** Native image dimensions — used only to compute the display aspect ratio. */
const IMG_W = 1206;
const IMG_H = 7528;
const IMG_ASPECT = IMG_H / IMG_W; // ≈ 6.243

type Props = {
  cameraY: number;
  screenWidth: number;
  screenHeight: number;
};

/**
 * Infinite vertically-scrolling background that syncs 1:1 with cameraY.
 *
 * BG_1 — "starting zone" image, shown from the bottom up.
 *   The first frame the component receives a valid cameraY we snapshot it as
 *   `initialCameraY`. BG_1 is then anchored so its BOTTOM sits at the BOTTOM
 *   of the screen at that moment:
 *
 *     bg1Top = (screenHeight − bgH) + (initialCameraY − cameraY)
 *
 *   At start  → bg1Top = screenHeight − bgH  (bottom of image = screen bottom)
 *   As camera moves up (cameraY decreases) → bg1Top increases → BG_1 slides
 *   DOWN the screen and eventually exits off the bottom.
 *
 * BG_2 — infinite loop, fills the space above as BG_1 exits.
 *   Two instances are kept: one partially/fully above the viewport and one
 *   just below it. Together they always span ≥ one full screenHeight with
 *   zero gap (B-top = A-top + bgH exactly).
 *
 *   scrolled  = max(0, −cameraY)     — distance into BG_2 territory
 *   offset    = scrolled % bgH       — position within current tile
 *   A-top     = offset − bgH         — upper instance
 *   B-top     = offset               — lower instance
 *
 * Render order (back → front): BG_2_A → BG_2_B → BG_1
 * BG_1 sits on top during transition; unmounted once it slides off the bottom.
 */
export function ScrollingBackground({ cameraY, screenWidth, screenHeight }: Props) {
  // Capture the very first cameraY seen so BG_1 can be bottom-anchored to
  // the initial view. Stored in a ref so it never triggers a re-render.
  const initialCameraYRef = useRef<number | null>(null);
  if (screenWidth > 0 && initialCameraYRef.current === null) {
    initialCameraYRef.current = cameraY;
  }

  if (screenWidth <= 0) return null;

  const initialCameraY = initialCameraYRef.current ?? cameraY;
  const bgH = screenWidth * IMG_ASPECT;

  // ── BG_2: seamless infinite loop ──────────────────────────────────────────
  const scrolled = Math.max(0, -cameraY);
  const offset = scrolled % bgH;
  const bg2ATop = offset - bgH; // upper instance — covers top of screen
  const bg2BTop = offset;       // lower instance — seam-free continuation

  // ── BG_1: starts bottom-aligned with screen, slides down as player climbs ─
  // At start (cameraY = initialCameraY): bg1Top = screenHeight − bgH
  //   → BG_1 bottom is exactly at the screen bottom.
  // As cameraY decreases: (initialCameraY − cameraY) grows → bg1Top rises
  //   → image moves down, revealing BG_2 from the top.
  const bg1Top = (screenHeight - bgH) + (initialCameraY - cameraY);
  const bg1Visible = bg1Top < screenHeight && bg1Top + bgH > 0;

  const imgStyle = { width: screenWidth, height: bgH };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* BG_2 upper instance */}
      <Image
        source={BG2}
        style={[styles.layer, imgStyle, { top: bg2ATop }]}
        resizeMode="stretch"
        fadeDuration={0}
      />
      {/* BG_2 lower instance */}
      <Image
        source={BG2}
        style={[styles.layer, imgStyle, { top: bg2BTop }]}
        resizeMode="stretch"
        fadeDuration={0}
      />
      {/* Twinkling stars — fixed in screen-space above BG_2, behind BG_1 */}
      <TwinklingStars screenWidth={screenWidth} screenHeight={screenHeight} />
      {/* BG_1 on top — slides down and exits as the player climbs */}
      {bg1Visible && (
        <Image
          source={BG1}
          style={[styles.layer, imgStyle, { top: bg1Top }]}
          resizeMode="stretch"
          fadeDuration={0}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: 0,
  },
});
