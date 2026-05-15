import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const STAR_COUNT = 52;

type StarDef = {
  x: number;
  y: number;
  size: number;
  maxOpacity: number;
  duration: number;
  initialT: number; // phase offset [0, 1)
};

function buildStars(w: number, h: number): StarDef[] {
  const stars: StarDef[] = [];
  // Use a simple deterministic-ish seed for stable layout on re-renders
  let s = 0x9e3779b9;
  const rand = () => {
    s = (s ^ (s >>> 16)) >>> 0;
    s = Math.imul(s, 0x45d9f3b) >>> 0;
    s = (s ^ (s >>> 16)) >>> 0;
    return (s >>> 0) / 0x100000000;
  };

  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: rand() * w,
      y: rand() * h,
      size: rand() * 2.4 + 0.8,        // 0.8 – 3.2 px
      maxOpacity: rand() * 0.55 + 0.25, // 0.25 – 0.80
      duration: rand() * 2800 + 1400,   // 1.4 – 4.2 s full cycle
      initialT: rand(),                  // random phase start
    });
  }
  return stars;
}

type Props = {
  screenWidth: number;
  screenHeight: number;
};

export function TwinklingStars({ screenWidth, screenHeight }: Props) {
  const stars = useMemo(
    () => buildStars(screenWidth, screenHeight),
    // Regenerate only when screen dimensions change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [screenWidth, screenHeight],
  );

  // One Animated.Value per star — created once and reused
  const opacityValues = useRef<Animated.Value[]>([]);
  if (opacityValues.current.length !== stars.length) {
    opacityValues.current = stars.map((s) =>
      new Animated.Value(s.initialT * s.maxOpacity),
    );
  }

  useEffect(() => {
    const animations = stars.map((star, i) => {
      const val = opacityValues.current[i];
      // Each star begins mid-cycle based on its initialT so they're all
      // already at different phases at mount — no synchronised "flash".
      const halfDur = star.duration / 2;
      const fadeInRemaining = (1 - star.initialT) * halfDur;

      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: star.maxOpacity,
            duration: fadeInRemaining,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0.02,
            duration: halfDur,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: star.maxOpacity,
            duration: halfDur,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0.02,
            duration: star.initialT * halfDur,
            useNativeDriver: true,
          }),
        ]),
      );

      loop.start();
      return loop;
    });

    return () => {
      animations.forEach((a) => a.stop());
    };
    // Only restart animations when the star definitions change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stars]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((star, i) => {
        const r = Math.ceil(star.size / 2);
        return (
          <Animated.View
            key={i}
            style={[
              styles.star,
              {
                left: star.x - r,
                top: star.y - r,
                width: star.size,
                height: star.size,
                borderRadius: star.size,
                opacity: opacityValues.current[i],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
});
