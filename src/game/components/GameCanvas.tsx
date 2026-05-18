import { StyleSheet, View } from 'react-native';
import { getPlatformWorldX } from '@/game/systems/gameTick';
import type { GameModel } from '@/game/types';
import { VoxelEnemy } from '@/game/components/VoxelEnemy';
import { VoxelPlatform } from '@/game/components/VoxelPlatform';
import { VoxelPlayer } from '@/game/components/VoxelPlayer';
import { ScrollingBackground } from '@/game/components/ScrollingBackground';

type Props = {
  game: GameModel;
};

export function GameCanvas({ game }: Props) {
  const { cameraY, player, platforms, enemies, width, height } = game;

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
      {enemies.map((e) => {
        const plat = platforms.find((p) => p.id === e.platformId);
        if (!plat) return null;
        const wx = getPlatformWorldX(plat) + e.relX;
        const wy = plat.y - e.h;
        const sy = wy - cameraY;
        if (sy > height + 80 || sy < -120) return null;
        return (
          <VoxelEnemy key={e.id} enemy={e} screenX={wx} screenY={sy} />
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
