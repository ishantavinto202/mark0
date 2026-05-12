import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  score: number;
  highScore: number;
  onPause: () => void;
};

export function GameHUD({ score, highScore, onPause }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
      <View style={styles.row}>
        <View style={styles.pill}>
          <Text style={styles.label}>SCORE</Text>
          <Text style={styles.value}>{score}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.label}>BEST</Text>
          <Text style={styles.value}>{highScore}</Text>
        </View>
        <Pressable style={styles.pauseBtn} onPress={onPause} hitSlop={12}>
          <Text style={styles.pauseTxt}>‖</Text>
        </Pressable>
      </View>
      <Text style={[styles.hint, { marginLeft: insets.left + 12 }]}>
        Hold the on-screen buttons to move
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  pill: {
    backgroundColor: 'rgba(12, 18, 28, 0.78)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  label: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  value: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  pauseBtn: {
    marginLeft: 'auto',
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(12, 18, 28, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  pauseTxt: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  hint: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '600',
  },
});
