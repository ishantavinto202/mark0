import { useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

const EDGE_PADDING = 24;
const VERTICAL_PADDING = 72;

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const getThirdSection = (value: number, size: number): 0 | 1 | 2 => {
  if (value < size / 3) return 0;
  if (value < (size * 2) / 3) return 1;
  return 2;
};

export default function Index() {
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [labelWidth, setLabelWidth] = useState(0);
  const [labelHeight, setLabelHeight] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const getCenteredPosition = (): { x: number; y: number } => {
    return {
      x: Math.max(0, containerWidth / 2 - labelWidth / 2),
      y: Math.max(0, containerHeight / 2 - labelHeight / 2),
    };
  };

  const handleContainerLayout = (event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout;
    setContainerWidth(width);
    setContainerHeight(height);
  };

  const handleLabelLayout = (event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout;
    setLabelWidth(width);
    setLabelHeight(height);
  };

  const moveLabel = (x: number, y: number): void => {
    if (!containerWidth || !containerHeight || !labelWidth || !labelHeight) return;

    const horizontalSection = getThirdSection(x, containerWidth); // left / center / right
    const verticalSection = getThirdSection(y, containerHeight); // top / middle / bottom

    const maxX = Math.max(0, containerWidth - labelWidth);
    const maxY = Math.max(0, containerHeight - labelHeight);

    const leftX = EDGE_PADDING;
    const centerX = containerWidth / 2 - labelWidth / 2;
    const rightX = containerWidth - labelWidth - EDGE_PADDING;

    const topY = VERTICAL_PADDING;
    const middleY = containerHeight / 2 - labelHeight / 2;
    const bottomY = containerHeight - labelHeight - VERTICAL_PADDING;

    const horizontalTargets = [leftX, centerX, rightX];
    const verticalTargets = [topY, middleY, bottomY];

    const clampedX = clamp(horizontalTargets[horizontalSection], 0, maxX);
    const clampedY = clamp(verticalTargets[verticalSection], 0, maxY);

    if (!hasInteracted) {
      position.setValue(getCenteredPosition());
      setHasInteracted(true);
    }

    Animated.timing(position, {
      toValue: { x: clampedX, y: clampedY },
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      style={styles.container}
      onLayout={handleContainerLayout}
      onPress={(event) => {
        const { locationX, locationY } = event.nativeEvent;
        moveLabel(locationX, locationY);
      }}
    >
      <Animated.View
        style={[
          styles.label,
          hasInteracted
            ? {
                transform: position.getTranslateTransform(),
              }
            : {
                left: '50%',
                top: '50%',
                transform: [
                  { translateX: -labelWidth / 2 },
                  { translateY: -labelHeight / 2 },
                ],
              },
        ]}
      >
        <Text style={styles.text} onLayout={handleLabelLayout}>
          hello ishnat
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0e',
    overflow: 'hidden',
  },
  label: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  text: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '600',
  },
});
