import { StyleSheet, View } from 'react-native';
import { getPlatformWorldX } from '@/game/systems/gameTick';
import type { GameModel } from '@/game/types';
import { VoxelObstacle } from '@/game/components/VoxelObstacle';
import { VoxelPlatform } from '@/game/components/VoxelPlatform';
import { VoxelPlayer } from '@/game/components/VoxelPlayer';
import { ScrollingBackground } from '@/game/components/ScrollingBackground';

type Props = {
  game: GameModel;
};

export function GameCanvas({ game }: Props) {
  const { cameraY, player, platforms, obstacles, width, height } = game;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <ScrollingBackground
        cameraY={cameraY}
        screenWidth={width}
        screenHeight={height}
      />
      {platforms.map((p) => {
        const wx = getPlatformWorldX(p);
        const sy = p.y - cameraY;
        if (sy > height + 80 || sy < -120) return null;
        return <VoxelPlatform key={p.id} platform={p} screenX={wx} screenY={sy} />;
      })}
      {obstacles.map((o) => {
        const sy = o.y - cameraY;
        if (sy > height + 80 || sy < -120) return null;
        return (
          <VoxelObstacle key={o.id} screenX={o.x} screenY={sy} w={o.w} h={o.h} />
        );
      })}
      <VoxelPlayer
        player={player}
        screenX={player.x}
        screenY={player.y - cameraY}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
});
