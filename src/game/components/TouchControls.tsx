import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  onLeftDown: () => void;
  onLeftUp: () => void;
  onRightDown: () => void;
  onRightUp: () => void;
};

/**
 * Always-visible touch/mouse overlay providing the only movement input.
 *
 * Layout: two pressables anchored to the bottom-left and bottom-right corners
 * with safe-area-aware padding. The wrap uses `pointerEvents="box-none"` so
 * the empty middle stays transparent to the game canvas underneath — only the
 * buttons themselves capture pointer/touch events. Hold-to-move is implemented
 * via `onPressIn`/`onPressOut`, which the RN `Pressable` raises consistently
 * for touch, stylus, and mouse on web.
 */
export function TouchControls({
  onLeftDown,
  onLeftUp,
  onRightDown,
  onRightUp,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          paddingBottom: insets.bottom + 18,
          paddingLeft: insets.left + 18,
          paddingRight: insets.right + 18,
        },
      ]}
    >
      <Pressable
        onPressIn={onLeftDown}
        onPressOut={onLeftUp}
        hitSlop={16}
        accessibilityRole="button"
        accessibilityLabel="Move left"
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
      >
        <Text style={styles.glyph}>{'\u25C0'}</Text>
      </Pressable>
      <Pressable
        onPressIn={onRightDown}
        onPressOut={onRightUp}
        hitSlop={16}
        accessibilityRole="button"
        accessibilityLabel="Move right"
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
      >
        <Text style={styles.glyph}>{'\u25B6'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 25,
  },
  btn: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(12, 18, 28, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    backgroundColor: 'rgba(62, 207, 142, 0.55)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  glyph: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '900',
    lineHeight: 44,
  },
});
